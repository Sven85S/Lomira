import type { PulseEntry } from '../types';

export interface PulseChart {
  beforePts: string;
  afterPts: string;
  beforeDots: { cx: number; cy: number }[];
  afterDots: { cx: number; cy: number }[];
}

/**
 * Maps before/after pulse samples onto a 280x110 viewBox: x by chronological
 * index, y by value within the sample's own min/max range (small margin so
 * the lines don't clip). Entries are sorted oldest -> newest first.
 */
export function buildPulseChart(entries: PulseEntry[]): PulseChart | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const vals = sorted.flatMap((e) => [e.before, e.after]);
  const min = Math.min(...vals) - 4;
  const max = Math.max(...vals) + 4;
  const w = 280;
  const h = 110;
  const padX = 6;
  const padY = 10;
  const n = sorted.length;
  const xAt = (i: number) => padX + (n === 1 ? 0 : (i / (n - 1)) * (w - padX * 2));
  const yAt = (v: number) => h - padY - ((v - min) / (max - min || 1)) * (h - padY * 2);

  return {
    beforePts: sorted.map((e, i) => `${xAt(i).toFixed(1)},${yAt(e.before).toFixed(1)}`).join(' '),
    afterPts: sorted.map((e, i) => `${xAt(i).toFixed(1)},${yAt(e.after).toFixed(1)}`).join(' '),
    beforeDots: sorted.map((e, i) => ({ cx: xAt(i), cy: yAt(e.before) })),
    afterDots: sorted.map((e, i) => ({ cx: xAt(i), cy: yAt(e.after) })),
  };
}
