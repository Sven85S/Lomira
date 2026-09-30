import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { fonts, glassCard, layout, listCard, listRow, palette, pillSegment, pillTrack, type, white } from '../styles/himmel';
import BackButton from '../components/BackButton';
import PrimaryButton from '../components/PrimaryButton';
import { useData } from '../context/DataContext';
import { useSubscription } from '../context/SubscriptionContext';
import handImage from '../assets/beruehren/hand.webp';
import butterflyImage from '../assets/beruehren/butterfly.webp';
import bilateralImage from '../assets/beruehren/bilateral.webp';
import yintangImage from '../assets/beruehren/yintang.webp';
import eftImage from '../assets/beruehren/eft.webp';
import anmianImage from '../assets/beruehren/anmian.webp';
import neiguanImage from '../assets/beruehren/neiguan.webp';
import { useT } from '../i18n';

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

// Point coordinates + a stable index the locale key resolves against
// (exercise.<id>.point.<1..N>). Fixed 1-based to match how the JSON reads.
interface ExercisePoint {
  index: number;
  x: number;
  y: number;
}

// Language-neutral exercise definition. Text-bearing fields (name, subtitle,
// duration, instruction, per-point labels) resolve via t() at render time
// from the exercise.<id>.* namespace in the locale files; this file only
// holds the layout data (coordinates, tick interval, silhouette choice, mode).
interface Exercise {
  id: string;
  category: Category;
  silhouette: SilhouetteType;
  mode: 'sequence' | 'alternate' | 'single';
  tickMs?: number;
  points: ExercisePoint[];
}

const exercises: Exercise[] = [
  {
    id: 'eft',
    category: 'tapping',
    silhouette: 'eft',
    mode: 'sequence',
    tickMs: 1600,
    points: [
      { index: 1, x: 240, y: 68 },
      { index: 2, x: 240, y: 129 },
      { index: 3, x: 198, y: 184 },
      { index: 4, x: 280, y: 184 },
      { index: 5, x: 240, y: 200 },
      { index: 6, x: 240, y: 270 },
      { index: 7, x: 199, y: 324 },
      { index: 8, x: 127, y: 373 },
    ],
  },
  {
    id: 'bilateral',
    category: 'tapping',
    silhouette: 'shoulders',
    mode: 'alternate',
    tickMs: 900,
    points: [
      { index: 1, x: 115, y: 436 },
      { index: 2, x: 363, y: 433 },
    ],
  },
  {
    id: 'yintang',
    category: 'akupressur',
    silhouette: 'yintang',
    mode: 'single',
    points: [{ index: 1, x: 241, y: 125 }],
  },
  {
    id: 'butterfly',
    category: 'tapping',
    silhouette: 'torso',
    mode: 'alternate',
    tickMs: 900,
    points: [
      { index: 1, x: 113, y: 276 },
      { index: 2, x: 375, y: 317 },
    ],
  },
  {
    id: 'hand',
    category: 'akupressur',
    silhouette: 'hand',
    mode: 'alternate',
    tickMs: 1400,
    points: [
      { index: 1, x: 279, y: 463 },
      { index: 2, x: 284, y: 632 },
    ],
  },
  {
    id: 'ear',
    category: 'akupressur',
    silhouette: 'ear',
    mode: 'single',
    points: [{ index: 1, x: 100, y: 60 }],
  },
  {
    id: 'anmian',
    category: 'akupressur',
    silhouette: 'anmian',
    mode: 'single',
    points: [{ index: 1, x: 214, y: 235 }],
  },
  {
    id: 'neiguan',
    category: 'akupressur',
    silhouette: 'neiguan',
    mode: 'single',
    points: [{ index: 1, x: 258, y: 396 }],
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
                <circle cx={p.x} cy={p.y} r={22} fill="none" stroke={palette.accent} strokeWidth={4} className="pulse-ring-lg" />
                <circle cx={p.x} cy={p.y} r={17} fill={palette.accent} className="pulse-dot-lg" />
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
            stroke={palette.accent}
            strokeWidth={0.75}
          />
          <path
            d="M100,58 C118,58 130,74 131,96 C132,116 124,133 111,142"
            fill="none"
            stroke={palette.accent}
            strokeWidth={1}
            opacity={0.5}
          />
          <ellipse cx={106} cy={100} rx={15} ry={24} fill={illustration.hair} stroke={palette.accent} strokeWidth={0.5} opacity={0.6} />
        </>
      )}
      {points.map((p, i) => {
        const active = activeIndex === i;
        return (
          <g key={i}>
            {active && <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={palette.accent} strokeWidth={2} className="pulse-ring" />}
            <circle cx={p.x} cy={p.y} r={7} fill={palette.accent} className={active ? 'pulse-dot' : ''} />
          </g>
        );
      })}
    </svg>
  );
}

function ExerciseDetail({ exercise, onBack }: { exercise: Exercise; onBack: () => void }) {
  const { t } = useT();
  const { recordExerciseSession } = useData();
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

  // Safety net for leaving mid-exercise without an explicit Pause tap (e.g.
  // the back button) — mirrors HrvFlow's unmount cleanup pattern: refs so
  // this effect only ever runs once, reading whatever the latest playing/
  // seconds/recordExerciseSession values were at the moment of unmount.
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const recordExerciseSessionRef = useRef(recordExerciseSession);
  recordExerciseSessionRef.current = recordExerciseSession;

  useEffect(() => {
    return () => {
      if (playingRef.current) {
        void recordExerciseSessionRef.current(secondsRef.current);
      }
    };
  }, []);

  const toggle = () => {
    if (!playing) {
      setSeconds(0);
    } else {
      void recordExerciseSession(seconds);
    }
    setPlaying(!playing);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div style={{ padding: `0 ${layout.screenX}px`, display: 'flex', flexDirection: 'column', gap: layout.blockGap }}>
      <div>
        <BackButton label={t('beruehren.back')} onClick={onBack} />
      </div>

      <div style={{ padding: `0 ${layout.headingInset}px` }}>
        <h2 style={{ ...type.subpageTitle, color: palette.ink, margin: 0 }}>{t(`exercise.${exercise.id}.name`)}</h2>
        <p style={{ ...type.body, color: palette.secondary, margin: `${layout.overlineToTitle}px 0 0` }}>{t(`exercise.${exercise.id}.duration`)}</p>
      </div>

      <div style={glassCard()}>
        <div style={{ padding: '12px 0' }}>
          <Silhouette type={exercise.silhouette} points={exercise.points} activeIndex={activeIndex} />
          <p style={{ ...type.body, fontWeight: 500, textAlign: 'center', color: palette.accent, marginTop: 12 }}>
            {t(`exercise.${exercise.id}.point.${(exercise.points[activeIndex] ?? exercise.points[0]).index}`)}
          </p>
        </div>
      </div>

      <div style={listCard()}>
        <p style={{ ...type.body, color: palette.ink, lineHeight: 1.6, margin: 0, padding: '12px 0' }}>{t(`exercise.${exercise.id}.instruction`)}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {playing && (
          <span style={{ ...type.tileValue, color: palette.ink, minWidth: 48, flexShrink: 0 }}>
            {mm}:{ss}
          </span>
        )}
        <PrimaryButton onClick={toggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? t('beruehren.play.pause') : t('beruehren.play.start')}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ExerciseList({ showInfo, onSelect }: { showInfo: boolean; onSelect: (exercise: Exercise) => void }) {
  const { t } = useT();
  const [category, setCategory] = useState<Category>('tapping');

  return (
    <div style={{ padding: `0 ${layout.screenX}px`, display: 'flex', flexDirection: 'column', gap: layout.blockGap }}>
      {showInfo && (
        <div style={listCard()}>
          <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ ...type.body, color: palette.ink, lineHeight: 1.6, margin: 0 }}>
              {t('beruehren.info.body1')}
            </p>
            <p style={{ ...type.body, color: palette.ink, lineHeight: 1.6, margin: 0 }}>
              {t('beruehren.info.body2')}
            </p>
            <p style={{ ...type.hintText, color: palette.hint, lineHeight: 1.6, margin: 0 }}>
              {t('beruehren.info.disclaimer')}
            </p>
          </div>
        </div>
      )}

      <p style={{ ...type.body, color: palette.secondary, margin: `0 ${layout.headingInset}px`, lineHeight: 1.5 }}>
        {t('beruehren.subtitle')}
      </p>

      <div style={{ ...pillTrack, alignSelf: 'flex-start' }}>
        {(
          [
            { key: 'tapping', labelKey: 'beruehren.category.tapping' },
            { key: 'akupressur', labelKey: 'beruehren.category.akupressur' },
          ] as { key: Category; labelKey: string }[]
        ).map((tab) => (
          <button key={tab.key} onClick={() => setCategory(tab.key)} style={pillSegment(category === tab.key)}>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div style={listCard()}>
        {exercises
          .filter((ex) => ex.category === category)
          .map((ex, i, list) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              style={{
                ...listRow(i === list.length - 1),
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', background: 'none', cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                  background: white(0.45), boxShadow: `inset 0 0 0 1px ${white(0.7)}`,
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
                <p style={{ ...type.body, color: palette.ink, margin: 0 }}>{t(`exercise.${ex.id}.name`)}</p>
                <p style={{ ...type.small, color: palette.secondary, margin: '2px 0 0' }}>
                  {t(`exercise.${ex.id}.subtitle`)} &middot; {t(`exercise.${ex.id}.duration`)}
                </p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

// Same lock glyph as HrvStartScreen's/LektionenScreen's LockIcon — each
// screen defines its own copy rather than sharing one, matching this
// codebase's established per-file icon convention.
function LockIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={palette.tertiary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

interface Props {
  showInfo: boolean;
  onOpenPaywall: () => void;
}

export default function BeruehrenScreen({ showInfo, onOpenPaywall }: Props) {
  const { t } = useT();
  const { isSubscribed } = useSubscription();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selected, setSelected] = useState<Exercise | null>(null);

  if (!isSubscribed) {
    return (
      <div style={{ padding: `0 ${layout.screenX}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 40 }}>
        <LockIcon />
        <p style={{ ...type.body, color: palette.ink, textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
          {t('beruehren.locked.body')}
        </p>
        <PrimaryButton onClick={onOpenPaywall}>{t('beruehren.locked.cta')}</PrimaryButton>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: fonts.sans }}>
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
