import { fonts, gearButton, layout, palette, progressFill, progressTrack, type, white } from '../../styles/himmel';
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
// Floor under the buffer's real min/max span so a near-silent stretch (e.g.
// right as the finger settles) doesn't blow tiny noise up into a wild line.
const MIN_RANGE = 6;

export default function HrvMeasuringScreen({ onClose, isWarmup, warmupRemainingMs, measureRemainingMs, totalMeasureMs, liveResult, livePoints }: Props) {
  let pathD = '';
  if (livePoints.length > 1) {
    // Scale to the currently visible buffer's own min/max (with padding) so
    // the actual pulse wave reads clearly, instead of a fixed range that
    // flattens it out — purely a display transform, the underlying samples
    // and BPM calculation are untouched.
    const min = Math.min(...livePoints);
    const max = Math.max(...livePoints);
    const range = Math.max(max - min, MIN_RANGE);
    const padding = range * 0.15;
    const paddedMin = min - padding;
    const paddedRange = range + padding * 2;
    pathD = livePoints
      .map((v, i) => {
        const x = (i / (MAX_POINTS - 1)) * 280;
        const y = 60 - ((v - paddedMin) / paddedRange) * 60;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const progress = isWarmup ? 0 : 1 - measureRemainingMs / totalMeasureMs;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* The one HRV sub-screen that keeps its own explicit button — it's not
          just "leave" here, it's "cancel a running measurement" (camera/torch
          active), which tapping a different tab would do too but far less
          visibly than an on-screen Abbrechen button. */}
      <div style={{ display: 'flex', alignItems: 'center', padding: `0 ${layout.screenX}px`, flexShrink: 0 }}>
        <button style={gearButton} onClick={onClose} aria-label="Abbrechen">
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6 * (24 / 17)} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: `0 ${layout.screenX}px` }}>
        {isWarmup ? (
          <>
            <div style={{ ...type.sectionTitle, color: palette.ink, textAlign: 'center' }}>Signal stabilisiert sich …</div>
            <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', margin: 0, maxWidth: 260 }}>
              Finger ruhig auf Kamera und Blitz liegen lassen. Gleich beginnt die eigentliche Messung.
            </p>
            <div style={{ ...type.scoreNumber, color: palette.tertiary }}>{Math.ceil(warmupRemainingMs / 1000)}</div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ ...type.scoreNumber, color: palette.ink }}>{liveResult?.bpm != null ? Math.round(liveResult.bpm) : '--'}</span>
              <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary }}>bpm</span>
            </div>

            <svg
              width={280}
              height={60}
              viewBox="0 0 280 60"
              style={{ background: white(0.58), borderRadius: 24, boxShadow: `inset 0 0 0 1px ${white(0.7)}` }}
            >
              {pathD && <path d={pathD} fill="none" stroke={palette.accent} strokeWidth={1.5} />}
            </svg>

            <p style={{ ...type.hintText, color: palette.tertiary, textAlign: 'center', margin: 0 }}>
              {liveResult?.isFingerDetected === false
                ? 'Finger nicht erkannt — bitte Kamera und Blitz vollständig bedecken.'
                : `Noch ${Math.ceil(measureRemainingMs / 1000)}s — bitte ruhig halten.`}
            </p>

            <div style={{ ...progressTrack, width: 200 }}>
              <div style={progressFill(progress, palette.accent)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
