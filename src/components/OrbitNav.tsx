import { useState, type CSSProperties } from 'react';
import { colors } from '../styles/tokens';
import type { TabId } from '../types';
import AnimatedBlob, { isWebglSupported } from './AnimatedBlob';

// Fixed, not breath-coupled and not oscillating — the tab bar button is a
// small fixed-size nav icon, not a breathing exercise; only the shader's
// color/texture drift (iTime) should move, never the circle's size.
//
// The shader masks its own disc at `radius` (in the canvas's normalized UV
// space, where the button's circular clip boundary sits at exactly 0.5) —
// 0.32 left a visible gap between the blob's edge and the button's edge,
// showing the pill's card color through as a ring. >=0.5 makes the disc
// reach the clip boundary everywhere, so the button's own circular
// overflow:hidden — not the shader's smoothstep fade — defines the edge.
const ANKER_BUTTON_RADIUS = 0.55;
const constantRadius = () => ANKER_BUTTON_RADIUS;

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

// Horizontal anchor points as a fraction of the pill's own width, converted
// 1:1 from the design mock's fixed 336px-wide phone-screen frame
// (34/92/168/244/302px) — Anker lands exactly centered, the other four
// symmetric around it. Expressed as calc(F% + Npx) rather than a plain F%
// because these buttons are positioned relative to the full nav container
// (100% width), while the pill itself is inset by PILL_INSET on each side —
// a plain percentage anchors against the wrong (wider) box, and the margin
// this leaves shrinks as the viewport narrows, since the fixed inset eats a
// growing share of it. The calc() term corrects for that at any width.
const PILL_INSET = 16;
const pillPos = (fraction: number) => `calc(${(fraction * 100).toFixed(4)}% + ${(PILL_INSET - 2 * PILL_INSET * fraction).toFixed(4)}px)`;

const POS = {
  hrv: pillPos(0.1012),
  beruehren: pillPos(0.2738),
  anker: pillPos(0.5),
  ritual: pillPos(0.7262),
  fortschritt: pillPos(0.8988),
};

const tabColor = (active: TabId, key: TabId) => (active === key ? colors.blue : colors.muted);
const tabWeight = (active: TabId, key: TabId) => (active === key ? 2.2 : 1.8);

const itemBtnStyle = (left: string): CSSProperties => ({
  position: 'absolute',
  left,
  bottom: 'calc(26px + env(safe-area-inset-bottom))',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  background: 'none',
  border: 'none',
  padding: 0,
});

export default function OrbitNav({ active, onChange }: Props) {
  const [ankerGlFailed, setAnkerGlFailed] = useState(false);
  const showAnkerBlob = isWebglSupported && !ankerGlFailed;

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(118px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
      {/* Floating pill, not edge-to-edge — inset from both sides and lifted
          off the bottom edge, with all four corners rounded, matching the
          redesign mockups (round 1 had this flush with the screen edges and
          only rounded on top, like a docked bar rather than a free-floating
          element). */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 'calc(8px + env(safe-area-inset-bottom))',
          height: 73,
          background: colors.card,
          borderRadius: 9999,
          border: `1px solid ${colors.border}`,
        }}
      />

      <button style={itemBtnStyle(POS.hrv)} onClick={() => onChange('hrv')} aria-label="HRV-Messung">
        <svg
          width={21}
          height={21}
          viewBox="0 0 24 24"
          fill="none"
          stroke={tabColor(active, 'hrv')}
          strokeWidth={tabWeight(active, 'hrv')}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ fontSize: 10, color: tabColor(active, 'hrv') }}>HRV</span>
      </button>

      <button style={itemBtnStyle(POS.beruehren)} onClick={() => onChange('beruehren')} aria-label="Übungen">
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
        <span style={{ fontSize: 10, color: tabColor(active, 'beruehren') }}>Übungen</span>
      </button>

      {/* Sized and vertically centered against the pill's own box (bottom+height),
          not the icon columns' bottom-anchor — a 56px button fully contained
          within the 73px pill, unlike the icon columns' bottom:26px anchor
          which only fits their much shorter icon+label stack. */}
      <div
        style={{
          position: 'absolute',
          left: POS.anker,
          bottom: 'calc(8px + env(safe-area-inset-bottom))',
          height: 73,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <button
          style={{
            width: 56,
            height: 56,
            borderRadius: 9999,
            position: 'relative',
            overflow: 'hidden',
            // Flat gradient fallback for devices without WebGL, or if the
            // shared shader hits a runtime error — same treatment as the
            // big Anker blob's own CSS fallback.
            ...(showAnkerBlob ? {} : { background: 'radial-gradient(circle at 34% 30%, #638098, #41607E 65%, #2A4257 100%)' }),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(65,96,126,0.35)',
            border: 'none',
            padding: 0,
          }}
          onClick={() => onChange('sos')}
          aria-label="Anker"
        >
          {showAnkerBlob && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <AnimatedBlob resolution={96} maxFps={18} getRadius={constantRadius} onGlFailed={() => setAnkerGlFailed(true)} />
            </div>
          )}
        </button>
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
