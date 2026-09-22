import { useState, type CSSProperties } from 'react';
import { bgGradient, colors, iconBtnStyle, serif } from '../styles/tokens';
import LektionenScreen from './LektionenScreen';

interface Props {
  onClose: () => void;
  onOpenLesson: (id: number) => void;
  onOpenPaywall: () => void;
}

// Same overlay chrome as SettingsScreen/LessonDetail (absolute, full-screen,
// own safe-area padding, 44x44 back button) — Lektionen used to get its
// title and info-toggle for free from the shared Header/tab system; now that
// it's an overlay like those two instead of a tab, it needs its own copy of
// both, same as they already have theirs.
const backBtnStyle: CSSProperties = { ...iconBtnStyle, width: 44, height: 44 };

export default function LektionenOverlay({ onClose, onOpenLesson, onOpenPaywall }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      style={{
        // bottom leaves room for OrbitNav instead of covering it (inset: 0
        // used to) — the tab bar stays visible/reachable while this overlay
        // shows. Exact value matches OrbitNav's own root height, OrbitNav.tsx:66.
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 'calc(118px + env(safe-area-inset-bottom))',
        background: bgGradient, zIndex: 20, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 4px', flexShrink: 0 }}>
        <button style={backBtnStyle} onClick={onClose} aria-label="Zurück">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button style={iconBtnStyle} onClick={() => setShowInfo((v) => !v)} aria-label="Mehr Informationen">
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0 0' }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text, padding: '0 20px 14px' }}>Lektionen</div>
        <LektionenScreen showInfo={showInfo} onOpenLesson={onOpenLesson} onOpenPaywall={onOpenPaywall} />
      </div>
    </div>
  );
}
