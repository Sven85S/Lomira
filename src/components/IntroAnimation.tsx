import { useEffect, useState } from 'react';
import { colors } from '../styles/tokens';
import { STORAGE_KEYS, readJSON } from '../lib/storage';
// Imported for their window-global side effects (Object.assign(window, {...})
// / window.LomiraStartAnim = ...) — the vendored files use this pattern
// throughout rather than ES exports, matching how Claude Design's own
// preview shell loads them. Order matters: animations-v3.jsx must run
// first so lomira-start-scene.jsx's bare CompositionStage/useComposition/
// animate/Easing references resolve.
import '../animations/intro/animations-v3.jsx';
import '../animations/intro/lomira-start-scene.jsx';

declare global {
  interface Window {
    LomiraStartAnim?: (props: { userName: string; accent: string }) => JSX.Element;
  }
}

// Sum of the three OM_SCENES durations authored in lomira-start-scene.jsx
// (1.8 + 0.9 + 1.6) — the engine has no "finished" callback, so this drives
// an external timer instead. Kept in sync manually; if the scene's scene
// durations ever change, update this too.
const ANIMATION_DURATION_MS = 4300;
const FADE_MS = 400;

// The engine persists its playhead across mounts via localStorage under
// `${persistKey}:t`; persistKey defaults to 'animstage-v3' and the scene
// never overrides it. Cleared before every mount so the animation always
// starts at 0, even on repeat app launches in the same browser/webview.
function resetEnginePlayhead() {
  try {
    localStorage.removeItem('animstage-v3:t');
  } catch {
    // Preferences/localStorage can throw in restrictive contexts — starting
    // from a stale playhead is a cosmetic issue, not worth failing over.
  }
}

export default function IntroAnimation() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  // Waits for the real stored name before ever mounting the engine, rather
  // than mounting with '' and re-rendering once the read resolves — the
  // scene's greeting-opacity math is keyed to the engine's own elapsed
  // time, so a userName that changes mid-flight would make the greeting
  // pop in abruptly instead of fading in on its authored cue.
  useEffect(() => {
    resetEnginePlayhead();
    void readJSON(STORAGE_KEYS.firstName, '').then(setFirstName);
  }, []);

  useEffect(() => {
    if (firstName === null) return;
    const fadeTimer = window.setTimeout(() => setFading(true), ANIMATION_DURATION_MS);
    return () => window.clearTimeout(fadeTimer);
  }, [firstName]);

  useEffect(() => {
    if (!fading) return;
    const unmountTimer = window.setTimeout(() => setVisible(false), FADE_MS);
    return () => window.clearTimeout(unmountTimer);
  }, [fading]);

  const LomiraStartAnim = window.LomiraStartAnim;
  if (!visible || firstName === null || !LomiraStartAnim) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <style>{`
        /* The engine's own play/scrub bar — only meant for the Claude Design
           editor, not this app. No prop to disable it, so it's hidden here. */
        [data-omelette-chrome] { display: none !important; }
        /* The engine letterboxes its fixed 390x844 canvas to fit whatever
           space it's given; on a screen whose aspect ratio doesn't match
           (mainly the smaller/squarer iPhone SE), that leaves the engine's
           own near-black default background visible at the edges. Matched
           to the scene's own top gradient stop (#EFE7D8, not the app's
           colors.surface — a near-but-not-exact match would leave a faint
           seam right where this is meant to hide one) so any edge blends
           in instead of showing a stray dark bar. */
        [data-om-starter] { background: #EFE7D8 !important; }
      `}</style>
      <LomiraStartAnim userName={firstName} accent={colors.blue} />
    </div>
  );
}
