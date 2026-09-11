/**
 * Two passes: first drop RR intervals outside the physiologically plausible
 * range (config.minRRMs/maxRRMs), then apply the IQR method (values outside
 * Q1-1.5·IQR .. Q3+1.5·IQR) to catch remaining statistical outliers within
 * that range — e.g. a single missed/doubled beat detection.
 */
export function filterRROutliers(rrIntervalsMs: number[], bounds: { minRRMs: number; maxRRMs: number }): number[] {
  const withinPhysiologicalBounds = rrIntervalsMs.filter((rr) => rr >= bounds.minRRMs && rr <= bounds.maxRRMs);
  if (withinPhysiologicalBounds.length < 4) return withinPhysiologicalBounds;

  const sorted = [...withinPhysiologicalBounds].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return withinPhysiologicalBounds.filter((rr) => rr >= lowerBound && rr <= upperBound);
}

function percentile(sortedValues: number[], p: number): number {
  const index = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}
