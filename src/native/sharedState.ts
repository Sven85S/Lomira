import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Bridge into the App Group's shared UserDefaults, read by the LomiraWidgets
 * extension (a separate process outside this WebView, with no access to
 * SubscriptionContext/Capacitor Preferences) — see
 * ios/App/App/Plugins/SharedStatePlugin.swift. iOS-only; no Android widget
 * equivalent implemented.
 */
export const isSharedStateSupported = Capacitor.getPlatform() === 'ios';

export interface WidgetState {
  isSubscribed?: boolean;
  streak?: number;
  /** Latest reliable RMSSD in ms, or null once a measurement exists but none is reliable enough. */
  hrvValue?: number | null;
  /** hrvValue minus the mean of the other rmssd-bearing measurements in the last 7 days, or null with too little history. */
  hrvWeekDeltaMs?: number | null;
  practicedToday?: boolean;
}

interface SharedStatePlugin {
  writeState(options: { state: WidgetState }): Promise<void>;
  reloadWidgets(): Promise<void>;
}

const SharedState = registerPlugin<SharedStatePlugin>('SharedState');

/**
 * Merges `patch` into the shared widget state and asks WidgetKit to reload
 * every Lomira widget's timeline. Fire-and-forget by design, same as
 * writeHrvSample — a failed write must never block or alarm the user over
 * something as peripheral as a Home Screen widget. Callers pass only the
 * fields they own; SharedStatePlugin merges rather than overwrites.
 */
export async function writeWidgetState(patch: WidgetState): Promise<void> {
  if (!isSharedStateSupported) return;
  try {
    await SharedState.writeState({ state: patch });
    await SharedState.reloadWidgets();
    console.log('[sharedState] writeWidgetState succeeded', patch);
  } catch (e) {
    console.error('[sharedState] writeWidgetState failed', patch, e);
    throw e;
  }
}
