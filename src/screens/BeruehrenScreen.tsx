import { colors, serif } from '../styles/tokens';

/**
 * The design canvas wires the "Berühren" tab into the tab bar but never gave
 * it a content section (no isBeruehrenTab branch) — it's a placeholder for a
 * future module, not a gap in this build.
 */
export default function BeruehrenScreen() {
  return (
    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, color: colors.text }}>Bald verfügbar</div>
      <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.5, maxWidth: 260 }}>
        Berührungsbasierte Übungen sind ein kommendes Modul. Schau in der Zwischenzeit bei Anker oder deinem täglichen Ritual vorbei.
      </p>
    </div>
  );
}
