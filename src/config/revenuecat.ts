/**
 * RevenueCat project config. Fill these via a .env.local (see .env.example) —
 * never commit real keys. The public/API key here is safe to ship in the app
 * bundle (it's the client SDK key, not a secret), but it's still per-project
 * config so it stays out of source control.
 */
export const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY ?? '';

/**
 * Identifier of the entitlement (configured in the RevenueCat dashboard) that
 * unlocks Lomira Plus: lessons 2-18 and the full ritual history.
 */
export const ENTITLEMENT_ID = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID || 'plus';
