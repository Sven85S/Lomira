import type { PpgSampleBatch } from '../native/ppgCamera';
import { bandpassFilter } from './bandpassFilter';
import { detectFrameRate } from './frameRateDetector';
import { filterRROutliers } from './outlierFilter';
import { detectPeaks, type Peak } from './peakDetector';
import { classifySnr, computeSnrDb, isFingerDetected } from './signalQuality';
import { DEFAULT_PPG_CONFIG, type PpgConfig, type PpgResult } from './types';

/** How much history the ring buffer keeps — long enough for fps detection and
 * several beats even at the slowest plausible heart rate, short enough that
 * the pipeline stays responsive to a changing signal. */
const WINDOW_MS = 8000;

export interface PpgService {
  /** Feeds one native sample batch through the pipeline and returns the current reading. */
  pushBatch(batch: PpgSampleBatch): PpgResult;
  /**
   * Runs frame-rate detection, the bandpass filter and peak detection once
   * over the *entire* untrimmed session buffer (everything pushed since the
   * last reset()), and returns the resulting raw RR intervals in ms. Used
   * for HRV metrics like RMSSD that need one coherent detection pass across
   * the whole measurement rather than concatenated results from the live
   * pushBatch()'s short rolling window (which would double-count intervals
   * as the window slides). Caller still owns outlier-filtering the result.
   */
  getSessionRRIntervalsMs(): number[];
  reset(): void;
}

const NOT_READY_RESULT: Omit<PpgResult, 'isFingerDetected' | 'isFpsStable' | 'fps'> = {
  bpm: null,
  quality: 'poor',
  snrDb: null,
};

/**
 * Orchestrator — the only stateful piece of src/ppg/. Holds the raw-sample
 * ring buffer and re-runs the (otherwise pure, individually testable)
 * pipeline stages over its current window on every batch: frame-rate
 * detection → bandpass filter → peak detection → RR intervals → outlier
 * filtering → BPM + SNR/quality.
 */
export function createPpgService(config: PpgConfig = DEFAULT_PPG_CONFIG): PpgService {
  let rawValues: number[] = [];
  let timestampsMs: number[] = [];
  // Never trimmed within a session (only reset() clears it) — a second,
  // parallel record of the same samples purely for the end-of-measurement
  // RMSSD pass; a ~60s session at typical camera frame rates is a trivial
  // amount of memory.
  let sessionRawValues: number[] = [];
  let sessionTimestampsMs: number[] = [];

  function trimToWindow(): void {
    if (timestampsMs.length === 0) return;
    const cutoff = timestampsMs[timestampsMs.length - 1] - WINDOW_MS;
    let start = 0;
    while (start < timestampsMs.length && timestampsMs[start] < cutoff) start++;
    if (start > 0) {
      rawValues = rawValues.slice(start);
      timestampsMs = timestampsMs.slice(start);
    }
  }

  function pushBatch(batch: PpgSampleBatch): PpgResult {
    for (const sample of batch.samples) {
      rawValues.push(sample.redMean);
      timestampsMs.push(sample.timestampMs);
      sessionRawValues.push(sample.redMean);
      sessionTimestampsMs.push(sample.timestampMs);
    }
    trimToWindow();

    const latestIntensity = rawValues[rawValues.length - 1] ?? 0;
    const fingerDetected = isFingerDetected(latestIntensity, config);
    const { fps, isStable } = detectFrameRate(timestampsMs, config);

    // Too little history, no finger, or fps not yet known — nothing reliable to report.
    if (!fingerDetected || fps === null || rawValues.length < 8) {
      return { ...NOT_READY_RESULT, isFingerDetected: fingerDetected, isFpsStable: isStable, fps };
    }

    const filtered = bandpassFilter(rawValues, fps);
    const peaks = detectPeaks(filtered, timestampsMs, fps, config.maxBpm);

    const rrIntervalsMs: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      rrIntervalsMs.push(peaks[i].timestampMs - peaks[i - 1].timestampMs);
    }
    const cleanRR = filterRROutliers(rrIntervalsMs, config);

    const bpm = cleanRR.length > 0 ? 60000 / mean(cleanRR) : null;
    const snrDb = computeSnrDb(filtered, rawValues);
    const quality = classifySnr(snrDb, config);

    return { bpm, quality, snrDb, isFingerDetected: fingerDetected, isFpsStable: isStable, fps };
  }

  function getSessionRRIntervalsMs(): number[] {
    const { fps, isStable } = detectFrameRate(sessionTimestampsMs, config);
    if (!isStable || fps === null || sessionRawValues.length < 8) return [];

    // A bandpass filter tuned to the pulse band plus physiologically-bounded
    // peak spacing will produce plausible-looking "beats" out of pure sensor
    // noise once enough dark/no-finger samples exist — confirmed
    // synthetically: a session with the finger never detected still yielded
    // 100 "clean" RR intervals implying ~107bpm. A single instantaneous
    // isFingerDetected() check per sample isn't the real gate; requiring the
    // finger to have been present for most of the *whole* session is.
    const fingerDetectedCount = sessionRawValues.reduce((count, v) => count + (isFingerDetected(v, config) ? 1 : 0), 0);
    if (fingerDetectedCount / sessionRawValues.length < config.minFingerPresenceFraction) return [];

    const filtered = bandpassFilter(sessionRawValues, fps);

    // Peak detection in non-overlapping ~8s chunks, each with its own global
    // std (exactly what the live per-batch path does on its own short
    // window) — not one rolling-std pass over the whole ~60s buffer. A
    // single one-shot pass over that much longer, non-stationary signal has
    // no redundancy against a locally elevated noise floor: confirmed
    // on-device losing the large majority of real beats (16 of ~79 expected
    // at 79bpm), unlike the live path, whose many independent short-window
    // estimates average out the same per-window miss rate into a plausible
    // avgBpm. Chunks can't simply be detectPeaks()'d on their own hard-cut
    // slice, though — a real peak sitting right at a chunk boundary would
    // lose the left/right context detectPeaks needs for its prominence and
    // merge-distance checks. Each chunk's slice is padded by minDistanceSamples
    // on both sides purely for that context; a peak is only kept if its
    // absolute index falls within the chunk's own unpadded [start, end) core,
    // which partitions the whole session exactly once — no gaps, no
    // double-counting. RR intervals are then a single diff pass over every
    // chunk's kept peaks concatenated in order, so the interval spanning two
    // chunks (last peak of one, first of the next) is just their real
    // timestamps' difference, the same as any other interval.
    const minDistanceSamples = Math.max(1, Math.round((fps * 60) / config.maxBpm));
    const chunkSamples = Math.round(fps * 8);

    const allPeaks: Peak[] = [];
    for (let chunkStart = 0; chunkStart < filtered.length; chunkStart += chunkSamples) {
      const chunkEnd = Math.min(filtered.length, chunkStart + chunkSamples);
      const sliceStart = Math.max(0, chunkStart - minDistanceSamples);
      const sliceEnd = Math.min(filtered.length, chunkEnd + minDistanceSamples);

      const filteredSlice = filtered.slice(sliceStart, sliceEnd);
      const timestampsSlice = sessionTimestampsMs.slice(sliceStart, sliceEnd);
      const chunkPeaks = detectPeaks(filteredSlice, timestampsSlice, fps, config.maxBpm);

      for (const peak of chunkPeaks) {
        const absoluteIndex = peak.index + sliceStart;
        if (absoluteIndex >= chunkStart && absoluteIndex < chunkEnd) {
          allPeaks.push({ ...peak, index: absoluteIndex });
        }
      }
    }

    const rrIntervalsMs: number[] = [];
    for (let i = 1; i < allPeaks.length; i++) {
      rrIntervalsMs.push(allPeaks[i].timestampMs - allPeaks[i - 1].timestampMs);
    }
    return rrIntervalsMs;
  }

  function reset(): void {
    rawValues = [];
    timestampsMs = [];
    sessionRawValues = [];
    sessionTimestampsMs = [];
  }

  return { pushBatch, getSessionRRIntervalsMs, reset };
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
