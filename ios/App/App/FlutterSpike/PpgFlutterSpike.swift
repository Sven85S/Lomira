import Flutter
import FlutterPluginRegistrant
import Foundation
import UIKit

/// Owns the single embedded Flutter engine for the whole PPG migration —
/// started here in step 1 (spike) to prove camera+torch reliability, now
/// also hosting the step-2 preview ViewController. Step 3
/// (PpgCameraCapture's real rewrite) will consume this same engine/channel
/// instead of AVFoundation; at that point this class gets renamed out of
/// "Spike" and the DEBUG-only call sites in MainViewController go away, but
/// the engine/channel plumbing itself stays — it's already the real thing,
/// not throwaway.
///
/// Deliberately still separate from PpgCameraPlugin/PpgCameraCapture, whose
/// public interface this does not touch (that's step 3's job).
final class PpgFlutterSpike {
    static let shared = PpgFlutterSpike()

    let engine = FlutterEngine(name: "lomira_ppg_bridge_engine")
    private let channel: FlutterMethodChannel
    private var isRunning = false
    private var sampleCount = 0
    private var lastLogTime = Date()
    private var previewViewController: FlutterViewController?

    private init() {
        // Headless: run() alone never shows a FlutterViewController or any
        // UI surface — this only starts the Dart isolate/engine.
        engine.run()
        GeneratedPluginRegistrant.register(with: engine)
        channel = FlutterMethodChannel(name: "com.lomira/ppgSpike", binaryMessenger: engine.binaryMessenger)
        channel.setMethodCallHandler { [weak self] call, result in
            self?.handle(call, result: result)
        }
    }

    /// Toggled by the DEBUG-only trigger in MainViewController — logs enough
    /// to judge torch/camera reliability by eye across several back-to-back
    /// runs on a real device without needing any UI beyond a print/console.
    func toggle() {
        if isRunning {
            stop()
        } else {
            start()
        }
    }

    private func start() {
        print("[PpgFlutterSpike] startCapture() → Dart")
        isRunning = true
        sampleCount = 0
        channel.invokeMethod("startCapture", arguments: nil)
    }

    private func stop() {
        print("[PpgFlutterSpike] stopCapture() → Dart (samples received this run: \(sampleCount))")
        isRunning = false
        channel.invokeMethod("stopCapture", arguments: nil)
    }

    /// Embeds a FlutterViewController bound to the SAME running engine as
    /// capture — deliberately not a second, independent engine/camera
    /// session, since flutter_ppg's Dart-side CameraController is the one
    /// and only camera user this module ever creates (see
    /// lib/main.dart's `activeController`). The preview widget renders
    /// nothing until that controller exists, so calling this before/without
    /// an active capture just shows black, not a crash.
    ///
    /// Must be called on the main thread (UIKit). `container`'s bounds
    /// should already be set to the desired preview frame.
    func attachPreview(to hostViewController: UIViewController, container: UIView) {
        if previewViewController != nil { return }
        // Diagnostic: container's own geometry BEFORE anything is inserted,
        // so a zero/degenerate container frame (hypothesis 1) is
        // distinguishable from a correctly-sized-but-not-actually-visible one.
        print("[PpgFlutterSpike] attachPreview() vorher: container.frame=\(container.frame) "
            + "container.bounds=\(container.bounds) container.isHidden=\(container.isHidden) "
            + "container.alpha=\(container.alpha) container.window != nil=\(container.window != nil) "
            + "container.superview=\(String(describing: container.superview))")

        let flutterVC = FlutterViewController(engine: engine, nibName: nil, bundle: nil)
        hostViewController.addChild(flutterVC)
        flutterVC.view.frame = container.bounds
        flutterVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        container.addSubview(flutterVC.view)
        flutterVC.didMove(toParent: hostViewController)
        previewViewController = flutterVC

        // Diagnostic: the FlutterViewController's view geometry and z-order
        // AFTER insertion — if this frame is non-zero and it's the topmost
        // subview, hypothesis 1 (native embedding) is cleared and the issue
        // is on the Dart/rendering side (hypothesis 2).
        print("[PpgFlutterSpike] attachPreview() nachher: flutterVC.view.frame=\(flutterVC.view.frame) "
            + "flutterVC.view.isHidden=\(flutterVC.view.isHidden) "
            + "flutterVC.view.window != nil=\(flutterVC.view.window != nil) "
            + "container.subviews.count=\(container.subviews.count) "
            + "flutterVC.view is topmost subview=\(container.subviews.last === flutterVC.view)")
        print("[PpgFlutterSpike] attachPreview() — FlutterViewController eingehängt")
    }

    /// Must be called on the main thread (UIKit), same as attachPreview().
    func detachPreview() {
        guard let flutterVC = previewViewController else { return }
        flutterVC.willMove(toParent: nil)
        flutterVC.view.removeFromSuperview()
        flutterVC.removeFromParent()
        previewViewController = nil
        print("[PpgFlutterSpike] detachPreview() — FlutterViewController entfernt")
    }

    private func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "onPpgSample":
            sampleCount += 1
            if let args = call.arguments as? [String: Any],
               let redMean = args["redMean"] as? Double,
               Date().timeIntervalSince(lastLogTime) >= 1.0 {
                lastLogTime = Date()
                print("[PpgFlutterSpike] samples=\(sampleCount) letzter redMean=\(redMean)")
            }
            result(nil)
        case "onCaptureError":
            let args = call.arguments as? [String: Any]
            print("[PpgFlutterSpike] captureError code=\(args?["code"] ?? "?") message=\(args?["message"] ?? "?")")
            result(nil)
        default:
            result(FlutterMethodNotImplemented)
        }
    }
}
