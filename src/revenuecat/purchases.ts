import { Capacitor } from '@capacitor/core';
import {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  Purchases,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
} from '@revenuecat/purchases-capacitor';
import { ENTITLEMENT_ID, REVENUECAT_API_KEY } from '../config/revenuecat';

/** RevenueCat's iOS SDK only runs on a native shell — guard every call site with this. */
export const isRevenueCatSupported = Capacitor.getPlatform() === 'ios';

let configured = false;

export async function configureRevenueCat(): Promise<void> {
  if (!isRevenueCatSupported || configured) return;
  if (!REVENUECAT_API_KEY) {
    console.warn('Lomira: VITE_REVENUECAT_IOS_API_KEY is not set — RevenueCat stays unconfigured.');
    return;
  }
  await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
  await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  configured = true;
}

export function hasPlusEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatSupported || !configured) return null;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isRevenueCatSupported || !configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePlan(offering: PurchasesOffering, plan: 'yearly' | 'monthly'): Promise<CustomerInfo> {
  const pkg = plan === 'yearly' ? offering.annual : offering.monthly;
  if (!pkg) throw new Error(`Lomira: keine "${plan}" Package im aktuellen Offering konfiguriert.`);
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

export function isUserCancelledError(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as PurchasesError).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export function purchaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) return String((error as PurchasesError).message);
  return 'Der Kauf konnte nicht abgeschlossen werden.';
}
