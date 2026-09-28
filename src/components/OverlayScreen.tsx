import type { ReactNode } from 'react';
import { layout, navClearance, skyBackground } from '../styles/himmel';
import BackButton from './BackButton';

interface Props {
  zIndex: number;
  onBack: () => void;
  backLabel?: string;
  backAriaLabel?: string;
  /** Knopf oben rechts (z. B. Info), optional. */
  topRight?: ReactNode;
  children: ReactNode;
}

// Gemeinsames Gerüst der Vollbild-Overlays (Paywall, Einstellungen,
// Lektionen, Lektion, Rechtstexte). Reicht bis ganz unten wie der
// Hauptinhalt; die schwebende Leiste (OrbitNav, zIndex 50) liegt darüber und
// bleibt bedienbar, der Inhalt scrollt dahinter durch und hält unten
// navClearance frei. Liegt absolut über der Shell und bringt deshalb den
// Safe-Area-Abstand oben selbst mit.
export default function OverlayScreen({ zIndex, onBack, backLabel = 'Zurück', backAriaLabel, topRight, children }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: skyBackground,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${layout.screenTop}px ${layout.screenX}px 0`,
          flexShrink: 0,
        }}
      >
        <BackButton label={backLabel} ariaLabel={backAriaLabel} onClick={onBack} />
        {topRight}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: `${layout.blockGap}px ${layout.screenX}px 0`,
          paddingBottom: navClearance,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: layout.blockGap,
        }}
      >
        {children}
      </div>
    </div>
  );
}
