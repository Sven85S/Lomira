import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { HrvMeasurement, PracticeSession, PulseEntry, RitualEntry, RitualState } from '../types';
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage';
import { dateKeyMinusDays, todayKey } from '../lib/date';
import { writeWidgetState } from '../native/sharedState';
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
      // Fire-and-forget, same as the Apple Health/RevenueCat sync calls — a
      // failed widget update must never affect the ritual entry itself.
      // .catch() logs rather than swallowing: a bare `void` here would make
      // any native failure completely silent, with nothing to diagnose why
      // a widget went stale — see the same note on recordHrvMeasurement below.
      writeWidgetState({ streak: currentStreak(next), practicedToday: true }).catch((e) => {
        console.error('[DataContext] writeWidgetState (completeRitual) failed', e);
      });
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

      // Widget's "HRV heute früh · +3 zur Woche" needs a comparison value —
      // this measurement's rmssd against the mean of the other rmssd-bearing
      // measurements from the last 7 days (today excluded, since it's the
      // thing being compared). No rmssd on this measurement, or no other
      // measurement to compare against, and the widget just shows the value
      // alone (see the SwiftUI view's own null-handling).
      if (rmssd != null) {
        const sevenDaysAgo = dateKeyMinusDays(todayKey(), 6);
        const priorValues = next.slice(1).filter((m) => m.rmssd != null && m.date >= sevenDaysAgo).map((m) => m.rmssd as number);
        const hrvWeekDeltaMs = priorValues.length > 0 ? rmssd - priorValues.reduce((a, b) => a + b, 0) / priorValues.length : null;
        // Diagnostic only — logs the actual native/bridge failure instead of
        // silently swallowing it, so a real device test with Safari Web
        // Inspector attached can show why the widget isn't picking this up
        // (see the on-device report this responds to: fields/values all
        // check out in code, so this is the one remaining unknown).
        console.log('[DataContext] recordHrvMeasurement: calling writeWidgetState', { hrvValue: rmssd, hrvWeekDeltaMs });
        writeWidgetState({ hrvValue: rmssd, hrvWeekDeltaMs }).catch((e) => {
          console.error('[DataContext] writeWidgetState (recordHrvMeasurement) failed', e);
        });
      } else {
        // The one guard in this function that can skip the widget write
        // entirely: HrvFlow's own RMSSD reliability gate (session RR count/
        // quality) already decided rmssd is undefined before this even runs.
        // A quality: "good" measurement can still land here if too few clean
        // RR intervals survived outlier filtering.
        console.log('[DataContext] recordHrvMeasurement: skipping widget HRV write, rmssd is null/undefined', { bpm, quality, rmssdEstimated });
      }
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
