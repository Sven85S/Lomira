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
    // SPIKE — this whole box+button pair, isolated from PpgCameraPlugin's
    // real previewContainerView. Step 2's on-device test: does the
    // Flutter-hosted CameraPreview actually render/update here while
    // capture is toggled via the other button, sharing the one camera
    // session correctly (see lib/main.dart's activeController)? Real
    // wiring into PpgCameraPlugin.attachPreview()/detachPreview() happens
    // together with step 3, since only then does PpgCameraCapture actually
    // drive capture through this same engine — attaching this preview to
    // the production path any earlier would fight AVFoundation for the
    // camera device, the exact conflict this migration exists to avoid.
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
        PpgFlutterSpike.shared.toggle()
    }

    @objc private func previewSpikeButtonTapped() {
        guard let box = previewSpikeBox else { return }
        if box.subviews.isEmpty {
            PpgFlutterSpike.shared.attachPreview(to: self, container: box)
        } else {
            PpgFlutterSpike.shared.detachPreview()
        }
    }
    #endif
}
