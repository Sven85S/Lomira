import { Capacitor } from '@capacitor/core';

/**
 * RevenueCat project config. Fill these via .env.local (see .env.example) —
 * never commit real keys. These are client SDK keys, safe to ship in the app
 * bundle, but still per-project config so they stay out of source control.
 *
 * A RevenueCat "Test Store" key (the `test_...` keys from RevenueCat's Test
 * Store feature) is platform-agnostic — one key works on iOS and Android
 * alike, since it simulates purchases without talking to StoreKit/Play
 * Billing at all. Real production keys are platform-specific (`appl_...` /
 * `goog_...`), so VITE_REVENUECAT_IOS_API_KEY / VITE_REVENUECAT_ANDROID_API_KEY
 * override the shared VITE_REVENUECAT_API_KEY per platform once you switch.
 */
function resolveApiKey(): string {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' && import.meta.env.VITE_REVENUECAT_IOS_API_KEY) {
    return import.meta.env.VITE_REVENUECAT_IOS_API_KEY;
  }
  if (platform === 'android' && import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY) {
    return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY;
  }
  return import.meta.env.VITE_REVENUECAT_API_KEY ?? '';
}

export const REVENUECAT_API_KEY = resolveApiKey();

// TEMPORÄR — entfernen sobald der echte Apple-Key da ist (Developer-Account-
// Antrag läuft, Stand 18.09.2026). Ein RevenueCat Test-Store-Key crasht
// ordentlich signierte Release-Builds; bis VITE_REVENUECAT_IOS_API_KEY auf
// einen echten appl_...-Key zeigt, bleibt Purchases.configure() komplett aus
// — siehe configureRevenueCat() in purchases.ts.
export const PURCHASES_DISABLED_TEMPORARILY = true;

/**
 * Identifier of the entitlement (configured in the RevenueCat dashboard) that
 * unlocks Lomira Plus: lessons 2-18 and the full ritual history.
 */
export const ENTITLEMENT_ID = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID || 'plus';
