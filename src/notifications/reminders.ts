import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/** Local notifications only run on a native shell — same guard pattern as RevenueCat. */
export const isReminderSupported = ['ios', 'android'].includes(Capacitor.getPlatform());

/** Fixed id: there is only ever one daily ritual reminder. */
const REMINDER_ID = 1;

/**
 * Requests the OS notification permission. Only call this from a direct user
 * action (the reminder toggle), never on mount — iOS in particular treats an
 * unprompted permission request as a bad pattern.
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

/** Schedules (or reschedules — same id overwrites) the daily reminder at HH:MM. */
export async function scheduleDailyReminder(time: string): Promise<void> {
  if (!isReminderSupported) return;
  const { hour, minute } = parseTime(time);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: 'Lomira',
        body: 'Zeit für dein tägliches Ritual — wie fühlst du dich gerade?',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      },
    ],
  });
}

export async function cancelDailyReminder(): Promise<void> {
  if (!isReminderSupported) return;
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
}
