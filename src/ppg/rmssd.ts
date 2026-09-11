/**
 * RMSSD — root mean square of successive differences between RR intervals,
 * in ms. The standard short-recording HRV metric (unlike SDNN, it stays
 * robust on the ~1-minute, motion-sensitive recordings a phone camera
 * produces). Caller is responsible for outlier-filtering the RR list first
 * (see outlierFilter.ts) and for deciding whether the result is reliable
 * enough to show (see rmssd count/quality gate at the call site).
 */
export function computeRmssd(cleanRRIntervalsMs: number[]): number | null {
  if (cleanRRIntervalsMs.length < 2) return null;

  let sumSquaredDiffs = 0;
  for (let i = 1; i < cleanRRIntervalsMs.length; i++) {
    const diff = cleanRRIntervalsMs[i] - cleanRRIntervalsMs[i - 1];
    sumSquaredDiffs += diff * diff;
  }
  return Math.sqrt(sumSquaredDiffs / (cleanRRIntervalsMs.length - 1));
}
