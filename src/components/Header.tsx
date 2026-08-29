import { colors, iconBtnStyle, serif } from '../styles/tokens';
import type { TabId } from '../types';

const TAB_TITLES: Record<TabId, string> = {
  sos: 'Anker',
  beruehren: 'Berühren',
  lektionen: 'Lektionen',
  ritual: 'Tägliches Ritual',
  fortschritt: 'Fortschritt',
};

const INFO_TABS: TabId[] = ['beruehren', 'ritual', 'lektionen', 'fortschritt'];

interface Props {
  tab: TabId;
  onToggleInfo: () => void;
}

export default function Header({ tab, onToggleInfo }: Props) {
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
    </div>
  );
}
