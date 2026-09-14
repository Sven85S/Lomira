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
        // DEBUG-only manual test harness for PpgFlutterEngineBridge,
        // independent of PpgCameraPlugin's real previewContainerView. Now
        // that PpgCameraCapture (step 3) drives real HRV measurements
        // through this same engine, these buttons and the real HRV tab
        // share one Dart isolate/CameraController — do not use both at the
        // same time. Remove this whole block once the real HRV tab is
        // confirmed working end-to-end over the bridge (step 4).
        addSpikeTriggerButton()
        #endif
    }

    #if DEBUG
    private var previewSpikeBox: UIView?

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

        let previewButton = UIButton(type: .system)
        previewButton.setTitle("PPG Flutter Preview", for: .normal)
        previewButton.backgroundColor = UIColor.black.withAlphaComponent(0.7)
        previewButton.setTitleColor(.white, for: .normal)
        previewButton.layer.cornerRadius = 8
        previewButton.frame = CGRect(x: 16, y: 104, width: 200, height: 40)
        previewButton.addTarget(self, action: #selector(previewSpikeButtonTapped), for: .touchUpInside)
        view.addSubview(previewButton)
        view.bringSubviewToFront(previewButton)

        let box = UIView(frame: CGRect(x: 16, y: 152, width: 200, height: 266))
        box.backgroundColor = .darkGray
        view.addSubview(box)
        view.bringSubviewToFront(box)
        previewSpikeBox = box
    }

    @objc private func spikeButtonTapped() {
        PpgFlutterEngineBridge.shared.debugToggle()
    }

    @objc private func previewSpikeButtonTapped() {
        guard let box = previewSpikeBox else { return }
        if box.subviews.isEmpty {
            PpgFlutterEngineBridge.shared.attachPreview(to: self, container: box)
        } else {
            PpgFlutterEngineBridge.shared.detachPreview()
        }
    }
    #endif
}
