import { fonts, layout, palette, pillTrack, statusDot, type } from '../../styles/himmel';
import PrimaryButton from '../../components/PrimaryButton';
import type { SignalQuality } from '../../ppg/types';
import { useT } from '../../i18n';

interface Props {
  result: { bpm: number; quality: SignalQuality; rmssd?: number; rmssdEstimated?: boolean } | null;
  /** Set when the counting phase ran to completion but the finger wasn't
   * reliably detected — shown instead of the generic "no reliable
   * measurement" text, since here the reason is specific and actionable. */
  noFingerDetected?: boolean;
  onOpenFortschritt: () => void;
  onRemeasure: () => void;
}

const QUALITY_KEY: Record<SignalQuality, string> = { good: 'hrv.quality.good', fair: 'hrv.quality.fair', poor: 'hrv.quality.poor' };
const QUALITY_COLOR: Record<SignalQuality, string> = { good: palette.reached, fair: palette.close, poor: palette.low };

// No close button — same reasoning as HrvStartScreen: HRV is a tab now, and
// this screen already has explicit forward actions (Zu Fortschritt/Erneut
// messen) below, so a redundant "X" isn't needed.
export default function HrvResultScreen({ result, noFingerDetected, onOpenFortschritt, onRemeasure }: Props) {
  const { t } = useT();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: `0 ${layout.screenX}px` }}>
        {result ? (
          <>
            <div style={type.overline}>{t('hrv.result.pulsLabel')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ ...type.scoreNumber, color: palette.ink }}>{result.bpm}</span>
              <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary }}>{t('hrv.measuring.bpmUnit')}</span>
            </div>

            <div style={{ ...pillTrack, alignItems: 'center', gap: 6, padding: '6px 14px' }}>
              <span style={statusDot(QUALITY_COLOR[result.quality])} />
              <span style={{ ...type.pill, color: palette.ink }}>{t('hrv.result.qualityLabel', { value: t(QUALITY_KEY[result.quality]) })}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={type.overline}>{t('hrv.result.hrvLabel')}</div>
              {result.rmssd != null ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ ...type.sectionTitle, color: palette.ink }}>{Math.round(result.rmssd)}</span>
                    <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary }}>{t('hrv.result.rmssdUnit')}</span>
                  </div>
                  <span style={{ ...type.small, color: result.rmssdEstimated ? palette.close : palette.tertiary }}>
                    {result.rmssdEstimated ? t('hrv.result.rmssdCaption.estimated') : t('hrv.result.rmssdCaption')}
                  </span>
                </>
              ) : (
                <p style={{ ...type.hintText, color: palette.tertiary, textAlign: 'center', margin: 0, maxWidth: 240 }}>
                  {t('hrv.result.rmssdUnavailable')}
                </p>
              )}
            </div>

            <PrimaryButton style={{ marginTop: 8 }} onClick={onOpenFortschritt}>
              {t('hrv.result.toProgress')}
            </PrimaryButton>
            <button style={{ ...type.pill, background: 'none', border: 'none', color: palette.tertiary, cursor: 'pointer', padding: 0 }} onClick={onRemeasure}>
              {t('hrv.result.remeasure')}
            </button>
          </>
        ) : (
          <>
            <div style={{ ...type.sectionTitle, color: palette.ink, textAlign: 'center' }}>
              {noFingerDetected ? t('hrv.result.noFinger') : t('hrv.result.noReliable')}
            </div>
            <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', margin: 0, maxWidth: 260 }}>
              {noFingerDetected ? t('hrv.result.noFingerBody') : t('hrv.result.noReliableBody')}
            </p>
            <PrimaryButton onClick={onRemeasure}>{t('hrv.result.retry')}</PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}
