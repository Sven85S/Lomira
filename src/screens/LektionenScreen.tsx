import { colors, primaryBtnStyle, serif } from '../styles/tokens';
import { LESSON_BLOCKS, LESSON_CONTENT } from '../data/lessons';
import { useSubscription } from '../context/SubscriptionContext';

interface Props {
  showInfo: boolean;
  onOpenLesson: (id: number) => void;
  onOpenPaywall: () => void;
}

function CheckIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.card} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function LektionenScreen({ showInfo, onOpenLesson, onOpenPaywall }: Props) {
  const { isSubscribed } = useSubscription();

  return (
    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {showInfo && (
        <div style={{ padding: '14px 16px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.border}`, margin: '4px 0 2px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, margin: 0 }}>
            Diese Lektionen bauen direkt auf dem Buch 'Warum dein Nervensystem dich zurückhält' auf — aufbereitet in kurzen, in sich
            abgeschlossenen Einheiten für den Alltag.
          </p>
          <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, margin: 0 }}>
            Sie vermitteln Wissen über dein Nervensystem, ersetzen aber keine Diagnose oder Behandlung. Bei anhaltender Belastung gehört
            professionelle Unterstützung dazu.
          </p>
        </div>
      )}

      {LESSON_BLOCKS.map((block) => (
        <div key={block.title} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.muted, margin: '8px 4px 0' }}>
            {block.title}
          </div>
          {block.lessonIds.map((id) => {
            const unlocked = id === 1 || isSubscribed;
            return (
              <div
                key={id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.border}`, cursor: 'pointer' }}
                onClick={() => (unlocked ? onOpenLesson(id) : onOpenPaywall())}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9999,
                      background: unlocked ? colors.sage : colors.surface,
                      border: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 12,
                      color: colors.muted,
                    }}
                  >
                    {unlocked ? <CheckIcon /> : id}
                  </div>
                  <span style={{ fontSize: 14, color: colors.text, lineHeight: 1.4 }}>{LESSON_CONTENT[id].title}</span>
                </div>
                {unlocked ? <ChevronIcon /> : <LockIcon />}
              </div>
            );
          })}
        </div>
      ))}

      {!isSubscribed && (
        <button style={{ ...primaryBtnStyle, marginTop: 10, textAlign: 'center' }} onClick={onOpenPaywall}>
          Alle Lektionen freischalten
        </button>
      )}
    </div>
  );
}
