import AVFoundation
import Capacitor
import Foundation
import UIKit

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
        CAPPluginMethod(name: "attachPreview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "detachPreview", returnType: CAPPluginReturnPromise),
    ]

    private lazy var capture: PpgCameraCapture = {
        let capture = PpgCameraCapture()
        capture.delegate = self
        return capture
    }()

    // The native container view holding the preview layer, inserted directly
    // below the WebView in the same view hierarchy. Only exists while a
    // preview is attached.
    private var previewContainerView: UIView?

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

    // capture.start()'s completion only fires once the camera is actually,
    // fully ready (session running, torch on, exposure/white-balance
    // settled and locked) — not just once its synchronous setup is done — so
    // by the time this call resolves, JS code that waits on it (like HrvFlow
    // calling attachPreview() right after) is guaranteed to be looking at an
    // already-fully-configured session, not racing its own setup.
    @objc func startCapture(_ call: CAPPluginCall) {
        print("[PpgCamera] startCapture() called")
        capture.start { result in
            switch result {
            case .success:
                print("[PpgCamera] startCapture() succeeded")
                call.resolve()
            case .failure(let error):
                print("[PpgCamera] startCapture() failed: \(error)")
                call.reject("Kamera konnte nicht gestartet werden.", "\(error)")
            }
        }
    }

    @objc func stopCapture(_ call: CAPPluginCall) {
        print("[PpgCamera] stopCapture() called")
        capture.stop(reason: "JS PpgCamera.stopCapture()")
        previewContainerView?.removeFromSuperview()
        previewContainerView = nil
        call.resolve()
    }

    /// Positions a native live-preview layer of the running session behind
    /// the (made-transparent) WebView, clipped to the rect a JS-side
    /// placeholder <div> reports via getBoundingClientRect() — same session,
    /// so no second AVCaptureSession competing for the camera. Call again
    /// with a new rect to reposition an already-attached preview (e.g. after
    /// a layout change) instead of stacking a second one.
    @objc func attachPreview(_ call: CAPPluginCall) {
        guard let x = call.getDouble("x"), let y = call.getDouble("y"),
              let width = call.getDouble("width"), let height = call.getDouble("height") else {
            call.reject("attachPreview benötigt x, y, width und height (in CSS-Pixeln).")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard let webView = self.bridge?.webView, let hostView = self.bridge?.viewController?.view else {
                call.reject("Keine WebView/ViewController verfügbar.")
                return
            }

            let frame = CGRect(x: x, y: y, width: width, height: height)

            if let existing = self.previewContainerView {
                existing.frame = frame
            } else {
                let container = UIView(frame: frame)
                container.backgroundColor = .black
                hostView.insertSubview(container, belowSubview: webView)
                self.previewContainerView = container

                // The WebView must become transparent for the native layer behind it
                // to show through — only where our own HTML deliberately leaves a
                // gap (the placeholder <div>), since every other screen still paints
                // its own opaque background.
                webView.isOpaque = false
                webView.backgroundColor = .clear
                webView.scrollView.backgroundColor = .clear
                print("[PpgCamera] attachPreview() — WebView made transparent, container inserted below it")
            }

            self.capture.attachPreview(to: self.previewContainerView!)
            print("[PpgCamera] attachPreview() — frame=\(frame)")
            call.resolve()
        }
    }

    @objc func detachPreview(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.capture.detachPreview()
            self.previewContainerView?.removeFromSuperview()
            self.previewContainerView = nil

            if let webView = self.bridge?.webView {
                webView.isOpaque = true
                webView.backgroundColor = nil
                webView.scrollView.backgroundColor = nil
            }
            print("[PpgCamera] detachPreview() — WebView opacity restored, container removed")
            call.resolve()
        }
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
