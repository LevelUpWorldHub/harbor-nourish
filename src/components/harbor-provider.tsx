"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { buildAveryJournal, demoSettings } from "@/lib/demo-persona";
import { checkDatabase, clearJournal, loadHarbor, putEvent, putMeal, putSymptom, repairDatabase, replaceJournal, saveSettings } from "@/lib/db";
import { EMPTY_SETTINGS, type HealthEvent, type Meal, type Settings, type SignalDay, type SymptomEntry } from "@/lib/types";

type HarborValue = {
  ready: boolean;
  error: string | null;
  settings: Settings;
  meals: Meal[];
  symptoms: SymptomEntry[];
  signals: SignalDay[];
  events: HealthEvent[];
  nowIso: string;
  updateSettings: (next: Settings) => Promise<void>;
  startEmpty: () => Promise<void>;
  loadDemo: () => Promise<void>;
  addMeal: (meal: Meal) => Promise<void>;
  addSymptom: (entry: SymptomEntry) => Promise<void>;
  logEvent: (level: HealthEvent["level"], message: string) => Promise<void>;
  eraseJournal: () => Promise<void>;
  runDatabaseCheck: () => ReturnType<typeof checkDatabase>;
  repair: () => Promise<string>;
};

const HarborContext = createContext<HarborValue | null>(null);

function sortByTime<T extends { at: string }>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => b.at.localeCompare(a.at));
}

export function HarborProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [signals, setSignals] = useState<SignalDay[]>([]);
  const [events, setEvents] = useState<HealthEvent[]>([]);

  const apply = useCallback((loaded: Awaited<ReturnType<typeof loadHarbor>>) => {
    setSettings(loaded.settings);
    setMeals(sortByTime(loaded.meals));
    setSymptoms(sortByTime(loaded.symptoms));
    setSignals(loaded.signals.slice().sort((a, b) => b.date.localeCompare(a.date)));
    setEvents(sortByTime(loaded.events).slice(0, 40));
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadHarbor()
      .then((loaded) => {
        if (!cancelled) {
          apply(loaded);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Harbor could not open the journal on this device. You can try a repair from Status after retrying.");
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  useEffect(() => {
    document.documentElement.classList.toggle("fatigue", settings.fatigueMode);
    document.documentElement.classList.toggle("contrast", settings.strongContrast);
  }, [settings.fatigueMode, settings.strongContrast]);

  const nowIso = settings.demoClock ?? new Date().toISOString().slice(0, 19);
  const updateSettings = useCallback(async (next: Settings) => {
    setSettings(next);
    await saveSettings(next);
  }, []);
  const logEvent = useCallback(async (level: HealthEvent["level"], message: string) => {
    const event: HealthEvent = {
      id: `event-${crypto.randomUUID()}`,
      at: settings.demoClock ?? new Date().toISOString().slice(0, 19),
      level,
      message,
    };
    setEvents((current) => [event, ...current].slice(0, 40));
    await putEvent(event);
  }, [settings.demoClock]);

  const value = useMemo<HarborValue>(() => ({
    ready,
    error,
    settings,
    meals,
    symptoms,
    signals,
    events,
    nowIso,
    updateSettings,
    logEvent,
    async startEmpty() {
      const next = { ...EMPTY_SETTINGS, onboardingDone: true };
      await clearJournal(next);
      apply(await loadHarbor());
    },
    async loadDemo() {
      const next = demoSettings();
      await replaceJournal(next, buildAveryJournal(), [
        { id: "event-demo-load", at: next.demoClock ?? nowIso, level: "info", message: "Loaded the synthetic demo journal. It is not a real person." },
      ]);
      apply(await loadHarbor());
    },
    async addMeal(meal) {
      await putMeal(meal);
      setMeals((current) => sortByTime([meal, ...current.filter((item) => item.id !== meal.id)]));
    },
    async addSymptom(entry) {
      await putSymptom(entry);
      setSymptoms((current) => sortByTime([entry, ...current.filter((item) => item.id !== entry.id)]));
    },
    async eraseJournal() {
      const next = { ...EMPTY_SETTINGS, onboardingDone: true };
      await clearJournal(next);
      apply(await loadHarbor());
    },
    runDatabaseCheck: checkDatabase,
    async repair() {
      const result = await repairDatabase();
      apply(await loadHarbor());
      return result.message;
    },
  }), [apply, error, events, logEvent, meals, nowIso, ready, settings, signals, symptoms, updateSettings]);

  return <HarborContext.Provider value={value}>{children}</HarborContext.Provider>;
}

export function useHarbor() {
  const value = useContext(HarborContext);
  if (!value) throw new Error("useHarbor must be used inside HarborProvider");
  return value;
}
