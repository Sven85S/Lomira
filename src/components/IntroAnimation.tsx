import { useEffect, useState } from 'react';
import { colors, serif } from '../styles/tokens';
import { STORAGE_KEYS, readJSON } from '../lib/storage';

// Pure CSS-transition intro, no external animation engine. Renders on top
// of the already-mounted app (Shell's default tab is Anker, so the real
// breath ball is already sitting at its real position underneath from the
// very first frame) — this overlay never renders a ball of its own, it's
// only ever a mask that fades away. That's deliberate: with only one ball
// instance ever existing, there's no way for this intro to drift out of
// sync with the real Anker screen.
const FADE_IN_MS = 200;
const HOLD_MS = 1800;
const TRANSITION_OUT_MS = 400;
const BUFFER_MS = 200;

export default function IntroAnimation() {
  // null until the stored name (same STORAGE_KEYS.firstName SettingsScreen.tsx
  // owns — not exposed through DataContext) has been read; the whole overlay
  // stays unrendered until then, rather than starting with a generic
  // "Willkommen" and swapping to the named greeting mid-fade-in.
  const [firstName, setFirstName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(true);
  const [textIn, setTextIn] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    void readJSON(STORAGE_KEYS.firstName, '').then(setFirstName);
  }, []);

  useEffect(() => {
    if (firstName === null) return;

    // Deferred a frame so the browser commits the initial (hidden) style
    // first — flipping textIn straight to true from the initial render
    // would skip the fade/scale-in transition entirely.
    const raf = requestAnimationFrame(() => setTextIn(true));

    // Text scale-down/fade-out and the overlay background fade-out start
    // together (both keyed off `leaving`), not one after the other.
    const leaveTimer = window.setTimeout(() => setLeaving(true), FADE_IN_MS + HOLD_MS);
    const unmountTimer = window.setTimeout(
      () => setMounted(false),
      FADE_IN_MS + HOLD_MS + TRANSITION_OUT_MS + BUFFER_MS,
    );

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [firstName]);

  if (!mounted || firstName === null) return null;

  const textVisible = textIn && !leaving;
  const textTransitionMs = textVisible ? FADE_IN_MS : TRANSITION_OUT_MS;
  const trimmedName = firstName.trim();
  const greeting = trimmedName ? `Willkommen, ${trimmedName}` : 'Willkommen';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#EFE7D8',
        opacity: leaving ? 0 : 1,
        transition: `opacity ${TRANSITION_OUT_MS}ms ease`,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          fontFamily: serif,
          fontSize: 36,
          fontWeight: 500,
          color: colors.text,
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'scale(1)' : 'scale(0.9)',
          transition: `opacity ${textTransitionMs}ms ease, transform ${textTransitionMs}ms ease`,
        }}
      >
        {greeting}
      </div>
    </div>
  );
}
