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
  /** RMSSD in ms — only set when signal quality was at least 'fair' and enough
   * clean RR intervals survived outlier filtering; absent otherwise rather
   * than a number that looks precise but isn't trustworthy. */
  rmssd?: number;
  /** True when rmssd was computed from only 'fair' (not 'good') quality —
   * still shown, but flagged as a rougher estimate. */
  rmssdEstimated?: boolean;
}

/**
 * A single completed Anker or Übungen session, used only for the Fortschritt
 * 4-week practiced-minutes chart. Deliberately separate from ankerSessionCount
 * (a bare counter with no date/duration) and from BeruehrenScreen's exercise
 * timer (previously pure local component state, never persisted).
 */
export interface PracticeSession {
  id: string;
  /** ISO date string (yyyy-mm-dd), local day the session belongs to. */
  date: string;
  /** ms since epoch when the session was recorded. */
  createdAt: number;
  minutes: number;
  source: 'anker' | 'beruehren';
}

// 'lektionen' deliberately not a tab anymore — it's a header-icon overlay now
// (see LektionenOverlay.tsx), like Settings. 'hrv' is back as a real tab
// (HrvFlow used to be a full-screen overlay reached via a ring chip, from
// before the tab bar existed) — see HrvFlow.tsx / App.tsx.
export type TabId = 'sos' | 'beruehren' | 'hrv' | 'ritual' | 'fortschritt';
