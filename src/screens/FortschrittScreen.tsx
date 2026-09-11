import { colors, cardStyle, serif } from '../styles/tokens';
import { useData } from '../context/DataContext';
import { STATE_COLORS } from '../store/ritualSelectors';
import { formatEntryDate } from '../lib/date';
import type { SignalQuality } from '../ppg/types';

interface Props {
  showInfo: boolean;
}

const QUALITY_COLOR: Record<SignalQuality, string> = { good: colors.sage, fair: colors.gold, poor: colors.rust };

export default function FortschrittScreen({ showInfo }: Props) {
  const { ankerSessionCount, streak, reguliertPercent, weekStrip, pulseChart, hrvMeasurements } = useData();

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
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 500, color: colors.text }}>{stat.value}</div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hrvMeasurements.slice(0, 6).map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: colors.muted }}>
                    {formatEntryDate(m.date)}, {new Date(m.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 9999, background: QUALITY_COLOR[m.quality] }} />
                    <span style={{ color: colors.text }}>
                      {m.bpm} bpm{m.rmssd != null ? ` · ${Math.round(m.rmssd)}ms RMSSD${m.rmssdEstimated ? ' (geschätzt)' : ''}` : ''}
                    </span>
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
