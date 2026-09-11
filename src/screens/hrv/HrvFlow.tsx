import { useCallback, useEffect, useRef, useState } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import { useData } from '../../context/DataContext';
import { PpgCamera, isPpgCameraSupported, type CameraPermissionState } from '../../native/ppgCamera';
import { filterRROutliers } from '../../ppg/outlierFilter';
import { createPpgService } from '../../ppg/ppgService';
import { computeRmssd } from '../../ppg/rmssd';
import { classifySnr } from '../../ppg/signalQuality';
import { DEFAULT_PPG_CONFIG, type PpgResult, type SignalQuality } from '../../ppg/types';
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
const MEASURE_MS = 60000;
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
  const [finalResult, setFinalResult] = useState<{ bpm: number; quality: SignalQuality; rmssd?: number; rmssdEstimated?: boolean } | null>(
    null,
  );

  const phaseRef = useRef<Phase>('start');
  phaseRef.current = phase;
  const isWarmupRef = useRef(true);
  const lastResultRef = useRef<PpgResult | null>(null);
  const bpmSamplesRef = useRef<number[]>([]);
  const snrSamplesRef = useRef<number[]>([]);
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
        if (!isWarmupRef.current && result.snrDb != null) {
          snrSamplesRef.current.push(result.snrDb);
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
      console.log('[HrvFlow] stopCapture called from: unmount safety-net cleanup', { phase: phaseRef.current });
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
    snrSamplesRef.current = [];
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
          console.log('[HrvFlow] stopCapture called from: measurement countdown finished', { elapsed, totalMs });
          await PpgCamera.stopCapture();
          const bpmSamples = bpmSamplesRef.current;
          if (bpmSamples.length > 0) {
            const avgBpm = Math.round(bpmSamples.reduce((a, b) => a + b, 0) / bpmSamples.length);

            // Quality from the mean SNR across the whole counting phase, not
            // just the last live 8s window — a single bad moment near the end
            // (e.g. a brief capture interruption) shouldn't decide the tag for
            // the entire measurement. Same classifySnr()/thresholds as before,
            // just fed a steadier number.
            const snrSamples = snrSamplesRef.current;
            const meanSnrDb = snrSamples.length > 0 ? snrSamples.reduce((a, b) => a + b, 0) / snrSamples.length : null;
            const quality: SignalQuality = meanSnrDb != null ? classifySnr(meanSnrDb, DEFAULT_PPG_CONFIG) : (lastResultRef.current?.quality ?? 'poor');

            // RMSSD needs its own reliability gate — a single bad RR interval
            // skews it far more than it does a plain BPM average — but a hard
            // "gut"-only cutoff rejected real, plausible measurements that only
            // reached "brauchbar" in practice. "brauchbar" is now accepted too,
            // just flagged as an estimate rather than silently dropped; "schwach"
            // still yields no RMSSD, since below 0dB SNR there's essentially no
            // reliable beat-to-beat structure left. One coherent peak-detection
            // pass over the whole session (not the live 8s rolling window)
            // avoids double-counting intervals across overlapping batches.
            const sessionRR = ppgServiceRef.current.getSessionRRIntervalsMs();
            const cleanSessionRR = filterRROutliers(sessionRR, DEFAULT_PPG_CONFIG);
            const rmssdReliable = quality !== 'poor' && cleanSessionRR.length >= DEFAULT_PPG_CONFIG.minRmssdCleanRRCount;
            const rmssd = rmssdReliable ? (computeRmssd(cleanSessionRR) ?? undefined) : undefined;
            const rmssdEstimated = rmssd != null && quality === 'fair';

            // Kept for calibration — the 5.0/0.0dB quality thresholds were only
            // rough starting values, never tuned against real Lomira device
            // data; comparing meanSnrDb/lastSnrDb across several clean (non-
            // interrupted) measurements is what a future retuning would need.
            console.log('[HrvFlow] Messung beendet', {
              avgBpm,
              quality,
              meanSnrDb,
              lastSnrDb: lastResultRef.current?.snrDb ?? null,
              minSnrDb: snrSamples.length > 0 ? Math.min(...snrSamples) : null,
              maxSnrDb: snrSamples.length > 0 ? Math.max(...snrSamples) : null,
              snrSampleCount: snrSamples.length,
              sessionRRCount: sessionRR.length,
              cleanRRCount: cleanSessionRR.length,
              rmssd,
              rmssdEstimated,
            });

            setFinalResult({ bpm: avgBpm, quality, rmssd, rmssdEstimated });
            await recordHrvMeasurementRef.current(avgBpm, quality, rmssd, rmssdEstimated);
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

  // The safety-net cleanup's dependency array is already [] — it can only
  // fire once, on a genuine unmount, never from a changing dependency. The
  // only way HrvFlow unmounts during phase==='measuring' is onClose() firing
  // (App.tsx's only other showHrvFlow-false path, onOpenFortschritt, is only
  // reachable from the result screen). handleClose is shared by all three
  // screens, so a plain log can't tell which one's onClick actually reached
  // it — console.trace() prints the real JS call stack instead, which does.
  const handleClose = useCallback(() => {
    console.trace('[HrvFlow] onClose invoked', { phase: phaseRef.current });
    onClose();
  }, [onClose]);

  if (phase === 'measuring') {
    return (
      <HrvMeasuringScreen
        onClose={handleClose}
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
    return <HrvResultScreen onClose={handleClose} result={finalResult} onOpenFortschritt={onOpenFortschritt} onRemeasure={handleRemeasure} />;
  }

  return (
    <HrvStartScreen
      onClose={handleClose}
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
