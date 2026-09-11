import { useCallback, useEffect, useRef, useState } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import { useData } from '../../context/DataContext';
import { PpgCamera, isPpgCameraSupported, type CameraPermissionState } from '../../native/ppgCamera';
import { createPpgService } from '../../ppg/ppgService';
import type { PpgResult, SignalQuality } from '../../ppg/types';
import HrvStartScreen from './HrvStartScreen';
import HrvMeasuringScreen from './HrvMeasuringScreen';
import HrvResultScreen from './HrvResultScreen';

interface Props {
  onClose: () => void;
  onOpenFortschritt: () => void;
}

type Phase = 'start' | 'measuring' | 'result';

// 5–10s warmup + 30–60s counting, per spec — the warmup's ppgService output is
// discarded entirely (bandpass/peak-detection needs a moment on fresh camera
// exposure/white-balance-locked signal before its output means anything).
const WARMUP_MS = 7000;
const MEASURE_MS = 45000;
const MAX_LIVE_POINTS = 150;

export default function HrvFlow({ onClose, onOpenFortschritt }: Props) {
  const { recordHrvMeasurement } = useData();

  const [phase, setPhase] = useState<Phase>('start');
  const [permission, setPermission] = useState<CameraPermissionState | 'unknown'>('unknown');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewActive, setPreviewActive] = useState(false);

  const [isWarmup, setIsWarmup] = useState(true);
  const [warmupRemainingMs, setWarmupRemainingMs] = useState(WARMUP_MS);
  const [measureRemainingMs, setMeasureRemainingMs] = useState(MEASURE_MS);
  const [liveResult, setLiveResult] = useState<PpgResult | null>(null);
  const [livePoints, setLivePoints] = useState<number[]>([]);
  const [finalResult, setFinalResult] = useState<{ bpm: number; quality: SignalQuality } | null>(null);

  const phaseRef = useRef<Phase>('start');
  phaseRef.current = phase;
  const isWarmupRef = useRef(true);
  const lastResultRef = useRef<PpgResult | null>(null);
  const bpmSamplesRef = useRef<number[]>([]);
  const ppgServiceRef = useRef(createPpgService());
  const previewRef = useRef<HTMLDivElement>(null);
  // Always-current reference to the context callback — the interval effect below
  // must not restart every time recordHrvMeasurement's identity changes (it does,
  // whenever hrvMeasurements changes), or a mid-measurement countdown would reset.
  const recordHrvMeasurementRef = useRef(recordHrvMeasurement);
  recordHrvMeasurementRef.current = recordHrvMeasurement;

  const sampleHandle = useRef<PluginListenerHandle | null>(null);
  const errorHandle = useRef<PluginListenerHandle | null>(null);

  // Permission/availability, checked once — mirrors PpgDebugScreen's pattern.
  useEffect(() => {
    if (!isPpgCameraSupported) return;
    (async () => {
      try {
        const [{ camera }, { available: avail }] = await Promise.all([PpgCamera.checkPermissions(), PpgCamera.isAvailable()]);
        setPermission(camera);
        setAvailable(avail);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  // Sample/error listeners, registered once for the whole flow's lifetime.
  useEffect(() => {
    if (!isPpgCameraSupported) return;
    let cancelled = false;
    (async () => {
      const sh = await PpgCamera.addListener('ppgSample', (batch) => {
        if (phaseRef.current !== 'measuring') return;
        const result = ppgServiceRef.current.pushBatch(batch);
        lastResultRef.current = result;
        setLiveResult(result);
        setLivePoints((prev) => {
          const next = [...prev, ...batch.samples.map((s) => s.redMean)];
          return next.length > MAX_LIVE_POINTS ? next.slice(next.length - MAX_LIVE_POINTS) : next;
        });
        if (!isWarmupRef.current && result.bpm != null) {
          bpmSamplesRef.current.push(result.bpm);
        }
      });
      const eh = await PpgCamera.addListener('captureError', (err) => {
        setError(err.message);
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
    };
  }, []);

  // Safety net for every exit path (close button, swipe-back, unmount mid-flow).
  useEffect(() => {
    return () => {
      void PpgCamera.stopCapture();
      void PpgCamera.detachPreview();
    };
  }, []);

  // Attaches the native preview to the Start screen's placeholder once the
  // camera is running there; detaches automatically on leaving 'start' or
  // turning the camera off again — same session throughout, not a second one.
  useEffect(() => {
    if (phase !== 'start' || !previewActive) return;
    const el = previewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    void PpgCamera.attachPreview({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    return () => {
      void PpgCamera.detachPreview();
    };
  }, [phase, previewActive]);

  const handleActivateCamera = useCallback(async () => {
    setError(null);
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
      await PpgCamera.startCapture();
      setPreviewActive(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [permission]);

  const handleContinueToMeasuring = useCallback(() => {
    ppgServiceRef.current.reset();
    bpmSamplesRef.current = [];
    lastResultRef.current = null;
    isWarmupRef.current = true;
    setIsWarmup(true);
    setWarmupRemainingMs(WARMUP_MS);
    setMeasureRemainingMs(MEASURE_MS);
    setLivePoints([]);
    setLiveResult(null);
    setPhase('measuring');
  }, []);

  // Countdown for the whole 'measuring' phase — a single interval spanning
  // warmup + counting, switching sub-phase at WARMUP_MS rather than two
  // separate timers, so there's one clock to reason about and no seam.
  useEffect(() => {
    if (phase !== 'measuring') return;
    const startedAt = Date.now();
    const totalMs = WARMUP_MS + MEASURE_MS;

    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;

      if (elapsed < WARMUP_MS) {
        isWarmupRef.current = true;
        setIsWarmup(true);
        setWarmupRemainingMs(Math.max(0, WARMUP_MS - elapsed));
      } else {
        if (isWarmupRef.current) {
          isWarmupRef.current = false;
          setIsWarmup(false);
        }
        setWarmupRemainingMs(0);
        setMeasureRemainingMs(Math.max(0, totalMs - elapsed));
      }

      if (elapsed >= totalMs) {
        window.clearInterval(id);
        void (async () => {
          await PpgCamera.stopCapture();
          const bpmSamples = bpmSamplesRef.current;
          if (bpmSamples.length > 0) {
            const avgBpm = Math.round(bpmSamples.reduce((a, b) => a + b, 0) / bpmSamples.length);
            const quality: SignalQuality = lastResultRef.current?.quality ?? 'poor';
            setFinalResult({ bpm: avgBpm, quality });
            await recordHrvMeasurementRef.current(avgBpm, quality);
          } else {
            setFinalResult(null);
          }
          setPhase('result');
        })();
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [phase]);

  const handleRemeasure = useCallback(() => {
    setFinalResult(null);
    setPreviewActive(false);
    setPhase('start');
  }, []);

  if (phase === 'measuring') {
    return (
      <HrvMeasuringScreen
        onClose={onClose}
        isWarmup={isWarmup}
        warmupRemainingMs={warmupRemainingMs}
        measureRemainingMs={measureRemainingMs}
        totalMeasureMs={MEASURE_MS}
        liveResult={liveResult}
        livePoints={livePoints}
      />
    );
  }

  if (phase === 'result') {
    return <HrvResultScreen onClose={onClose} result={finalResult} onOpenFortschritt={onOpenFortschritt} onRemeasure={handleRemeasure} />;
  }

  return (
    <HrvStartScreen
      onClose={onClose}
      isSupported={isPpgCameraSupported}
      permission={permission}
      available={available}
      error={error}
      previewActive={previewActive}
      previewRef={previewRef}
      onActivateCamera={handleActivateCamera}
      onContinue={handleContinueToMeasuring}
    />
  );
}
