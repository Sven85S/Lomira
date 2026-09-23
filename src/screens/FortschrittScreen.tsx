import { cardStyle, colors, primaryBtnStyle, serif } from '../styles/tokens';
import { useData } from '../context/DataContext';
import { useSubscription } from '../context/SubscriptionContext';
import { STATE_COLORS } from '../store/ritualSelectors';
import { formatEntryDate } from '../lib/date';
import type { SignalQuality } from '../ppg/types';

interface Props {
  showInfo: boolean;
  onOpenPaywall: () => void;
}

const QUALITY_COLOR: Record<SignalQuality, string> = { good: colors.sage, fair: colors.gold, poor: colors.rust };

// Same lock glyph as HrvStartScreen's/LektionenScreen's LockIcon — each
// screen defines its own copy rather than sharing one, matching this
// codebase's established per-file icon convention.
function LockIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function FortschrittScreen({ showInfo, onOpenPaywall }: Props) {
  const { isSubscribed } = useSubscription();
  const { ankerSessionCount, streak, reguliertPercent, weekStrip, pulseChart, hrvMeasurements, weeklyMinutesChart } = useData();
  const maxWeeklyMinutes = Math.max(1, ...weeklyMinutesChart.map((w) => w.minutes));
  const hasAnyPracticeMinutes = weeklyMinutesChart.some((w) => w.minutes > 0);

  if (!isSubscribed) {
    return (
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 40 }}>
        <LockIcon />
        <p style={{ fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
          Fortschritt ist Teil von Lomira Plus — starte deine kostenlose 7-tägige Testphase, um ihn freizuschalten.
        </p>
        <button style={primaryBtnStyle} onClick={onOpenPaywall}>
          Fortschritt freischalten
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {showInfo && (
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, margin: 0 }}>
            Hier siehst du deine Entwicklung über Zeit — keine einzelnen Einträge, die findest du unter Ritual, sondern zusammengefasste
            Zahlen und Verläufe.
          </p>
          <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, margin: 0 }}>
            Die Puls-Werte sind ein grober Trend aus freiwilligen Messungen, keine medizinische Messung. Bei gesundheitlichen Fragen wende
            dich an eine Ärztin oder einen Arzt.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { value: ankerSessionCount, label: 'Sessions gesamt' },
          { value: streak, label: 'Aktuelle Serie' },
          { value: `${reguliertPercent}%`, label: 'Reguliert-Anteil' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, padding: '12px 8px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, color: colors.text, marginBottom: 12 }}>Diese Woche</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {weekStrip.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 9999,
                  background: d.hasEntry && d.state ? STATE_COLORS[d.state] : 'transparent',
                  border: d.hasEntry ? 'none' : `1px solid ${colors.border}`,
                }}
              />
              <span style={{ fontSize: 11, color: colors.muted }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, color: colors.text, marginBottom: 12 }}>Geübte Minuten (4 Wochen)</div>
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
                    background: w.isCurrent ? colors.blue : 'rgba(65,96,126,0.25)',
                  }}
                />
                <span style={{ fontSize: 10, color: colors.muted }}>{w.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', padding: '16px 8px', margin: 0 }}>
            Noch keine geübten Minuten erfasst — probiere eine Anker- oder Übungen-Session.
          </p>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: colors.text }}>Puls-Verlauf</span>
          {pulseChart && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: colors.muted }}>
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: colors.gold, display: 'inline-block' }} />
                Vorher
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: colors.muted }}>
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: colors.green, display: 'inline-block' }} />
                Nachher
              </span>
            </div>
          )}
        </div>
        {pulseChart ? (
          <>
            <svg width="100%" height={110} viewBox="0 0 280 110">
              <polyline points={pulseChart.beforePts} fill="none" stroke={colors.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={pulseChart.afterPts} fill="none" stroke={colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {pulseChart.beforeDots.map((d, i) => (
                <circle key={i} cx={d.cx} cy={d.cy} r={2.5} fill={colors.gold} />
              ))}
              {pulseChart.afterDots.map((d, i) => (
                <circle key={i} cx={d.cx} cy={d.cy} r={2.5} fill={colors.green} />
              ))}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.muted, marginTop: 2 }}>
              <span>Früheste Messung</span>
              <span>Heute</span>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', padding: '16px 8px', margin: 0 }}>
            Noch keine Messungen — miss deinen Puls vor/nach der nächsten Anker-Übung.
          </p>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, color: colors.text, marginBottom: 10 }}>Puls &amp; HRV (Kamera-Messung)</div>
        {hrvMeasurements.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 500, color: colors.text }}>{hrvMeasurements[0].bpm}</span>
              <span style={{ fontSize: 13, color: colors.muted }}>
                bpm
                {hrvMeasurements[0].rmssd != null
                  ? ` · RMSSD ${Math.round(hrvMeasurements[0].rmssd)}ms${hrvMeasurements[0].rmssdEstimated ? ' (geschätzt)' : ''}`
                  : ''}{' '}
                · zuletzt {formatEntryDate(hrvMeasurements[0].date)}
              </span>
              <span
                style={{ width: 7, height: 7, borderRadius: 9999, background: QUALITY_COLOR[hrvMeasurements[0].quality], marginLeft: 'auto' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Includes the newest entry too, even though it's already
                  summarized in the big headline above — excluding it here
                  (as this used to) meant it never showed up as a plain list
                  row at all, easy to misread as "the last measurement wasn't
                  saved". Every row's primary line is the same "● XX bpm"
                  shape regardless of RMSSD; RMSSD (when present) is a
                  fixed-position second line underneath rather than
                  variable-length text appended to the first, so it reads as
                  extra info rather than a layout glitch. */}
              {hrvMeasurements.slice(0, 6).map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', fontSize: 12, gap: 8 }}>
                  <span style={{ color: colors.muted }}>
                    {formatEntryDate(m.date)}, {new Date(m.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 9999, background: QUALITY_COLOR[m.quality], flexShrink: 0 }} />
                      <span style={{ color: colors.text }}>{m.bpm} bpm</span>
                    </span>
                    {m.rmssd != null && (
                      <span style={{ fontSize: 11, color: colors.muted }}>
                        RMSSD {Math.round(m.rmssd)}ms{m.rmssdEstimated ? ' (geschätzt)' : ''}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', padding: '16px 8px', margin: 0 }}>
            Noch keine Kamera-Messung — probiere &quot;Puls messen&quot; über den Anker-Bereich.
          </p>
        )}
      </div>
    </div>
  );
}
