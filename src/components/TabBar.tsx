import { colors } from '../styles/tokens';
import type { TabId } from '../types';

interface TabDef {
  id: TabId;
  label: string;
  icon: (color: string, weight: number) => JSX.Element;
}

const TABS: TabDef[] = [
  {
    id: 'sos',
    label: 'Anker',
    icon: (color, weight) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={5} r={3} />
        <line x1={12} y1={22} x2={12} y2={8} />
        <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
      </svg>
    ),
  },
  {
    id: 'beruehren',
    label: 'Berühren',
    icon: (color, weight) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 11V4.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M11 10V3.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0v8" />
        <path d="M17 12v-1.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2c-2.5 0-3.5-1-5-3l-2.7-4.3a1.5 1.5 0 0 1 2.6-1.5L8 12" />
      </svg>
    ),
  },
  {
    id: 'lektionen',
    label: 'Lektionen',
    icon: (color, weight) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: 'ritual',
    label: 'Ritual',
    icon: (color, weight) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={12} r={5} />
        <line x1={12} y1={1} x2={12} y2={3} />
        <line x1={12} y1={21} x2={12} y2={23} />
        <line x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
        <line x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
        <line x1={1} y1={12} x2={3} y2={12} />
        <line x1={21} y1={12} x2={23} y2={12} />
        <line x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
        <line x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
      </svg>
    ),
  },
  {
    id: 'fortschritt',
    label: 'Fortschritt',
    icon: (color, weight) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function TabBar({ active, onChange }: Props) {
  return (
    <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0 calc(10px + env(safe-area-inset-bottom))', borderTop: `1px solid ${colors.border}`, background: colors.card }}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const color = isActive ? colors.rust : colors.muted;
        const weight = isActive ? 2.2 : 1.8;
        return (
          <button
            key={tab.id}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 8px' }}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon(color, weight)}
            <span style={{ fontSize: 10, color }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
