import type { CSSProperties } from 'react';
import { fonts, gearButton, glassCard, layout, listCard, palette, progressFill, progressTrack, statusDot, type } from '../../styles/himmel';
import type { PpgResult, SignalQuality } from '../../ppg/types';

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
// 3 leaves calmer real signals looking like a wave rather than a flat line
// while still keeping pure warmup noise from filling the whole viewBox.
const MIN_RANGE = 3;

// viewBox of the live line — stretched to the card's full width via
// preserveAspectRatio="none"; vectorEffect keeps the stroke itself unstretched.
const LINE_W = 280;
const LINE_H = 150;

// Catmull-Rom → cubic Bézier through the same points: a soft curve instead of
// straight segments between individual camera frames. Display only.
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

const QUALITY_LABEL: Record<SignalQuality, string> = { good: 'gut', fair: 'brauchbar', poor: 'schwach' };
const QUALITY_COLOR: Record<SignalQuality, string> = { good: palette.reached, fair: palette.close, poor: palette.low };

const tileStyle: CSSProperties = { ...listCard(), padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 };
const unitStyle: CSSProperties = { fontFamily: fonts.sans, fontSize: 13, color: palette.secondary, marginLeft: 6 };

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
    pathD = smoothPath(
      livePoints.map((v, i): [number, number] => [(i / (MAX_POINTS - 1)) * LINE_W, LINE_H - ((v - paddedMin) / paddedRange) * LINE_H]),
    );
  }

  const progress = isWarmup ? 0 : 1 - measureRemainingMs / totalMeasureMs;
  const fingerLost = liveResult?.isFingerDetected === false;
  const bigValue = isWarmup
    ? String(Math.ceil(warmupRemainingMs / 1000))
    : liveResult?.bpm != null
      ? String(Math.round(liveResult.bpm))
      : '--';

  let signal: { label: string; color: string | null };
  if (fingerLost) signal = { label: 'Kein Finger', color: palette.low };
  else if (!liveResult || liveResult.bpm == null) signal = { label: 'Wird erkannt …', color: null };
  else signal = { label: QUALITY_LABEL[liveResult.quality], color: QUALITY_COLOR[liveResult.quality] };

  const hint = fingerLost
    ? 'Finger nicht erkannt — bitte Kamera und Blitz vollständig bedecken.'
    : isWarmup
      ? 'Finger ruhig auf Kamera und Blitz liegen lassen. Gleich beginnt die eigentliche Messung.'
      : 'Bitte ruhig halten, bis die Messung abgeschlossen ist.';

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

      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: layout.blockGap,
          padding: `${layout.blockGap}px ${layout.screenX}px`,
        }}
      >
        <div style={glassCard()}>
          <div style={{ padding: '20px 0 18px' }}>
            <div style={type.overline}>{isWarmup ? 'Signal stabilisiert sich' : 'Puls'}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: layout.overlineToCard }}>
              <span style={{ fontFamily: fonts.serif, fontSize: 64, lineHeight: 1, color: isWarmup ? palette.tertiary : palette.ink }}>{bigValue}</span>
              <span style={unitStyle}>{isWarmup ? 's' : 'bpm'}</span>
            </div>

            <svg
              width="100%"
              height={LINE_H}
              viewBox={`0 0 ${LINE_W} ${LINE_H}`}
              preserveAspectRatio="none"
              style={{ display: 'block', marginTop: 20, overflow: 'visible' }}
            >
              {pathD ? (
                <path
                  d={pathD}
                  fill="none"
                  stroke={palette.accent}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : (
                <line x1={0} y1={LINE_H / 2} x2={LINE_W} y2={LINE_H / 2} stroke={palette.track} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
              )}
            </svg>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
              <div style={tileStyle}>
                <span style={type.overline}>{isWarmup ? 'Messdauer' : 'Verbleibend'}</span>
                <span style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ ...type.sectionTitle, lineHeight: 1, color: palette.ink }}>
                    {Math.ceil((isWarmup ? totalMeasureMs : measureRemainingMs) / 1000)}
                  </span>
                  <span style={{ ...unitStyle, fontSize: 12, marginLeft: 4 }}>s</span>
                </span>
              </div>
              <div style={tileStyle}>
                <span style={type.overline}>Signal</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 22 }}>
                  {signal.color && <span style={statusDot(signal.color)} />}
                  <span style={{ ...type.settingsRow, color: signal.color ? palette.ink : palette.tertiary }}>{signal.label}</span>
                </span>
              </div>
            </div>

            <div style={{ ...progressTrack, marginTop: 18 }}>
              <div style={progressFill(progress, palette.accent)} />
            </div>
          </div>
        </div>

        <p style={{ ...type.hintText, color: fingerLost ? palette.low : palette.tertiary, textAlign: 'center', margin: `0 ${layout.headingInset}px` }}>{hint}</p>
      </div>
    </div>
  );
}
