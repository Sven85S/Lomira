import Capacitor
import UIKit

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

        #if DEBUG
        // SPIKE — remove this block together with FlutterSpike/PpgFlutterSpike.swift
        // once the Flutter-camera reliability question is answered. Not wired
        // into PpgCameraPlugin/PpgCameraCapture at all; only exists to trigger
        // PpgFlutterSpike by hand on a real device for repeated test runs.
        addSpikeTriggerButton()
        #endif
    }

    #if DEBUG
    private func addSpikeTriggerButton() {
        let button = UIButton(type: .system)
        button.setTitle("PPG Flutter Spike", for: .normal)
        button.backgroundColor = UIColor.black.withAlphaComponent(0.7)
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 8
        button.frame = CGRect(x: 16, y: 56, width: 200, height: 40)
        button.addTarget(self, action: #selector(spikeButtonTapped), for: .touchUpInside)
        view.addSubview(button)
        view.bringSubviewToFront(button)
    }

    @objc private func spikeButtonTapped() {
        PpgFlutterSpike.shared.toggle()
    }
    #endif
}
