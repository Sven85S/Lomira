import Flutter
import FlutterPluginRegistrant
import Foundation

/// SPIKE — throwaway harness to answer one question before any of the real
/// integration work (SPM packaging, preview embedding, PpgCameraCapture
/// rewiring) is built on top of it: does camera+torch stay reliable across
/// repeated measurements when driven through Flutter's `camera` plugin
/// instead of raw AVFoundation? Talks directly to the embedded
/// lomira_ppg_bridge Flutter module over its own MethodChannel — completely
/// separate from PpgCameraPlugin/PpgCameraCapture, whose public interface
/// this must not touch. Delete this whole file (and its call site in
/// MainViewController) once the real PpgCameraCapture rewrite lands.
final class PpgFlutterSpike {
    static let shared = PpgFlutterSpike()

    private let engine = FlutterEngine(name: "lomira_ppg_bridge_engine")
    private let channel: FlutterMethodChannel
    private var isRunning = false
    private var sampleCount = 0
    private var lastLogTime = Date()

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
