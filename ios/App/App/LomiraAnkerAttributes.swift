//
//  LomiraAnkerAttributes.swift
//
//  Shared between the app target (which starts/updates/ends the activity
//  via AnkerLiveActivityPlugin) and the widget target (which renders it).
//  ActivityAttributes/ActivityContent are ActivityKit types; the protocol
//  itself needs iOS 16.1 but the plain data types Codable/Hashable are
//  fine on the app's 15.0 deployment target — every USER of the attributes
//  (Activity<…>.request/update/end) guards with #available on its side.
//

import ActivityKit

/// Fixed configuration for the whole life of one Anker Live Activity. The
/// breath rhythm the user picked (in seconds) doesn't change within a
/// running exercise, so it lives here rather than in the per-tick
/// ContentState — smaller updates, and the durations still travel with the
/// activity itself so the SwiftUI views don't need to invent them.
///
/// The ActivityAttributes protocol needs iOS 16.1+; the app-side plugin
/// guards every touch with #available and the widget target's deployment
/// target sits well above 16.1, so this file compiles in both.
@available(iOS 16.1, *)
public struct LomiraAnkerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// "inhale" or "exhale" — matches the JS-side Phase type.
        public var phase: String
        /// Full duration of the currently running phase in seconds (inhale
        /// duration during "inhale", exhale duration during "exhale") — the
        /// progress ring needs both this and remainingSeconds.
        public var totalPhaseSeconds: Int
        /// Whole seconds left in the current phase, counting down.
        public var remainingSeconds: Int

        public init(phase: String, totalPhaseSeconds: Int, remainingSeconds: Int) {
            self.phase = phase
            self.totalPhaseSeconds = totalPhaseSeconds
            self.remainingSeconds = remainingSeconds
        }
    }

    // Placeholder — no per-instance static data yet. Kept so future needs
    // (e.g. session id) don't require an attribute-shape migration.
    public var kind: String

    public init(kind: String = "anker") {
        self.kind = kind
    }
}
