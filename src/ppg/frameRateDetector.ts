import type { PpgConfig } from './types';

export interface FrameRateResult {
  fps: number | null;
  isStable: boolean;
}

/**
 * Median of successive timestamp deltas (robust against the odd dropped/late
 * frame, unlike a mean), snapped to the nearest of the device's plausible
 * frame rates. Stability just means "we've seen enough samples to trust the
 * estimate" — it says nothing about jitter.
 */
export function detectFrameRate(timestampsMs: number[], config: PpgConfig): FrameRateResult {
  const isStable = timestampsMs.length >= config.fpsWarmupSamples;

  if (timestampsMs.length < 2) return { fps: null, isStable };

  const deltas: number[] = [];
  for (let i = 1; i < timestampsMs.length; i++) {
    const delta = timestampsMs[i] - timestampsMs[i - 1];
    if (delta > 0) deltas.push(delta);
  }
  if (deltas.length === 0) return { fps: null, isStable };

  const medianDeltaMs = median(deltas);
  if (medianDeltaMs <= 0) return { fps: null, isStable };
  const rawFps = 1000 / medianDeltaMs;

  const snappedFps = config.candidateFps.reduce((best, candidate) =>
    Math.abs(candidate - rawFps) < Math.abs(best - rawFps) ? candidate : best,
  );

  return { fps: snappedFps, isStable };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
