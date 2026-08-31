import { Preferences } from '@capacitor/preferences';

/**
 * Thin JSON wrapper around @capacitor/preferences. On iOS this persists to
 * UserDefaults; in the browser (dev, or a plain web build) Capacitor's web
 * implementation backs it with localStorage — so the same calls work in both.
 */
export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const { value } = await Preferences.get({ key });
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function writeJSON<T>(key: string, value: T): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

export const STORAGE_KEYS = {
  ritualEntries: 'lomira.ritualEntries.v1',
  ankerSessionCount: 'lomira.ankerSessionCount.v1',
  pulseEntries: 'lomira.pulseEntries.v1',
  firstName: 'lomira.firstName.v1',
  remindersEnabled: 'lomira.remindersEnabled.v1',
  reminderTime: 'lomira.reminderTime.v1',
} as const;
