import { useCallback, useEffect, useRef, useState } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import { colors, iconBtnStyle, primaryBtnStyle, serif } from '../../styles/tokens';
import { PpgCamera, isPpgCameraSupported, type CameraPermissionState, type PpgSample } from '../../native/ppgCamera';

interface Props {
  onClose: () => void;
}

// Purely a Step-1 verification aid: plots the raw, unfiltered red-channel
// signal so camera/torch/BGRA extraction can be confirmed on a real device
// before any signal-processing code exists. Not part of the shipped HRV flow.
const MAX_POINTS = 150;

export default function PpgDebugScreen({ onClose }: Props) {
  const [permission, setPermission] = useState<CameraPermissionState | 'unknown'>('unknown');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [latest, setLatest] = useState<PpgSample | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sampleHandle = useRef<PluginListenerHandle | null>(null);
  const errorHandle = useRef<PluginListenerHandle | null>(null);
  const runningRef = useRef(false);
  runningRef.current = running;

  useEffect(() => {
    if (!isPpgCameraSupported) return;
    (async () => {
      try {
        const [{ camera }, { available: avail }] = await Promise.all([PpgCamera.checkPermissions(), PpgCamera.isAvailable()]);
        setPermission(camera);
        setAvailable(avail);
      } catch (e) {
        // Surfaced explicitly — an unhandled rejection here (e.g. the native
        // plugin isn't registered under this jsName) would otherwise leave
        // permission/available stuck forever with no visible sign why.
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  useEffect(() => {
    if (!isPpgCameraSupported) return;
    let cancelled = false;
    (async () => {
      const sh = await PpgCamera.addListener('ppgSample', (batch) => {
        if (batch.samples.length === 0) return;
        setLatest(batch.samples[batch.samples.length - 1]);
        setPoints((prev) => {
          const next = [...prev, ...batch.samples.map((s) => s.redMean)];
          return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
        });
      });
      const eh = await PpgCamera.addListener('captureError', (err) => {
        setError(err.message);
        setRunning(false);
      });
      if (cancelled) {
        void sh.remove();
        void eh.remove();
        return;
      }
      sampleHandle.current = sh;
      errorHandle.current = eh;
    })();
    return () => {
      cancelled = true;
      void sampleHandle.current?.remove();
      void errorHandle.current?.remove();
      // Screen unmount is the safety net for "user navigated away mid-measurement" —
      // stopCapture() is idempotent, so this is harmless if already stopped.
      if (runningRef.current) void PpgCamera.stopCapture();
    };
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    // The whole flow — requestPermissions() included — is wrapped here. It
    // wasn't before, so a native-bridge error thrown by requestPermissions()
    // (e.g. the plugin not being found under its jsName) silently killed the
    // handler before startCapture() was ever reached, with no visible error.
    try {
      let state = permission;
      if (state !== 'granted') {
        const res = await PpgCamera.requestPermissions();
        state = res.camera;
        setPermission(state);
      }
      if (state !== 'granted') {
        setError('Ohne Kamera-Berechtigung keine Messung möglich.');
        return;
      }
      setPoints([]);
      await PpgCamera.startCapture();
      setRunning(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [permission]);

  const handleStop = useCallback(async () => {
    try {
      await PpgCamera.stopCapture();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  const pathD =
    points.length > 1
      ? points
          .map((v, i) => {
            const x = (i / (MAX_POINTS - 1)) * 300;
            const y = 100 - Math.min(100, Math.max(0, v / 2.55));
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  return (
    <div
      style={{
        position: 'absolute', inset: 0, background: colors.surface, zIndex: 35, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 4px', flexShrink: 0 }}>
        <button style={iconBtnStyle} onClick={onClose} aria-label="Zurück">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: colors.text }}>PPG-Debug</div>

        {!isPpgCameraSupported && (
          <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Nur auf iOS verfügbar (Web/Android sind hier Platzhalter).</p>
        )}

        {isPpgCameraSupported && (
          <>
            <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>
              Berechtigung: {permission} · Kamera verfügbar: {available === null ? '…' : available ? 'ja' : 'nein (Simulator?)'}
            </p>

            <button style={primaryBtnStyle} onClick={running ? handleStop : handleStart}>
              {running ? 'Messung stoppen' : 'Messung starten'}
            </button>

            {error && (
              <p style={{ fontSize: 12, color: colors.rust, margin: 0 }}>{error}</p>
            )}

            <div style={{ fontFamily: serif, fontSize: 32, color: colors.text, textAlign: 'center' }}>{latest ? latest.redMean.toFixed(1) : '--'}</div>
            <p style={{ fontSize: 11, color: colors.muted, textAlign: 'center', margin: 0 }}>Rotkanal-Mittelwert (0–255), roh, ungefiltert</p>

            <svg width="100%" height={100} viewBox="0 0 300 100" style={{ background: colors.card, borderRadius: 16, border: `1px solid ${colors.border}` }}>
              {pathD && <path d={pathD} fill="none" stroke={colors.rust} strokeWidth={1.5} />}
            </svg>
          </>
        )}
      </div>
    </div>
  );
}
