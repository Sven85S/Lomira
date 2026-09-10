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

    @objc func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(["camera": Self.authorizationState()])
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            call.resolve(["camera": granted ? "granted" : "denied"])
        }
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": PpgCameraCapture.isCameraAvailable])
    }

    @objc func startCapture(_ call: CAPPluginCall) {
        do {
            try capture.start()
            call.resolve()
        } catch {
            call.reject("Kamera konnte nicht gestartet werden.", "\(error)")
        }
    }

    @objc func stopCapture(_ call: CAPPluginCall) {
        capture.stop()
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
