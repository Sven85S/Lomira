import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import { colors, sans, serif } from '../styles/tokens';
import handImage from '../assets/beruehren/hand.webp';
import butterflyImage from '../assets/beruehren/butterfly.webp';
import bilateralImage from '../assets/beruehren/bilateral.webp';
import yintangImage from '../assets/beruehren/yintang.webp';
import eftImage from '../assets/beruehren/eft.webp';
import anmianImage from '../assets/beruehren/anmian.webp';
import neiguanImage from '../assets/beruehren/neiguan.webp';

/**
 * Illustration-only fills for the body/ear outline drawings below — these
 * depict skin/hair, not app chrome, so they don't map onto the app's
 * semantic color tokens the way the rest of this screen's palette does.
 */
const illustration = {
  skin: '#EAD3AA',
  hair: '#D9BD8C',
};

type SilhouetteType = 'hand' | 'torso' | 'shoulders' | 'yintang' | 'eft' | 'anmian' | 'neiguan' | 'ear';
type Category = 'tapping' | 'akupressur';

interface ExercisePoint {
  name: string;
  x: number;
  y: number;
}

interface Exercise {
  id: string;
  name: string;
  category: Category;
  subtitle: string;
  duration: string;
  silhouette: SilhouetteType;
  mode: 'sequence' | 'alternate' | 'single';
  tickMs?: number;
  points: ExercisePoint[];
  instruction: string;
}

const exercises: Exercise[] = [
  {
    id: 'eft',
    name: 'EFT-Grundsequenz',
    category: 'tapping',
    subtitle: '8 Punkte, rhythmisch klopfen',
    duration: '2 Min',
    silhouette: 'eft',
    mode: 'sequence',
    tickMs: 1600,
    points: [
      { name: 'Scheitel', x: 240, y: 68 },
      { name: 'Augenbraue', x: 240, y: 129 },
      { name: 'Schläfe', x: 198, y: 184 },
      { name: 'Unter dem Auge', x: 280, y: 184 },
      { name: 'Unter der Nase', x: 240, y: 200 },
      { name: 'Kinn', x: 240, y: 270 },
      { name: 'Schlüsselbein', x: 199, y: 324 },
      { name: 'Achsel', x: 127, y: 373 },
    ],
    instruction: 'Klopfe jeden Punkt 5–7 Mal leicht mit zwei Fingerspitzen, dann weiter zum nächsten. Zwei Runden.',
  },
  {
    id: 'bilateral',
    name: 'Bilaterales Tapping',
    category: 'tapping',
    subtitle: '2 Punkte, abwechselnd',
    duration: '1–2 Min',
    silhouette: 'shoulders',
    mode: 'alternate',
    tickMs: 900,
    points: [
      { name: 'Linke Schulter', x: 115, y: 436 },
      { name: 'Rechte Schulter', x: 363, y: 433 },
    ],
    instruction: 'Abwechselnd linke und rechte Schulter sanft klopfen. Rhythmisch, mit offenen oder geschlossenen Augen.',
  },
  {
    id: 'yintang',
    name: 'Yintang',
    category: 'akupressur',
    subtitle: '1 Punkt, sanfter Druck',
    duration: '1 Min',
    silhouette: 'yintang',
    mode: 'single',
    points: [{ name: 'Yintang', x: 241, y: 125 }],
    instruction: 'Sanften Druck mit der Fingerspitze zwischen den Augenbrauen halten. Ruhig weiteratmen.',
  },
  {
    id: 'butterfly',
    name: 'Butterfly Hug',
    category: 'tapping',
    subtitle: '2 Punkte, abwechselnd',
    duration: '30 Sek – 2 Min',
    silhouette: 'torso',
    mode: 'alternate',
    tickMs: 900,
    points: [
      { name: 'Linke Hand', x: 113, y: 276 },
      { name: 'Rechte Hand', x: 375, y: 317 },
    ],
    instruction: 'Hände überkreuzt auf der Brust, abwechselnd sanft klopfen.',
  },
  {
    id: 'hand',
    name: 'Handpunkte',
    category: 'akupressur',
    subtitle: 'Shenmen & Laogong',
    duration: '1 Min',
    silhouette: 'hand',
    mode: 'alternate',
    tickMs: 1400,
    points: [
      { name: 'Laogong, Handflächenmitte', x: 279, y: 463 },
      { name: 'Shenmen, Handgelenk', x: 284, y: 632 },
    ],
    instruction: 'Abwechselnd Handflächenmitte und Handgelenk sanft drücken oder reiben.',
  },
  {
    id: 'ear',
    name: 'Ohr-Shenmen',
    category: 'akupressur',
    subtitle: '1 Punkt, sanfter Druck',
    duration: '1 Min',
    silhouette: 'ear',
    mode: 'single',
    points: [{ name: 'Ohr-Shenmen', x: 100, y: 60 }],
    instruction: 'Sanften Druck am oberen Ohrmuschelbereich halten oder langsam kneten.',
  },
  {
    id: 'anmian',
    name: 'Anmian',
    category: 'akupressur',
    subtitle: '1 Punkt, sanfter Druck',
    duration: '1 Min',
    silhouette: 'anmian',
    mode: 'single',
    points: [{ name: 'Anmian', x: 214, y: 235 }],
    instruction: 'Sanften Druck in der Vertiefung hinter dem Ohrläppchen halten oder langsam kreisen.',
  },
  {
    id: 'neiguan',
    name: 'Neiguan',
    category: 'akupressur',
    subtitle: '1 Punkt, sanfter Druck',
    duration: '1 Min',
    silhouette: 'neiguan',
    mode: 'single',
    points: [{ name: 'Neiguan', x: 258, y: 396 }],
    instruction: 'Sanften Druck zwei bis drei Fingerbreit oberhalb der Handgelenksfalte halten, mittig zwischen den Sehnen.',
  },
];

const IMAGE_SILHOUETTES: Record<string, { src: string; viewBox: string }> = {
  hand: { src: handImage, viewBox: '0 0 480 720' },
  torso: { src: butterflyImage, viewBox: '0 0 480 515' },
  shoulders: { src: bilateralImage, viewBox: '0 0 480 720' },
  yintang: { src: yintangImage, viewBox: '0 0 480 525' },
  eft: { src: eftImage, viewBox: '0 0 480 568' },
  anmian: { src: anmianImage, viewBox: '0 0 480 576' },
  neiguan: { src: neiguanImage, viewBox: '0 0 480 570' },
};

const THUMB_CONFIG: Record<string, { src: string; position: string }> = {
  eft: { src: eftImage, position: '50% 30%' },
  yintang: { src: yintangImage, position: '50% 30%' },
  shoulders: { src: bilateralImage, position: '50% 25%' },
  torso: { src: butterflyImage, position: '50% 35%' },
  hand: { src: handImage, position: '50% 25%' },
  anmian: { src: anmianImage, position: '35% 35%' },
  neiguan: { src: neiguanImage, position: '50% 55%' },
};

function Silhouette({ type, points, activeIndex }: { type: SilhouetteType; points: ExercisePoint[]; activeIndex: number }) {
  const image = IMAGE_SILHOUETTES[type];
  if (image) {
    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: 210, margin: '0 auto' }}>
        <img src={image.src} alt="" style={{ width: '100%', display: 'block' }} />
        <svg viewBox={image.viewBox} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {points.map((p, i) => {
            if (activeIndex !== i) return null;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={22} fill="none" stroke={colors.sage} strokeWidth={4} className="pulse-ring-lg" />
                <circle cx={p.x} cy={p.y} r={17} fill={colors.sage} className="pulse-dot-lg" />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
  return (
    <svg viewBox="0 0 200 240" style={{ width: '100%', maxWidth: 210, display: 'block', margin: '0 auto' }}>
      {type === 'ear' && (
        <>
          <path
            d="M100,35 C130,35 152,60 155,95 C158,130 148,160 128,178 C122,183 116,186 110,186 C104,186 100,182 99,175 C97,165 100,155 95,150 C75,145 62,125 62,98 C62,65 78,35 100,35 Z"
            fill={illustration.skin}
            stroke={colors.rust}
            strokeWidth={0.75}
          />
          <path
            d="M100,58 C118,58 130,74 131,96 C132,116 124,133 111,142"
            fill="none"
            stroke={colors.rust}
            strokeWidth={1}
            opacity={0.5}
          />
          <ellipse cx={106} cy={100} rx={15} ry={24} fill={illustration.hair} stroke={colors.rust} strokeWidth={0.5} opacity={0.6} />
        </>
      )}
      {points.map((p, i) => {
        const active = activeIndex === i;
        return (
          <g key={i}>
            {active && <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={colors.sage} strokeWidth={2} className="pulse-ring" />}
            <circle cx={p.x} cy={p.y} r={7} fill={active ? colors.sage : colors.gold} className={active ? 'pulse-dot' : ''} />
          </g>
        );
      })}
    </svg>
  );
}

function ExerciseDetail({ exercise, onBack }: { exercise: Exercise; onBack: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const pointRef = useRef<number | null>(null);

  useEffect(() => {
    if (exercise.mode !== 'single') {
      pointRef.current = window.setInterval(() => {
        setActiveIndex((i) => (i + 1) % exercise.points.length);
      }, exercise.tickMs || 1200);
    }
    return () => {
      if (pointRef.current) window.clearInterval(pointRef.current);
    };
  }, [exercise]);

  useEffect(() => {
    if (playing) {
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing]);

  const toggle = () => {
    if (!playing) setSeconds(0);
    setPlaying(!playing);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          color: colors.muted, fontFamily: sans, fontSize: 14, padding: '16px 0', cursor: 'pointer',
        }}
      >
        <ChevronLeft size={18} /> Berühren
      </button>

      <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, color: colors.text, margin: '4px 0 4px' }}>{exercise.name}</h2>
      <p style={{ fontFamily: sans, fontSize: 13, color: colors.muted, margin: '0 0 20px' }}>{exercise.duration}</p>

      <div style={{ background: colors.card, borderRadius: 20, padding: '24px 12px', border: `1px solid ${colors.border}` }}>
        <Silhouette type={exercise.silhouette} points={exercise.points} activeIndex={activeIndex} />
        <p style={{ textAlign: 'center', fontFamily: sans, fontSize: 13, color: colors.green, marginTop: 12, fontWeight: 500 }}>
          {exercise.points[activeIndex]?.name || exercise.points[0].name}
        </p>
      </div>

      <div
        style={{
          background: 'rgba(139,154,124,0.08)', borderRadius: 16, padding: '16px 18px', margin: '20px 0',
          border: `1px dashed ${colors.sage}`,
        }}
      >
        <p style={{ fontFamily: sans, fontSize: 14, color: colors.text, lineHeight: 1.6, margin: 0 }}>{exercise.instruction}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {playing && (
          <span style={{ fontFamily: sans, fontSize: 15, color: colors.muted, minWidth: 48 }}>
            {mm}:{ss}
          </span>
        )}
        <button
          onClick={toggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: colors.text, color: colors.surface,
            border: 'none', borderRadius: 999, padding: '14px 32px', fontFamily: sans, fontSize: 15, fontWeight: 500, cursor: 'pointer',
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Pause' : 'Übung starten'}
        </button>
      </div>
    </div>
  );
}

function ExerciseList({ showInfo, onSelect }: { showInfo: boolean; onSelect: (exercise: Exercise) => void }) {
  const [category, setCategory] = useState<Category>('tapping');

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {showInfo && (
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
          <p style={{ fontFamily: sans, fontSize: 14, color: colors.text, lineHeight: 1.6, margin: '0 0 12px' }}>
            Berührung ist eines der ältesten Signale für Sicherheit, die unser Nervensystem kennt – noch bevor wir sprechen
            konnten, hat der Körper schon auf sie reagiert. Rhythmisches Klopfen oder sanfter Druck kann diesen Effekt
            gezielt nutzen.
          </p>
          <p style={{ fontFamily: sans, fontSize: 14, color: colors.text, lineHeight: 1.6, margin: '0 0 12px' }}>
            Klopfen-Übungen stammen direkt aus dem Buch und sind in Studien zu Stress und Angst untersucht.
            Akupressur-Punkte stammen aus der traditionellen chinesischen Medizin – hier ist die Studienlage dünner, sie
            können beruhigend wirken, ohne dass wir ihnen ein Wirkversprechen geben.
          </p>
          <p style={{ fontFamily: sans, fontSize: 13, color: colors.muted, lineHeight: 1.6, margin: 0 }}>
            Bei schwerer Traumatisierung oder akuten psychischen Erkrankungen ersetzen diese Übungen keine Behandlung.
            Professionelle Unterstützung gehört in professionelle Hände.
          </p>
        </div>
      )}

      <p style={{ fontFamily: sans, fontSize: 14, color: colors.muted, margin: '0 0 16px', lineHeight: 1.5 }}>
        Sanfte Berührung als Signal für Sicherheit. Kurze Übungen, keine Verarbeitung.
      </p>

      <div
        style={{
          display: 'flex', background: colors.surface, borderRadius: 999, padding: 4, marginBottom: 20,
          border: `1px solid ${colors.border}`,
        }}
      >
        {(
          [
            { key: 'tapping', label: 'Klopfen' },
            { key: 'akupressur', label: 'Akupressur' },
          ] as { key: Category; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            style={{
              flex: 1, border: 'none', borderRadius: 999, padding: '9px 0', cursor: 'pointer',
              fontFamily: sans, fontSize: 14, fontWeight: 500,
              background: category === tab.key ? colors.text : 'transparent',
              color: category === tab.key ? colors.surface : colors.muted,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {exercises
          .filter((ex) => ex.category === category)
          .map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', background: colors.card,
                border: `1px solid ${colors.border}`, borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {ex.silhouette === 'ear' ? (
                  <div style={{ width: 76 }}>
                    <Silhouette type="ear" points={[]} activeIndex={-1} />
                  </div>
                ) : (
                  <img
                    src={THUMB_CONFIG[ex.silhouette].src}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: THUMB_CONFIG[ex.silhouette].position }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 500, color: colors.text, margin: 0 }}>{ex.name}</p>
                <p style={{ fontFamily: sans, fontSize: 13, color: colors.muted, margin: '2px 0 0' }}>
                  {ex.subtitle} &middot; {ex.duration}
                </p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

interface Props {
  showInfo: boolean;
}

export default function BeruehrenScreen({ showInfo }: Props) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selected, setSelected] = useState<Exercise | null>(null);

  return (
    <div style={{ fontFamily: sans }}>
      <style>{`
        @keyframes pulseDot { 0%,100% { r: 7; opacity: 1; } 50% { r: 8.5; opacity: 0.85; } }
        @keyframes pulseRing { 0% { r: 9; opacity: 0.9; } 100% { r: 20; opacity: 0; } }
        @keyframes pulseDotLg { 0%,100% { r: 17; opacity: 1; } 50% { r: 20; opacity: 0.85; } }
        @keyframes pulseRingLg { 0% { r: 22; opacity: 0.9; } 100% { r: 46; opacity: 0; } }
        .pulse-dot { animation: pulseDot 1.1s ease-in-out infinite; transform-origin: center; }
        .pulse-ring { animation: pulseRing 1.4s ease-out infinite; transform-origin: center; }
        .pulse-dot-lg { animation: pulseDotLg 1.1s ease-in-out infinite; transform-origin: center; }
        .pulse-ring-lg { animation: pulseRingLg 1.4s ease-out infinite; transform-origin: center; }
      `}</style>

      {view === 'list' && <ExerciseList showInfo={showInfo} onSelect={(ex) => { setSelected(ex); setView('detail'); }} />}
      {view === 'detail' && selected && <ExerciseDetail exercise={selected} onBack={() => setView('list')} />}
    </div>
  );
}
