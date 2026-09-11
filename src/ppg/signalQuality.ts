import type { PpgConfig, SignalQuality } from './types';

/**
 * Signal power is the variance of the already bandpass-filtered pulse
 * component; noise power is estimated from the raw signal's frame-to-frame
 * first differences (the highest-frequency jitter the bandpass filter
 * discards entirely, i.e. sensor/quantization noise rather than pulse). A
 * first-difference's variance is ~2× the underlying white-noise variance,
 * hence the /2.
 */
export function computeSnrDb(filtered: number[], raw: number[]): number {
  const signalPower = variance(filtered);
  const noisePower = variance(firstDifferences(raw)) / 2;

  if (noisePower <= 0) return signalPower > 0 ? 60 : 0;
  const ratio = Math.max(signalPower / noisePower, 1e-9);
  return 10 * Math.log10(ratio);
}

export function classifySnr(snrDb: number, config: Pick<PpgConfig, 'minGoodSnrDb' | 'minFairSnrDb'>): SignalQuality {
  if (snrDb >= config.minGoodSnrDb) return 'good';
  if (snrDb >= config.minFairSnrDb) return 'fair';
  return 'poor';
}

/** A finger fully covering the lens sits in a plausible brightness band — well
 * below it means no finger (ambient light), well above means overexposed/no
 * real occlusion. */
export function isFingerDetected(meanIntensity: number, config: Pick<PpgConfig, 'fingerPresenceMin' | 'fingerPresenceMax'>): boolean {
  return meanIntensity >= config.fingerPresenceMin && meanIntensity <= config.fingerPresenceMax;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
}

function firstDifferences(values: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < values.length; i++) result.push(values[i] - values[i - 1]);
  return result;
}
