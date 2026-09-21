import Capacitor
import Foundation
import HealthKit

/// Writes BPM and SDNN to Apple Health after a completed HRV measurement.
/// Opt-in only (SettingsScreen toggle) and write-only — no read access is
/// ever requested, matching Lomira's "lokal, kein Zwang" principle: nothing
/// leaves the device unless the user explicitly turned this on, and even
/// then Health is the only destination, never a network call.
@objc(AppleHealthPlugin)
public class AppleHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleHealthPlugin"
    public let jsName = "AppleHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeSample", returnType: CAPPluginReturnPromise),
    ]

    private let healthStore = HKHealthStore()
    private let heartRateType = HKQuantityType(.heartRate)
    private let hrvType = HKQuantityType(.heartRateVariabilitySDNN)

    override public func load() {
        print("[AppleHealth] plugin loaded by bridge (jsName=\(jsName))")
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = HKHealthStore.isHealthDataAvailable()
        print("[AppleHealth] isAvailable() called, result=\(available)")
        call.resolve(["available": available])
    }

    // HealthKit's requestAuthorization completion only reports whether the
    // request dialog ran, not what the user chose (Apple deliberately hides
    // per-type read grants from the app). For write/share types specifically,
    // authorizationStatus(for:) IS reliable afterwards, so that's checked
    // explicitly here rather than trusting the completion's own success flag.
    //
    // `granted` reflects only the heart-rate (BPM) type — BPM is the metric
    // every write attempt includes, so it decides whether the Settings toggle
    // can turn on at all. SDNN authorization is tracked and reported
    // separately (`hrv`): if the user denies only that one, the toggle still
    // turns on and BPM keeps getting written on its own, matching the
    // intended "BPM allein, ohne SDNN" partial-write behavior — see
    // writeSample() below.
    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["granted": false, "hrv": false])
            return
        }
        let typesToShare: Set<HKSampleType> = [heartRateType, hrvType]
        healthStore.requestAuthorization(toShare: typesToShare, read: []) { [weak self] _, error in
            guard let self else { return }
            if let error {
                print("[AppleHealth] requestAuthorization() error: \(error)")
            }
            let heartRateGranted = self.healthStore.authorizationStatus(for: self.heartRateType) == .sharingAuthorized
            let hrvGranted = self.healthStore.authorizationStatus(for: self.hrvType) == .sharingAuthorized
            print("[AppleHealth] requestAuthorization() result — heartRate=\(heartRateGranted) hrv=\(hrvGranted)")
            call.resolve(["granted": heartRateGranted, "hrv": hrvGranted])
        }
    }

    // BPM and SDNN are saved as two independent HKQuantitySample.save() calls
    // rather than one batched save — HealthKit fails a batch atomically if
    // any sample's type isn't authorized, which would silently drop the BPM
    // write too whenever only SDNN permission was denied. Errors are logged,
    // never surfaced back to JS — this call always resolves, matching the
    // fire-and-forget "never block or alarm the user over a Health write"
    // behavior already established on the JS side.
    @objc func writeSample(_ call: CAPPluginCall) {
        guard let bpm = call.getDouble("bpm") else {
            call.reject("writeSample benötigt bpm.")
            return
        }
        let sdnn = call.getDouble("sdnn")
        let date = Date()
        let group = DispatchGroup()

        group.enter()
        let heartRateSample = HKQuantitySample(
            type: heartRateType,
            quantity: HKQuantity(unit: HKUnit.count().unitDivided(by: .minute()), doubleValue: bpm),
            start: date,
            end: date
        )
        healthStore.save(heartRateSample) { success, error in
            print("[AppleHealth] save(heartRate) success=\(success) error=\(String(describing: error))")
            group.leave()
        }

        if let sdnn {
            group.enter()
            let hrvSample = HKQuantitySample(
                type: hrvType,
                quantity: HKQuantity(unit: .secondUnit(with: .milli), doubleValue: sdnn),
                start: date,
                end: date
            )
            healthStore.save(hrvSample) { success, error in
                print("[AppleHealth] save(hrv) success=\(success) error=\(String(describing: error))")
                group.leave()
            }
        }

        group.notify(queue: .main) {
            call.resolve()
        }
    }
}
