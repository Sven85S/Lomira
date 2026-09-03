import { colors, iconBtnStyle, serif } from '../styles/tokens';
import type { TabId } from '../types';

const TAB_TITLES: Record<TabId, string> = {
  sos: '',
  beruehren: 'Berühren',
  lektionen: 'Lektionen',
  ritual: 'Tägliches Ritual',
  fortschritt: 'Fortschritt',
};

const INFO_TABS: TabId[] = ['beruehren', 'ritual', 'lektionen', 'fortschritt'];

interface Props {
  tab: TabId;
  onToggleInfo: () => void;
  onOpenSettings: () => void;
}

export default function Header({ tab, onToggleInfo, onOpenSettings }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 14px', flexShrink: 0 }}>
      <div>
        <div style={{ fontFamily: serif, fontSize: 10, letterSpacing: '0.1em', color: colors.muted, textTransform: 'uppercase' }}>lomira</div>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text, marginTop: 2, whiteSpace: 'nowrap' }}>{TAB_TITLES[tab]}</div>
      </div>
      {INFO_TABS.includes(tab) && (
        <button style={iconBtnStyle} onClick={onToggleInfo} aria-label="Mehr Informationen">
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.rust} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      )}
      {tab === 'sos' && (
        <button style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }} onClick={onOpenSettings} aria-label="Einstellungen">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={3} />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      )}
    </div>
  );
}
