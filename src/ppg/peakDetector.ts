export interface Peak {
  index: number;
  timestampMs: number;
  value: number;
}

/**
 * Local maxima in the bandpass-filtered signal, kept only if their prominence
 * (height above the lower of the two nearest valleys within one physiological
 * beat-period) clears an adaptive threshold tied to the signal's own standard
 * deviation — a fixed absolute threshold would be wrong for both a strong,
 * clean signal and a weak, noisy one. A minimum sample distance (derived from
 * maxBpm, i.e. the fastest physiologically plausible heartbeat) then collapses
 * any remaining too-close candidates down to the tallest one.
 *
 * `localStdWindowSamples` controls how that std is computed: omitted (the
 * default, used by the live per-batch path on its own short ~8s window), it's
 * one global number over the whole `filtered` array. Passed a window size
 * (used by the one-shot whole-session pass for RMSSD, on a ~60s array), it
 * becomes a rolling std instead — without it, a single brief artifact
 * anywhere in a long buffer (motion, an exposure glitch) can inflate that one
 * global number enough to bury real peaks throughout the rest of the
 * recording; confirmed via a synthetic one-off outlier spike collapsing peak
 * count from ~77 to 1 with the global variant, vs. 65 with the rolling one.
 */
export function detectPeaks(
  filtered: number[],
  timestampsMs: number[],
  fps: number,
  maxBpm: number,
  prominenceFactor = 0.5,
  localStdWindowSamples?: number,
): Peak[] {
  if (filtered.length < 3) return [];

  const stdAtIndex =
    localStdWindowSamples != null
      ? rollingStandardDeviation(filtered, localStdWindowSamples)
      : new Array(filtered.length).fill(standardDeviation(filtered));
  const minDistanceSamples = Math.max(1, Math.round((fps * 60) / maxBpm));

  const candidates: Peak[] = [];
  for (let i = 1; i < filtered.length - 1; i++) {
    const value = filtered[i];
    if (value <= filtered[i - 1] || value <= filtered[i + 1]) continue;

    const left = Math.max(0, i - minDistanceSamples);
    const right = Math.min(filtered.length - 1, i + minDistanceSamples);
    let leftMin = value;
    for (let j = i - 1; j >= left; j--) leftMin = Math.min(leftMin, filtered[j]);
    let rightMin = value;
    for (let j = i + 1; j <= right; j++) rightMin = Math.min(rightMin, filtered[j]);
    const prominence = value - Math.max(leftMin, rightMin);

    if (prominence >= stdAtIndex[i] * prominenceFactor) {
      candidates.push({ index: i, timestampMs: timestampsMs[i], value });
    }
  }

  const accepted: Peak[] = [];
  for (const candidate of candidates) {
    const last = accepted[accepted.length - 1];
    if (last && candidate.index - last.index < minDistanceSamples) {
      if (candidate.value > last.value) accepted[accepted.length - 1] = candidate;
      continue;
    }
    accepted.push(candidate);
  }

  return accepted;
}

function standardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Standard deviation over a centered sliding window at each index, computed
 * in O(n) via running sum/sum-of-squares rather than a fresh pass per index. */
function rollingStandardDeviation(values: number[], windowSize: number): number[] {
  const n = values.length;
  const result = new Array(n);
  const half = Math.floor(windowSize / 2);
  let sum = 0;
  let sumSq = 0;
  let start = 0;
  let end = -1;

  for (let i = 0; i < n; i++) {
    const desiredStart = Math.max(0, i - half);
    const desiredEnd = Math.min(n - 1, i + half);
    while (end < desiredEnd) {
      end++;
      sum += values[end];
      sumSq += values[end] * values[end];
    }
    while (start < desiredStart) {
      sum -= values[start];
      sumSq -= values[start] * values[start];
      start++;
    }
    const count = end - start + 1;
    const mean = sum / count;
    result[i] = Math.sqrt(Math.max(0, sumSq / count - mean * mean));
  }
  return result;
}
