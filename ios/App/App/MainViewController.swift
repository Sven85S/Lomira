import Capacitor

/// Capacitor auto-discovers npm-package plugins (their Package.swift/Podspec
/// entry registers them), but NOT app-local plugins living directly in this
/// target — those need an explicit `bridge?.registerPluginInstance(...)`
/// call, which only has a hook point here, in capacitorDidLoad(). See
/// https://capacitorjs.com/docs/ios/custom-code
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        // Deliberately independent of everything below — proves capacitorDidLoad()
        // itself fired at all, regardless of whether registerPluginInstance()
        // (or PpgCameraPlugin's own load()) succeeds.
        print("[MainViewController] capacitorDidLoad() called")
        bridge?.registerPluginInstance(PpgCameraPlugin())
        bridge?.registerPluginInstance(AppleHealthPlugin())

        // Eagerly touch PpgFlutterEngineBridge.shared here, on the main
        // thread — capacitorDidLoad() is reliably main-thread (confirmed
        // when the plugin registration above was first wired up). Its
        // `static let shared = PpgFlutterEngineBridge()` is a one-time,
        // thread-safe Swift singleton init: whichever thread touches it
        // FIRST is the one that actually runs PpgFlutterEngineBridge.init()
        // (and, inside it, engine.run()) — every later access, from any
        // thread, just reads the already-built instance.
        //
        // Left to happen lazily instead, the first touch would come from
        // PpgCameraPlugin.capture's own lazy var — first reached from a
        // startCapture/stopCapture/attachPreview/detachPreview call, all of
        // which Capacitor dispatches on its own background plugin queue,
        // not main. FlutterEngine.run() called there binds Flutter's own
        // internal "platform thread" reference to that wrong thread, which
        // no amount of dispatching individual later calls to the real main
        // thread can undo — confirmed via crash stack trace
        // (dispatch_lane_serial_drain landing inside
        // FlutterEngine.runWithEntrypoint) that this was happening.
        print("[MainViewController] eagerly touching PpgFlutterEngineBridge.shared on main thread")
        _ = PpgFlutterEngineBridge.shared

        // Lets Safari's Web Inspector (Develop menu > device name) attach to
        // this app's WKWebView — Capacitor itself only sets isInspectable
        // automatically for Debug builds, and this API needs iOS 16.4+
        // (below the app's own 15.0 deployment target, hence the guard).
        // Unconditional here, NOT `#if DEBUG`-gated: this project is
        // currently only ever tested as a Release build (see the Debug/JIT
        // Flutter-engine crash earlier commits on this branch root-caused,
        // which is why Release became the only build actually run on
        // device) — gating this behind DEBUG would make it useless for
        // exactly the build that needs inspecting. Remove or gate behind
        // `#if DEBUG` before an actual App Store/TestFlight submission —
        // isInspectable on a shipped Release build lets anyone with
        // physical USB access and Xcode attach the Web Inspector.
        if #available(iOS 16.4, *) {
            webView?.isInspectable = true
            print("[MainViewController] webView.isInspectable = true")
        }
    }
}
