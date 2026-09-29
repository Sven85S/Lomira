import { useState, type CSSProperties, type ReactNode } from 'react';
import type { TabId } from '../types';
import AnimatedBlob, { isWebglSupported } from './AnimatedBlob';
import blobTexture from '../assets/anker/blob-texture-shader.png';
import { palette, white, inkA, type, layout } from '../styles/himmel';
import { useT } from '../i18n';

// Menüleiste nach Lomira-Design "Himmel" (NavBar.swift aus Lomira Nutrition):
// 70 hoch (8 + Ball 54 + 8), 14 vom linken/rechten Rand, 4 über dem
// Home-Indikator-Sicherheitsbereich (iPhone 16 Pro: 38 zur Displaykante),
// Radius 32, Milchglas + Weiß 62 %, Rand Weiß 80 % innen, Schatten Tinte 16 %.
// Fünf gleich breite Spalten, Ball in der Mitte.
//
// Die Leiste schwebt ÜBER dem Inhalt (position: absolute) — der Inhalt
// scrollt dahinter durch und hält unten `navClearance` frei (siehe App.tsx).

// Shader-Disc füllt den Kreis bis zum Clip-Rand (>= 0.5, siehe AnimatedBlob).
const ANKER_BUTTON_RADIUS = 0.55;
const constantRadius = () => ANKER_BUTTON_RADIUS;

const BALL = 54;
const ICON = 18;
const ICON_STROKE = 1.6; // SF Symbols "regular" bei 18pt

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const barStyle: CSSProperties = {
  position: 'absolute',
  left: layout.navSide,
  right: layout.navSide,
  bottom: `calc(${layout.navAboveSafeArea}px + env(safe-area-inset-bottom))`,
  height: layout.navHeight,
  boxSizing: 'border-box',
  padding: '8px 6px',
  display: 'flex',
  alignItems: 'center',
  borderRadius: 32,
  // .ultraThinMaterial + Weiß 62 % darüber
  background: white(0.62),
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  // Rand 1px Weiß 80 % nach innen + Schatten Tinte 16 %, 16 weich, 14 nach unten
  // (SwiftUI-radius 16 ≈ CSS-Blur 32)
  boxShadow: `inset 0 0 0 1px ${white(0.8)}, 0 14px 32px ${inkA(0.16)}`,
  // Über den Vollbild-Overlays (Paywall, Einstellungen … zIndex 20–40): die
  // Leiste bleibt auch dort sichtbar und bedienbar, ein Reiter-Tipp schließt
  // das offene Overlay (App.tsx handleTabChange). Unter IntroAnimation (200).
  zIndex: 50,
};

const columnStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 48,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

function Tab({
  id,
  label,
  ariaLabel,
  active,
  onChange,
  children,
}: {
  id: TabId;
  label: string;
  ariaLabel: string;
  active: TabId;
  onChange: (tab: TabId) => void;
  children: ReactNode;
}) {
  const color = active === id ? palette.ink : palette.tertiary;
  return (
    <button style={{ ...columnStyle, color }} onClick={() => onChange(id)} aria-label={ariaLabel}>
      <svg
        width={ICON}
        height={ICON}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={ICON_STROKE * (24 / ICON)}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
      <span
        style={{
          ...type.navLabel,
          // 1.2 statt 1: mit overflow: hidden schnitt lineHeight 1 die
          // Umlaut-Punkte ab ("Ubungen").
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'clip',
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function OrbitNav({ active, onChange }: Props) {
  const { t } = useT();
  const [ankerGlFailed, setAnkerGlFailed] = useState(false);
  const showAnkerBlob = isWebglSupported && !ankerGlFailed;

  return (
    <nav style={barStyle}>
      <Tab id="hrv" label={t('nav.hrv')} ariaLabel={t('nav.hrv.aria')} active={active} onChange={onChange}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </Tab>

      <Tab id="beruehren" label={t('nav.uebungen')} ariaLabel={t('nav.uebungen.aria')} active={active} onChange={onChange}>
        <path d="M8 11V4.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M11 10V3.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0v8" />
        <path d="M17 12v-1.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2c-2.5 0-3.5-1-5-3l-2.7-4.3a1.5 1.5 0 0 1 2.6-1.5L8 12" />
      </Tab>

      {/* Lomira-Ball: 54, Rand 2 Weiß 90 % (nach innen), Schatten Tinte 35 %
          (8 weich ≈ CSS 16, 6 nach unten). Liegt bündig in der Leiste. */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <button
          onClick={() => onChange('sos')}
          aria-label={t('nav.atmung.aria')}
          style={{
            width: BALL,
            height: BALL,
            boxSizing: 'border-box',
            borderRadius: 9999,
            position: 'relative',
            overflow: 'hidden',
            border: 'none',
            padding: 0,
            boxShadow: `0 6px 16px ${inkA(0.35)}`,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            // Ohne WebGL: das gemalte Ball-Bild statt des alten blauen Verlaufs,
            // wie in Nutrition auf 126 % vergrößert und rund beschnitten.
            ...(showAnkerBlob
              ? {}
              : { backgroundImage: `url(${blobTexture})`, backgroundSize: '126%', backgroundPosition: 'center', backgroundColor: '#EFDDA8' }),
          }}
        >
          {showAnkerBlob && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <AnimatedBlob resolution={96} maxFps={18} getRadius={constantRadius} onGlFailed={() => setAnkerGlFailed(true)} />
            </div>
          )}
          {/* Ring als eigene Ebene über dem Shader-Canvas, sonst verdeckt ihn das Canvas */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 9999,
              boxShadow: `inset 0 0 0 2px ${white(0.9)}`,
              pointerEvents: 'none',
            }}
          />
        </button>
      </div>

      <Tab id="ritual" label={t('nav.ritual')} ariaLabel={t('nav.ritual.aria')} active={active} onChange={onChange}>
        <circle cx={12} cy={12} r={5} />
        <line x1={12} y1={1} x2={12} y2={3} />
        <line x1={12} y1={21} x2={12} y2={23} />
        <line x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
        <line x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
        <line x1={1} y1={12} x2={3} y2={12} />
        <line x1={21} y1={12} x2={23} y2={12} />
        <line x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
        <line x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
      </Tab>

      <Tab id="fortschritt" label={t('nav.fortschritt')} ariaLabel={t('nav.fortschritt.aria')} active={active} onChange={onChange}>
        {/* chart.bar */}
        <line x1={6} y1={20} x2={6} y2={14} />
        <line x1={12} y1={20} x2={12} y2={8} />
        <line x1={18} y1={20} x2={18} y2={4} />
      </Tab>
    </nav>
  );
}
