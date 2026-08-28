import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { colors, serif } from '../styles/tokens';
import { useData } from '../context/DataContext';
import blobTexture from '../assets/blob-texture.png';

const WORDS: Record<number, string> = {
  2: 'Zwei', 3: 'Drei', 4: 'Vier', 5: 'Fünf', 6: 'Sechs',
  7: 'Sieben', 8: 'Acht', 9: 'Neun', 10: 'Zehn', 11: 'Elf', 12: 'Zwölf',
};

const clampInhale = (v: number) => Math.max(2, Math.min(10, v));
const clampExhale = (v: number) => Math.max(2, Math.min(12, v));

type Phase = 'idle' | 'inhale' | 'exhale';

export default function AnkerScreen() {
  const { recordAnkerSession } = useData();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [inhaleDuration, setInhaleDuration] = useState(4);
  const [exhaleDuration, setExhaleDuration] = useState(8);

  const blobRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const exerciseStart = useRef(0);
  const phaseStart = useRef(0);

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
      await recordAnkerSession();
    } else {
      exerciseStart.current = Date.now();
      phaseStart.current = Date.now();
      setActive(true);
      setPhase('inhale');
      setPhaseTimer(0);
      requestAnimationFrame(() => restartBreath());
    }
  }, [active, recordAnkerSession, restartBreath]);

  const bigTimer = active ? String(phaseTimer + 1) : '';
  const phaseLabel = active ? (phase === 'exhale' ? 'Ausatmen' : 'Einatmen') : '';
  const inW = WORDS[inhaleDuration] ?? inhaleDuration;
  const outW = String(WORDS[exhaleDuration] ?? exhaleDuration).toLowerCase();
  const exerciseCopy = `${inW} Sekunden ein, ${outW} Sekunden aus. Lass dich vom Kreis führen und komm zur Ruhe.`;

  const stepperBtnStyle: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 9999,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: 17,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', boxSizing: 'border-box', padding: '8px 20px 10px', gap: 8 }}>
      <div style={{ height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 500, color: colors.text, lineHeight: 1 }}>{bigTimer}</div>
        <div style={{ fontFamily: serif, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.muted, marginTop: 4, height: 15 }}>
          {phaseLabel}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ position: 'relative', height: '100%', aspectRatio: '1', maxWidth: '100%', maxHeight: 260 }}>
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
              ...(active ? {} : { animation: 'none', transform: 'scale(0.62)' }),
            }}
          />
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
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 15, color: colors.text, minHeight: '2.6em', lineHeight: 1.4, maxWidth: 280, flexShrink: 0 }}>
        {exerciseCopy}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 18, background: colors.card, border: `1px solid ${colors.border}` }}>
          <span style={{ fontSize: 14, color: colors.muted }}>Einatmen</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={stepperBtnStyle} onClick={() => setInhaleDuration((v) => clampInhale(v - 1))} aria-label="Einatmen kürzer">
              −
            </button>
            <span style={{ fontFamily: serif, fontSize: 16, color: colors.text, minWidth: 28, textAlign: 'center' }}>{inhaleDuration}s</span>
            <button style={stepperBtnStyle} onClick={() => setInhaleDuration((v) => clampInhale(v + 1))} aria-label="Einatmen länger">
              +
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 18, background: colors.card, border: `1px solid ${colors.border}` }}>
          <span style={{ fontSize: 14, color: colors.muted }}>Ausatmen</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={stepperBtnStyle} onClick={() => setExhaleDuration((v) => clampExhale(v - 1))} aria-label="Ausatmen kürzer">
              −
            </button>
            <span style={{ fontFamily: serif, fontSize: 16, color: colors.text, minWidth: 28, textAlign: 'center' }}>{exhaleDuration}s</span>
            <button style={stepperBtnStyle} onClick={() => setExhaleDuration((v) => clampExhale(v + 1))} aria-label="Ausatmen länger">
              +
            </button>
          </div>
        </div>
      </div>

      <button
        style={{ padding: '12px 30px', borderRadius: 9999, fontSize: 16, background: colors.text, color: colors.surface, cursor: 'pointer', flexShrink: 0 }}
        onClick={toggleExercise}
      >
        {active ? 'Übung beenden' : 'Übung starten'}
      </button>
    </div>
  );
}
