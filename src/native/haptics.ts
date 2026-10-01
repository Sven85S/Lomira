import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';

/**
 * One short haptic pulse to confirm an event has finished. Same shape as
 * sharedState / ppgCamera: silently a no-op on non-native platforms (web
 * build has no Taptic Engine to talk to), and a failed call is swallowed —
 * a missed buzz should never affect the measurement result that just came in.
 */
export async function hapticSuccess(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    console.error('[haptics] success notification failed', e);
  }
}
