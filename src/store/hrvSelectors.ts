import type { HrvMeasurement } from '../types';
import { dateKeyMinusDays, todayKey } from '../lib/date';

export interface HrvHistoryChart {
  bpmPts: string;
  rmssdPts: string | null;
  bpmMin: number;
  bpmMax: number;
  rmssdMin: number | null;
  rmssdMax: number | null;
  earliestDate: string;
  latestDate: string;
}

/**
 * Two separate sparklines over the last 30 days — one for resting BPM, one
 * for RMSSD — for the Fortschritt page. Each gets its own Y range so a 50-100
 * BPM line and a 10-150 ms RMSSD line don't flatten each other when drawn on
 * a shared axis; the Fortschritt view renders them as two stacked SVGs in the
 * same card. One point per day (newest value), days without an rmssd value
 * are still plotted on the BPM line (rmssd is optional per measurement). The
 * rmssd line is null when fewer than two days have an rmssd value — a single
 * point isn't a trend.
 */
export function buildHrvHistoryChart(measurements: HrvMeasurement[]): HrvHistoryChart | null {
  if (measurements.length < 2) return null;

  const windowStart = dateKeyMinusDays(todayKey(), 29);
  const perDayBpm = new Map<string, number>();
  const perDayRmssd = new Map<string, number>();
  // Measurements are newest-first; the first hit per date is the latest.
  for (const m of measurements) {
    if (m.date < windowStart) continue;
    if (!perDayBpm.has(m.date)) perDayBpm.set(m.date, m.bpm);
    if (m.rmssd != null && !perDayRmssd.has(m.date)) perDayRmssd.set(m.date, m.rmssd);
  }

  const bpmDays = [...perDayBpm.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (bpmDays.length < 2) return null;

  const w = 280;
  const h = 70;
  const padX = 4;
  const padY = 8;
  const buildPts = (days: [string, number][], min: number, max: number): string => {
    const n = days.length;
    const xAt = (i: number) => padX + (i / (n - 1)) * (w - padX * 2);
    const yAt = (v: number) => h - padY - ((v - min) / (max - min || 1)) * (h - padY * 2);
    return days.map(([, v], i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
  };

  const bpmVals = bpmDays.map(([, v]) => v);
  const bpmMin = Math.min(...bpmVals);
  const bpmMax = Math.max(...bpmVals);
  // Rounded for the Y-axis labels; a tiny bit of padding on the plotted range
  // so the line doesn't glue to the top or bottom edge of the viewBox.
  const bpmPts = buildPts(bpmDays, bpmMin - 2, bpmMax + 2);

  const rmssdDays = [...perDayRmssd.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let rmssdPts: string | null = null;
  let rmssdMin: number | null = null;
  let rmssdMax: number | null = null;
  if (rmssdDays.length >= 2) {
    const rmssdVals = rmssdDays.map(([, v]) => v);
    rmssdMin = Math.min(...rmssdVals);
    rmssdMax = Math.max(...rmssdVals);
    rmssdPts = buildPts(rmssdDays, rmssdMin - 2, rmssdMax + 2);
  }

  return {
    bpmPts,
    rmssdPts,
    bpmMin: Math.round(bpmMin),
    bpmMax: Math.round(bpmMax),
    rmssdMin: rmssdMin != null ? Math.round(rmssdMin) : null,
    rmssdMax: rmssdMax != null ? Math.round(rmssdMax) : null,
    earliestDate: bpmDays[0][0],
    latestDate: bpmDays[bpmDays.length - 1][0],
  };
}

export interface HrvDashboardData {
  latestBpm: number;
  latestQuality: HrvMeasurement['quality'];
  latestRmssd: number | null;
  /** Set only when the shown rmssd isn't from the latest measurement itself
   * (that one lacked a reliable rmssd) — the date it's actually from instead. */
  rmssdFallbackDate: string | null;
  /** Heuristic estimate from the latest measurement's signal quality — never a
   * real coherence measurement, callers must label it as an estimate. */
  coherencePercent: number;
  /** SVG polyline points over a 260x60 viewBox, or null when fewer than 2 of
   * the last 7 days have an rmssd-bearing measurement to plot. */
  sparklinePts: string | null;
}

const COHERENCE_ESTIMATE: Record<HrvMeasurement['quality'], number> = { good: 85, fair: 60, poor: 30 };

/**
 * Dashboard summary for the HRV tab's landing screen. Returns null when
 * there are no measurements at all — callers show the empty state instead.
 */
export function buildHrvDashboard(measurements: HrvMeasurement[]): HrvDashboardData | null {
  if (measurements.length === 0) return null;
  const latest = measurements[0];

  // rmssd isn't guaranteed on the latest measurement — absent below 'fair'
  // quality or with too few clean RR intervals (see HrvMeasurement's own
  // comment). Search backward for the most recent measurement that does
  // have one, rather than showing nothing just because the very latest
  // reading happened to be too noisy.
  const withRmssd = measurements.find((m) => m.rmssd != null);
  const latestRmssd = withRmssd?.rmssd ?? null;
  const rmssdFallbackDate = withRmssd && withRmssd.id !== latest.id ? withRmssd.date : null;

  // One point per calendar day over the last 7 days (not one point per
  // measurement — a day can have several), using each day's most recent
  // rmssd-bearing reading. Days with no rmssd value are skipped rather than
  // interpolated or zero-filled, so a thin week still reads as thin data,
  // not as a real dip to zero.
  const sevenDaysAgo = dateKeyMinusDays(todayKey(), 6);
  const perDay = new Map<string, number>();
  for (const m of measurements) {
    if (m.rmssd == null || m.date < sevenDaysAgo) continue;
    // Measurements are newest-first, so the first hit for a given day is
    // already that day's most recent one.
    if (!perDay.has(m.date)) perDay.set(m.date, m.rmssd);
  }
  const days = [...perDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  let sparklinePts: string | null = null;
  if (days.length >= 2) {
    const w = 260;
    const h = 60;
    const padX = 4;
    const padY = 8;
    const vals = days.map((d) => d[1]);
    const min = Math.min(...vals) - 2;
    const max = Math.max(...vals) + 2;
    const n = days.length;
    const xAt = (i: number) => padX + (i / (n - 1)) * (w - padX * 2);
    const yAt = (v: number) => h - padY - ((v - min) / (max - min || 1)) * (h - padY * 2);
    sparklinePts = days.map(([, v], i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
  }

  return {
    latestBpm: latest.bpm,
    latestQuality: latest.quality,
    latestRmssd,
    rmssdFallbackDate,
    coherencePercent: COHERENCE_ESTIMATE[latest.quality],
    sparklinePts,
  };
}
