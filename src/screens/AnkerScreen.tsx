import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { fonts, gearButton, layout, listCard, palette, type } from '../styles/himmel';
import { useData } from '../context/DataContext';
import blobTexture from '../assets/anker/blob-texture-shader.png';
import AnimatedBlob, { isWebglSupported, MIN_RADIUS, MAX_RADIUS } from '../components/AnimatedBlob';
import { useT } from '../i18n';

const clampInhale = (v: number) => Math.max(2, Math.min(10, v));
const clampExhale = (v: number) => Math.max(2, Math.min(12, v));

const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

type Phase = 'idle' | 'inhale' | 'exhale';

export default function AnkerScreen() {
  const { t } = useT();
  const { recordAnkerSession } = useData();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [inhaleDuration, setInhaleDuration] = useState(4);
  const [exhaleDuration, setExhaleDuration] = useState(8);
  const [glFailed, setGlFailed] = useState(false);

  const blobRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const exerciseStart = useRef(0);
  const phaseStart = useRef(0);

  const webglOk = isWebglSupported && !glFailed;
  const useCssBlob = !isWebglSupported || glFailed;

  // Mirrors the latest render's breath state into a ref so the WebGL render
  // loop (running outside React via requestAnimationFrame) always reads
  // current values instead of the ones captured when it was scheduled.
  const liveBreath = useRef({ active, phase, inhaleDuration, exhaleDuration });
  liveBreath.current = { active, phase, inhaleDuration, exhaleDuration };

  const restartBreath = useCallback(() => {
    const total = inhaleDuration + exhaleDuration;
    const anim = `lomBreath ${total}s ease-in-out infinite`;
    [blobRef.current, glowRef.current].forEach((el) => {
      if (!el) return;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = anim;
    });
  }, [inhaleDuration, exhaleDuration]);

  // Radius range 0.21-0.39, driven by the breath phase (wall-clock, eased) —
  // big at the end of inhale, small at the end of exhale. Reads liveBreath/
  // phaseStart refs rather than closed-over state since it's called from the
  // WebGL render loop below, outside React's render cycle.
  const currentRadius = useCallback(() => {
    const { active, phase, inhaleDuration, exhaleDuration } = liveBreath.current;
    if (!active || !phaseStart.current) return MIN_RADIUS;
    const target = phase === 'inhale' ? inhaleDuration : exhaleDuration;
    const elapsed = (Date.now() - phaseStart.current) / 1000;
    const progress = Math.min(1, Math.max(0, elapsed / target));
    const eased = easeInOutSine(progress);
    return phase === 'inhale' ? MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * eased : MAX_RADIUS - (MAX_RADIUS - MIN_RADIUS) * eased;
  }, []);

  // Injects the @keyframes rule with the current inhale/exhale split as the
  // growth-to-shrink switch point — can't be expressed as an inline style.
  useEffect(() => {
    const total = inhaleDuration + exhaleDuration;
    const switchPct = ((inhaleDuration / total) * 100).toFixed(2);
    let styleEl = document.getElementById('lom-breath-keyframes') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'lom-breath-keyframes';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@keyframes lomBreath { 0% { transform: scale(0.62); } ${switchPct}% { transform: scale(1); } 100% { transform: scale(0.62); } }`;
    if (active) {
      phaseStart.current = Date.now();
      restartBreath();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inhaleDuration, exhaleDuration]);

  // Wall-clock based so it self-corrects after a throttled/backgrounded tab —
  // the interval is recreated on every phase flip, always reading the state
  // current at that point.
  useEffect(() => {
    if (!active) return;
    const target = phase === 'inhale' ? inhaleDuration : exhaleDuration;
    const id = window.setInterval(() => {
      const now = Date.now();
      const phaseElapsed = (now - phaseStart.current) / 1000;
      if (phaseElapsed >= target) {
        phaseStart.current = now;
        setPhase(phase === 'inhale' ? 'exhale' : 'inhale');
        setPhaseTimer(0);
      } else {
        setPhaseTimer(Math.floor(phaseElapsed));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [active, phase, inhaleDuration, exhaleDuration]);

  const toggleExercise = useCallback(async () => {
    if (active) {
      setActive(false);
      setPhase('idle');
      setPhaseTimer(0);
      await recordAnkerSession(Date.now() - exerciseStart.current);
    } else {
      exerciseStart.current = Date.now();
      phaseStart.current = Date.now();
      setActive(true);
      setPhase('inhale');
      setPhaseTimer(0);
      requestAnimationFrame(() => restartBreath());
    }
  }, [active, recordAnkerSession, restartBreath]);

  // Idle state lost its icon ring (see below) and, with it, the reason to
  // say "wähle was du brauchst" — replaced by a plain "Bereit"/tap-hint pair
  // in the same slot the active countdown uses, matching the redesign.
  const bigTimer = active ? String(phaseTimer + 1) : t('anker.bigTimer.bereit');
  const phaseLabel = active ? (phase === 'exhale' ? t('anker.phase.ausatmen') : t('anker.phase.einatmen')) : '';
  const introCopy = active ? '' : t('anker.introCopy');
  const tapHintLabel = active ? t('anker.tapHint') : '';

  // +/− als gearButton in 32px
  const stepperBtnStyle: CSSProperties = { ...gearButton, width: 32, height: 32, fontSize: 17, lineHeight: 1 };

  const stepperCardStyle: CSSProperties = {
    ...listCard(24),
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    // Karten-Innenabstand 4 + Zeilenabstand 12, wie bei listRow()
    paddingTop: 16,
    paddingBottom: 16,
  };

  // Große Serif-Zahl + kleine Sans-Einheit daneben
  const stepperValue = (seconds: number) => (
    <span style={{ minWidth: 30, textAlign: 'center', whiteSpace: 'nowrap' }}>
      <span style={{ ...type.tileValue, color: palette.ink }}>{seconds}</span>
      <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.secondary, marginLeft: 2 }}>s</span>
    </span>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        height: '100%',
        minHeight: '100%',
        padding: `0 ${layout.screenX}px`,
        gap: layout.blockGap,
      }}
    >
      {/* Breath blob first, directly under the header — the screen's sole
          focus, no longer sharing space with navigation. Full-bleed: the
          outer div cancels the screen's 20px side padding via the standard
          calc(50% - 50vw) break-out trick and centers the ball against the
          true viewport width instead of the padded content box — a fixed
          pixel width here would exceed that padded box on every current
          phone width and collapse to flush-left instead of centering. */}
      <div style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ position: 'relative', width: 'min(420px, 96vw)', aspectRatio: '1 / 1', cursor: 'pointer' }} onClick={toggleExercise}>
          <div
            ref={glowRef}
            style={{
              position: 'absolute',
              inset: '-14%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,168,75,0.4) 0%, rgba(200,168,75,0) 72%)',
              filter: 'blur(20px)',
              transformOrigin: 'center center',
              willChange: 'transform',
              transition: 'opacity 0.3s',
              // Only shown during an active breath cycle — in the idle "Bereit"
              // state it's fully hidden rather than just scaled down, per the
              // "no glow at rest" fix.
              ...(active ? {} : { animation: 'none', transform: 'scale(0.62)', opacity: 0 }),
            }}
          />
          {webglOk && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
              <AnimatedBlob resolution={640} getRadius={currentRadius} onGlFailed={() => setGlFailed(true)} />
            </div>
          )}
          {useCssBlob && (
            <div
              ref={blobRef}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                overflow: 'hidden',
                transformOrigin: 'center center',
                willChange: 'transform',
                ...(active ? {} : { animation: 'none', transform: 'scale(0.62)' }),
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(circle at 30% 52%, #E3A93B 0%, rgba(227,169,59,0) 58%), radial-gradient(circle at 68% 26%, #F6F1E2 0%, rgba(246,241,226,0) 55%), radial-gradient(circle at 64% 78%, #8FA07C 0%, rgba(143,160,124,0) 58%), #EFDDA8',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${blobTexture})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  mixBlendMode: 'normal',
                  opacity: 1,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Timer + intro copy, below the ball now — tightly coupled, only the
          space around this group as a whole flexes with the viewport. Both
          idle ("Bereit") and active (the countdown) show real text in the
          big slot, so it keeps one fixed height in both states. */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ height: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 32, fontWeight: 400, color: palette.ink, lineHeight: 1 }}>{bigTimer}</div>
          <div style={{ ...type.overline, marginTop: 4, height: 15 }}>{phaseLabel}</div>
        </div>

        <p style={{ ...type.body, textAlign: 'center', color: palette.ink, lineHeight: 1.4, maxWidth: 280, minHeight: 16, margin: '4px 0 0' }}>
          {introCopy}
        </p>
      </div>

      {/* Bottom group: exercise copy, tap hint and steppers stay together as one
          block; like the timer group, only the space around it flexes. */}
      <div style={{ width: '100%', flexShrink: 0 }}>
        <p style={{ ...type.body, textAlign: 'center', color: palette.tertiary, margin: '10px 0 0' }}>{tapHintLabel}</p>

        <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 6 }}>
          <div style={stepperCardStyle}>
            <span style={{ ...type.small, color: palette.secondary }}>{t('anker.label.einatmen')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={stepperBtnStyle} onClick={() => setInhaleDuration((v) => clampInhale(v - 1))} aria-label={t('anker.aria.einatmenShorter')}>
                −
              </button>
              {stepperValue(inhaleDuration)}
              <button style={stepperBtnStyle} onClick={() => setInhaleDuration((v) => clampInhale(v + 1))} aria-label={t('anker.aria.einatmenLonger')}>
                +
              </button>
            </div>
          </div>
          <div style={stepperCardStyle}>
            <span style={{ ...type.small, color: palette.secondary }}>{t('anker.label.ausatmen')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={stepperBtnStyle} onClick={() => setExhaleDuration((v) => clampExhale(v - 1))} aria-label={t('anker.aria.ausatmenShorter')}>
                −
              </button>
              {stepperValue(exhaleDuration)}
              <button style={stepperBtnStyle} onClick={() => setExhaleDuration((v) => clampExhale(v + 1))} aria-label={t('anker.aria.ausatmenLonger')}>
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
