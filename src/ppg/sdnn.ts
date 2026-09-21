/**
 * SDNN — standard deviation of NN (RR) intervals, in ms. More sensitive than
 * RMSSD to motion artifacts/non-stationarity on short phone-camera
 * recordings, so callers apply a stricter reliability gate before using this
 * (see the Apple Health write gate at the HrvFlow call site: quality ===
 * 'good' only). Caller is responsible for outlier-filtering the RR list
 * first (see outlierFilter.ts), same as computeRmssd().
 */
export function computeSdnn(cleanRRIntervalsMs: number[]): number | null {
  if (cleanRRIntervalsMs.length < 2) return null;

  const mean = cleanRRIntervalsMs.reduce((a, b) => a + b, 0) / cleanRRIntervalsMs.length;
  const variance = cleanRRIntervalsMs.reduce((sum, rr) => sum + (rr - mean) ** 2, 0) / (cleanRRIntervalsMs.length - 1);
  return Math.sqrt(variance);
}
