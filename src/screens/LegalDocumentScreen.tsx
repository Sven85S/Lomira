import { layout, listCard, palette, type } from '../styles/himmel';
import OverlayScreen from '../components/OverlayScreen';
import type { LegalDocument } from '../data/legal';

interface Props {
  doc: LegalDocument;
  onClose: () => void;
}

// Nests over SettingsScreen (zIndex 35) the same way LessonDetail nests over
// LektionenOverlay. onClose only closes this screen, returning to Settings
// underneath, not Settings itself.
export default function LegalDocumentScreen({ doc, onClose }: Props) {
  return (
    <OverlayScreen zIndex={40} onBack={onClose}>
      <div style={{ ...type.subpageTitle, color: palette.ink, lineHeight: 1.2, padding: `0 ${layout.headingInset}px` }}>{doc.title}</div>
      {doc.sections.map((section) => (
        <div key={section.heading} style={listCard()}>
          <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...type.cardTitle, color: palette.ink }}>{section.heading}</div>
            {section.paragraphs.map((para, i) => (
              <p key={i} style={{ ...type.body, color: palette.ink, lineHeight: 1.6, margin: 0 }}>
                {para}
              </p>
            ))}
          </div>
        </div>
      ))}
      <p style={{ ...type.hintText, color: palette.tertiary, textAlign: 'center', margin: 0 }}>{doc.footer}</p>
    </OverlayScreen>
  );
}
