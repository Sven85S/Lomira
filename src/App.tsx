import { useCallback, useRef, useState } from 'react';
import { bgGradient } from './styles/tokens';
import type { TabId } from './types';
import { DataProvider } from './context/DataContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import IntroAnimation from './components/IntroAnimation';
import Header from './components/Header';
import OrbitNav from './components/OrbitNav';
import AnkerScreen from './screens/AnkerScreen';
import BeruehrenScreen from './screens/BeruehrenScreen';
import LektionenOverlay from './screens/LektionenOverlay';
import LessonDetail from './screens/LessonDetail';
import RitualScreen from './screens/RitualScreen';
import FortschrittScreen from './screens/FortschrittScreen';
import PaywallScreen from './screens/PaywallScreen';
import SettingsScreen from './screens/SettingsScreen';
import LegalDocumentScreen from './screens/LegalDocumentScreen';
import HrvFlow from './screens/hrv/HrvFlow';
import { PRIVACY_POLICY, TERMS_OF_USE } from './data/legal';
// PpgDebugScreen stays in the codebase for later on-device signal-processing
// tuning, but is no longer wired to a regular entry point — see HrvFlow.

export default function App() {
  return (
    <DataProvider>
      <SubscriptionProvider>
        <Shell />
        <IntroAnimation />
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
  const [showLektionen, setShowLektionen] = useState(false);
  // Nested over SettingsScreen, not siblings of it — closing one of these
  // returns to Settings underneath, same relationship as LessonDetail
  // nesting over LektionenOverlay below.
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleInfo = useCallback(() => {
    setInfoOpen((cur) => {
      const opening = !cur[tab];
      if (opening) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return { ...cur, [tab]: opening };
    });
  }, [tab]);

  // Every full-screen overlay (Paywall, Lektionen, LessonDetail, Settings) is
  // its own boolean/nullable state, independent of `tab` — a tab tap changed
  // `tab` underneath whichever overlay was open without ever closing it, so
  // the overlay just kept covering the newly-active tab. Root-caused via
  // real device touch diagnostics: the tap genuinely reached OrbitNav and
  // fired onChange (confirmed by HrvFlow's own unmount safety-net logging),
  // it just never closed the overlay sitting on top, looking exactly like
  // "the tab bar doesn't respond". A tab change now always closes all four.
  const handleTabChange = useCallback((newTab: TabId) => {
    setTab(newTab);
    setShowPaywall(false);
    setShowLektionen(false);
    setShowSettings(false);
    setOpenLessonId(null);
    setShowPrivacyPolicy(false);
    setShowTerms(false);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        background: bgGradient,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <Header tab={tab} onToggleInfo={toggleInfo} onOpenSettings={() => setShowSettings(true)} onOpenLektionen={() => setShowLektionen(true)} />

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
        {tab === 'sos' && <AnkerScreen />}
        {tab === 'beruehren' && <BeruehrenScreen showInfo={!!infoOpen.beruehren} onOpenPaywall={() => setShowPaywall(true)} />}
        {tab === 'hrv' && (
          <HrvFlow onClose={() => setTab('sos')} onOpenFortschritt={() => setTab('fortschritt')} onOpenPaywall={() => setShowPaywall(true)} />
        )}
        {tab === 'ritual' && <RitualScreen showInfo={!!infoOpen.ritual} />}
        {tab === 'fortschritt' && <FortschrittScreen showInfo={!!infoOpen.fortschritt} onOpenPaywall={() => setShowPaywall(true)} />}
      </div>

      <OrbitNav active={tab} onChange={handleTabChange} />

      {showPaywall && <PaywallScreen onClose={() => setShowPaywall(false)} />}
      {showLektionen && (
        <LektionenOverlay
          onClose={() => setShowLektionen(false)}
          onOpenLesson={setOpenLessonId}
          onOpenPaywall={() => setShowPaywall(true)}
        />
      )}
      {openLessonId != null && <LessonDetail lessonId={openLessonId} onClose={() => setOpenLessonId(null)} />}
      {showSettings && (
        <SettingsScreen
          onClose={() => setShowSettings(false)}
          onOpenPrivacyPolicy={() => setShowPrivacyPolicy(true)}
          onOpenTerms={() => setShowTerms(true)}
        />
      )}
      {showPrivacyPolicy && <LegalDocumentScreen doc={PRIVACY_POLICY} onClose={() => setShowPrivacyPolicy(false)} />}
      {showTerms && <LegalDocumentScreen doc={TERMS_OF_USE} onClose={() => setShowTerms(false)} />}
    </div>
  );
}
