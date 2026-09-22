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
//
// Siehe auch FORCE_UNLOCKED_FOR_TESTING weiter unten — der Rückbau beider
// Flags gehört zusammen, sobald der echte Key da ist.
export const PURCHASES_DISABLED_TEMPORARILY = true;

// TEMPORÄR — entfernen zusammen mit PURCHASES_DISABLED_TEMPORARILY, sobald
// der echte Apple-Key da ist (Stand 22.09.2026). Grund: Ein HealthKit-Test
// braucht kurzzeitig Zugriff auf den HRV-Tab, aber die RevenueCat-Integration
// ist wegen PURCHASES_DISABLED_TEMPORARILY blockiert — ohne diesen Override
// bleibt isSubscribed dauerhaft false (Purchases.configure() läuft nicht,
// also liefert hasPlusEntitlement() nie true), und der HRV-Tab bliebe
// gesperrt. Erzwingt isSubscribed===true in SubscriptionContext, unabhängig
// vom tatsächlichen RevenueCat-Status — betrifft jeden Bildschirm, der über
// useSubscription() gated ist (HRV, Fortschritt, Übungen, Lektionen).
export const FORCE_UNLOCKED_FOR_TESTING = true;

/**
 * Identifier of the entitlement (configured in the RevenueCat dashboard) that
 * unlocks Lomira Plus: lessons 2-18 and the full ritual history.
 */
export const ENTITLEMENT_ID = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID || 'plus';
