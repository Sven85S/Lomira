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
    }
}
