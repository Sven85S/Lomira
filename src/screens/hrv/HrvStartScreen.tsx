import type { RefObject } from 'react';
import { layout, palette, type, white } from '../../styles/himmel';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import type { CameraPermissionState } from '../../native/ppgCamera';

interface Props {
  isSupported: boolean;
  /** Returns to HrvDashboardScreen — this screen is now only reachable via
   * its "Jetzt messen" CTA (already past the subscription gate, which the
   * dashboard checks before this screen is ever rendered), not a tab. */
  onBack: () => void;
  permission: CameraPermissionState | 'unknown';
  available: boolean | null;
  error: string | null;
  previewActive: boolean;
  previewRef: RefObject<HTMLDivElement>;
  onActivateCamera: () => void;
  onContinue: () => void;
}

export default function HrvStartScreen({
  isSupported,
  onBack,
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
      <div style={{ display: 'flex', alignItems: 'center', padding: `0 ${layout.screenX}px`, flexShrink: 0 }}>
        <BackButton label="Zurück" onClick={onBack} />
      </div>
      <div
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: `${layout.blockGap}px ${layout.screenX}px 0`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: layout.blockGap,
        }}
      >
        <div style={{ ...type.subpageTitle, color: palette.ink, alignSelf: 'flex-start', padding: `0 ${layout.headingInset}px` }}>Puls messen</div>

        {!isSupported && (
          <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', margin: '40px 0 0' }}>
            Die Puls-Messung über die Kamera ist aktuell nur in der iOS-App verfügbar.
          </p>
        )}

        {simulatorLikely && (
          <p style={{ ...type.body, color: palette.tertiary, textAlign: 'center', margin: '40px 0 0' }}>
            Keine passende Kamera gefunden. Diese Messung funktioniert nur auf einem echten iPhone.
          </p>
        )}

        {isSupported && available !== false && (
          <>
            <p style={{ ...type.body, color: palette.ink, textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
              Finger vollständig auf Kamera und Blitz legen — ruhig halten, bis die Messung abgeschlossen ist.
            </p>

            {/* The native preview layer is positioned behind the WebView, at this
                element's on-screen rect — deliberately unclipped natively (no
                cornerRadius/masksToBounds on that container; see the comment in
                PpgCameraPlugin.swift's attachPreview() — clipping the live ~30fps
                preview there once corrupted real PPG readings on-device, a GPU
                compositing cost, not a change to the analyzed pixel stream, which
                is separate). The round look here is purely this CSS border-radius
                — cosmetic only, the native square feed can show past its corners.
                No background here so the (still square) video shows through once
                attached; the decorative border comes from a sibling overlay so it
                stays visible even when the background is fully transparent. */}
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              <div ref={previewRef} style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }} />
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `inset 0 0 0 1px ${white(0.7)}`,
                  pointerEvents: 'none', background: previewActive ? 'transparent' : white(0.62),
                }}
              />
              {!previewActive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={palette.tertiary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </div>

            {error && <p style={{ ...type.hintText, color: palette.low, textAlign: 'center', margin: 0 }}>{error}</p>}

            {!previewActive ? (
              <PrimaryButton onClick={onActivateCamera}>Kamera &amp; Blitz aktivieren</PrimaryButton>
            ) : (
              <PrimaryButton onClick={onContinue}>Weiter</PrimaryButton>
            )}

            {permission === 'denied' && (
              <p style={{ ...type.hintText, color: palette.tertiary, textAlign: 'center', margin: 0 }}>
                Kamera-Zugriff wurde abgelehnt — erlaube ihn in den Systemeinstellungen deines Geräts und versuche es erneut.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
