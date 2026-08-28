import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PulseEntry, RitualEntry, RitualState } from '../types';
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage';
import { todayKey } from '../lib/date';
import {
  buildCalendar,
  buildWeekStrip,
  currentStreak,
  reguliertPct,
  type CalendarMonth,
  type WeekStripDay,
} from '../store/ritualSelectors';
import { buildPulseChart, type PulseChart } from '../store/pulseSelectors';

interface DataContextValue {
  loading: boolean;

  ritualEntries: RitualEntry[];
  todayEntry: RitualEntry | undefined;
  streak: number;
  reguliertPercent: number;
  weekStrip: WeekStripDay[];
  calendarForOffset: (monthOffset: number) => CalendarMonth;
  completeRitual: (state: RitualState, note: string) => Promise<void>;
  updateRitualEntry: (id: string, patch: Partial<Pick<RitualEntry, 'note' | 'state'>>) => Promise<void>;
  deleteRitualEntry: (id: string) => Promise<void>;

  ankerSessionCount: number;
  recordAnkerSession: () => Promise<void>;

  pulseEntries: PulseEntry[];
  pulseChart: PulseChart | null;
}

const DataContext = createContext<DataContextValue | null>(null);

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [ritualEntries, setRitualEntries] = useState<RitualEntry[]>([]);
  const [ankerSessionCount, setAnkerSessionCount] = useState(0);
  const [pulseEntries, setPulseEntries] = useState<PulseEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [entries, ankerCount, pulses] = await Promise.all([
        readJSON<RitualEntry[]>(STORAGE_KEYS.ritualEntries, []),
        readJSON<number>(STORAGE_KEYS.ankerSessionCount, 0),
        readJSON<PulseEntry[]>(STORAGE_KEYS.pulseEntries, []),
      ]);
      setRitualEntries(entries);
      setAnkerSessionCount(ankerCount);
      setPulseEntries(pulses);
      setLoading(false);
    })();
  }, []);

  const persistRitualEntries = useCallback(async (next: RitualEntry[]) => {
    setRitualEntries(next);
    await writeJSON(STORAGE_KEYS.ritualEntries, next);
  }, []);

  const completeRitual = useCallback(
    async (state: RitualState, note: string) => {
      const key = todayKey();
      const existing = ritualEntries.find((e) => e.date === key);
      const next = existing
        ? ritualEntries.map((e) => (e.id === existing.id ? { ...e, state, note } : e))
        : [{ id: uid(), date: key, state, note, createdAt: Date.now() }, ...ritualEntries];
      await persistRitualEntries(next);
    },
    [ritualEntries, persistRitualEntries],
  );

  const updateRitualEntry = useCallback(
    async (id: string, patch: Partial<Pick<RitualEntry, 'note' | 'state'>>) => {
      await persistRitualEntries(ritualEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    },
    [ritualEntries, persistRitualEntries],
  );

  const deleteRitualEntry = useCallback(
    async (id: string) => {
      await persistRitualEntries(ritualEntries.filter((e) => e.id !== id));
    },
    [ritualEntries, persistRitualEntries],
  );

  const recordAnkerSession = useCallback(async () => {
    const next = ankerSessionCount + 1;
    setAnkerSessionCount(next);
    await writeJSON(STORAGE_KEYS.ankerSessionCount, next);
  }, [ankerSessionCount]);

  const value = useMemo<DataContextValue>(() => {
    const sortedEntries = [...ritualEntries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    return {
      loading,
      ritualEntries: sortedEntries,
      todayEntry: ritualEntries.find((e) => e.date === todayKey()),
      streak: currentStreak(ritualEntries),
      reguliertPercent: reguliertPct(ritualEntries),
      weekStrip: buildWeekStrip(ritualEntries),
      calendarForOffset: (monthOffset: number) => buildCalendar(ritualEntries, monthOffset),
      completeRitual,
      updateRitualEntry,
      deleteRitualEntry,
      ankerSessionCount,
      recordAnkerSession,
      pulseEntries,
      pulseChart: buildPulseChart(pulseEntries),
    };
  }, [
    loading,
    ritualEntries,
    completeRitual,
    updateRitualEntry,
    deleteRitualEntry,
    ankerSessionCount,
    recordAnkerSession,
    pulseEntries,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
