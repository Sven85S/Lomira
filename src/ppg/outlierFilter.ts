/**
 * Two passes: first drop RR intervals outside the physiologically plausible
 * range (config.minRRMs/maxRRMs), then drop intervals deviating more than
 * MEDIAN_TOLERANCE from the median — catches a missed beat (~2x) or a
 * spurious extra peak (~0.5x).
 *
 * Relative to the median rather than the IQR: RR intervals from a ~30fps
 * camera only come in ~33ms steps, so on a calm, regular pulse most
 * intervals land in one or two steps, the IQR collapses to ~0 and the IQR
 * rule threw away nearly all real beat-to-beat variation — RMSSD dropped to
 * ~0 in synthetic runs with a few weak beats or motion spikes. 25% was the
 * best tolerance in those runs: 20% already discarded up to a third of real
 * beats under strong breathing-driven variation, 30% let more artifacts in.
 */
const MEDIAN_TOLERANCE = 0.25;

export function filterRROutliers(rrIntervalsMs: number[], bounds: { minRRMs: number; maxRRMs: number }): number[] {
  const withinPhysiologicalBounds = rrIntervalsMs.filter((rr) => rr >= bounds.minRRMs && rr <= bounds.maxRRMs);
  if (withinPhysiologicalBounds.length < 4) return withinPhysiologicalBounds;

  const med = median(withinPhysiologicalBounds);
  const maxDeviation = med * MEDIAN_TOLERANCE;
  return withinPhysiologicalBounds.filter((rr) => Math.abs(rr - med) <= maxDeviation);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
