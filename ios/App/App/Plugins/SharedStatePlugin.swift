import Capacitor
import Foundation
import WidgetKit

/// Bridges app state into the App Group's shared UserDefaults, the only
/// channel the LomiraWidgets extension has — it runs as its own process
/// outside this WebView, with no access to SubscriptionContext or Capacitor
/// Preferences. Write-only from the app's side; the extension reads this
/// same key synchronously while building its timeline entries.
@objc(SharedStatePlugin)
public class SharedStatePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SharedStatePlugin"
    public let jsName = "SharedState"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "writeState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadWidgets", returnType: CAPPluginReturnPromise),
    ]

    private static let appGroupId = "group.com.lomira.app"
    private static let stateKey = "lomira.widgetState.v1"

    override public func load() {
        print("[SharedState] plugin loaded by bridge (jsName=\(jsName))")
    }

    // SubscriptionContext and DataContext each own different fields of the
    // same shared blob (isSubscribed vs. streak/hrvValue/practicedToday) and
    // write independently of one another — merging into whatever's already
    // stored, rather than overwriting wholesale, means neither call can blow
    // away fields the other context is responsible for.
    @objc func writeState(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: Self.appGroupId) else {
            call.reject("App Group \(Self.appGroupId) nicht verfügbar.")
            return
        }
        guard let patch = call.getObject("state") else {
            call.reject("writeState benötigt ein 'state'-Objekt.")
            return
        }

        var state: [String: Any] = [:]
        if let existingData = defaults.data(forKey: Self.stateKey),
           let existing = try? JSONSerialization.jsonObject(with: existingData) as? [String: Any] {
            state = existing
        }
        for (key, value) in patch { state[key] = value }
        state["updatedAt"] = Date().timeIntervalSince1970

        guard JSONSerialization.isValidJSONObject(state), let data = try? JSONSerialization.data(withJSONObject: state) else {
            call.reject("Zustand konnte nicht serialisiert werden.")
            return
        }
        defaults.set(data, forKey: Self.stateKey)
        print("[SharedState] writeState() merged keys=\(Array(patch.keys)) → \(state)")
        call.resolve()
    }

    @objc func reloadWidgets(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            print("[SharedState] reloadWidgets() — reloadAllTimelines() called")
        }
        call.resolve()
    }
}
