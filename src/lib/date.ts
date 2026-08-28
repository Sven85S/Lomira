/** yyyy-mm-dd for the local calendar day — the key ritual/pulse entries are stored under. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function dateKeyMinusDays(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() - days);
  return toDateKey(d);
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const MONTH_LABELS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export function weekdayLabel(key: string): string {
  return WEEKDAY_LABELS[(fromDateKey(key).getDay() + 6) % 7];
}

export function formatEntryDate(key: string): string {
  return fromDateKey(key).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}
