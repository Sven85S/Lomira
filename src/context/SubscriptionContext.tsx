import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PurchasesOffering } from '@revenuecat/purchases-capacitor';
import {
  configureRevenueCat,
  fetchCurrentOffering,
  fetchCustomerInfo,
  getPurchasingUnavailableReason,
  hasPlusEntitlement,
  isUserCancelledError,
  purchaseErrorMessage,
  purchasePlan,
  restorePurchases,
  type PurchasingUnavailableReason,
} from '../revenuecat/purchases';

interface SubscriptionContextValue {
  loading: boolean;
  isSubscribed: boolean;
  offering: PurchasesOffering | null;
  /** Null once purchasing genuinely works; otherwise why it doesn't right now
   * (unsupported platform). */
  purchasingUnavailableReason: PurchasingUnavailableReason;
  purchasing: boolean;
  purchaseError: string | null;
  purchase: (plan: 'yearly' | 'monthly') => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  // Computed post-mount (inside the effect below), not at module-load time —
  // see isRevenueCatSupported()'s own comment in purchases.ts for why a
  // load-time snapshot of Capacitor.getPlatform() can freeze at the wrong
  // "web" result on a real device.
  const [purchasingUnavailableReason, setPurchasingUnavailableReason] = useState<PurchasingUnavailableReason>(null);

  const refresh = useCallback(async () => {
    const [info, current] = await Promise.all([fetchCustomerInfo(), fetchCurrentOffering()]);
    setIsSubscribed(hasPlusEntitlement(info));
    setOffering(current);
  }, []);

  useEffect(() => {
    (async () => {
      setPurchasingUnavailableReason(getPurchasingUnavailableReason());
      await configureRevenueCat();
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const purchase = useCallback(
    async (plan: 'yearly' | 'monthly') => {
      if (!offering) {
        setPurchaseError('Aktuell ist kein Angebot verfügbar. Bitte versuch es später erneut.');
        return false;
      }
      setPurchasing(true);
      setPurchaseError(null);
      try {
        const info = await purchasePlan(offering, plan);
        setIsSubscribed(hasPlusEntitlement(info));
        return hasPlusEntitlement(info);
      } catch (error) {
        if (!isUserCancelledError(error)) setPurchaseError(purchaseErrorMessage(error));
        return false;
      } finally {
        setPurchasing(false);
      }
    },
    [offering],
  );

  const restore = useCallback(async () => {
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const info = await restorePurchases();
      setIsSubscribed(hasPlusEntitlement(info));
      return hasPlusEntitlement(info);
    } catch (error) {
      setPurchaseError(purchaseErrorMessage(error));
      return false;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      loading,
      isSubscribed,
      offering,
      purchasingUnavailableReason,
      purchasing,
      purchaseError,
      purchase,
      restore,
      refresh,
    }),
    [loading, isSubscribed, offering, purchasingUnavailableReason, purchasing, purchaseError, purchase, restore, refresh],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
