import { colors, iconBtnStyle, primaryBtnStyle, serif } from '../../styles/tokens';
import type { SignalQuality } from '../../ppg/types';

interface Props {
  onClose: () => void;
  result: { bpm: number; quality: SignalQuality; rmssd?: number; rmssdEstimated?: boolean } | null;
  /** Set when the measurement was cut short by a specific native error (e.g.
   * the torch dimming) — shown instead of the generic "no reliable
   * measurement" text, since here we actually know why and what to do. */
  abortReason?: string | null;
  onOpenFortschritt: () => void;
  onRemeasure: () => void;
}

const QUALITY_LABEL: Record<SignalQuality, string> = { good: 'gut', fair: 'brauchbar', poor: 'schwach' };
const QUALITY_COLOR: Record<SignalQuality, string> = { good: colors.sage, fair: colors.gold, poor: colors.rust };

export default function HrvResultScreen({ onClose, result, abortReason, onOpenFortschritt, onRemeasure }: Props) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, background: colors.surface, zIndex: 35, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 4px', flexShrink: 0 }}>
        <button style={iconBtnStyle} onClick={onClose} aria-label="Schließen">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 20px 28px' }}>
        {result ? (
          <>
            <div style={{ fontFamily: serif, fontSize: 15, color: colors.muted }}>Dein Puls</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: serif, fontSize: 64, fontWeight: 500, color: colors.text }}>{result.bpm}</span>
              <span style={{ fontSize: 16, color: colors.muted }}>bpm</span>
            </div>

            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999,
                background: colors.card, border: `1px solid ${colors.border}`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: QUALITY_COLOR[result.quality] }} />
              <span style={{ fontSize: 13, color: colors.text }}>Signalqualität: {QUALITY_LABEL[result.quality]}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontFamily: serif, fontSize: 15, color: colors.muted }}>Deine HRV</div>
              {result.rmssd != null ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, color: colors.text }}>{Math.round(result.rmssd)}</span>
                    <span style={{ fontSize: 13, color: colors.muted }}>ms RMSSD</span>
                  </div>
                  <span style={{ fontSize: 11, color: colors.muted }}>
                    Kurzfristige Herzratenvariabilität{result.rmssdEstimated ? ' — geschätzt, mit Vorbehalt' : ''}
                  </span>
                </>
              ) : (
                <p style={{ fontSize: 12, color: colors.muted, textAlign: 'center', margin: 0, maxWidth: 240 }}>
                  HRV (RMSSD) nicht verlässlich berechenbar — dafür war das Signal nicht sauber und stabil genug.
                </p>
              )}
            </div>

            <button style={{ ...primaryBtnStyle, marginTop: 8 }} onClick={onOpenFortschritt}>
              Zu Fortschritt
            </button>
            <button
              style={{ background: 'none', border: 'none', color: colors.muted, fontSize: 13, cursor: 'pointer', padding: 0 }}
              onClick={onRemeasure}
            >
              Erneut messen
            </button>
          </>
        ) : (
          <>
            <div style={{ fontFamily: serif, fontSize: 18, color: colors.text, textAlign: 'center' }}>
              {abortReason ? 'Messung abgebrochen' : 'Keine zuverlässige Messung'}
            </div>
            <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', margin: 0, maxWidth: 260 }}>
              {abortReason ?? 'Der Puls konnte nicht sicher erkannt werden. Bitte lege den Finger vollständig auf Kamera und Blitz und halte ihn ruhig.'}
            </p>
            <button style={primaryBtnStyle} onClick={onRemeasure}>
              Erneut versuchen
            </button>
          </>
        )}
      </div>
    </div>
  );
}
