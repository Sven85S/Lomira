import type { CSSProperties } from 'react';
import { colors, iconBtnStyle, serif } from '../styles/tokens';
import { LESSON_CONTENT } from '../data/lessons';

interface Props {
  lessonId: number;
  onClose: () => void;
}

// This screen is an absolutely-positioned overlay covering the whole Shell
// (see App.tsx), so it doesn't inherit Shell's safe-area-inset-top padding —
// absolute offsets are resolved against the ancestor's padding box, not its
// content box. Re-apply the same safe-area padding here, and give the back
// button the Apple-recommended >=44x44pt tap target (bigger than the shared
// 32x32 iconBtnStyle used elsewhere) since it now sits right under the notch.
const backBtnStyle: CSSProperties = { ...iconBtnStyle, width: 44, height: 44 };

export default function LessonDetail({ lessonId, onClose }: Props) {
  const lesson = LESSON_CONTENT[lessonId];

  return (
    <div
      style={{
        position: 'absolute', inset: 0, background: colors.surface, zIndex: 25, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 4px', flexShrink: 0 }}>
        <button style={backBtnStyle} onClick={onClose} aria-label="Zurück">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text, lineHeight: 1.3 }}>{lesson.title}</div>
        {lesson.paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 14, color: colors.text, lineHeight: 1.7, margin: 0 }}>
            {para}
          </p>
        ))}
        <p style={{ fontSize: 15, color: colors.rust, fontWeight: 500, lineHeight: 1.6, margin: '6px 0 0', paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
          {lesson.question}
        </p>
      </div>
    </div>
  );
}
