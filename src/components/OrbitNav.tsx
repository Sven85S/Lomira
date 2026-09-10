import type { CSSProperties } from 'react';
import { colors } from '../styles/tokens';
import type { TabId } from '../types';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  /** Opens the HRV/pulse measurement flow — same entry point the Anker ring's HRV chip uses. */
  onOpenHrv: () => void;
}

// Horizontal anchor points as a % of the bar's own width, converted 1:1 from the
// design mock's fixed 336px-wide phone-screen frame (34/92/168/244/302px) — Anker
// lands exactly centered, and the other four are symmetric around it.
const POS = {
  hrv: '10.12%',
  beruehren: '27.38%',
  anker: '50%',
  ritual: '72.62%',
  fortschritt: '89.88%',
};

const tabColor = (active: TabId, key: TabId) => (active === key ? colors.rust : colors.muted);
const tabWeight = (active: TabId, key: TabId) => (active === key ? 2.2 : 1.8);

const itemBtnStyle = (left: string): CSSProperties => ({
  position: 'absolute',
  left,
  bottom: 'calc(18px + env(safe-area-inset-bottom))',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  background: 'none',
  border: 'none',
  padding: 0,
});

export default function OrbitNav({ active, onChange, onOpenHrv }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(110px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 'calc(73px + env(safe-area-inset-bottom))',
          background: colors.card,
          borderRadius: '30px 30px 0 0',
          borderTop: `1px solid ${colors.border}`,
        }}
      />

      <button style={itemBtnStyle(POS.hrv)} onClick={onOpenHrv} aria-label="HRV-Messung">
        <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ fontSize: 10, color: colors.muted }}>HRV</span>
      </button>

      <button style={itemBtnStyle(POS.beruehren)} onClick={() => onChange('beruehren')} aria-label="Berühren">
        <svg
          width={21}
          height={21}
          viewBox="0 0 24 24"
          fill="none"
          stroke={tabColor(active, 'beruehren')}
          strokeWidth={tabWeight(active, 'beruehren')}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 11V4.5a1.5 1.5 0 0 1 3 0V10" />
          <path d="M11 10V3.5a1.5 1.5 0 0 1 3 0V10" />
          <path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0v8" />
          <path d="M17 12v-1.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2c-2.5 0-3.5-1-5-3l-2.7-4.3a1.5 1.5 0 0 1 2.6-1.5L8 12" />
        </svg>
        <span style={{ fontSize: 10, color: tabColor(active, 'beruehren') }}>Berühren</span>
      </button>

      <div
        style={{
          position: 'absolute',
          left: POS.anker,
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 2,
        }}
      >
        <button
          style={{
            width: 68,
            height: 68,
            borderRadius: 9999,
            background: 'radial-gradient(circle at 34% 30%, #D98A57, #B0532B 65%, #8A3D1F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 10px 24px rgba(176,83,43,0.45), 0 0 0 6px ${colors.surface}`,
            border: 'none',
            padding: 0,
          }}
          onClick={() => onChange('sos')}
          aria-label="Anker"
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#F9F1E4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={5} r={3} />
            <line x1={12} y1={22} x2={12} y2={8} />
            <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
          </svg>
        </button>
        <span style={{ fontSize: 11, color: colors.rust, fontWeight: 500 }}>Anker</span>
      </div>

      <button style={itemBtnStyle(POS.ritual)} onClick={() => onChange('ritual')} aria-label="Ritual">
        <svg
          width={21}
          height={21}
          viewBox="0 0 24 24"
          fill="none"
          stroke={tabColor(active, 'ritual')}
          strokeWidth={tabWeight(active, 'ritual')}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
        <span style={{ fontSize: 10, color: tabColor(active, 'ritual') }}>Ritual</span>
      </button>

      <button style={itemBtnStyle(POS.fortschritt)} onClick={() => onChange('fortschritt')} aria-label="Fortschritt">
        <svg
          width={21}
          height={21}
          viewBox="0 0 24 24"
          fill="none"
          stroke={tabColor(active, 'fortschritt')}
          strokeWidth={tabWeight(active, 'fortschritt')}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ fontSize: 10, color: tabColor(active, 'fortschritt') }}>Fortschritt</span>
      </button>
    </div>
  );
}
