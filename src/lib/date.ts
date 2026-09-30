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

/**
 * Locale-aware short weekday label for a given date key ("Mo", "Mon", "lun.",
 * "lun"…). Delegates entirely to Intl.DateTimeFormat so the browser's own
 * locale data — same source Apple's system settings uses on-device — decides
 * abbreviation style. Locale defaults to German for legacy callers.
 */
export function weekdayShortLabel(key: string, locale: string = 'de-DE'): string {
  return fromDateKey(key).toLocaleDateString(locale, { weekday: 'short' });
}

/**
 * Seven Monday-first short weekday labels for a calendar header row. Uses
 * 2024-01-01 (a Monday) as the anchor so index 0 = Monday regardless of the
 * locale's own week start (which some locales — e.g. en-US — put on Sunday
 * by default). Independent of Intl.Locale's weekInfo (Firefox: not exposed;
 * Safari on older iOS: not exposed either).
 */
export function weekdayHeaderLabels(locale: string = 'de-DE'): string[] {
  const anchor = new Date(2024, 0, 1); // Monday
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(anchor);
    d.setDate(d.getDate() + i);
    labels.push(d.toLocaleDateString(locale, { weekday: 'short' }));
  }
  return labels;
}

/**
 * "January 2024" / "Januar 2024" / "janvier 2024" — long month + year in the
 * given locale, for the ritual-calendar heading.
 */
export function monthYearLabel(year: number, month: number, locale: string = 'de-DE'): string {
  return new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
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
