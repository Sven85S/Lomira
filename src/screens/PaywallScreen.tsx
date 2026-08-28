import { useState, type CSSProperties } from 'react';
import { colors, iconBtnStyle, primaryBtnStyle, serif } from '../styles/tokens';
import { useSubscription } from '../context/SubscriptionContext';

interface Props {
  onClose: () => void;
}

const FEATURES = ['Alle Lektionen freigeschaltet', 'Unbegrenzter Ritual-Verlauf', 'Neue Inhalte automatisch inklusive'];

export default function PaywallScreen({ onClose }: Props) {
  const { offering, purchasingUnsupported, purchasing, purchaseError, purchase, restore, isSubscribed } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  const yearlyPkg = offering?.annual ?? null;
  const monthlyPkg = offering?.monthly ?? null;
  const yearlyPerMonth = yearlyPkg?.product.pricePerMonth;

  const planTileStyle = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '14px 16px',
    borderRadius: 16,
    background: active ? colors.surface : colors.card,
    border: active ? `2px solid ${colors.text}` : `1px solid ${colors.border}`,
    cursor: 'pointer',
  });

  const handleCta = async () => {
    if (isSubscribed) {
      onClose();
      return;
    }
    const ok = await purchase(selectedPlan);
    if (ok) onClose();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: colors.surface, zIndex: 30, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 4px', flexShrink: 0 }}>
        <button style={iconBtnStyle} onClick={onClose} aria-label="Schließen">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ fontFamily: serif, fontSize: 10, letterSpacing: '0.1em', color: colors.muted, textTransform: 'uppercase', marginTop: 4 }}>lomira</div>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, color: colors.text, textAlign: 'center' }}>Lomira Plus</div>
        <p style={{ fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 1.5, maxWidth: 270, margin: 0 }}>
          Alle 18 Lektionen, dein vollständiger Ritual-Verlauf und alle kommenden Module.
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          {FEATURES.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.sage} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 13, color: colors.text }}>{f}</span>
            </div>
          ))}
        </div>

        {isSubscribed ? (
          <div style={{ ...primaryBtnStyleCard(), textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: colors.text, margin: 0 }}>Du hast Lomira Plus bereits freigeschaltet.</p>
          </div>
        ) : purchasingUnsupported ? (
          <p style={{ fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 1.5, maxWidth: 260 }}>
            Käufe sind nur in der iOS- oder Android-App verfügbar. Öffne Lomira auf deinem Smartphone, um Lomira Plus zu abonnieren.
          </p>
        ) : (
          <>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
              <div style={planTileStyle(selectedPlan === 'yearly')} onClick={() => setSelectedPlan('yearly')}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>Jährlich</span>
                    <span style={{ fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase', color: colors.text, background: colors.gold, padding: '2px 8px', borderRadius: 9999 }}>
                      Empfohlen
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                    {yearlyPerMonth != null ? `entspricht ${yearlyPerMonth.toFixed(2)} €/Monat` : yearlyPkg ? '' : 'Angebot wird geladen …'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>{yearlyPkg?.product.priceString ?? '—'}</div>
                </div>
              </div>
              <div style={planTileStyle(selectedPlan === 'monthly')} onClick={() => setSelectedPlan('monthly')}>
                <span style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>Monatlich</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>{monthlyPkg?.product.priceString ?? '—'}</div>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 11, color: colors.muted, textAlign: 'center', lineHeight: 1.4, margin: '6px 0 0', maxWidth: 260 }}>
              14 Tage kostenlos, danach automatische Verlängerung. Jederzeit kündbar.
            </p>

            {purchaseError && (
              <p style={{ fontSize: 12, color: colors.rust, textAlign: 'center', margin: 0 }}>{purchaseError}</p>
            )}

            <button style={{ ...primaryBtnStyle, marginTop: 4, opacity: purchasing ? 0.6 : 1 }} onClick={handleCta} disabled={purchasing}>
              {purchasing ? 'Einen Moment …' : '14 Tage kostenlos testen'}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <button
                style={{ fontSize: 12, color: colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}
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
      </div>
    </div>
  );
}

function primaryBtnStyleCard(): CSSProperties {
  return { width: '100%', marginTop: 4, padding: '15px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.border}` };
}
