import { gearButton, layout, palette, type } from '../styles/himmel';
import type { TabId } from '../types';

// 'hrv' stays empty like 'sos' — its three phases (Start/Measuring/Result)
// each render their own differing heading already, unlike the other tabs'
// single fixed title.
const TAB_TITLES: Record<TabId, string> = {
  sos: '',
  beruehren: 'Übungen',
  hrv: '',
  ritual: 'Tägliches Ritual',
  fortschritt: 'Fortschritt',
};

const INFO_TABS: TabId[] = ['beruehren', 'ritual', 'fortschritt'];

// Symbole 17 im Kreis 42 (gearButton), Strich wie SF Symbols "regular"
const ICON = 17;
const STROKE = 1.6 * (24 / ICON);

interface Props {
  tab: TabId;
  onToggleInfo: () => void;
  onOpenSettings: () => void;
  /** Opens the Lektionen overlay — a header icon next to the gear now, not a tab. */
  onOpenLektionen: () => void;
}

export default function Header({ tab, onToggleInfo, onOpenSettings, onOpenLektionen }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${layout.screenTop}px ${layout.screenX}px ${layout.blockGap}px ${layout.screenX + layout.headingInset}px`,
        flexShrink: 0,
      }}
    >
      <div>
        <div style={type.wordmark}>Lomira</div>
        <div style={{ ...type.pageTitle, color: palette.ink, marginTop: layout.overlineToTitle, whiteSpace: 'nowrap' }}>{TAB_TITLES[tab]}</div>
      </div>
      {INFO_TABS.includes(tab) && (
        <button style={gearButton} onClick={onToggleInfo} aria-label="Mehr Informationen">
          <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      )}
      {tab === 'sos' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <button style={gearButton} onClick={onOpenLektionen} aria-label="Lektionen">
            <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </button>
          <button style={gearButton} onClick={onOpenSettings} aria-label="Einstellungen">
            <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={12} cy={12} r={3} />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
