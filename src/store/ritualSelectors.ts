import type { RitualEntry, RitualState } from '../types';
import { MONTH_LABELS, dateKeyMinusDays, toDateKey, todayKey, weekdayLabel } from '../lib/date';

export const STATE_COLORS: Record<RitualState, string> = {
  angespannt: '#B0532B',
  neutral: '#A69A7C',
  reguliert: '#6E7D66',
  entspannt: '#C8A84B',
};

function entryByDate(entries: RitualEntry[]): Map<string, RitualEntry> {
  const map = new Map<string, RitualEntry>();
  for (const e of entries) map.set(e.date, e);
  return map;
}

/**
 * Consecutive-day streak counting backward from today (or from yesterday if
 * today has no entry yet, so the streak doesn't look broken mid-day), stopping
 * at the first gap. Ritual entries are the only input — no other tab feeds this.
 */
export function currentStreak(entries: RitualEntry[]): number {
  const days = new Set(entries.map((e) => e.date));
  let cursor = todayKey();
  if (!days.has(cursor)) cursor = dateKeyMinusDays(cursor, 1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = dateKeyMinusDays(cursor, 1);
  }
  return streak;
}

/**
 * Share of ritual entries logged as "reguliert" or "entspannt" — the single
 * source of the Fortschritt "Reguliert-Anteil" metric. Anker/SOS sessions
 * don't capture a Zustand and never feed this number.
 */
export function reguliertPct(entries: RitualEntry[]): number {
  if (!entries.length) return 0;
  const regCount = entries.filter((e) => e.state === 'reguliert' || e.state === 'entspannt').length;
  return Math.round((regCount / entries.length) * 100);
}

export interface WeekStripDay {
  label: string;
  hasEntry: boolean;
  state: RitualState | null;
}

export function buildWeekStrip(entries: RitualEntry[]): WeekStripDay[] {
  const byDate = entryByDate(entries);
  const days: WeekStripDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = dateKeyMinusDays(todayKey(), i);
    const entry = byDate.get(key);
    days.push({ label: weekdayLabel(key), hasEntry: !!entry, state: entry ? entry.state : null });
  }
  return days;
}

export interface CalendarCell {
  hasDay: boolean;
  dayNum: number | '';
  state: RitualState | null;
}

export interface CalendarMonth {
  cells: CalendarCell[];
  label: string;
}

/** Monday-first month grid; each day cell carries the ritual entry state landing on it, if any. */
export function buildCalendar(entries: RitualEntry[], monthOffset: number): CalendarMonth {
  const byDate = entryByDate(entries);
  const base = new Date();
  const target = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = target.getFullYear();
  const month = target.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayFirst = (target.getDay() + 6) % 7;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < mondayFirst; i++) cells.push({ hasDay: false, dayNum: '', state: null });
  for (let day = 1; day <= daysInMonth; day++) {
    const key = toDateKey(new Date(year, month, day));
    const entry = byDate.get(key);
    cells.push({ hasDay: true, dayNum: day, state: entry ? entry.state : null });
  }
  return { cells, label: `${MONTH_LABELS[month]} ${year}` };
}
