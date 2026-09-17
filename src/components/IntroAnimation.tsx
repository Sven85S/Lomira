import { useEffect, useState } from 'react';
import { colors, serif } from '../styles/tokens';

// Pure CSS-transition intro, no external animation engine. Renders on top
// of the already-mounted app (Shell's default tab is Anker, so the real
// breath ball is already sitting at its real position underneath from the
// very first frame) — this overlay never renders a ball of its own, it's
// only ever a mask that fades away. That's deliberate: with only one ball
// instance ever existing, there's no way for this intro to drift out of
// sync with the real Anker screen.
const FADE_IN_MS = 200;
const HOLD_MS = 1100;
const TRANSITION_OUT_MS = 400;
const BUFFER_MS = 200;

export default function IntroAnimation() {
  const [mounted, setMounted] = useState(true);
  const [textIn, setTextIn] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
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
  }, []);

  if (!mounted) return null;

  const textVisible = textIn && !leaving;
  const textTransitionMs = textVisible ? FADE_IN_MS : TRANSITION_OUT_MS;

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
        Willkommen
      </div>
    </div>
  );
}
