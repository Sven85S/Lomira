import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * The Apple Health plugin is a local, app-only Swift class (no separate npm
 * package) — see ios/App/App/Plugins/AppleHealthPlugin.swift. Android has no
 * Health Connect equivalent implemented, so this is iOS-only.
 */
export const isAppleHealthSupported = Capacitor.getPlatform() === 'ios';

interface AppleHealthAuthorizationResult {
  /** Whether the heart-rate (BPM) write type was granted — decides whether the Settings toggle can turn on. */
  granted: boolean;
  /** Whether the SDNN write type was granted, tracked separately so BPM can still be written alone if this is denied. */
  hrv: boolean;
}

interface AppleHealthPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(): Promise<AppleHealthAuthorizationResult>;
  writeSample(options: { bpm: number; sdnn?: number }): Promise<void>;
}

const AppleHealth = registerPlugin<AppleHealthPlugin>('AppleHealth');

/**
 * Requests write-only HealthKit authorization for heart rate + SDNN. Only
 * call this from a direct user action (the Health toggle), never on mount —
 * same rule as requestNotificationPermission. Returns whether BPM writes are
 * possible at all; a separately-denied SDNN permission doesn't block this.
 */
export async function requestAppleHealthAuthorization(): Promise<boolean> {
  if (!isAppleHealthSupported) return false;
  const { available } = await AppleHealth.isAvailable();
  if (!available) return false;
  const { granted } = await AppleHealth.requestAuthorization();
  return granted;
}

/**
 * Writes one completed measurement to Health. Fire-and-forget by design —
 * callers catch/log errors and never surface them to the user, matching
 * Lomira's "lokal, kein Zwang" principle. `sdnn` is optional: pass it only
 * when the measurement met its own (stricter than BPM's) reliability gate;
 * omitting it still writes BPM alone.
 */
export async function writeHrvSample(bpm: number, sdnn?: number): Promise<void> {
  if (!isAppleHealthSupported) return;
  await AppleHealth.writeSample({ bpm, sdnn });
}
