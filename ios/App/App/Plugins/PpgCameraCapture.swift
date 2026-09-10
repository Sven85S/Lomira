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

    static var isCameraAvailable: Bool {
        AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) != nil
    }

    func start() throws {
        guard !isRunning else { return }
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            throw PpgCaptureError.deviceUnavailable
        }

        session.beginConfiguration()
        session.sessionPreset = .medium
        session.inputs.forEach { session.removeInput($0) }
        session.outputs.forEach { session.removeOutput($0) }

        guard let input = try? AVCaptureDeviceInput(device: device), session.canAddInput(input) else {
            session.commitConfiguration()
            throw PpgCaptureError.inputCreationFailed
        }
        session.addInput(input)

        videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.setSampleBufferDelegate(self, queue: processingQueue)
        guard session.canAddOutput(videoOutput) else {
            session.commitConfiguration()
            throw PpgCaptureError.sessionConfigurationFailed
        }
        session.addOutput(videoOutput)
        session.commitConfiguration()

        do {
            try device.lockForConfiguration()
        } catch {
            throw PpgCaptureError.torchUnavailable
        }
        defer { device.unlockForConfiguration() }

        guard device.isTorchModeSupported(.on) else {
            throw PpgCaptureError.torchUnavailable
        }
        do {
            try device.setTorchModeOn(level: 1.0)
        } catch {
            throw PpgCaptureError.torchUnavailable
        }
        if device.isFocusModeSupported(.locked) {
            device.focusMode = .locked
        }

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
        }
    }

    /// Idempotent — safe to call from a screen's unmount/cleanup without
    /// tracking whether capture is actually active.
    func stop() {
        guard isRunning else { return }
        isRunning = false
        NotificationCenter.default.removeObserver(self)

        if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
           device.hasTorch, device.torchMode != .off {
            try? device.lockForConfiguration()
            device.torchMode = .off
            device.unlockForConfiguration()
        }

        let runningSession = session
        processingQueue.async {
            runningSession.stopRunning()
        }
        pendingSamples.removeAll()
        sessionStartTimestamp = nil
    }

    @objc private func handleInterruption() {
        delegate?.ppgCapture(
            self, didFailWith: "sessionInterrupted",
            message: "Die Kamera-Session wurde unterbrochen (z. B. eingehender Anruf)."
        )
        stop()
    }

    /// Backgrounding the app must never leave the torch on.
    @objc private func handleWillResignActive() {
        stop()
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
