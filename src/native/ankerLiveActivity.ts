import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * JS-side bridge to AnkerLiveActivityPlugin.swift. The Live Activity is
 * fully passive — it only ever reflects what the app told it to show, never
 * starts, stops or steers the exercise itself. iOS-only; every method is a
 * no-op on other platforms.
 */
export const isAnkerLiveActivitySupported = Capacitor.getPlatform() === 'ios';

export type AnkerPhase = 'inhale' | 'exhale';

export interface AnkerContentState {
  phase: AnkerPhase;
  totalPhaseSeconds: number;
  remainingSeconds: number;
}

interface AnkerLiveActivityPlugin {
  // `reason: "iosBelow16_2"` when the runtime iOS version predates
  // ActivityContent — see AnkerLiveActivityPlugin.swift for why the guard
  // is 16.2 rather than 16.1.
  start(state: AnkerContentState): Promise<{ supported: boolean; id?: string; reason?: string }>;
  update(state: AnkerContentState): Promise<{ supported: boolean; updated?: boolean }>;
  end(): Promise<{ supported: boolean }>;
}

const AnkerLiveActivity = registerPlugin<AnkerLiveActivityPlugin>('AnkerLiveActivity');

/**
 * Fire-and-forget: a failed Live Activity call must never affect the actual
 * exercise. Same pattern as writeWidgetState — a failed native call goes to
 * console.error rather than surfacing to the user.
 */
export async function startAnkerActivity(state: AnkerContentState): Promise<void> {
  if (!isAnkerLiveActivitySupported) return;
  try {
    await AnkerLiveActivity.start(state);
  } catch (e) {
    console.error('[ankerLiveActivity] start failed', e);
  }
}

export async function updateAnkerActivity(state: AnkerContentState): Promise<void> {
  if (!isAnkerLiveActivitySupported) return;
  try {
    await AnkerLiveActivity.update(state);
  } catch (e) {
    console.error('[ankerLiveActivity] update failed', e);
  }
}

export async function endAnkerActivity(): Promise<void> {
  if (!isAnkerLiveActivitySupported) return;
  try {
    await AnkerLiveActivity.end();
  } catch (e) {
    console.error('[ankerLiveActivity] end failed', e);
  }
}
