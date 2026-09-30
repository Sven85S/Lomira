import { useState } from 'react';
import { gearButton, layout, palette, type } from '../styles/himmel';
import OverlayScreen from '../components/OverlayScreen';
import LektionenScreen from './LektionenScreen';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
  onOpenLesson: (id: number) => void;
  onOpenPaywall: () => void;
}

// Lektionen used to get its title and info-toggle for free from the shared
// Header/tab system; now that it's an overlay instead of a tab, it needs its
// own copy of both.
export default function LektionenOverlay({ onClose, onOpenLesson, onOpenPaywall }: Props) {
  const { t } = useT();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <OverlayScreen
      zIndex={20}
      onBack={onClose}
      topRight={
        <button style={gearButton} onClick={() => setShowInfo((v) => !v)} aria-label={t('header.info.aria')}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6 * (24 / 17)} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      }
    >
      <div style={{ ...type.subpageTitle, color: palette.ink, padding: `0 ${layout.headingInset}px` }}>{t('lektionen.title')}</div>
      <LektionenScreen showInfo={showInfo} onOpenLesson={onOpenLesson} onOpenPaywall={onOpenPaywall} />
    </OverlayScreen>
  );
}
