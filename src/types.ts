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

export type TabId = 'sos' | 'beruehren' | 'lektionen' | 'ritual' | 'fortschritt';
