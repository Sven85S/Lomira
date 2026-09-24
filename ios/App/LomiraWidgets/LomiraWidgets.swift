//
//  LomiraWidgets.swift
//  LomiraWidgets
//
//  Home Screen (1a small / 1c medium) and Lock Screen (2c accessoryRectangular)
//  widgets from the approved design concept. Replaces Xcode's default
//  AppIntentTimelineProvider scaffold — nothing here needs per-instance user
//  configuration, so this uses a plain TimelineProvider instead.
//
//  Typography note: "Instrument Serif"/"Instrument Sans" are only ever
//  loaded as web fonts inside the app's WebView (Google Fonts CDN) — no
//  .ttf/.otf is bundled natively anywhere in this Xcode project, so a
//  widget can't reference them by name. SwiftUI's built-in `.serif` design
//  (New York) stands in as the closest native equivalent for the numerals.

import WidgetKit
import SwiftUI

// MARK: - Shared state (App Group)

/// Mirrors SharedStatePlugin.swift's JSON contract. Every field optional in
/// the raw decode — the plugin's writeState() merges partial patches from two
/// independent callers (SubscriptionContext writes isSubscribed,
/// DataContext writes streak/hrvValue/practicedToday), so on a fresh install,
/// or between those two ever having both fired, any subset of keys can be
/// missing. A single missing key must never fail the whole decode and fall
/// back to defaults for fields that WERE actually written.
private struct RawWidgetState: Codable {
    var isSubscribed: Bool?
    var streak: Int?
    var hrvValue: Double?
    var hrvWeekDeltaMs: Double?
    var practicedToday: Bool?
}

struct LomiraWidgetState {
    let isSubscribed: Bool
    let streak: Int
    let hrvValue: Double?
    let hrvWeekDeltaMs: Double?
    let practicedToday: Bool

    static let appGroupId = "group.com.lomira.app"
    static let stateKey = "lomira.widgetState.v1"

    static let empty = LomiraWidgetState(isSubscribed: false, streak: 0, hrvValue: nil, hrvWeekDeltaMs: nil, practicedToday: false)

    static func load() -> LomiraWidgetState {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: stateKey),
              let raw = try? JSONDecoder().decode(RawWidgetState.self, from: data) else {
            return .empty
        }
        return LomiraWidgetState(
            isSubscribed: raw.isSubscribed ?? false,
            streak: raw.streak ?? 0,
            hrvValue: raw.hrvValue,
            hrvWeekDeltaMs: raw.hrvWeekDeltaMs,
            practicedToday: raw.practicedToday ?? false
        )
    }
}

// MARK: - Colors (from the approved widget design concept, not tokens.ts —
// a separate, widget-specific palette tuned for Home/Lock Screen legibility)

private extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
    static let lomiraCard = Color(hex: 0xEFE7D8)
    static let lomiraText = Color(hex: 0x1F2A36)
    static let lomiraMuted = Color(hex: 0x5F5748)
    static let lomiraAccent = Color(hex: 0x41607E)
    static let lomiraAccentText = Color(hex: 0xF8F1E3)
}

// MARK: - Timeline

struct LomiraWidgetsEntry: TimelineEntry {
    let date: Date
    let state: LomiraWidgetState
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> LomiraWidgetsEntry {
        LomiraWidgetsEntry(date: Date(), state: .empty)
    }

    func getSnapshot(in context: Context, completion: @escaping (LomiraWidgetsEntry) -> Void) {
        completion(LomiraWidgetsEntry(date: Date(), state: LomiraWidgetState.load()))
    }

    // One entry for "now", refreshed whenever the app calls
    // SharedStatePlugin.reloadWidgets() after a real change — plus an hourly
    // backstop in case a reload call is ever missed (app killed mid-write,
    // etc.), so the widget can't go stale indefinitely on its own.
    func getTimeline(in context: Context, completion: @escaping (Timeline<LomiraWidgetsEntry>) -> Void) {
        let entry = LomiraWidgetsEntry(date: Date(), state: LomiraWidgetState.load())
        let nextHour = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextHour)))
    }
}

// MARK: - Locked state (shared across all three families)

private struct LockedContent: View {
    var compact: Bool = false

    var body: some View {
        VStack(spacing: compact ? 4 : 8) {
            Image(systemName: "lock.fill")
                .font(compact ? .caption : .title2)
                .foregroundStyle(.secondary)
            Text("Nur mit Lomira Plus")
                .font(compact ? .caption2 : .caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - 1a · Home klein (systemSmall)

private struct SmallStreakView: View {
    let state: LomiraWidgetState

    var body: some View {
        if !state.isSubscribed {
            LockedContent(compact: true)
        } else {
            VStack(alignment: .leading, spacing: 0) {
                Image("LomiraBall")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 46, height: 46)
                    .clipShape(Circle())

                Spacer(minLength: 8)

                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("\(state.streak) Tage")
                            .font(.system(.title2, design: .serif))
                            .foregroundStyle(Color.lomiraText)
                        Text("in Folge")
                            .font(.caption2)
                            .foregroundStyle(Color.lomiraMuted)
                    }
                    Spacer()
                    ZStack {
                        Circle().fill(Color.lomiraAccent)
                        Image(systemName: "arrow.right")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Color.lomiraAccentText)
                    }
                    .frame(width: 26, height: 26)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }
}

// MARK: - 1c · Home mittel (systemMedium)

private struct MediumHrvView: View {
    let state: LomiraWidgetState

    var body: some View {
        if !state.isSubscribed {
            LockedContent()
        } else {
            HStack(spacing: 16) {
                Image("LomiraBall")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 74, height: 74)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("SERIE")
                            .font(.system(size: 9, weight: .semibold))
                            .tracking(1.2)
                            .foregroundStyle(Color.lomiraMuted)
                        Text("\(state.streak) Tage")
                            .font(.system(.title3, design: .serif))
                            .foregroundStyle(Color.lomiraText)
                    }

                    Divider().overlay(Color.lomiraAccent.opacity(0.18))

                    VStack(alignment: .leading, spacing: 1) {
                        Text("HRV HEUTE FRÜH")
                            .font(.system(size: 9, weight: .semibold))
                            .tracking(1.2)
                            .foregroundStyle(Color.lomiraMuted)
                        if let hrv = state.hrvValue {
                            HStack(alignment: .lastTextBaseline, spacing: 5) {
                                Text("\(Int(hrv.rounded()))")
                                    .font(.system(.title3, design: .serif))
                                    .foregroundStyle(Color.lomiraAccent)
                                Text(hrvSuffix)
                                    .font(.system(size: 10))
                                    .foregroundStyle(Color.lomiraMuted)
                            }
                        } else {
                            Text("Noch keine Messung")
                                .font(.system(size: 11))
                                .foregroundStyle(Color.lomiraMuted)
                        }
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }

    private var hrvSuffix: String {
        guard let delta = state.hrvWeekDeltaMs else { return "ms" }
        let rounded = Int(delta.rounded())
        let sign = rounded >= 0 ? "+" : ""
        return "ms · \(sign)\(rounded) zur Woche"
    }
}

// MARK: - 2c · Sperrbildschirm (accessoryRectangular)
//
// iOS renders accessory-family widgets itself, stripped of custom colors
// (vibrant, tinted to match the Lock Screen) — Text/Image content only,
// no Color.lomira* here, it would be ignored anyway.

private struct LockScreenView: View {
    let state: LomiraWidgetState

    var body: some View {
        if !state.isSubscribed {
            HStack(spacing: 8) {
                Image(systemName: "lock.fill")
                Text("Nur mit Lomira Plus")
                    .font(.caption2)
            }
        } else {
            HStack(spacing: 8) {
                // Deliberately a vector shape, not Image("LomiraBall") — a
                // full-color bitmap here (combined with .resizable() +
                // .clipShape()) was the confirmed cause of the whole
                // accessoryRectangular view rendering blank on-device.
                // WidgetKit's accessory families expect SF Symbols or
                // template-rendered images, not raw raster content; a plain
                // Shape renders correctly since iOS fills it with its own
                // vibrant/monochrome tint automatically, same as it already
                // does for the Text/SF Symbol content in this view.
                Circle()
                    .frame(width: 32, height: 32)

                VStack(alignment: .leading, spacing: 1) {
                    Text(state.practicedToday ? "Heute geübt" : "Zeit durchzuatmen")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                    Text("\(state.streak) Tage in Folge")
                        .font(.caption2)
                        .lineLimit(1)
                }
            }
        }
    }
}

// MARK: - Entry view (picks the layout for the current family)

struct LomiraWidgetsEntryView: View {
    @Environment(\.widgetFamily) private var family
    var entry: Provider.Entry

    var body: some View {
        Group {
            switch family {
            case .systemSmall:
                SmallStreakView(state: entry.state)
            case .accessoryRectangular:
                LockScreenView(state: entry.state)
            default:
                MediumHrvView(state: entry.state)
            }
        }
        .containerBackground(family == .accessoryRectangular ? AnyShapeStyle(Color.clear) : AnyShapeStyle(Color.lomiraCard), for: .widget)
        // Never a bare "open the app" link when locked — every tap goes
        // straight to the Paywall instead, same intent as onOpenPaywall
        // elsewhere. Unlocked, no explicit URL: a tap just opens the app
        // normally, matching "widget never starts anything on its own".
        .widgetURL(entry.state.isSubscribed ? nil : URL(string: "lomira://paywall"))
    }
}

// MARK: - Widget declaration

struct LomiraWidgets: Widget {
    let kind: String = "LomiraWidgets"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            LomiraWidgetsEntryView(entry: entry)
        }
        .configurationDisplayName("Lomira")
        .description("Deine Serie und dein HRV-Wert auf einen Blick.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

#Preview("1a · Klein", as: .systemSmall) {
    LomiraWidgets()
} timeline: {
    LomiraWidgetsEntry(date: .now, state: LomiraWidgetState(isSubscribed: true, streak: 5, hrvValue: nil, hrvWeekDeltaMs: nil, practicedToday: false))
}

#Preview("1c · Mittel", as: .systemMedium) {
    LomiraWidgets()
} timeline: {
    LomiraWidgetsEntry(date: .now, state: LomiraWidgetState(isSubscribed: true, streak: 5, hrvValue: 54, hrvWeekDeltaMs: 3, practicedToday: false))
}

#Preview("2c · Sperrbildschirm", as: .accessoryRectangular) {
    LomiraWidgets()
} timeline: {
    LomiraWidgetsEntry(date: .now, state: LomiraWidgetState(isSubscribed: true, streak: 5, hrvValue: 54, hrvWeekDeltaMs: 3, practicedToday: true))
}
