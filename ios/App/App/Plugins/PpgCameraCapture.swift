import AVFoundation
import UIKit

struct PpgSample {
    let redMean: Double
    let timestampMs: Double
}

enum PpgCaptureError: Error {
    case deviceUnavailable
    case inputCreationFailed
    case torchUnavailable
    case sessionConfigurationFailed
}

protocol PpgCameraCaptureDelegate: AnyObject {
    func ppgCapture(_ capture: PpgCameraCapture, didProduceBatch samples: [PpgSample])
    func ppgCapture(_ capture: PpgCameraCapture, didFailWith code: String, message: String)
}

/// Owns the AVCaptureSession end-to-end: picks the main wide-angle back lens
/// (not just "the first camera"), forces BGRA8888 so red-channel access is a
/// fixed byte offset (no YUV plane-layout assumptions), turns the torch on/off,
/// and hands off small batches of timestamped red-channel means. All signal
/// processing (filtering, peak detection, quality) happens on the JS side —
/// this class only ever emits raw samples.
final class PpgCameraCapture: NSObject {
    weak var delegate: PpgCameraCaptureDelegate?

    private let session = AVCaptureSession()
    private let videoOutput = AVCaptureVideoDataOutput()
    private let processingQueue = DispatchQueue(label: "com.lomira.ppgcamera.processing")

    // Read/written only on processingQueue (the AVCaptureVideoDataOutput delegate queue).
    private var sessionStartTimestamp: Double?
    private var pendingSamples: [PpgSample] = []
    private let batchSize = 8

    private(set) var isRunning = false

    // KVO on isAdjustingExposure — lets us wait for auto-exposure to actually
    // settle under the now-on torch before locking it, instead of locking on
    // whatever transient value it had at torch-on.
    private var exposureObservation: NSKeyValueObservation?
    private var exposureWhiteBalanceLockApplied = false

    // The same session also drives an on-screen live preview when attached —
    // CALayer work, so always touched on the main thread regardless of which
    // thread attach/detach/update is called from.
    private var previewLayer: AVCaptureVideoPreviewLayer?

    // Torch/brightness health monitor — see startTorchHealthMonitor(). All
    // read/written only on processingQueue, same as the sample-batching state.
    private var torchHealthTimer: DispatchSourceTimer?
    private var recentRedMeanEma: Double?
    private var peakRedMean: Double = 0
    private var healthCheckSamplesSeen = 0
    private static let recentEmaAlpha = 0.2
    private static let minSamplesBeforeHealthChecks = 60
    private static let minPlausiblePeakRedMean = 60.0
    private static let dimmedRatioThreshold = 0.25

    static var isCameraAvailable: Bool {
        AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) != nil
    }

    /// Only resolves `completion` once the camera is actually, fully ready —
    /// session running, torch on, exposure/white-balance settled and locked —
    /// not just once the synchronous session setup is done. Two regressions
    /// were traced back to that distinction: a call to attachPreview() right
    /// after JS awaited the old (synchronously-resolving) startCapture() could
    /// land before torch/exposure setup had even started on processingQueue,
    /// and reasserting torch/exposure from within attachPreview() as a
    /// workaround then raced the *original* start() sequence on the same
    /// AVCaptureDevice, which AVFoundation reported as
    /// videoDeviceInUseByAnotherClient — not a real other app, just our own
    /// two unsynchronized configuration attempts. Making completion wait for
    /// the real end of the async block removes the race at its source: by the
    /// time JS's `await startCapture()` returns, there is nothing left for
    /// attachPreview() (or anything else) to race against.
    func start(completion: @escaping (Result<Void, Error>) -> Void) {
        print("[PpgCameraCapture] start() called")
        guard !isRunning else {
            print("[PpgCameraCapture] start() ignored — already running")
            completion(.success(()))
            return
        }
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            print("[PpgCameraCapture] start() failed — no main wide-angle back camera on this device")
            completion(.failure(PpgCaptureError.deviceUnavailable))
            return
        }
        guard device.isTorchModeSupported(.on) else {
            print("[PpgCameraCapture] start() failed — torch not supported on this device")
            completion(.failure(PpgCaptureError.torchUnavailable))
            return
        }

        session.beginConfiguration()
        session.sessionPreset = .medium
        session.inputs.forEach { session.removeInput($0) }
        session.outputs.forEach { session.removeOutput($0) }

        guard let input = try? AVCaptureDeviceInput(device: device), session.canAddInput(input) else {
            session.commitConfiguration()
            print("[PpgCameraCapture] start() failed — could not create/add AVCaptureDeviceInput")
            completion(.failure(PpgCaptureError.inputCreationFailed))
            return
        }
        session.addInput(input)

        videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.setSampleBufferDelegate(self, queue: processingQueue)
        guard session.canAddOutput(videoOutput) else {
            session.commitConfiguration()
            print("[PpgCameraCapture] start() failed — could not add AVCaptureVideoDataOutput")
            completion(.failure(PpgCaptureError.sessionConfigurationFailed))
            return
        }
        session.addOutput(videoOutput)
        session.commitConfiguration()

        sessionStartTimestamp = nil
        pendingSamples.removeAll()
        recentRedMeanEma = nil
        peakRedMean = 0
        healthCheckSamplesSeen = 0

        NotificationCenter.default.addObserver(
            self, selector: #selector(handleInterruption(_:)),
            name: .AVCaptureSessionWasInterrupted, object: session
        )
        NotificationCenter.default.addObserver(
            self, selector: #selector(handleWillResignActive),
            name: UIApplication.willResignActiveNotification, object: nil
        )

        isRunning = true
        let runningSession = session
        processingQueue.async {
            runningSession.startRunning()
            print("[PpgCameraCapture] session.startRunning() returned, isRunning=\(runningSession.isRunning)")

            // Testing the theory that torch set BEFORE startRunning() gets reset once
            // the session's own device-configuration management actually kicks in —
            // setting it here, right after startRunning() instead of before, per plan.
            Self.setTorch(on: true, device: device, reason: "start() — right after startRunning()")
            self.startTorchHealthMonitor(device: device)

            if device.isFocusModeSupported(.locked) {
                do {
                    try device.lockForConfiguration()
                    device.focusMode = .locked
                    device.unlockForConfiguration()
                } catch {
                    print("[PpgCameraCapture] focusMode=.locked failed — lockForConfiguration() threw: \(error)")
                }
            }

            // completion only fires once the exposure/white-balance lock has
            // actually been applied (see onLocked below) — matching original
            // behavior, a failure to lock is logged but non-fatal, so this
            // always resolves .success once that cycle has run its course.
            self.lockExposureAndWhiteBalanceOnceStable(device: device) {
                completion(.success(()))
            }
        }
    }

    /// The torch turning on kicks continuous auto-exposure/white-balance into
    /// actively compensating for the new, constant light — exactly the drift
    /// that was swamping the PPG signal. Lets it settle (watched via KVO on
    /// isAdjustingExposure, Apple's documented way to know when a change has
    /// finished) and only then locks both, instead of locking on whatever
    /// transient value they had right at torch-on.
    /// `onLocked` fires exactly once, on whichever of the two racing paths
    /// below (KVO-settled or the timeout fallback) actually applies the lock
    /// — see the idempotency guard in applyExposureWhiteBalanceLock(), which
    /// both paths call.
    private func lockExposureAndWhiteBalanceOnceStable(device: AVCaptureDevice, onLocked: @escaping () -> Void) {
        exposureWhiteBalanceLockApplied = false
        exposureObservation?.invalidate()

        do {
            try device.lockForConfiguration()
            if device.isExposureModeSupported(.continuousAutoExposure) {
                device.exposureMode = .continuousAutoExposure
            }
            if device.isWhiteBalanceModeSupported(.continuousAutoWhiteBalance) {
                device.whiteBalanceMode = .continuousAutoWhiteBalance
            }
            device.unlockForConfiguration()
        } catch {
            print("[PpgCameraCapture] could not (re)set continuous auto exposure/white-balance: \(error)")
        }

        print("[PpgCameraCapture] waiting for auto-exposure to settle before locking (isAdjustingExposure=\(device.isAdjustingExposure))")

        exposureObservation = device.observe(\.isAdjustingExposure, options: [.initial, .new]) { [weak self] dev, _ in
            guard !dev.isAdjustingExposure else { return }
            self?.applyExposureWhiteBalanceLock(device: dev, reason: "isAdjustingExposure settled", onLocked: onLocked)
        }

        // Fallback: on some devices isAdjustingExposure can keep flapping
        // under torch light and never settle — lock after a bounded wait
        // regardless, so a measurement never runs on an indefinitely
        // auto-adjusting camera.
        processingQueue.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.applyExposureWhiteBalanceLock(device: device, reason: "1.5s settle timeout", onLocked: onLocked)
        }
    }

    /// The idempotency guard below means only the first of the two racing
    /// callers actually runs this body — `onLocked` is deferred so it fires
    /// exactly once on that first call, regardless of which return path is
    /// taken (including lockForConfiguration() itself throwing), so a caller
    /// waiting on it (start()'s completion) can never hang.
    private func applyExposureWhiteBalanceLock(device: AVCaptureDevice, reason: String, onLocked: @escaping () -> Void) {
        guard !exposureWhiteBalanceLockApplied else { return }
        exposureWhiteBalanceLockApplied = true
        exposureObservation?.invalidate()
        exposureObservation = nil
        defer { onLocked() }

        do {
            try device.lockForConfiguration()
        } catch {
            print("[PpgCameraCapture] exposure/white-balance lock failed — lockForConfiguration() threw: \(error) (reason=\(reason))")
            return
        }
        defer { device.unlockForConfiguration() }

        if device.isExposureModeSupported(.locked) {
            device.exposureMode = .locked
            print("[PpgCameraCapture] exposureMode = .locked (reason=\(reason), exposureDuration=\(device.exposureDuration.seconds)s, ISO=\(device.iso))")
        } else {
            print("[PpgCameraCapture] exposureMode .locked not supported on this device")
        }

        if device.isWhiteBalanceModeSupported(.locked) {
            device.whiteBalanceMode = .locked
            print("[PpgCameraCapture] whiteBalanceMode = .locked (reason=\(reason))")
        } else {
            print("[PpgCameraCapture] whiteBalanceMode .locked not supported on this device")
        }
    }

    /// Idempotent — safe to call from a screen's unmount/cleanup without
    /// tracking whether capture is actually active. `reason` is purely for the
    /// print log below, to see on-device which of the three call sites (JS
    /// stopCapture, session interruption, or app-resign-active) fired.
    func stop(reason: String = "stop() called directly") {
        print("[PpgCameraCapture] stop() called, reason=\"\(reason)\", wasRunning=\(isRunning)")
        guard isRunning else { return }
        isRunning = false
        NotificationCenter.default.removeObserver(self)
        exposureObservation?.invalidate()
        exposureObservation = nil
        stopTorchHealthMonitor()
        // Defensive — the normal flow detaches the preview explicitly before
        // stopping, but a stray preview layer must never outlive the session.
        detachPreview()

        if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) {
            Self.setTorch(on: false, device: device, reason: reason)
        }

        let runningSession = session
        processingQueue.async {
            runningSession.stopRunning()
            print("[PpgCameraCapture] session.stopRunning() returned")
        }
        pendingSamples.removeAll()
        sessionStartTimestamp = nil
    }

    /// Reads the real AVCaptureSession.InterruptionReason out of the notification's
    /// userInfo instead of guessing — a prior version hardcoded "incoming call" in
    /// the user-facing message, which turned out to be wrong (no call was involved).
    /// Only a few reasons are common enough on a phone-in-hand PPG measurement to
    /// get their own message; anything else (including a reason Apple adds later,
    /// hence the @unknown default) falls back to a neutral message until we've
    /// actually seen it happen and know what to say.
    @objc private func handleInterruption(_ notification: Notification) {
        let rawReason = (notification.userInfo?[AVCaptureSessionInterruptionReasonKey] as? Int)
        let reason = rawReason.flatMap { AVCaptureSession.InterruptionReason(rawValue: $0) }
        print("[PpgCameraCapture] AVCaptureSessionWasInterrupted notification received, reason=\(String(describing: reason)) (rawValue=\(String(describing: rawReason)))")

        let (code, message) = Self.interruptionErrorInfo(for: reason)
        delegate?.ppgCapture(self, didFailWith: code, message: message)
        stop(reason: "AVCaptureSessionWasInterrupted (reason=\(String(describing: reason)))")
    }

    private static func interruptionErrorInfo(for reason: AVCaptureSession.InterruptionReason?) -> (code: String, message: String) {
        guard let reason else {
            return ("sessionInterrupted", "Die Kamera-Session wurde unterbrochen. Bitte versuche es erneut.")
        }
        switch reason {
        case .videoDeviceNotAvailableDueToSystemPressure:
            return (
                "sessionInterruptedSystemPressure",
                "Das Gerät braucht kurz eine Pause (z. B. durch Wärmeentwicklung von Kamera und Blitz) — bitte in ein paar Sekunden erneut versuchen."
            )
        case .videoDeviceInUseByAnotherClient:
            return ("sessionInterruptedDeviceInUse", "Die Kamera wird gerade von einer anderen App verwendet.")
        case .videoDeviceNotAvailableInBackground:
            return ("sessionInterruptedBackground", "Die Kamera-Session wurde unterbrochen, weil die App in den Hintergrund wechselte.")
        case .videoDeviceNotAvailableWithMultipleForegroundApps:
            return ("sessionInterruptedMultitasking", "Die Kamera ist im geteilten Bildschirm nicht verfügbar — bitte die App im Vollbild öffnen.")
        case .audioDeviceInUseByAnotherClient:
            return ("sessionInterrupted", "Die Kamera-Session wurde unterbrochen. Bitte versuche es erneut.")
        @unknown default:
            return ("sessionInterrupted", "Die Kamera-Session wurde unterbrochen. Bitte versuche es erneut.")
        }
    }

    /// Backgrounding the app must never leave the torch on. Logged with its own
    /// reason so a spurious/transient willResignActive (e.g. a system HUD) shows
    /// up clearly instead of looking like an unexplained stop.
    @objc private func handleWillResignActive() {
        print("[PpgCameraCapture] UIApplication.willResignActiveNotification received")
        stop(reason: "UIApplication.willResignActiveNotification")
    }

    private static func setTorch(on: Bool, device: AVCaptureDevice, reason: String) {
        guard device.hasTorch else {
            print("[PpgCameraCapture] setTorch(on: \(on)) skipped — device has no torch")
            return
        }
        do {
            try device.lockForConfiguration()
        } catch {
            print("[PpgCameraCapture] setTorch(on: \(on)) failed — lockForConfiguration() threw: \(error) (reason=\(reason))")
            return
        }
        defer { device.unlockForConfiguration() }

        if on {
            guard device.isTorchModeSupported(.on) else {
                print("[PpgCameraCapture] setTorch(on: true) skipped — torch mode .on not supported")
                return
            }
            do {
                try device.setTorchModeOn(level: 1.0)
                print("[PpgCameraCapture] setTorch(on: true) succeeded (reason=\(reason))")
            } catch {
                print("[PpgCameraCapture] setTorch(on: true) failed — setTorchModeOn() threw: \(error) (reason=\(reason))")
            }
        } else {
            device.torchMode = .off
            print("[PpgCameraCapture] setTorch(on: false) succeeded (reason=\(reason))")
        }
    }

    /// iOS can silently dim the torch LED to a faint residual brightness —
    /// observed on-device: a stable redMean of ~176 abruptly dropped to
    /// ~19-40 about 18s into a measurement and stayed there for 15+s, with
    /// zero events (no captureError, no interruption) ever firing. Likely
    /// thermal/power throttling that AVFoundation doesn't surface — nothing
    /// tells the app this happened, so it has to notice on its own. Checked
    /// periodically (not per-frame) so a single noisy frame can't trip it.
    ///
    /// Two independent signals: isTorchActive going false while torchMode is
    /// still .on is the more authoritative one (a real, documented
    /// AVCaptureDevice property for exactly this); the redMean-vs-peak ratio
    /// is the fallback in case isTorchActive doesn't reflect a partial dim.
    /// Deliberately does NOT try to re-assert the torch — if this is thermal,
    /// forcing it back on would just reproduce the same failure; a clean stop
    /// with a clear reason is the right response, not another workaround.
    private func startTorchHealthMonitor(device: AVCaptureDevice) {
        torchHealthTimer?.cancel()
        let timer = DispatchSource.makeTimerSource(queue: processingQueue)
        timer.schedule(deadline: .now() + 1.5, repeating: 1.5)
        timer.setEventHandler { [weak self] in
            self?.checkTorchHealth(device: device)
        }
        timer.resume()
        torchHealthTimer = timer
    }

    private func stopTorchHealthMonitor() {
        torchHealthTimer?.cancel()
        torchHealthTimer = nil
        recentRedMeanEma = nil
        peakRedMean = 0
        healthCheckSamplesSeen = 0
    }

    private func checkTorchHealth(device: AVCaptureDevice) {
        guard isRunning else { return }

        if device.torchMode == .on, !device.isTorchActive {
            print("[PpgCameraCapture] torch health check — isTorchActive=false while torchMode=.on")
            reportTorchDimmedOrFailed()
            return
        }

        // Give the peak a couple of seconds to reflect the real, lit level
        // (exposure/white-balance are still settling early on), and don't
        // flag a session that never got bright in the first place — that's
        // a finger-placement problem the JS-side finger-detection already
        // covers, not a dimming event.
        guard healthCheckSamplesSeen >= Self.minSamplesBeforeHealthChecks,
              peakRedMean >= Self.minPlausiblePeakRedMean,
              let recent = recentRedMeanEma else { return }

        if recent < peakRedMean * Self.dimmedRatioThreshold {
            print("[PpgCameraCapture] torch health check — redMean dropped to \(recent), peak was \(peakRedMean)")
            reportTorchDimmedOrFailed()
        }
    }

    private func reportTorchDimmedOrFailed() {
        delegate?.ppgCapture(
            self, didFailWith: "torchDimmedOrFailed",
            message: "Blitz wurde schwächer — bitte Gerät kurz abkühlen lassen und erneut versuchen."
        )
        stop(reason: "torch health check — dimmed or failed")
    }

    /// Adds a live preview of the same session as a sublayer of `containerView`.
    /// Safe to call again with a different/resized containerView (or the same
    /// one after a layout change) — replaces any existing layer rather than
    /// stacking a second one. Back to its original, simple job — start()
    /// waiting for its own async work to finish before resolving (see start())
    /// means whoever calls attachPreview() after that is guaranteed to be
    /// looking at an already-fully-configured session, so there's nothing left
    /// here to race or reassert.
    func attachPreview(to containerView: UIView) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.previewLayer?.removeFromSuperlayer()

            let layer = AVCaptureVideoPreviewLayer(session: self.session)
            layer.videoGravity = .resizeAspectFill
            layer.frame = containerView.bounds
            containerView.layer.insertSublayer(layer, at: 0)
            self.previewLayer = layer
            print("[PpgCameraCapture] attachPreview() — layer added, frame=\(layer.frame)")
        }
    }

    func detachPreview() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.previewLayer?.removeFromSuperlayer()
            self.previewLayer = nil
            print("[PpgCameraCapture] detachPreview() — layer removed")
        }
    }
}

extension PpgCameraCapture: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        // The sensor's own presentation timestamp, not Date() — the delegate
        // callback runs on a background queue and can be jittered by thread
        // scheduling, which would throw off frame-rate detection on the JS side.
        let presentationSeconds = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
        if sessionStartTimestamp == nil {
            sessionStartTimestamp = presentationSeconds
        }
        let relativeMs = (presentationSeconds - (sessionStartTimestamp ?? presentationSeconds)) * 1000.0

        guard let redMean = Self.redChannelMean(from: pixelBuffer) else { return }

        recentRedMeanEma = recentRedMeanEma.map { $0 * (1 - Self.recentEmaAlpha) + redMean * Self.recentEmaAlpha } ?? redMean
        peakRedMean = max(peakRedMean, redMean)
        healthCheckSamplesSeen += 1

        pendingSamples.append(PpgSample(redMean: redMean, timestampMs: relativeMs))

        if pendingSamples.count >= batchSize {
            let batch = pendingSamples
            pendingSamples.removeAll(keepingCapacity: true)
            delegate?.ppgCapture(self, didProduceBatch: batch)
        }
    }

    /// Averages the red channel over a centered window instead of the full
    /// frame — a finger fully covering the lens makes every pixel equally
    /// valid, and a small window keeps per-frame cost low at up to 60fps.
    private static func redChannelMean(from pixelBuffer: CVPixelBuffer) -> Double? {
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }

        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return nil }
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        guard width > 0, height > 0 else { return nil }

        let windowSize = 96
        let halfWindow = windowSize / 2
        let startX = max(0, width / 2 - halfWindow)
        let endX = min(width, width / 2 + halfWindow)
        let startY = max(0, height / 2 - halfWindow)
        let endY = min(height, height / 2 + halfWindow)
        guard endX > startX, endY > startY else { return nil }

        let buffer = baseAddress.assumingMemoryBound(to: UInt8.self)
        var sum: UInt64 = 0
        var count: UInt64 = 0

        for y in startY..<endY {
            let rowStart = y * bytesPerRow
            var x = startX
            while x < endX {
                // BGRA8888: red is byte offset 2 within each 4-byte pixel.
                sum += UInt64(buffer[rowStart + x * 4 + 2])
                count += 1
                x += 1
            }
        }

        guard count > 0 else { return nil }
        return Double(sum) / Double(count)
    }
}
