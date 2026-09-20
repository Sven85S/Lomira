import type { RefObject } from 'react';
import { colors, primaryBtnStyle, serif } from '../../styles/tokens';
import type { CameraPermissionState } from '../../native/ppgCamera';

interface Props {
  isSupported: boolean;
  /** No active subscription/trial — takes priority over the platform checks
   * below, since the Plus gate applies regardless of iOS/web/simulator. */
  locked: boolean;
  onOpenPaywall: () => void;
  permission: CameraPermissionState | 'unknown';
  available: boolean | null;
  error: string | null;
  previewActive: boolean;
  previewRef: RefObject<HTMLDivElement>;
  onActivateCamera: () => void;
  onContinue: () => void;
}

// Same lock glyph as LektionenScreen's LockIcon, just sized to match this
// screen's own centered-icon states (the 40x40 "no preview" camera icon
// below) instead of LektionenScreen's small 15x15 row icon.
function LockIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// No back/close button — HRV is a regular tab now (like Anker/Übungen/...),
// so switching to another tab is the exit, same as everywhere else. Only
// HrvMeasuringScreen keeps an explicit button, since it doubles as
// "cancel a running measurement", not just "leave".
export default function HrvStartScreen({
  isSupported,
  locked,
  onOpenPaywall,
  permission,
  available,
  error,
  previewActive,
  previewRef,
  onActivateCamera,
  onContinue,
}: Props) {
  const simulatorLikely = isSupported && available === false;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text, alignSelf: 'flex-start' }}>Puls messen</div>

        {locked && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 40 }}>
            <LockIcon />
            <p style={{ fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
              Die HRV-Messung ist Teil von Lomira Plus — starte deine kostenlose 7-tägige Testphase, um sie freizuschalten.
            </p>
            <button style={primaryBtnStyle} onClick={onOpenPaywall}>
              HRV-Messung freischalten
            </button>
          </div>
        )}

        {!locked && !isSupported && (
          <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', margin: '40px 0 0' }}>
            Die Puls-Messung über die Kamera ist aktuell nur in der iOS-App verfügbar.
          </p>
        )}

        {!locked && simulatorLikely && (
          <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', margin: '40px 0 0' }}>
            Keine passende Kamera gefunden. Diese Messung funktioniert nur auf einem echten iPhone.
          </p>
        )}

        {!locked && isSupported && available !== false && (
          <>
            <p style={{ fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
              Finger vollständig auf Kamera und Blitz legen — ruhig halten, bis die Messung abgeschlossen ist.
            </p>

            {/* The native preview layer is positioned behind the WebView, clipped to
                this element's on-screen rect — deliberately no background here so it
                shows through once attached; the border comes from a sibling overlay
                so the corner-radius still reads correctly against a live video feed. */}
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              <div ref={previewRef} style={{ position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden' }} />
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: 20, border: `1px solid ${colors.border}`,
                  pointerEvents: 'none', background: previewActive ? 'transparent' : colors.card,
                }}
              />
              {!previewActive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </div>

            {error && <p style={{ fontSize: 12, color: colors.rust, textAlign: 'center', margin: 0 }}>{error}</p>}

            {!previewActive ? (
              <button style={primaryBtnStyle} onClick={onActivateCamera}>
                Kamera &amp; Blitz aktivieren
              </button>
            ) : (
              <button style={primaryBtnStyle} onClick={onContinue}>
                Weiter
              </button>
            )}

            {permission === 'denied' && (
              <p style={{ fontSize: 12, color: colors.muted, textAlign: 'center', margin: 0 }}>
                Kamera-Zugriff wurde abgelehnt — erlaube ihn in den Systemeinstellungen deines Geräts und versuche es erneut.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
