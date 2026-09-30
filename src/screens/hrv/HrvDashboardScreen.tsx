import type { CSSProperties } from 'react';
import { fonts, glassCard, layout, palette, type } from '../../styles/himmel';
import { useData } from '../../context/DataContext';
import { formatEntryDate } from '../../lib/date';
import { buildHrvDashboard } from '../../store/hrvSelectors';
import PrimaryButton from '../../components/PrimaryButton';
import { useLocale, useT } from '../../i18n';

interface Props {
  /** No active subscription/trial — takes priority over everything else,
   * same as the gate HrvStartScreen used to run itself before it became
   * reachable only via this dashboard's own CTA. */
  locked: boolean;
  onOpenPaywall: () => void;
  onStartMeasurement: () => void;
}

const scrollStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: `0 ${layout.screenX}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: layout.blockGap,
};

// Same lock glyph as HrvStartScreen's/FortschrittScreen's own LockIcon —
// each screen defines its own copy rather than sharing one, matching this
// codebase's established per-file icon convention.
function LockIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={palette.tertiary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function HrvDashboardScreen({ locked, onOpenPaywall, onStartMeasurement }: Props) {
  const { t } = useT();
  const locale = useLocale();
  const { hrvMeasurements } = useData();

  if (locked) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...scrollStyle, alignItems: 'center', gap: 16, marginTop: 40 }}>
          <LockIcon />
          <p style={{ ...type.body, color: palette.ink, textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
            {t('hrvDashboard.locked.body')}
          </p>
          <PrimaryButton onClick={onOpenPaywall}>{t('hrvDashboard.locked.cta')}</PrimaryButton>
        </div>
      </div>
    );
  }

  const dashboard = buildHrvDashboard(hrvMeasurements);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={scrollStyle}>
        <div style={{ ...type.pageTitle, color: palette.ink, padding: `0 ${layout.headingInset}px` }}>{t('hrvDashboard.title')}</div>

        {dashboard ? (
          <>
            <div style={glassCard()}>
              <div style={{ padding: '12px 0' }}>
                <div style={{ ...type.cardTitle, color: palette.ink, marginBottom: 8 }}>{t('hrvDashboard.rmssd.title')}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ ...type.sectionTitle, color: palette.ink }}>
                    {dashboard.latestRmssd != null ? Math.round(dashboard.latestRmssd) : '—'}
                  </span>
                  <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary }}>
                    ms{dashboard.rmssdFallbackDate ? ` · ${t('hrvDashboard.rmssd.last')} ${formatEntryDate(dashboard.rmssdFallbackDate, locale)}` : ''}
                  </span>
                </div>
                {dashboard.sparklinePts ? (
                  <svg width="100%" height={60} viewBox="0 0 260 60" style={{ marginTop: 10 }}>
                    <polyline points={dashboard.sparklinePts} fill="none" stroke={palette.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <p style={{ ...type.hintText, color: palette.tertiary, margin: '8px 0 0' }}>
                    {dashboard.latestRmssd != null
                      ? t('hrvDashboard.rmssd.tooFew')
                      : t('hrvDashboard.rmssd.none')}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ ...glassCard(), padding: '16px 8px', textAlign: 'center' }}>
                <div style={{ ...type.sectionTitle, color: palette.ink }}>{dashboard.latestBpm}</div>
                <div style={{ ...type.small, color: palette.secondary, marginTop: 2 }}>{t('hrvDashboard.restingPulse')}</div>
              </div>
              <div style={{ ...glassCard(), padding: '16px 8px', textAlign: 'center' }}>
                <div style={{ ...type.sectionTitle, color: palette.ink }}>{dashboard.coherencePercent}%*</div>
                <div style={{ ...type.small, color: palette.secondary, marginTop: 2 }}>{t('hrvDashboard.coherence')}</div>
              </div>
            </div>
            <p style={{ ...type.small, color: palette.tertiary, margin: 0, padding: `0 ${layout.headingInset}px` }}>
              {t('hrvDashboard.coherence.footnote')}
            </p>
          </>
        ) : (
          <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', padding: '16px 8px', margin: '20px 0 0' }}>
            {t('hrvDashboard.empty')}
          </p>
        )}

        <PrimaryButton onClick={onStartMeasurement}>{t('hrvDashboard.cta')}</PrimaryButton>
      </div>
    </div>
  );
}
