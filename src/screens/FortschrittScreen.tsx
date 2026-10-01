import type { CSSProperties } from 'react';
import { accentA, fonts, glassCard, layout, listRow, palette, statusDot, type } from '../styles/himmel';
import { useData } from '../context/DataContext';
import { useSubscription } from '../context/SubscriptionContext';
import { STATE_COLORS } from '../store/ritualSelectors';
import { buildHrvHistoryChart } from '../store/hrvSelectors';
import { formatEntryDate } from '../lib/date';
import PrimaryButton from '../components/PrimaryButton';
import type { SignalQuality } from '../ppg/types';
import { useLocale, useT } from '../i18n';

interface Props {
  showInfo: boolean;
  onOpenPaywall: () => void;
}

const QUALITY_COLOR: Record<SignalQuality, string> = { good: palette.reached, fair: palette.close, poor: palette.low };

// Puls-Verlauf behält bewusst seine zwei bisherigen Linienfarben — mit nur
// einem Akzent wären Vorher/Nachher nicht mehr unterscheidbar.
const PULSE_BEFORE = '#C8A84B';
const PULSE_AFTER = '#6E7D66';

// HRV-Verlauf: BPM nutzt dieselbe Farbe wie die "nachher"-Linie oben
// (Puls-Thema), RMSSD übernimmt die Akzent-Farbe aus der Palette.
const HISTORY_BPM = '#6E7D66';
const HISTORY_RMSSD = '#41607E';

const cardInner: CSSProperties = { padding: '12px 0' };

// Same lock glyph as HrvStartScreen's/LektionenScreen's LockIcon — each
// screen defines its own copy rather than sharing one, matching this
// codebase's established per-file icon convention.
function LockIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={palette.tertiary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function FortschrittScreen({ showInfo, onOpenPaywall }: Props) {
  const { t } = useT();
  const locale = useLocale();
  const { isSubscribed } = useSubscription();
  const { ankerSessionCount, streak, reguliertPercent, weekStrip, pulseChart, hrvMeasurements, weeklyMinutesChart } = useData();
  const maxWeeklyMinutes = Math.max(1, ...weeklyMinutesChart.map((w) => w.minutes));
  const hasAnyPracticeMinutes = weeklyMinutesChart.some((w) => w.minutes > 0);
  const hrvHistory = buildHrvHistoryChart(hrvMeasurements);

  if (!isSubscribed) {
    return (
      <div style={{ padding: `0 ${layout.screenX}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 40 }}>
        <LockIcon />
        <p style={{ ...type.body, color: palette.ink, textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
          {t('fortschritt.locked.body')}
        </p>
        <PrimaryButton onClick={onOpenPaywall}>{t('fortschritt.locked.cta')}</PrimaryButton>
      </div>
    );
  }

  return (
    <div style={{ padding: `0 ${layout.screenX}px`, display: 'flex', flexDirection: 'column', gap: layout.blockGap }}>
      {showInfo && (
        <div style={glassCard()}>
          <div style={{ ...cardInner, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ ...type.body, color: palette.ink, lineHeight: 1.5, margin: 0 }}>
              {t('fortschritt.info.body')}
            </p>
            <p style={{ ...type.hintText, color: palette.hint, lineHeight: 1.5, margin: 0 }}>
              {t('fortschritt.info.disclaimer')}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { value: ankerSessionCount, label: t('fortschritt.stats.sessions') },
          { value: streak, label: t('fortschritt.stats.streak') },
          { value: `${reguliertPercent}%`, label: t('fortschritt.stats.reguliertPercent') },
        ].map((stat) => (
          <div key={stat.label} style={{ ...glassCard(), padding: '16px 8px', textAlign: 'center' }}>
            <div style={{ ...type.sectionTitle, color: palette.ink }}>{stat.value}</div>
            <div style={{ ...type.small, color: palette.secondary, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={glassCard()}>
        <div style={cardInner}>
          <div style={{ ...type.cardTitle, color: palette.ink, marginBottom: 12 }}>{t('fortschritt.week.title')}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {weekStrip.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    ...statusDot(d.hasEntry && d.state ? STATE_COLORS[d.state] : 'transparent'),
                    boxShadow: d.hasEntry ? 'none' : `inset 0 0 0 1px ${palette.track}`,
                  }}
                />
                <span style={{ ...type.small, color: palette.tertiary }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={glassCard()}>
        <div style={cardInner}>
          <div style={{ ...type.cardTitle, color: palette.ink, marginBottom: 12 }}>{t('fortschritt.minutes.title')}</div>
          {hasAnyPracticeMinutes ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 90 }}>
              {weeklyMinutesChart.map((w) => (
                <div key={w.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 36,
                      height: Math.max(4, (w.minutes / maxWeeklyMinutes) * 64),
                      borderRadius: 6,
                      background: w.isCurrent ? palette.accent : accentA(0.25),
                    }}
                  />
                  <span style={{ ...type.small, color: palette.tertiary }}>{w.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', padding: '16px 8px', margin: 0 }}>
              {t('fortschritt.minutes.empty')}
            </p>
          )}
        </div>
      </div>

      <div style={glassCard()}>
        <div style={cardInner}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ ...type.cardTitle, color: palette.ink }}>{t('fortschritt.pulse.title')}</span>
            {pulseChart && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ ...type.small, display: 'flex', alignItems: 'center', gap: 4, color: palette.tertiary }}>
                  <span style={statusDot(PULSE_BEFORE)} />
                  {t('fortschritt.pulse.before')}
                </span>
                <span style={{ ...type.small, display: 'flex', alignItems: 'center', gap: 4, color: palette.tertiary }}>
                  <span style={statusDot(PULSE_AFTER)} />
                  {t('fortschritt.pulse.after')}
                </span>
              </div>
            )}
          </div>
          {pulseChart ? (
            <>
              <svg width="100%" height={110} viewBox="0 0 280 110">
                <polyline points={pulseChart.beforePts} fill="none" stroke={PULSE_BEFORE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={pulseChart.afterPts} fill="none" stroke={PULSE_AFTER} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {pulseChart.beforeDots.map((d, i) => (
                  <circle key={i} cx={d.cx} cy={d.cy} r={2.5} fill={PULSE_BEFORE} />
                ))}
                {pulseChart.afterDots.map((d, i) => (
                  <circle key={i} cx={d.cx} cy={d.cy} r={2.5} fill={PULSE_AFTER} />
                ))}
              </svg>
              <div style={{ ...type.small, display: 'flex', justifyContent: 'space-between', color: palette.tertiary, marginTop: 2 }}>
                <span>{t('fortschritt.pulse.earliest')}</span>
                <span>{t('fortschritt.pulse.today')}</span>
              </div>
            </>
          ) : (
            <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', padding: '16px 8px', margin: 0 }}>
              {t('fortschritt.pulse.empty')}
            </p>
          )}
        </div>
      </div>

      {hrvMeasurements.length > 0 && (
        <div style={glassCard()}>
          <div style={cardInner}>
            <div style={{ ...type.cardTitle, color: palette.ink, marginBottom: 2 }}>{t('fortschritt.hrvHistory.title')}</div>
            <div style={{ ...type.small, color: palette.tertiary, marginBottom: 12 }}>{t('fortschritt.hrvHistory.subtitle')}</div>
            {hrvHistory ? (
              <>
                {/* BPM-Linie oben */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ ...type.small, color: palette.secondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={statusDot(HISTORY_BPM)} />
                    {t('fortschritt.hrvHistory.bpmLabel')}
                  </span>
                  <span style={{ ...type.small, color: palette.tertiary }}>{hrvHistory.bpmMin}–{hrvHistory.bpmMax}</span>
                </div>
                <svg width="100%" height={70} viewBox="0 0 280 70" preserveAspectRatio="none" style={{ display: 'block' }}>
                  <polyline
                    points={hrvHistory.bpmPts}
                    fill="none"
                    stroke={HISTORY_BPM}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* RMSSD-Linie unten — nur rendern wenn an mindestens zwei
                    Tagen ein RMSSD-Wert vorliegt, sonst Hinweis */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }}>
                  <span style={{ ...type.small, color: palette.secondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={statusDot(HISTORY_RMSSD)} />
                    {t('fortschritt.hrvHistory.rmssdLabel')}
                  </span>
                  {hrvHistory.rmssdMin != null && hrvHistory.rmssdMax != null && (
                    <span style={{ ...type.small, color: palette.tertiary }}>{hrvHistory.rmssdMin}–{hrvHistory.rmssdMax}</span>
                  )}
                </div>
                {hrvHistory.rmssdPts ? (
                  <svg width="100%" height={70} viewBox="0 0 280 70" preserveAspectRatio="none" style={{ display: 'block' }}>
                    <polyline
                      points={hrvHistory.rmssdPts}
                      fill="none"
                      stroke={HISTORY_RMSSD}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                ) : (
                  <p style={{ ...type.hintText, color: palette.tertiary, margin: '4px 0 0' }}>{t('fortschritt.hrvHistory.rmssdMissing')}</p>
                )}

                {/* Zeitachse: früheste und späteste Messung des Fensters */}
                <div style={{ ...type.small, display: 'flex', justifyContent: 'space-between', color: palette.tertiary, marginTop: 6 }}>
                  <span>{formatEntryDate(hrvHistory.earliestDate, locale)}</span>
                  <span>{formatEntryDate(hrvHistory.latestDate, locale)}</span>
                </div>
              </>
            ) : (
              <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', padding: '8px 8px 4px', margin: 0 }}>
                {t('fortschritt.hrvHistory.empty')}
              </p>
            )}
          </div>
        </div>
      )}

      <div style={glassCard()}>
        <div style={{ ...type.cardTitle, color: palette.ink, padding: '12px 0 0' }}>{t('fortschritt.hrv.title')}</div>
        {hrvMeasurements.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '10px 0 12px', borderBottom: `1px solid ${palette.divider}` }}>
              <span style={{ ...type.sectionTitle, color: palette.ink }}>{hrvMeasurements[0].bpm}</span>
              <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary }}>
                bpm
                {hrvMeasurements[0].rmssd != null
                  ? ` · RMSSD ${Math.round(hrvMeasurements[0].rmssd)}ms${hrvMeasurements[0].rmssdEstimated ? ' ' + t('fortschritt.hrv.rmssdEstimated') : ''}`
                  : ''}{' '}
                · {t('fortschritt.hrv.last')} {formatEntryDate(hrvMeasurements[0].date, locale)}
              </span>
              <span style={{ ...statusDot(QUALITY_COLOR[hrvMeasurements[0].quality]), marginLeft: 'auto', alignSelf: 'center' }} />
            </div>
            {/* Includes the newest entry too, even though it's already
                summarized in the big headline above — excluding it here
                (as this used to) meant it never showed up as a plain list
                row at all, easy to misread as "the last measurement wasn't
                saved". Every row's primary line is the same "● XX bpm"
                shape regardless of RMSSD; RMSSD (when present) is a
                fixed-position second line underneath rather than
                variable-length text appended to the first, so it reads as
                extra info rather than a layout glitch. */}
            {hrvMeasurements.slice(0, 6).map((m, i, list) => (
              <div key={m.id} style={{ ...listRow(i === list.length - 1), display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ ...type.small, color: palette.secondary }}>
                  {formatEntryDate(m.date, locale)}, {new Date(m.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={statusDot(QUALITY_COLOR[m.quality])} />
                    <span style={{ ...type.body, color: palette.ink }}>{m.bpm} bpm</span>
                  </span>
                  {m.rmssd != null && (
                    <span style={{ ...type.small, color: palette.secondary }}>
                      RMSSD {Math.round(m.rmssd)}ms{m.rmssdEstimated ? ' ' + t('fortschritt.hrv.rmssdEstimated') : ''}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </>
        ) : (
          <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', padding: '16px 8px 16px', margin: 0 }}>
            {t('fortschritt.hrv.empty')}
          </p>
        )}
      </div>
    </div>
  );
}
