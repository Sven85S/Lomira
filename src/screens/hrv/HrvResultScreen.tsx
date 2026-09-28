import { fonts, layout, palette, pillTrack, statusDot, type } from '../../styles/himmel';
import PrimaryButton from '../../components/PrimaryButton';
import type { SignalQuality } from '../../ppg/types';

interface Props {
  result: { bpm: number; quality: SignalQuality; rmssd?: number; rmssdEstimated?: boolean } | null;
  /** Set when the counting phase ran to completion but the finger wasn't
   * reliably detected — shown instead of the generic "no reliable
   * measurement" text, since here the reason is specific and actionable. */
  noFingerDetected?: boolean;
  onOpenFortschritt: () => void;
  onRemeasure: () => void;
}

const QUALITY_LABEL: Record<SignalQuality, string> = { good: 'gut', fair: 'brauchbar', poor: 'schwach' };
const QUALITY_COLOR: Record<SignalQuality, string> = { good: palette.reached, fair: palette.close, poor: palette.low };

// No close button — same reasoning as HrvStartScreen: HRV is a tab now, and
// this screen already has explicit forward actions (Zu Fortschritt/Erneut
// messen) below, so a redundant "X" isn't needed.
export default function HrvResultScreen({ result, noFingerDetected, onOpenFortschritt, onRemeasure }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: `0 ${layout.screenX}px` }}>
        {result ? (
          <>
            <div style={type.overline}>Dein Puls</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ ...type.scoreNumber, color: palette.ink }}>{result.bpm}</span>
              <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary }}>bpm</span>
            </div>

            <div style={{ ...pillTrack, alignItems: 'center', gap: 6, padding: '6px 14px' }}>
              <span style={statusDot(QUALITY_COLOR[result.quality])} />
              <span style={{ ...type.pill, color: palette.ink }}>Signalqualität: {QUALITY_LABEL[result.quality]}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={type.overline}>Deine HRV</div>
              {result.rmssd != null ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ ...type.sectionTitle, color: palette.ink }}>{Math.round(result.rmssd)}</span>
                    <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary }}>ms RMSSD</span>
                  </div>
                  <span style={{ ...type.small, color: result.rmssdEstimated ? palette.close : palette.tertiary }}>
                    Kurzfristige Herzratenvariabilität{result.rmssdEstimated ? ' — geschätzt, mit Vorbehalt' : ''}
                  </span>
                </>
              ) : (
                <p style={{ ...type.hintText, color: palette.tertiary, textAlign: 'center', margin: 0, maxWidth: 240 }}>
                  HRV (RMSSD) nicht verlässlich berechenbar — dafür war das Signal nicht sauber und stabil genug.
                </p>
              )}
            </div>

            <PrimaryButton style={{ marginTop: 8 }} onClick={onOpenFortschritt}>
              Zu Fortschritt
            </PrimaryButton>
            <button style={{ ...type.pill, background: 'none', border: 'none', color: palette.tertiary, cursor: 'pointer', padding: 0 }} onClick={onRemeasure}>
              Erneut messen
            </button>
          </>
        ) : (
          <>
            <div style={{ ...type.sectionTitle, color: palette.ink, textAlign: 'center' }}>
              {noFingerDetected ? 'Kein Finger erkannt' : 'Keine zuverlässige Messung'}
            </div>
            <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', margin: 0, maxWidth: 260 }}>
              {noFingerDetected
                ? 'Der Finger lag während der Messung nicht zuverlässig auf Kamera und Blitz. Bitte beide vollständig bedecken und ruhig halten.'
                : 'Der Puls konnte nicht sicher erkannt werden. Bitte lege den Finger vollständig auf Kamera und Blitz und halte ihn ruhig.'}
            </p>
            <PrimaryButton onClick={onRemeasure}>Erneut versuchen</PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}
