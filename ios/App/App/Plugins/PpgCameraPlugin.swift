import AVFoundation
import Capacitor
import Foundation

/// Thin Capacitor bridge over PpgCameraCapture — deliberately has no signal
/// processing of its own. It only starts/stops the capture session and relays
/// raw red-channel sample batches (and hard failures) to JS as events.
@objc(PpgCameraPlugin)
public class PpgCameraPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PpgCameraPlugin"
    public let jsName = "PpgCamera"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startCapture", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopCapture", returnType: CAPPluginReturnPromise),
    ]

    private lazy var capture: PpgCameraCapture = {
        let capture = PpgCameraCapture()
        capture.delegate = self
        return capture
    }()

    // load() is called once by the Capacitor bridge when it discovers and
    // instantiates this plugin — this print is the definitive way to see
    // whether the native side was ever reached at all, independent of any
    // single JS call succeeding or failing.
    override public func load() {
        print("[PpgCamera] plugin loaded by bridge (jsName=\(jsName))")
    }

    // CAPPlugin already declares these two as `open` stubs (its standard
    // permissions API) — overriding them requires both `override` and `public`
    // (the class is `public`, so an override can't be less visible than that).
    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        print("[PpgCamera] checkPermissions() called")
        call.resolve(["camera": Self.authorizationState()])
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        print("[PpgCamera] requestPermissions() called")
        AVCaptureDevice.requestAccess(for: .video) { granted in
            call.resolve(["camera": granted ? "granted" : "denied"])
        }
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = PpgCameraCapture.isCameraAvailable
        print("[PpgCamera] isAvailable() called, result=\(available)")
        call.resolve(["available": available])
    }

    @objc func startCapture(_ call: CAPPluginCall) {
        print("[PpgCamera] startCapture() called")
        do {
            try capture.start()
            print("[PpgCamera] startCapture() succeeded")
            call.resolve()
        } catch {
            print("[PpgCamera] startCapture() failed: \(error)")
            call.reject("Kamera konnte nicht gestartet werden.", "\(error)")
        }
    }

    @objc func stopCapture(_ call: CAPPluginCall) {
        print("[PpgCamera] stopCapture() called")
        capture.stop(reason: "JS PpgCamera.stopCapture()")
        call.resolve()
    }

    private static func authorizationState() -> String {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: return "granted"
        case .denied, .restricted: return "denied"
        case .notDetermined: return "prompt"
        @unknown default: return "prompt"
        }
    }
}

extension PpgCameraPlugin: PpgCameraCaptureDelegate {
    func ppgCapture(_ capture: PpgCameraCapture, didProduceBatch samples: [PpgSample]) {
        let payload: [String: Any] = [
            "samples": samples.map { ["redMean": $0.redMean, "timestampMs": $0.timestampMs] },
        ]
        notifyListeners("ppgSample", data: payload)
    }

    func ppgCapture(_ capture: PpgCameraCapture, didFailWith code: String, message: String) {
        notifyListeners("captureError", data: ["code": code, "message": message])
    }
}
