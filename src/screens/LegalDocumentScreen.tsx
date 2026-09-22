import type { CSSProperties } from 'react';
import { cardStyle, colors, iconBtnStyle, serif } from '../styles/tokens';
import type { LegalDocument } from '../data/legal';

interface Props {
  doc: LegalDocument;
  onClose: () => void;
}

// Nests over SettingsScreen (zIndex 35) the same way LessonDetail nests over
// LektionenOverlay — see App.tsx's zIndex comment. onClose only closes this
// screen, returning to Settings underneath, not Settings itself.
const backBtnStyle: CSSProperties = { ...iconBtnStyle, width: 44, height: 44 };

export default function LegalDocumentScreen({ doc, onClose }: Props) {
  return (
    <div
      style={{
        // bottom leaves room for OrbitNav instead of covering it (inset: 0
        // used to) — the tab bar stays visible/reachable while this overlay
        // shows. Exact value matches OrbitNav's own root height, OrbitNav.tsx:66.
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 'calc(118px + env(safe-area-inset-bottom))',
        background: colors.surface, zIndex: 40, display: 'flex', flexDirection: 'column',
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
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text, lineHeight: 1.3 }}>{doc.title}</div>
        {doc.sections.map((section) => (
          <div key={section.heading} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 500, color: colors.text }}>{section.heading}</div>
            {section.paragraphs.map((para, i) => (
              <p key={i} style={{ fontSize: 13, color: colors.text, lineHeight: 1.6, margin: 0 }}>
                {para}
              </p>
            ))}
          </div>
        ))}
        <p style={{ fontSize: 12, color: colors.muted, textAlign: 'center', margin: '6px 0 0' }}>{doc.footer}</p>
      </div>
    </div>
  );
}
