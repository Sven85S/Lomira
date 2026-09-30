import { fonts, layout, palette, type } from '../styles/himmel';
import OverlayScreen from '../components/OverlayScreen';
import { useLessons } from '../i18n/lessons';

interface Props {
  lessonId: number;
  onClose: () => void;
}

// Text außerhalb von Karten steht auf Höhe der eingerückten Überschrift.
const inset = `0 ${layout.headingInset}px`;

export default function LessonDetail({ lessonId, onClose }: Props) {
  const { lessons } = useLessons();
  const lesson = lessons[String(lessonId)];

  return (
    <OverlayScreen zIndex={25} onBack={onClose}>
      <div style={{ ...type.subpageTitle, color: palette.ink, lineHeight: 1.2, padding: inset }}>{lesson.title}</div>
      {lesson.paragraphs.map((para, i) => (
        <p key={i} style={{ ...type.body, color: palette.ink, lineHeight: 1.7, margin: 0, padding: inset }}>
          {para}
        </p>
      ))}
      <div style={{ padding: inset }}>
        <p
          style={{
            fontFamily: fonts.sans, fontSize: 15, fontWeight: 500, color: palette.accent, lineHeight: 1.6, margin: 0,
            paddingTop: 14, borderTop: `1px solid ${palette.divider}`,
          }}
        >
          {lesson.question}
        </p>
      </div>
    </OverlayScreen>
  );
}
