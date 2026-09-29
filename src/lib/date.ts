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

/**
 * Weekday + day + month, e.g. "Mo, 18. Sep" in German. Locale defaults to
 * German for legacy callers that haven't been migrated; the hook version
 * (useFormatEntryDate) in ../i18n binds it to the current app language, and
 * new call sites should prefer that. Kept as a plain function too because
 * non-React code (store selectors, potential logging) can't call hooks.
 */
export function formatEntryDate(key: string, locale: string = 'de-DE'): string {
  return fromDateKey(key).toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}
