import { iconBubble, layout, listCard, listRow, palette, type } from '../styles/himmel';
import { LESSON_BLOCKS, LESSON_CONTENT } from '../data/lessons';
import { useSubscription } from '../context/SubscriptionContext';
import PrimaryButton from '../components/PrimaryButton';

interface Props {
  showInfo: boolean;
  onOpenLesson: (id: number) => void;
  onOpenPaywall: () => void;
}

// Symbol in der Blase: 42 % von 34 = 14
function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={palette.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={palette.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Rendered inside LektionenOverlay's scroll area, which already supplies the
// screen margins and the block gap.
export default function LektionenScreen({ showInfo, onOpenLesson, onOpenPaywall }: Props) {
  const { isSubscribed } = useSubscription();

  return (
    <>
      {showInfo && (
        <div style={listCard()}>
          <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ ...type.body, color: palette.ink, lineHeight: 1.5, margin: 0 }}>
              Diese Lektionen bauen direkt auf dem Buch 'Warum dein Nervensystem dich zurückhält' auf — aufbereitet in kurzen, in sich
              abgeschlossenen Einheiten für den Alltag.
            </p>
            <p style={{ ...type.hintText, color: palette.hint, lineHeight: 1.5, margin: 0 }}>
              Sie vermitteln Wissen über dein Nervensystem, ersetzen aber keine Diagnose oder Behandlung. Bei anhaltender Belastung gehört
              professionelle Unterstützung dazu.
            </p>
          </div>
        </div>
      )}

      {LESSON_BLOCKS.map((block) => (
        <div key={block.title}>
          <div style={{ ...type.overline, padding: `0 ${layout.headingInset}px`, marginBottom: layout.overlineToCard }}>{block.title}</div>
          <div style={listCard()}>
            {block.lessonIds.map((id, i) => {
              const unlocked = id === 1 || isSubscribed;
              return (
                <div
                  key={id}
                  style={{ ...listRow(i === block.lessonIds.length - 1), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
                  onClick={() => (unlocked ? onOpenLesson(id) : onOpenPaywall())}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ ...iconBubble(), ...type.pill }}>{unlocked ? <CheckIcon /> : id}</div>
                    <span style={{ ...type.body, color: palette.ink, lineHeight: 1.4 }}>{LESSON_CONTENT[id].title}</span>
                  </div>
                  {unlocked ? <ChevronIcon /> : <LockIcon />}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!isSubscribed && <PrimaryButton onClick={onOpenPaywall}>Alle Lektionen freischalten</PrimaryButton>}
    </>
  );
}
