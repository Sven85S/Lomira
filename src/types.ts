export type RitualState = 'angespannt' | 'neutral' | 'reguliert' | 'entspannt';

export interface RitualEntry {
  id: string;
  /** ISO date string (yyyy-mm-dd), local day the entry belongs to. */
  date: string;
  state: RitualState;
  note: string;
  /** ms since epoch when the entry was created, for stable ordering of same-day entries. */
  createdAt: number;
}

export interface PulseEntry {
  id: string;
  date: string;
  before: number;
  after: number;
}

/**
 * A camera-based pulse measurement (HRV tab). Deliberately its own type,
 * separate from PulseEntry's manual before/after pair around an Anker
 * session — this is a standalone, single-value reading with its own history.
 */
export interface HrvMeasurement {
  id: string;
  /** ISO date string (yyyy-mm-dd), local day the measurement belongs to. */
  date: string;
  /** ms since epoch when the measurement was recorded. */
  createdAt: number;
  bpm: number;
  quality: 'good' | 'fair' | 'poor';
}

export type TabId = 'sos' | 'beruehren' | 'lektionen' | 'ritual' | 'fortschritt';
