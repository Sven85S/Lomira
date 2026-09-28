import { useState, type CSSProperties } from 'react';
import { glassCard, layout, listCard, palette, type, white } from '../styles/himmel';
import OverlayScreen from '../components/OverlayScreen';
import PrimaryButton from '../components/PrimaryButton';
import { useSubscription } from '../context/SubscriptionContext';

interface Props {
  onClose: () => void;
}

const FEATURES = [
  'HRV-Messung freigeschaltet',
  'Fortschritt freigeschaltet',
  'Übungen freigeschaltet',
  'Alle Lektionen freigeschaltet',
  'Unbegrenzter Ritual-Verlauf',
  'Neue Inhalte automatisch inklusive',
];

// Shown only while the real RevenueCat offering hasn't loaded yet (e.g. the
// fetch is still in flight, or genuinely unavailable) — real priceStrings
// from `offering` take over automatically once it does, these are just
// placeholders so the plan picker isn't empty in the meantime.
const FALLBACK_YEARLY_PRICE = 24.99;
const FALLBACK_MONTHLY_PRICE = 2.99;
const formatEuro = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;

// Kapsel wie der Primärbutton, ohne Füllung: Rand 1px Weiß 70 % innen
const secondaryBtnStyle: CSSProperties = {
  ...type.primaryButton,
  width: '100%',
  padding: '15px 0',
  borderRadius: 9999,
  background: 'transparent',
  color: palette.ink,
  cursor: 'pointer',
  border: 'none',
  boxShadow: `inset 0 0 0 1px ${white(0.7)}`,
};

export default function PaywallScreen({ onClose }: Props) {
  const { offering, purchasingUnavailableReason, purchasing, purchaseError, purchase, restore, isSubscribed } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  // Set on a CTA tap while purchasing is unavailable, instead of attempting
  // a real purchase() call — see handlePurchaseAttempt below.
  const [showUnavailableHint, setShowUnavailableHint] = useState(false);

  const yearlyPkg = offering?.annual ?? null;
  const monthlyPkg = offering?.monthly ?? null;
  const yearlyPerMonth = yearlyPkg?.product.pricePerMonth;

  const planTileStyle = (active: boolean): CSSProperties => ({
    ...listCard(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    background: active ? white(0.45) : white(0.58),
    boxShadow: active ? `inset 0 0 0 2px ${palette.ink}` : `inset 0 0 0 1px ${white(0.7)}`,
    cursor: 'pointer',
  });

  // Shared by both CTAs — RevenueCat/StoreKit determine trial eligibility
  // from the product's own configuration, not from which button was
  // tapped, so "7 Tage kostenlos testen" and "Jetzt erwerben" have nothing
  // to branch on differently once real purchasing returns; both call the
  // same purchase(selectedPlan). While it's unavailable, both show the
  // existing inline hint instead of attempting a real purchase.
  const handlePurchaseAttempt = async () => {
    if (isSubscribed) {
      onClose();
      return;
    }
    if (purchasingUnavailableReason) {
      setShowUnavailableHint(true);
      return;
    }
    setShowUnavailableHint(false);
    const ok = await purchase(selectedPlan);
    if (ok) onClose();
  };

  return (
    <OverlayScreen zIndex={30} onBack={onClose} backAriaLabel="Schließen">
      <div style={{ padding: `0 ${layout.headingInset}px` }}>
        <div style={type.wordmark}>Lomira</div>
        <div style={{ ...type.sheetTitle, color: palette.ink, marginTop: layout.overlineToTitle }}>Lomira Plus</div>
      </div>

      <div style={glassCard()}>
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ ...type.body, color: palette.ink }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {isSubscribed ? (
        <div style={glassCard()}>
          <p style={{ ...type.body, color: palette.ink, margin: 0, padding: '12px 0', textAlign: 'center' }}>Du hast Lomira Plus bereits freigeschaltet.</p>
        </div>
      ) : (
        <>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={planTileStyle(selectedPlan === 'yearly')} onClick={() => setSelectedPlan('yearly')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...type.cardTitle, color: palette.ink }}>Jährlich</span>
                  <span style={{ ...type.overline, color: palette.onAccent, background: palette.accent, padding: '2px 8px', borderRadius: 9999 }}>
                    Empfohlen
                  </span>
                </div>
                <div style={{ ...type.small, color: palette.secondary, marginTop: 4 }}>
                  entspricht {yearlyPerMonth != null ? formatEuro(yearlyPerMonth) : formatEuro(FALLBACK_YEARLY_PRICE / 12)}/Monat
                </div>
              </div>
              <div style={{ ...type.cardTitle, color: palette.ink, textAlign: 'right' }}>
                {yearlyPkg?.product.priceString ?? formatEuro(FALLBACK_YEARLY_PRICE)}
              </div>
            </div>
            <div style={planTileStyle(selectedPlan === 'monthly')} onClick={() => setSelectedPlan('monthly')}>
              <span style={{ ...type.cardTitle, color: palette.ink }}>Monatlich</span>
              <div style={{ ...type.cardTitle, color: palette.ink, textAlign: 'right' }}>
                {monthlyPkg?.product.priceString ?? formatEuro(FALLBACK_MONTHLY_PRICE)}
              </div>
            </div>
          </div>

          <p style={{ ...type.small, color: palette.tertiary, textAlign: 'center', lineHeight: 1.4, margin: '0 auto', maxWidth: 260 }}>
            7 Tage kostenlos, danach automatische Verlängerung. Jederzeit kündbar.
          </p>

          {purchaseError && <p style={{ ...type.hintText, color: palette.low, textAlign: 'center', margin: 0 }}>{purchaseError}</p>}

          {showUnavailableHint && purchasingUnavailableReason && (
            <p style={{ ...type.hintText, color: palette.tertiary, textAlign: 'center', lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
              Käufe sind nur in der iOS-App verfügbar.
            </p>
          )}

          <PrimaryButton style={{ opacity: purchasing ? 0.6 : 1 }} onClick={handlePurchaseAttempt} disabled={purchasing}>
            {purchasing ? 'Einen Moment …' : '7 Tage kostenlos testen'}
          </PrimaryButton>

          <button style={{ ...secondaryBtnStyle, opacity: purchasing ? 0.6 : 1 }} onClick={handlePurchaseAttempt} disabled={purchasing}>
            Jetzt erwerben
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button
              style={{ ...type.pill, color: palette.tertiary, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={async () => {
                const ok = await restore();
                if (ok) onClose();
              }}
            >
              Bereits abonniert? Käufe wiederherstellen
            </button>
          </div>
        </>
      )}
    </OverlayScreen>
  );
}
