import ActivityKit
import Capacitor
import Foundation

/// Bridges the Anker Live Activity to the JS side (see
/// src/native/ankerLiveActivity.ts). Fully passive from the activity's own
/// perspective: this plugin only ever reacts to explicit JS calls
/// (start/update/end), matching the "widget/activity does nothing on its
/// own" rule the Home/Lock Screen widgets already follow. ActivityKit
/// itself needs iOS 16.2+ (ActivityContent, request(_:content:pushType:),
/// update(_:), end(_:dismissalPolicy:) are all 16.2 APIs — 16.1 shipped
/// with older signatures), and the app's deployment target is 15.0, so
/// every touch below is #available-guarded. On older iOS the plugin
/// silently resolves each call with `supported: false` — the JS caller
/// treats the whole thing as best-effort and never surfaces the missing
/// activity to the user.
@objc(AnkerLiveActivityPlugin)
public class AnkerLiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AnkerLiveActivityPlugin"
    public let jsName = "AnkerLiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
    ]

    /// The one activity this plugin ever creates. Anker is a single-session
    /// exercise (the user runs one at a time), so a single tracked activity
    /// is enough — no need for a keyed dictionary.
    private var activityId: String?

    override public func load() {
        print("[AnkerLiveActivity] plugin loaded")
    }

    @objc func start(_ call: CAPPluginCall) {
        guard let phase = call.getString("phase"),
              let total = call.getInt("totalPhaseSeconds"),
              let remaining = call.getInt("remainingSeconds") else {
            call.reject("start: erwartet phase, totalPhaseSeconds, remainingSeconds")
            return
        }
        if #available(iOS 16.2, *) {
            // Match: Live Activities require Info.plist NSSupportsLiveActivities
            // = YES *and* the per-device toggle (Einstellungen > Face ID … / iOS
            // Focus). If either is off, `areActivitiesEnabled` reads false and
            // the request would throw — resolve gracefully instead so the JS
            // side treats the whole thing as best-effort.
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                call.resolve(["supported": false, "reason": "activitiesDisabled"])
                return
            }
            // End a previous instance (e.g. if the last session died without a
            // clean end call) before starting a new one — never more than one
            // active Anker activity at a time.
            endExistingIfAny()

            let state = LomiraAnkerAttributes.ContentState(
                phase: phase,
                totalPhaseSeconds: total,
                remainingSeconds: remaining
            )
            do {
                let content = ActivityContent(state: state, staleDate: nil)
                let activity = try Activity.request(
                    attributes: LomiraAnkerAttributes(),
                    content: content,
                    pushType: nil
                )
                self.activityId = activity.id
                call.resolve(["supported": true, "id": activity.id])
            } catch {
                call.reject("start: konnte Activity nicht anfragen: \(error.localizedDescription)")
            }
        } else {
            call.resolve(["supported": false, "reason": "iosBelow16_2"])
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard let phase = call.getString("phase"),
              let total = call.getInt("totalPhaseSeconds"),
              let remaining = call.getInt("remainingSeconds") else {
            call.reject("update: erwartet phase, totalPhaseSeconds, remainingSeconds")
            return
        }
        if #available(iOS 16.2, *) {
            guard let id = activityId,
                  let activity = Activity<LomiraAnkerAttributes>.activities.first(where: { $0.id == id }) else {
                // JS updates before start, or after the activity already
                // ended — no-op, don't fail the call.
                call.resolve(["supported": true, "updated": false])
                return
            }
            let state = LomiraAnkerAttributes.ContentState(
                phase: phase,
                totalPhaseSeconds: total,
                remainingSeconds: remaining
            )
            Task {
                let content = ActivityContent(state: state, staleDate: nil)
                await activity.update(content)
                call.resolve(["supported": true, "updated": true])
            }
        } else {
            call.resolve(["supported": false])
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            endExistingIfAny()
        }
        call.resolve(["supported": true])
    }

    // MARK: - Helpers

    @available(iOS 16.2, *)
    private func endExistingIfAny() {
        // End every currently-running Anker activity (usually one, but be
        // defensive: a crash between start and end could have left orphans).
        let activities = Activity<LomiraAnkerAttributes>.activities
        for activity in activities {
            Task { await activity.end(nil, dismissalPolicy: .immediate) }
        }
        self.activityId = nil
    }
}
