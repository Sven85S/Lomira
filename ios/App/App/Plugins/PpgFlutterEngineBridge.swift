import AVFoundation
import Flutter
import FlutterPluginRegistrant
import Foundation
import UIKit

enum PpgFlutterBridgeError: Error, CustomStringConvertible {
    case startupFailed(code: String, message: String)

    var description: String {
        switch self {
        case .startupFailed(let code, let message):
            return "\(code): \(message)"
        }
    }
}

/// Owns the single embedded Flutter engine (lomira_ppg_bridge) that
/// PpgCameraCapture delegates to instead of driving AVFoundation directly —
/// step 3 of the migration. No longer a spike: this is the real capture
/// path for the HRV tab. Proven across steps 1–2 first (camera+torch
/// reliability across repeated runs, then preview embedding) before being
/// wired into the actual measurement flow here.
// NSObject-derived (like PpgCameraCapture was) specifically so
// NotificationCenter's selector-based addObserver(_:selector:name:object:)
// below has a proper Objective-C-runtime-compatible observer to target —
// the same reason PpgCameraCapture itself inherits NSObject.
final class PpgFlutterEngineBridge: NSObject {
    static let shared = PpgFlutterEngineBridge()

    let engine = FlutterEngine(name: "lomira_ppg_bridge_engine")
    private let channel: FlutterMethodChannel
    private var previewViewController: FlutterViewController?

    /// Set by PpgCameraCapture. Called for every onCaptureError from Dart —
    /// both a startup failure and a mid-measurement one (no camera, stream
    /// error, an AVCaptureSessionWasInterrupted this class also forwards
    /// below) — same as the old AVFoundation implementation surfaced session
    /// interruptions to its delegate.
    var onCaptureError: ((_ code: String, _ message: String) -> Void)?
    /// Set by PpgCameraCapture. Called once per accumulated batch (same
    /// batchSize/cadence as the old AVFoundation implementation, to keep the
    /// JS-bridge call frequency the same).
    var onSampleBatch: (([PpgSample]) -> Void)?

    private var pendingSamples: [PpgSample] = []
    private let batchSize = 8

    /// Resolves start(completion:)'s completion with .failure if an
    /// onCaptureError arrives before startCapture's own invokeMethod
    /// completion does. Safe to rely on that ordering: Dart's _start()
    /// (lib/main.dart) reports errors via onCaptureError synchronously,
    /// inside its own catch block, before returning — never by rethrowing —
    /// and MethodChannel messages on one channel are delivered in order, so
    /// onCaptureError is guaranteed to arrive first when there is one.
    private var startupError: (code: String, message: String)?

    // DEBUG-only spike controls (button/box in MainViewController) share
    // this same engine/channel — must not be exercised at the same time as
    // a real HRV measurement (both would call startCapture on the same Dart
    // isolate, racing to create two CameraControllers). Remove together
    // with those buttons once the real path is confirmed end-to-end
    // (step 4).
    private var isDebugSpikeRunning = false
    private var debugSampleCount = 0
    private var debugLastLogTime = Date()

    private init() {
        super.init()
        // Headless: run() alone never shows a FlutterViewController or any
        // UI surface — this only starts the Dart isolate/engine.
        engine.run()
        GeneratedPluginRegistrant.register(with: engine)
        channel = FlutterMethodChannel(name: "com.lomira/ppgSpike", binaryMessenger: engine.binaryMessenger)
        channel.setMethodCallHandler { [weak self] call, result in
            self?.handle(call, result: result)
        }

        // Not scoped to a specific AVCaptureSession `object:` — we don't own
        // one anymore, Flutter's camera_avfoundation plugin does internally.
        // NSNotificationCenter posts are per-notification-name, not
        // per-listener-scoped, so this still fires for Flutter's own session
        // exactly like it fired for our own before; reading
        // AVCaptureSessionInterruptionReasonKey out of userInfo works the
        // same way regardless of who created the session.
        NotificationCenter.default.addObserver(
            self, selector: #selector(handleInterruption(_:)),
            name: .AVCaptureSessionWasInterrupted, object: nil
        )
    }

    // MARK: - Real capture path (PpgCameraCapture)

    func start(completion: @escaping (Result<Void, Error>) -> Void) {
        startupError = nil
        pendingSamples.removeAll()
        print("[PpgFlutterEngineBridge] startCapture() → Dart")
        channel.invokeMethod("startCapture", arguments: nil) { [weak self] result in
            guard let self else { return }
            if let startupError = self.startupError {
                self.startupError = nil
                completion(.failure(PpgFlutterBridgeError.startupFailed(code: startupError.code, message: startupError.message)))
            } else if let flutterError = result as? FlutterError {
                // Defensive — lib/main.dart's _start() is written to always
                // catch and report via onCaptureError rather than rethrow,
                // so this path is not expected to trigger in practice; it's
                // here so an unforeseen Dart-side exception still surfaces
                // as a failure instead of silently resolving .success.
                completion(.failure(PpgFlutterBridgeError.startupFailed(
                    code: flutterError.code, message: flutterError.message ?? "Unbekannter Flutter-Fehler"
                )))
            } else {
                completion(.success(()))
            }
        }
    }

    func stop() {
        print("[PpgFlutterEngineBridge] stopCapture() → Dart")
        pendingSamples.removeAll()
        channel.invokeMethod("stopCapture", arguments: nil)
    }

    /// Same mechanism proven in step 2's spike preview — a
    /// FlutterViewController bound to this same running engine, showing
    /// whatever CameraController lib/main.dart's `activeController` holds
    /// (i.e. the one capture() above already started), embedded natively in
    /// `container`. Must be called on the main thread.
    func attachPreview(to hostViewController: UIViewController, container: UIView) {
        if previewViewController != nil { return }
        let flutterVC = FlutterViewController(engine: engine, nibName: nil, bundle: nil)
        hostViewController.addChild(flutterVC)
        flutterVC.view.frame = container.bounds
        flutterVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        container.addSubview(flutterVC.view)
        flutterVC.didMove(toParent: hostViewController)
        previewViewController = flutterVC
        print("[PpgFlutterEngineBridge] attachPreview() — FlutterViewController eingehängt")
    }

    /// Must be called on the main thread, same as attachPreview().
    func detachPreview() {
        guard let flutterVC = previewViewController else { return }
        flutterVC.willMove(toParent: nil)
        flutterVC.view.removeFromSuperview()
        flutterVC.removeFromParent()
        previewViewController = nil
        print("[PpgFlutterEngineBridge] detachPreview() — FlutterViewController entfernt")
    }

    // MARK: - DEBUG-only spike controls

    func debugToggle() {
        if isDebugSpikeRunning {
            print("[PpgFlutterEngineBridge] (debug) stopCapture() → Dart (samples received this run: \(debugSampleCount))")
            isDebugSpikeRunning = false
            channel.invokeMethod("stopCapture", arguments: nil)
        } else {
            print("[PpgFlutterEngineBridge] (debug) startCapture() → Dart")
            isDebugSpikeRunning = true
            debugSampleCount = 0
            channel.invokeMethod("startCapture", arguments: nil)
        }
    }

    // MARK: - Dart → native

    private func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "onPpgSample":
            guard let args = call.arguments as? [String: Any],
                  let redMean = args["redMean"] as? Double,
                  let timestampMs = args["timestampMs"] as? Double else {
                result(nil)
                return
            }

            pendingSamples.append(PpgSample(redMean: redMean, timestampMs: timestampMs))
            if pendingSamples.count >= batchSize {
                let batch = pendingSamples
                pendingSamples.removeAll(keepingCapacity: true)
                onSampleBatch?(batch)
            }

            if isDebugSpikeRunning {
                debugSampleCount += 1
                if Date().timeIntervalSince(debugLastLogTime) >= 1.0 {
                    debugLastLogTime = Date()
                    print("[PpgFlutterEngineBridge] (debug) samples=\(debugSampleCount) letzter redMean=\(redMean)")
                }
            }
            result(nil)
        case "onCaptureError":
            let args = call.arguments as? [String: Any]
            let code = args?["code"] as? String ?? "unknown"
            let message = args?["message"] as? String ?? "Unbekannter Fehler"
            print("[PpgFlutterEngineBridge] captureError code=\(code) message=\(message)")
            startupError = (code, message)
            onCaptureError?(code, message)
            result(nil)
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    /// Reads the real AVCaptureSession.InterruptionReason out of the
    /// notification's userInfo, same as the old AVFoundation implementation
    /// did for its own session — see PpgCameraCapture.interruptionErrorInfo
    /// for the reason → (code, message) mapping, unchanged.
    @objc private func handleInterruption(_ notification: Notification) {
        let rawReason = (notification.userInfo?[AVCaptureSessionInterruptionReasonKey] as? Int)
        let reason = rawReason.flatMap { AVCaptureSession.InterruptionReason(rawValue: $0) }
        print("[PpgFlutterEngineBridge] AVCaptureSessionWasInterrupted notification received, reason=\(String(describing: reason)) (rawValue=\(String(describing: rawReason)))")

        let (code, message) = PpgCameraCapture.interruptionErrorInfo(for: reason)
        onCaptureError?(code, message)
    }
}
