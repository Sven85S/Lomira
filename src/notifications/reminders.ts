import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage';

/** Local notifications only run on a native shell — same guard pattern as RevenueCat. */
export const isReminderSupported = ['ios', 'android'].includes(Capacitor.getPlatform());

/** One user-configured daily reminder. `id` is the native LocalNotifications id (see getNextReminderId). */
export interface ReminderEntry {
  id: number;
  time: string;
  enabled: boolean;
}

/**
 * Requests the OS notification permission. Only call this from a direct user
 * action (adding the first reminder, or re-enabling one), never on mount —
 * iOS in particular treats an unprompted permission request as a bad pattern.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isReminderSupported) return false;
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted';
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

/**
 * Each reminder entry owns a stable native notification id for its whole
 * lifetime (not derived from its position in the list — deleting an earlier
 * entry must never shift which id an unrelated entry's schedule/cancel calls
 * target). Ids come from a persisted, monotonically increasing counter
 * rather than e.g. Date.now(), so two reminders added in quick succession
 * can never collide.
 */
export async function getNextReminderId(): Promise<number> {
  const next = await readJSON(STORAGE_KEYS.reminderNextId, 2);
  await writeJSON(STORAGE_KEYS.reminderNextId, next + 1);
  return next;
}

/** Schedules (or reschedules — same id overwrites) a daily reminder at HH:MM under `id`. */
export async function scheduleReminder(id: number, time: string): Promise<void> {
  if (!isReminderSupported) return;
  const { hour, minute } = parseTime(time);
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: 'Lomira',
        body: 'Zeit für dein tägliches Ritual — wie fühlst du dich gerade?',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      },
    ],
  });
}

export async function cancelReminder(id: number): Promise<void> {
  if (!isReminderSupported) return;
  await LocalNotifications.cancel({ notifications: [{ id }] });
}
