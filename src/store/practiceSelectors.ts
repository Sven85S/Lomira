import type { PracticeSession } from '../types';
import { dateKeyMinusDays, fromDateKey, toDateKey, todayKey } from '../lib/date';

export interface WeeklyMinutesBar {
  label: string;
  minutes: number;
  isCurrent: boolean;
}

function mondayOf(dateKey: string): string {
  const d = fromDateKey(dateKey);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  return toDateKey(d);
}

function formatWeekLabel(weekStartKey: string): string {
  const d = fromDateKey(weekStartKey);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

/**
 * Last 4 Monday-start calendar weeks (oldest first, current week last),
 * summing PracticeSession minutes per week — Anker and Übungen sessions
 * both count, regardless of source.
 */
export function buildWeeklyMinutesChart(sessions: PracticeSession[]): WeeklyMinutesBar[] {
  const currentWeekStart = mondayOf(todayKey());
  const weekStarts: string[] = [];
  for (let i = 3; i >= 0; i--) {
    weekStarts.push(dateKeyMinusDays(currentWeekStart, i * 7));
  }

  const totals = new Map<string, number>();
  for (const s of sessions) {
    const wk = mondayOf(s.date);
    totals.set(wk, (totals.get(wk) ?? 0) + s.minutes);
  }

  return weekStarts.map((wk) => ({
    label: wk === currentWeekStart ? 'Diese Woche' : formatWeekLabel(wk),
    minutes: Math.round(totals.get(wk) ?? 0),
    isCurrent: wk === currentWeekStart,
  }));
}
