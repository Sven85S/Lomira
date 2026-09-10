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

    static var isCameraAvailable: Bool {
        AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) != nil
    }

    func start() throws {
        print("[PpgCameraCapture] start() called")
        guard !isRunning else {
            print("[PpgCameraCapture] start() ignored — already running")
            return
        }
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            print("[PpgCameraCapture] start() failed — no main wide-angle back camera on this device")
            throw PpgCaptureError.deviceUnavailable
        }
        guard device.isTorchModeSupported(.on) else {
            print("[PpgCameraCapture] start() failed — torch not supported on this device")
            throw PpgCaptureError.torchUnavailable
        }

        session.beginConfiguration()
        session.sessionPreset = .medium
        session.inputs.forEach { session.removeInput($0) }
        session.outputs.forEach { session.removeOutput($0) }

        guard let input = try? AVCaptureDeviceInput(device: device), session.canAddInput(input) else {
            session.commitConfiguration()
            print("[PpgCameraCapture] start() failed — could not create/add AVCaptureDeviceInput")
            throw PpgCaptureError.inputCreationFailed
        }
        session.addInput(input)

        videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.setSampleBufferDelegate(self, queue: processingQueue)
        guard session.canAddOutput(videoOutput) else {
            session.commitConfiguration()
            print("[PpgCameraCapture] start() failed — could not add AVCaptureVideoDataOutput")
            throw PpgCaptureError.sessionConfigurationFailed
        }
        session.addOutput(videoOutput)
        session.commitConfiguration()

        sessionStartTimestamp = nil
        pendingSamples.removeAll()

        NotificationCenter.default.addObserver(
            self, selector: #selector(handleInterruption),
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

            if device.isFocusModeSupported(.locked) {
                do {
                    try device.lockForConfiguration()
                    device.focusMode = .locked
                    device.unlockForConfiguration()
                } catch {
                    print("[PpgCameraCapture] focusMode=.locked failed — lockForConfiguration() threw: \(error)")
                }
            }

            self.lockExposureAndWhiteBalanceOnceStable(device: device)
        }
    }

    /// The torch turning on kicks continuous auto-exposure/white-balance into
    /// actively compensating for the new, constant light — exactly the drift
    /// that was swamping the PPG signal. Lets it settle (watched via KVO on
    /// isAdjustingExposure, Apple's documented way to know when a change has
    /// finished) and only then locks both, instead of locking on whatever
    /// transient value they had right at torch-on.
    private func lockExposureAndWhiteBalanceOnceStable(device: AVCaptureDevice) {
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
            self?.applyExposureWhiteBalanceLock(device: dev, reason: "isAdjustingExposure settled")
        }

        // Fallback: on some devices isAdjustingExposure can keep flapping
        // under torch light and never settle — lock after a bounded wait
        // regardless, so a measurement never runs on an indefinitely
        // auto-adjusting camera.
        processingQueue.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.applyExposureWhiteBalanceLock(device: device, reason: "1.5s settle timeout")
        }
    }

    private func applyExposureWhiteBalanceLock(device: AVCaptureDevice, reason: String) {
        guard !exposureWhiteBalanceLockApplied else { return }
        exposureWhiteBalanceLockApplied = true
        exposureObservation?.invalidate()
        exposureObservation = nil

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

    @objc private func handleInterruption() {
        print("[PpgCameraCapture] AVCaptureSessionWasInterrupted notification received")
        delegate?.ppgCapture(
            self, didFailWith: "sessionInterrupted",
            message: "Die Kamera-Session wurde unterbrochen (z. B. eingehender Anruf)."
        )
        stop(reason: "AVCaptureSessionWasInterrupted")
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
