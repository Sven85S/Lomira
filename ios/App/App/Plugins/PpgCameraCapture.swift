import AVFoundation
import UIKit

struct PpgSample {
    let redMean: Double
    let timestampMs: Double
}

protocol PpgCameraCaptureDelegate: AnyObject {
    func ppgCapture(_ capture: PpgCameraCapture, didProduceBatch samples: [PpgSample])
    func ppgCapture(_ capture: PpgCameraCapture, didFailWith code: String, message: String)
}

/// Delegates capture to the embedded Flutter module (lomira_ppg_bridge) via
/// PpgFlutterEngineBridge instead of driving AVFoundation directly — the
/// native AVFoundation implementation this class used to own directly could
/// never reliably keep the torch on across a full measurement; Flutter's
/// camera plugin proved reliable across repeated runs in steps 1–2 of the
/// migration, so it now owns the actual AVCaptureSession, hidden behind
/// this same class.
///
/// Public interface (start/stop/attachPreview/detachPreview/isRunning/
/// isCameraAvailable, and the PpgCameraCaptureDelegate protocol) is
/// unchanged on purpose — PpgCameraPlugin.swift, the Capacitor JS contract,
/// and everything above it (src/ppg/, HrvFlow.tsx) doesn't need to know or
/// care that camera/torch handling moved to Flutter underneath.
final class PpgCameraCapture: NSObject {
    weak var delegate: PpgCameraCaptureDelegate?

    private let bridge = PpgFlutterEngineBridge.shared
    private(set) var isRunning = false

    static var isCameraAvailable: Bool {
        AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) != nil
    }

    /// Only resolves `completion` once the Flutter bridge's startCapture
    /// MethodChannel call has actually completed — which itself only
    /// happens once lib/main.dart's `_start()` has finished camera init,
    /// torch-on and image-stream start (see PpgFlutterEngineBridge.start()).
    /// Same "don't resolve until genuinely ready" contract the old
    /// AVFoundation implementation had via its exposure/white-balance-lock
    /// wait, just satisfied on the Dart side now instead of via KVO here.
    func start(completion: @escaping (Result<Void, Error>) -> Void) {
        print("[PpgCameraCapture] start() called")
        guard !isRunning else {
            print("[PpgCameraCapture] start() ignored — already running")
            completion(.success(()))
            return
        }

        bridge.onSampleBatch = { [weak self] samples in
            guard let self else { return }
            self.delegate?.ppgCapture(self, didProduceBatch: samples)
        }
        bridge.onCaptureError = { [weak self] code, message in
            guard let self else { return }
            print("[PpgCameraCapture] captureError from bridge: code=\(code) message=\(message)")
            self.delegate?.ppgCapture(self, didFailWith: code, message: message)
            self.stop(reason: "captureError from Flutter bridge (code=\(code))")
        }

        NotificationCenter.default.addObserver(
            self, selector: #selector(handleWillResignActive),
            name: UIApplication.willResignActiveNotification, object: nil
        )

        isRunning = true
        // PpgCameraPlugin.startCapture() calls this from Capacitor's plugin
        // background queue, not the main thread — but PpgFlutterEngineBridge
        // methods that touch the platform channel (channel.invokeMethod
        // inside bridge.start()) must be called on the main thread, or
        // Flutter's own platform_task_runner_ check crashes the app.
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.bridge.start { [weak self] result in
                switch result {
                case .success:
                    print("[PpgCameraCapture] start() succeeded via Flutter bridge")
                    completion(.success(()))
                case .failure(let error):
                    print("[PpgCameraCapture] start() failed via Flutter bridge: \(error)")
                    if let self {
                        self.isRunning = false
                        NotificationCenter.default.removeObserver(self, name: UIApplication.willResignActiveNotification, object: nil)
                    }
                    completion(.failure(error))
                }
            }
        }
    }

    /// Idempotent — safe to call from a screen's unmount/cleanup without
    /// tracking whether capture is actually active. `reason` is purely for
    /// the print log below, to see on-device which call site fired.
    func stop(reason: String = "stop() called directly") {
        print("[PpgCameraCapture] stop() called, reason=\"\(reason)\", wasRunning=\(isRunning)")
        guard isRunning else { return }
        isRunning = false
        NotificationCenter.default.removeObserver(self, name: UIApplication.willResignActiveNotification, object: nil)
        // Defensive — the normal flow detaches the preview explicitly before
        // stopping, but a stray preview must never outlive the capture.
        detachPreview()
        // Same main-thread requirement as bridge.start() above — stop(reason:)
        // is called from multiple contexts (JS stopCapture on Capacitor's
        // background queue, willResignActive on main, a bridge onCaptureError
        // callback), none of which is guaranteed to already be the main
        // thread.
        DispatchQueue.main.async { [weak self] in
            self?.bridge.stop()
        }
    }

    /// Reads the real AVCaptureSession.InterruptionReason — called from
    /// PpgFlutterEngineBridge, which observes the notification globally
    /// (it doesn't own the session, Flutter's camera_avfoundation plugin
    /// does) rather than scoped to a specific session object. Only a few
    /// reasons are common enough on a phone-in-hand PPG measurement to get
    /// their own message; anything else (including a reason Apple adds
    /// later, hence the @unknown default) falls back to a neutral message.
    static func interruptionErrorInfo(for reason: AVCaptureSession.InterruptionReason?) -> (code: String, message: String) {
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

    /// Backgrounding the app must never leave the torch on. Logged with its
    /// own reason so a spurious/transient willResignActive (e.g. a system
    /// HUD) shows up clearly instead of looking like an unexplained stop.
    @objc private func handleWillResignActive() {
        print("[PpgCameraCapture] UIApplication.willResignActiveNotification received")
        stop(reason: "UIApplication.willResignActiveNotification")
    }

    /// Embeds the Flutter-hosted camera preview (same running engine/
    /// CameraController as capture — see PpgFlutterEngineBridge) as a
    /// subview of `containerView`. The host UIViewController is discovered
    /// via the responder chain rather than taking it as a parameter, so
    /// this signature stays exactly what PpgCameraPlugin already calls.
    func attachPreview(to containerView: UIView) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard let hostViewController = containerView.parentViewController else {
                print("[PpgCameraCapture] attachPreview() — kein UIViewController für containerView im Responder-Chain gefunden")
                return
            }
            self.bridge.attachPreview(to: hostViewController, container: containerView)
        }
    }

    func detachPreview() {
        DispatchQueue.main.async { [weak self] in
            self?.bridge.detachPreview()
        }
    }
}

private extension UIView {
    /// Standard responder-chain walk to find the UIViewController that owns
    /// this view — `next` returns the owning UIViewController once the walk
    /// reaches a view that IS that controller's root `.view`, otherwise the
    /// view's superview.
    var parentViewController: UIViewController? {
        var responder: UIResponder? = self
        while let current = responder {
            if let viewController = current as? UIViewController {
                return viewController
            }
            responder = current.next
        }
        return nil
    }
}
