import { colors, iconBtnStyle, serif } from '../../styles/tokens';
import type { PpgResult } from '../../ppg/types';

interface Props {
  onClose: () => void;
  isWarmup: boolean;
  warmupRemainingMs: number;
  measureRemainingMs: number;
  totalMeasureMs: number;
  liveResult: PpgResult | null;
  livePoints: number[];
}

const MAX_POINTS = 150;

export default function HrvMeasuringScreen({ onClose, isWarmup, warmupRemainingMs, measureRemainingMs, totalMeasureMs, liveResult, livePoints }: Props) {
  const pathD =
    livePoints.length > 1
      ? livePoints
          .map((v, i) => {
            const x = (i / (MAX_POINTS - 1)) * 280;
            const y = 60 - Math.min(60, Math.max(0, v / 4.25));
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  const progress = isWarmup ? 0 : 1 - measureRemainingMs / totalMeasureMs;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, background: colors.surface, zIndex: 35, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 4px', flexShrink: 0 }}>
        <button style={iconBtnStyle} onClick={onClose} aria-label="Abbrechen">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 20px 20px' }}>
        {isWarmup ? (
          <>
            <div style={{ fontFamily: serif, fontSize: 20, color: colors.text, textAlign: 'center' }}>Signal stabilisiert sich …</div>
            <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', margin: 0, maxWidth: 260 }}>
              Finger ruhig auf Kamera und Blitz liegen lassen. Gleich beginnt die eigentliche Messung.
            </p>
            <div style={{ fontFamily: serif, fontSize: 40, color: colors.muted }}>{Math.ceil(warmupRemainingMs / 1000)}</div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: serif, fontSize: 56, fontWeight: 500, color: colors.text }}>
                {liveResult?.bpm != null ? Math.round(liveResult.bpm) : '--'}
              </span>
              <span style={{ fontSize: 15, color: colors.muted }}>bpm</span>
            </div>

            <svg width={280} height={60} viewBox="0 0 280 60" style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}` }}>
              {pathD && <path d={pathD} fill="none" stroke={colors.rust} strokeWidth={1.5} />}
            </svg>

            <p style={{ fontSize: 12, color: colors.muted, textAlign: 'center', margin: 0 }}>
              {liveResult?.isFingerDetected === false
                ? 'Finger nicht erkannt — bitte Kamera und Blitz vollständig bedecken.'
                : `Noch ${Math.ceil(measureRemainingMs / 1000)}s — bitte ruhig halten.`}
            </p>

            <div style={{ width: 200, height: 4, borderRadius: 9999, background: colors.border, overflow: 'hidden' }}>
              <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: colors.rust, transition: 'width 0.2s linear' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
