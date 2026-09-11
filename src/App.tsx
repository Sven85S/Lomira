import { useCallback, useRef, useState } from 'react';
import { colors } from './styles/tokens';
import type { TabId } from './types';
import { DataProvider } from './context/DataContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Header from './components/Header';
import OrbitNav from './components/OrbitNav';
import AnkerScreen from './screens/AnkerScreen';
import BeruehrenScreen from './screens/BeruehrenScreen';
import LektionenScreen from './screens/LektionenScreen';
import LessonDetail from './screens/LessonDetail';
import RitualScreen from './screens/RitualScreen';
import FortschrittScreen from './screens/FortschrittScreen';
import PaywallScreen from './screens/PaywallScreen';
import SettingsScreen from './screens/SettingsScreen';
import HrvFlow from './screens/hrv/HrvFlow';
// PpgDebugScreen stays in the codebase for later on-device signal-processing
// tuning, but is no longer wired to a regular entry point — see HrvFlow.

export default function App() {
  return (
    <DataProvider>
      <SubscriptionProvider>
        <Shell />
      </SubscriptionProvider>
    </DataProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<TabId>('sos');
  const [infoOpen, setInfoOpen] = useState<Partial<Record<TabId, boolean>>>({});
  const [openLessonId, setOpenLessonId] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHrvFlow, setShowHrvFlow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleInfo = useCallback(() => {
    setInfoOpen((cur) => {
      const opening = !cur[tab];
      if (opening) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return { ...cur, [tab]: opening };
    });
  }, [tab]);

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        background: colors.surface,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <Header tab={tab} onToggleInfo={toggleInfo} onOpenSettings={() => setShowSettings(true)} />

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
        }}
      >
        {tab === 'sos' && <AnkerScreen onNavigate={setTab} onOpenHrv={() => setShowHrvFlow(true)} />}
        {tab === 'beruehren' && <BeruehrenScreen showInfo={!!infoOpen.beruehren} />}
        {tab === 'lektionen' && (
          <LektionenScreen showInfo={!!infoOpen.lektionen} onOpenLesson={setOpenLessonId} onOpenPaywall={() => setShowPaywall(true)} />
        )}
        {tab === 'ritual' && <RitualScreen showInfo={!!infoOpen.ritual} />}
        {tab === 'fortschritt' && <FortschrittScreen showInfo={!!infoOpen.fortschritt} />}
      </div>

      <OrbitNav active={tab} onChange={setTab} onOpenHrv={() => setShowHrvFlow(true)} />

      {showPaywall && <PaywallScreen onClose={() => setShowPaywall(false)} />}
      {openLessonId != null && <LessonDetail lessonId={openLessonId} onClose={() => setOpenLessonId(null)} />}
      {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
      {showHrvFlow && (
        <HrvFlow
          onClose={() => setShowHrvFlow(false)}
          onOpenFortschritt={() => {
            setShowHrvFlow(false);
            setTab('fortschritt');
          }}
        />
      )}
    </div>
  );
}
