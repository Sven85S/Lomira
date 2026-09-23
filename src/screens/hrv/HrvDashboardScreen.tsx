import { cardStyle, colors, primaryBtnStyle, serif } from '../../styles/tokens';
import { useData } from '../../context/DataContext';
import { formatEntryDate } from '../../lib/date';
import { buildHrvDashboard } from '../../store/hrvSelectors';

interface Props {
  /** No active subscription/trial — takes priority over everything else,
   * same as the gate HrvStartScreen used to run itself before it became
   * reachable only via this dashboard's own CTA. */
  locked: boolean;
  onOpenPaywall: () => void;
  onStartMeasurement: () => void;
}

// Same lock glyph as HrvStartScreen's/FortschrittScreen's own LockIcon —
// each screen defines its own copy rather than sharing one, matching this
// codebase's established per-file icon convention.
function LockIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function HrvDashboardScreen({ locked, onOpenPaywall, onStartMeasurement }: Props) {
  const { hrvMeasurements } = useData();

  if (locked) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 40 }}>
          <LockIcon />
          <p style={{ fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
            Die HRV-Messung ist Teil von Lomira Plus — starte deine kostenlose 7-tägige Testphase, um sie freizuschalten.
          </p>
          <button style={primaryBtnStyle} onClick={onOpenPaywall}>
            HRV-Messung freischalten
          </button>
        </div>
      </div>
    );
  }

  const dashboard = buildHrvDashboard(hrvMeasurements);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text }}>Puls &amp; HRV</div>

        {dashboard ? (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Herzratenvariabilität (RMSSD)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 500, color: colors.text }}>
                  {dashboard.latestRmssd != null ? Math.round(dashboard.latestRmssd) : '—'}
                </span>
                <span style={{ fontSize: 13, color: colors.muted }}>
                  ms{dashboard.rmssdFallbackDate ? ` · zuletzt ${formatEntryDate(dashboard.rmssdFallbackDate)}` : ''}
                </span>
              </div>
              {dashboard.sparklinePts ? (
                <svg width="100%" height={60} viewBox="0 0 260 60" style={{ marginTop: 10 }}>
                  <polyline points={dashboard.sparklinePts} fill="none" stroke={colors.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <p style={{ fontSize: 12, color: colors.muted, margin: '8px 0 0' }}>
                  {dashboard.latestRmssd != null
                    ? 'Noch zu wenige Tage mit HRV-Werten für einen Verlauf.'
                    : 'Noch kein zuverlässiger HRV-Wert — miss erneut für einen aktuellen Wert.'}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ ...cardStyle, padding: '12px 8px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text }}>{dashboard.latestBpm}</div>
                <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Ruhepuls</div>
              </div>
              <div style={{ ...cardStyle, padding: '12px 8px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text }}>{dashboard.coherencePercent}%*</div>
                <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Kohärenz</div>
              </div>
            </div>
            <p style={{ fontSize: 10, color: colors.muted, margin: 0, padding: '0 4px' }}>
              *Kohärenz ist eine grobe Schätzung aus der Signalqualität deiner letzten Messung, kein eigener Messwert.
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', padding: '16px 8px', margin: '20px 0 0' }}>
            Noch keine Messung — starte deine erste HRV-Messung.
          </p>
        )}

        <button style={{ ...primaryBtnStyle, marginTop: dashboard ? 4 : 0 }} onClick={onStartMeasurement}>
          Jetzt messen
        </button>
      </div>
    </div>
  );
}
