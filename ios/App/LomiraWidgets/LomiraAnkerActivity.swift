//
//  LomiraAnkerActivity.swift
//  LomiraWidgets
//
//  Live Activity for the Anker breathing exercise: the app starts it via
//  AnkerLiveActivityPlugin when the user taps the ball to begin the exercise,
//  and ends it when they tap again to stop. Fully passive: the Live Activity
//  itself never starts, stops or steers anything — a tap on it only opens
//  the app (widgetURL "lomira://anker"), matching the same
//  "widget/activity does nothing on its own" rule the Home/Lock Screen
//  widgets already follow.
//
//  Availability: the ActivityAttributes struct itself needs no guard (it's
//  just a Codable payload), but everything from ActivityKit lookups upward
//  does. The widget target's deployment target is well above 16.1, so this
//  file (widget bundle side) needs no #available. The app-side plugin
//  guards its own ActivityKit calls because that target still ships iOS 15.
//

import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Shared visuals

private extension String {
    var germanPhaseLabel: String {
        switch self {
        case "inhale": return "Einatmen"
        case "exhale": return "Ausatmen"
        default: return ""
        }
    }
}

/// Fraction of the current phase already elapsed, 0…1. The SwiftUI views
/// use this both for the progress ring and to align the dot on it.
private func progressFraction(state: LomiraAnkerAttributes.ContentState) -> Double {
    guard state.totalPhaseSeconds > 0 else { return 0 }
    let elapsed = Double(state.totalPhaseSeconds - state.remainingSeconds)
    return min(1, max(0, elapsed / Double(state.totalPhaseSeconds)))
}

// MARK: - Lock Screen / expanded Dynamic Island content
//
// Same layout for both — the user asked for parity, so a single view feeds
// the lock-screen banner and the dynamicIsland(expanded:) region. The lock
// screen paints a Himmel-cream background; iOS handles the expanded Dynamic
// Island's own black background itself.

private struct AnkerActivityContent: View {
    let state: LomiraAnkerAttributes.ContentState
    /// Lock-screen banner gets its own painted card; the Dynamic Island
    /// expanded region uses the system's own black background instead.
    var paintCard: Bool

    var body: some View {
        HStack(spacing: 16) {
            // Progress ring around the phase name and countdown. Not a
            // literal breathing ball (Live Activities are static per update
            // — one repaint per second at most is not the same as the app's
            // ~30fps shader) — a clean ring communicates progress instead.
            ZStack {
                Circle()
                    .stroke(Color.lomiraTrack, lineWidth: 5)
                Circle()
                    .trim(from: 0, to: progressFraction(state: state))
                    .stroke(Color.lomiraAccent, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(state.remainingSeconds)")
                        .font(.system(.title2, design: .serif))
                        .foregroundStyle(Color.lomiraText)
                    Text("s")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.lomiraMuted)
                }
            }
            .frame(width: 56, height: 56)

            VStack(alignment: .leading, spacing: 2) {
                Text("ATMUNG")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(1.2)
                    .foregroundStyle(Color.lomiraMuted)
                Text(state.phase.germanPhaseLabel)
                    .font(.system(.title3, design: .serif))
                    .foregroundStyle(Color.lomiraText)
                Text("Ball zum Beenden antippen")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.lomiraMuted)
                    .padding(.top, 2)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, paintCard ? 16 : 0)
        .padding(.vertical, paintCard ? 14 : 0)
        .frame(maxWidth: .infinity, alignment: .leading)
        .containerBackground(paintCard ? AnyShapeStyle(Color.lomiraCard) : AnyShapeStyle(Color.clear), for: .widget)
    }
}

// MARK: - Widget declaration

public struct LomiraAnkerLiveActivity: Widget {
    public init() {}

    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: LomiraAnkerAttributes.self) { context in
            // Lock-screen banner — plus, on older iPhones without a Dynamic
            // Island, the fallback ongoing-activity presentation.
            AnkerActivityContent(state: context.state, paintCard: true)
                .widgetURL(URL(string: "lomira://anker"))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    // Full-width center region so the layout matches the
                    // lock-screen banner exactly, per the user's ask.
                    AnkerActivityContent(state: context.state, paintCard: false)
                }
            } compactLeading: {
                // Small ring in the leading pill next to the notch.
                ZStack {
                    Circle().stroke(Color.lomiraTrack, lineWidth: 2)
                    Circle()
                        .trim(from: 0, to: progressFraction(state: context.state))
                        .stroke(Color.lomiraAccent, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                .frame(width: 18, height: 18)
                .padding(.leading, 2)
            } compactTrailing: {
                Text("\(context.state.remainingSeconds)s")
                    .font(.system(.body, design: .serif))
                    .foregroundStyle(Color.lomiraText)
            } minimal: {
                // Minimal state (multiple activities visible at once): just
                // the seconds — the most useful single glance.
                Text("\(context.state.remainingSeconds)")
                    .font(.system(.body, design: .serif))
                    .foregroundStyle(Color.lomiraAccent)
            }
            .widgetURL(URL(string: "lomira://anker"))
        }
    }
}

// MARK: - Palette bridges
//
// The Home/Lock Screen widget file already defines its own colors as
// `private extension Color`; Live Activity views live in a separate file
// and can't see those. Same values are re-declared here rather than moved
// to a shared file — a shared color helper would be a wider refactor that
// touches an already-working file, and the values match one-for-one.

private extension Color {
    init(anker hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
    static let lomiraCard = Color(anker: 0xEFE7D8)
    static let lomiraText = Color(anker: 0x1F2A36)
    static let lomiraMuted = Color(anker: 0x5F5748)
    static let lomiraAccent = Color(anker: 0x41607E)
    static let lomiraTrack = Color(anker: 0x41607E).opacity(0.18)
}

// MARK: - Previews

#if DEBUG
#Preview("Anker · Sperrbildschirm", as: .content, using: LomiraAnkerAttributes()) {
    LomiraAnkerLiveActivity()
} contentStates: {
    LomiraAnkerAttributes.ContentState(phase: "inhale", totalPhaseSeconds: 4, remainingSeconds: 2)
    LomiraAnkerAttributes.ContentState(phase: "exhale", totalPhaseSeconds: 8, remainingSeconds: 5)
}
#endif
