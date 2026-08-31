import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { colors, serif } from '../styles/tokens';
import { useData } from '../context/DataContext';
import type { TabId } from '../types';
import blobTexture from '../assets/anker/blob-texture-shader.png';

interface Props {
  /** Same tab-switch handler the bottom TabBar uses — the ring is extra navigation, not a separate path. */
  onNavigate: (tab: TabId) => void;
}

interface RingIcon {
  tab: TabId | 'hrv';
  label: string;
  angle: number;
  icon: (color: string) => JSX.Element;
}

const RING_ICONS: RingIcon[] = [
  {
    tab: 'sos',
    label: 'Anker',
    angle: 0,
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={5} r={3} />
        <line x1={12} y1={22} x2={12} y2={8} />
        <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
      </svg>
    ),
  },
  {
    tab: 'beruehren',
    label: 'Berühren',
    angle: 60,
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 11V4.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M11 10V3.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0v8" />
        <path d="M17 12v-1.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2c-2.5 0-3.5-1-5-3l-2.7-4.3a1.5 1.5 0 0 1 2.6-1.5L8 12" />
      </svg>
    ),
  },
  {
    tab: 'lektionen',
    label: 'Lektionen',
    angle: 120,
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    tab: 'ritual',
    label: 'Ritual',
    angle: 180,
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={12} r={5} />
        <line x1={12} y1={1} x2={12} y2={3} />
        <line x1={12} y1={21} x2={12} y2={23} />
        <line x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
        <line x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
        <line x1={1} y1={12} x2={3} y2={12} />
        <line x1={21} y1={12} x2={23} y2={12} />
        <line x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
        <line x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
      </svg>
    ),
  },
  {
    tab: 'hrv',
    label: 'HRV-Messung',
    angle: 240,
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    tab: 'fortschritt',
    label: 'Fortschritt',
    angle: 300,
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

// Ring geometry: 300x300 container, icons on a circle of radius 124 around the
// center; while a breath exercise is active they fly out to radius 160 and
// fade away (and become non-interactive) so they don't compete with the blob.
const RING_HALF = 150;
const RING_RADIUS = 124;
const RING_FLY_OUT = 36;

function ringNodeStyle(angleDeg: number, active: boolean): CSSProperties {
  const rad = (angleDeg * Math.PI) / 180;
  const baseX = RING_HALF + RING_RADIUS * Math.sin(rad);
  const baseY = RING_HALF - RING_RADIUS * Math.cos(rad);
  const outR = RING_RADIUS + RING_FLY_OUT;
  const outX = RING_HALF + outR * Math.sin(rad);
  const outY = RING_HALF - outR * Math.cos(rad);
  const x = active ? outX : baseX;
  const y = active ? outY : baseY;
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%,-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    width: 58,
    opacity: active ? 0 : 1,
    pointerEvents: active ? 'none' : 'auto',
    transition: 'left 0.5s ease, top 0.5s ease, opacity 0.4s ease',
  };
}

const ringChipStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 9999,
  background: colors.card,
  border: `1px solid ${colors.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
  flexShrink: 0,
};

const WORDS: Record<number, string> = {
  2: 'Zwei', 3: 'Drei', 4: 'Vier', 5: 'Fünf', 6: 'Sechs',
  7: 'Sieben', 8: 'Acht', 9: 'Neun', 10: 'Zehn', 11: 'Elf', 12: 'Zwölf',
};

const clampInhale = (v: number) => Math.max(2, Math.min(10, v));
const clampExhale = (v: number) => Math.max(2, Math.min(12, v));

const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

// Probed once at module load — WebGL support doesn't change at runtime, so this
// doesn't need to be React state; only a later hard GL failure (glFailed) can
// still force the CSS fallback after the fact.
const webglSupported = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
})();

const VERTEX_SHADER = `attribute vec2 position;\nvoid main(){ gl_Position = vec4(position,0.0,1.0); }`;

// Domain-warping shader (fbm-based), texture-mapped onto the blob photo. Only the
// radius uniform is driven externally (per-frame, from the breath phase below).
const FRAGMENT_SHADER = `precision highp float;
uniform float iTime;
uniform float iRadius;
uniform vec2 iResolution;
uniform sampler2D iChannel0;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float noise(in vec2 x){
  vec2 p = floor(x);
  vec2 f = fract(x);
  f = f*f*(3.0-2.0*f);
  float a = hash(p+vec2(0.0,0.0));
  float b = hash(p+vec2(1.0,0.0));
  float c = hash(p+vec2(0.0,1.0));
  float d = hash(p+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
const mat2 mtx = mat2(0.80,0.60,-0.60,0.80);
float fbm(vec2 p){
  float f = 0.0;
  f += 0.500000*noise(p); p = mtx*p*2.02;
  f += 0.250000*noise(p); p = mtx*p*2.03;
  f += 0.125000*noise(p); p = mtx*p*2.01;
  f += 0.062500*noise(p); p = mtx*p*2.04;
  f += 0.031250*noise(p); p = mtx*p*2.01;
  f += 0.015625*noise(p);
  return f/0.96875;
}
void pattern(in vec2 p, in float t, out vec2 q, out vec2 r, out vec2 g){
  q = vec2(fbm(p), fbm(p+vec2(10.0,1.3)));
  r = vec2(fbm(p+4.0*q+vec2(t)+vec2(1.7,9.2)), fbm(p+4.0*q+vec2(t)+vec2(8.3,2.8)));
  g = vec2(fbm(p+2.0*r+vec2(t*2.0)+vec2(2.0,6.0)), fbm(p+2.0*r+vec2(t*1.0)+vec2(5.0,3.0)));
}
void main(){
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = (fragCoord - 0.5*iResolution.xy) / iResolution.y;
  float dist = length(uv);
  float radius = iRadius;
  vec2 q, r, g;
  pattern(uv*2.2, iTime*0.06, q, r, g);
  vec2 warp = (g - 0.5) * 0.16 + (r - 0.5) * 0.09;
  vec2 texUV = uv / (radius*1.5) * 0.5 + 0.5 + warp;
  texUV = clamp(texUV, vec2(0.10), vec2(0.90));
  vec3 col = texture2D(iChannel0, texUV).rgb;
  float mask = 1.0 - smoothstep(radius-0.004, radius+0.004, dist);
  gl_FragColor = vec4(col, mask);
}`;

const MIN_RADIUS = 0.21;
const MAX_RADIUS = 0.39;

type Phase = 'idle' | 'inhale' | 'exhale';

export default function AnkerScreen({ onNavigate }: Props) {
  const { recordAnkerSession } = useData();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [inhaleDuration, setInhaleDuration] = useState(4);
  const [exhaleDuration, setExhaleDuration] = useState(8);
  const [glFailed, setGlFailed] = useState(false);
  const [hrvHintVisible, setHrvHintVisible] = useState(false);

  const blobRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exerciseStart = useRef(0);
  const phaseStart = useRef(0);
  const hrvHintTimer = useRef<number | null>(null);

  const showHrvHint = useCallback(() => {
    if (hrvHintTimer.current) window.clearTimeout(hrvHintTimer.current);
    setHrvHintVisible(true);
    hrvHintTimer.current = window.setTimeout(() => setHrvHintVisible(false), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (hrvHintTimer.current) window.clearTimeout(hrvHintTimer.current);
    };
  }, []);

  const webglOk = webglSupported && !glFailed;
  const useCssBlob = !webglSupported || glFailed;

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

  // Compiles the shader once on mount and starts its own requestAnimationFrame
  // loop; any GL failure (init or mid-render) falls back to the plain CSS blob.
  useEffect(() => {
    if (!webglSupported) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    let rafId: number | null = null;

    const glState: {
      prog: WebGLProgram | null;
      tex: WebGLTexture | null;
      iTimeLoc: WebGLUniformLocation | null;
      iRadiusLoc: WebGLUniformLocation | null;
      iResLoc: WebGLUniformLocation | null;
      iChanLoc: WebGLUniformLocation | null;
      glStart: number;
    } = { prog: null, tex: null, iTimeLoc: null, iRadiusLoc: null, iResLoc: null, iChanLoc: null, glStart: 0 };

    const renderFrame = (now: number) => {
      if (!gl) return;
      try {
        const t = (now - glState.glStart) / 1000;
        gl.useProgram(glState.prog);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(glState.iTimeLoc, t);
        gl.uniform1f(glState.iRadiusLoc, currentRadius());
        gl.uniform2f(glState.iResLoc, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glState.tex);
        gl.uniform1i(glState.iChanLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } catch (e) {
        console.warn('Lomira: WebGL render failed, falling back to CSS blob', e);
        gl = null;
        setGlFailed(true);
        return;
      }
      rafId = requestAnimationFrame(renderFrame);
    };

    try {
      gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (!gl) throw new Error('WebGL not available');

      const compile = (type: number, src: string) => {
        const s = gl!.createShader(type)!;
        gl!.shaderSource(s, src);
        gl!.compileShader(s);
        if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(s) ?? 'shader compile failed');
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'program link failed');
      gl.useProgram(prog);
      glState.prog = prog;

      const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(prog, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      glState.iTimeLoc = gl.getUniformLocation(prog, 'iTime');
      glState.iRadiusLoc = gl.getUniformLocation(prog, 'iRadius');
      glState.iResLoc = gl.getUniformLocation(prog, 'iResolution');
      glState.iChanLoc = gl.getUniformLocation(prog, 'iChannel0');
      glState.tex = gl.createTexture();

      const img = new Image();
      img.onload = () => {
        if (!gl) return;
        gl.bindTexture(gl.TEXTURE_2D, glState.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
        glState.glStart = performance.now();
        rafId = requestAnimationFrame(renderFrame);
      };
      img.onerror = () => setGlFailed(true);
      img.src = blobTexture;
    } catch (e) {
      console.warn('Lomira: WebGL init failed, falling back to CSS blob', e);
      setGlFailed(true);
    }

    return () => {
      gl = null;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentRadius]);

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
  const exerciseCopy = `${inW} Sekunden ein, ${outW} Sekunden aus.`;
  const introCopy = active ? '' : 'Wähle, was du heute brauchst';
  const tapHintLabel = active ? 'Ball zum Beenden antippen' : 'Ball zum Starten antippen';

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box', padding: '8px 20px 10px', gap: 8 }}>
      <div style={{ height: active ? 58 : 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 500, color: colors.text, lineHeight: 1 }}>{bigTimer}</div>
        <div style={{ fontFamily: serif, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.muted, marginTop: 4, height: 15 }}>
          {phaseLabel}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: colors.text, lineHeight: 1.4, maxWidth: 280, minHeight: 20, margin: '-30px 0 0', flexShrink: 0 }}>
        {introCopy}
      </p>

      {/* Ring navigation around the blob — six shortcuts, fading out while a breath exercise runs */}
      <div style={{ position: 'relative', width: 300, height: 300, margin: '0 auto', flexShrink: 0 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 300 300"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: active ? 0 : 1, transition: 'opacity 0.4s ease' }}
        >
          <circle cx={150} cy={150} r={RING_RADIUS} fill="none" stroke={colors.border} strokeWidth={1} />
        </svg>

        <div
          style={{ position: 'absolute', left: '50%', top: '50%', width: 190, height: 190, transform: 'translate(-50%,-50%)', cursor: 'pointer' }}
          onClick={toggleExercise}
        >
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
          {webglOk && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
              <canvas ref={canvasRef} width={640} height={640} style={{ width: '100%', height: '100%', display: 'block' }} />
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

        {RING_ICONS.map(({ tab, label, angle, icon }) => {
          const isSelf = tab === 'sos';
          const color = isSelf ? colors.rust : colors.muted;
          return (
            <div key={tab} style={ringNodeStyle(angle, active)}>
              <button
                style={ringChipStyle}
                onClick={() => (tab === 'hrv' ? showHrvHint() : onNavigate(tab))}
                aria-label={label}
              >
                {icon(color)}
              </button>
              <span style={{ fontSize: 10, color, whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          );
        })}

        {hrvHintVisible && (
          <div
            style={{
              position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 5,
              background: colors.text, color: colors.surface, fontSize: 13, padding: '10px 20px', borderRadius: 9999,
              boxShadow: '0 8px 20px rgba(0,0,0,0.18)', whiteSpace: 'nowrap',
            }}
          >
            Bald verfügbar
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 15, color: colors.text, minHeight: '2.2em', lineHeight: 1.4, maxWidth: 280, flexShrink: 0, margin: '22px 0 0' }}>
        {exerciseCopy}
      </p>
      <p style={{ textAlign: 'center', fontSize: 12, color: colors.muted, margin: 0, flexShrink: 0 }}>{tapHintLabel}</p>

      <div style={{ display: 'flex', gap: 8, width: '100%', flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 18, background: colors.card, border: `1px solid ${colors.border}` }}>
          <span style={{ fontSize: 11, color: colors.muted }}>Einatmen</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={stepperBtnStyle} onClick={() => setInhaleDuration((v) => clampInhale(v - 1))} aria-label="Einatmen kürzer">
              −
            </button>
            <span style={{ fontFamily: serif, fontSize: 15, color: colors.text, minWidth: 22, textAlign: 'center' }}>{inhaleDuration}s</span>
            <button style={stepperBtnStyle} onClick={() => setInhaleDuration((v) => clampInhale(v + 1))} aria-label="Einatmen länger">
              +
            </button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 18, background: colors.card, border: `1px solid ${colors.border}` }}>
          <span style={{ fontSize: 11, color: colors.muted }}>Ausatmen</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={stepperBtnStyle} onClick={() => setExhaleDuration((v) => clampExhale(v - 1))} aria-label="Ausatmen kürzer">
              −
            </button>
            <span style={{ fontFamily: serif, fontSize: 15, color: colors.text, minWidth: 22, textAlign: 'center' }}>{exhaleDuration}s</span>
            <button style={stepperBtnStyle} onClick={() => setExhaleDuration((v) => clampExhale(v + 1))} aria-label="Ausatmen länger">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
