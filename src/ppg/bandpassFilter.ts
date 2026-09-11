/**
 * Isolates the 0.7–3.0 Hz pulse band (42–180 bpm) with two moving averages:
 * a short SMA acts as a low-pass (smooths anything faster than ~3 Hz), a
 * long SMA tracks the slow baseline drift below ~0.7 Hz; subtracting the
 * long SMA from the short one leaves the band in between. Window lengths
 * are derived from the detected fps rather than hardcoded, since a fixed
 * sample count means a different frequency cutoff at 24fps vs 60fps.
 */
export function bandpassFilter(samples: number[], fps: number, lowHz = 0.7, highHz = 3.0): number[] {
  if (samples.length === 0) return [];

  const shortWindow = Math.max(1, Math.round(fps / highHz));
  const longWindow = Math.max(shortWindow + 1, Math.round(fps / lowHz));

  const shortSma = movingAverage(samples, shortWindow);
  const longSma = movingAverage(samples, longWindow);

  return samples.map((_, i) => shortSma[i] - longSma[i]);
}

/** Causal simple moving average — at index i, averages over up to windowSize preceding samples. */
function movingAverage(values: number[], windowSize: number): number[] {
  const result: number[] = new Array(values.length);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= windowSize) sum -= values[i - windowSize];
    const count = Math.min(i + 1, windowSize);
    result[i] = sum / count;
  }
  return result;
}
