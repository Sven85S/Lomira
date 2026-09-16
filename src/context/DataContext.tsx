import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { HrvMeasurement, PracticeSession, PulseEntry, RitualEntry, RitualState } from '../types';
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
import { buildWeeklyMinutesChart, type WeeklyMinutesBar } from '../store/practiceSelectors';

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
  recordAnkerSession: (durationMs: number) => Promise<void>;

  pulseEntries: PulseEntry[];
  pulseChart: PulseChart | null;

  hrvMeasurements: HrvMeasurement[];
  recordHrvMeasurement: (bpm: number, quality: HrvMeasurement['quality'], rmssd?: number, rmssdEstimated?: boolean) => Promise<void>;

  practiceSessions: PracticeSession[];
  weeklyMinutesChart: WeeklyMinutesBar[];
  recordExerciseSession: (durationSeconds: number) => Promise<void>;
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
  const [hrvMeasurements, setHrvMeasurements] = useState<HrvMeasurement[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    (async () => {
      const [entries, ankerCount, pulses, hrvs, sessions] = await Promise.all([
        readJSON<RitualEntry[]>(STORAGE_KEYS.ritualEntries, []),
        readJSON<number>(STORAGE_KEYS.ankerSessionCount, 0),
        readJSON<PulseEntry[]>(STORAGE_KEYS.pulseEntries, []),
        readJSON<HrvMeasurement[]>(STORAGE_KEYS.hrvMeasurements, []),
        readJSON<PracticeSession[]>(STORAGE_KEYS.practiceSessions, []),
      ]);
      setRitualEntries(entries);
      setAnkerSessionCount(ankerCount);
      setPulseEntries(pulses);
      setHrvMeasurements(hrvs);
      setPracticeSessions(sessions);
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

  const persistPracticeSessions = useCallback(async (next: PracticeSession[]) => {
    setPracticeSessions(next);
    await writeJSON(STORAGE_KEYS.practiceSessions, next);
  }, []);

  const recordAnkerSession = useCallback(
    async (durationMs: number) => {
      const nextCount = ankerSessionCount + 1;
      setAnkerSessionCount(nextCount);
      await writeJSON(STORAGE_KEYS.ankerSessionCount, nextCount);

      // A session under 30s rounds to 0 minutes — not worth a record, since
      // it wouldn't move the weekly-minutes sum anyway.
      const minutes = Math.round(durationMs / 60000);
      if (minutes > 0) {
        await persistPracticeSessions([{ id: uid(), date: todayKey(), createdAt: Date.now(), minutes, source: 'anker' }, ...practiceSessions]);
      }
    },
    [ankerSessionCount, practiceSessions, persistPracticeSessions],
  );

  const recordExerciseSession = useCallback(
    async (durationSeconds: number) => {
      const minutes = Math.round(durationSeconds / 60);
      if (minutes <= 0) return;
      await persistPracticeSessions([{ id: uid(), date: todayKey(), createdAt: Date.now(), minutes, source: 'beruehren' }, ...practiceSessions]);
    },
    [practiceSessions, persistPracticeSessions],
  );

  const recordHrvMeasurement = useCallback(
    async (bpm: number, quality: HrvMeasurement['quality'], rmssd?: number, rmssdEstimated?: boolean) => {
      const next = [{ id: uid(), date: todayKey(), createdAt: Date.now(), bpm, quality, rmssd, rmssdEstimated }, ...hrvMeasurements];
      setHrvMeasurements(next);
      await writeJSON(STORAGE_KEYS.hrvMeasurements, next);
    },
    [hrvMeasurements],
  );

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
      hrvMeasurements,
      recordHrvMeasurement,
      practiceSessions,
      weeklyMinutesChart: buildWeeklyMinutesChart(practiceSessions),
      recordExerciseSession,
    };
  }, [
    loading,
    ritualEntries,
    completeRitual,
    updateRitualEntry,
    deleteRitualEntry,
    ankerSessionCount,
    recordAnkerSession,
    practiceSessions,
    recordExerciseSession,
    pulseEntries,
    hrvMeasurements,
    recordHrvMeasurement,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
