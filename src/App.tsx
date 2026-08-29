import { useCallback, useRef, useState } from 'react';
import { colors } from './styles/tokens';
import type { TabId } from './types';
import { DataProvider } from './context/DataContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Header from './components/Header';
import TabBar from './components/TabBar';
import AnkerScreen from './screens/AnkerScreen';
import BeruehrenScreen from './screens/BeruehrenScreen';
import LektionenScreen from './screens/LektionenScreen';
import LessonDetail from './screens/LessonDetail';
import RitualScreen from './screens/RitualScreen';
import FortschrittScreen from './screens/FortschrittScreen';
import PaywallScreen from './screens/PaywallScreen';

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
      <Header tab={tab} onToggleInfo={toggleInfo} />

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'sos' && <AnkerScreen />}
        {tab === 'beruehren' && <BeruehrenScreen showInfo={!!infoOpen.beruehren} />}
        {tab === 'lektionen' && (
          <LektionenScreen showInfo={!!infoOpen.lektionen} onOpenLesson={setOpenLessonId} onOpenPaywall={() => setShowPaywall(true)} />
        )}
        {tab === 'ritual' && <RitualScreen showInfo={!!infoOpen.ritual} />}
        {tab === 'fortschritt' && <FortschrittScreen showInfo={!!infoOpen.fortschritt} />}
      </div>

      <TabBar active={tab} onChange={setTab} />

      {showPaywall && <PaywallScreen onClose={() => setShowPaywall(false)} />}
      {openLessonId != null && <LessonDetail lessonId={openLessonId} onClose={() => setOpenLessonId(null)} />}
    </div>
  );
}
