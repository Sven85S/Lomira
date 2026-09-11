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
 */
export function detectPeaks(
  filtered: number[],
  timestampsMs: number[],
  fps: number,
  maxBpm: number,
  prominenceFactor = 0.5,
): Peak[] {
  if (filtered.length < 3) return [];

  const std = standardDeviation(filtered);
  const minProminence = std * prominenceFactor;
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

    if (prominence >= minProminence) {
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
