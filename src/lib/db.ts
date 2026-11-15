import { EMPTY_SETTINGS, type HealthEvent, type JournalData, type Meal, type Settings, type SignalDay, type SymptomEntry } from "@/lib/types";

const DB_NAME = "harbor";
const DB_VERSION = 1;
const SETTING_KEY = "root";
type StoreName = "meals" | "symptoms" | "signals" | "events";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of ["meals", "symptoms", "signals", "events"] as const) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the journal."));
  });
}

async function openWithRetry(): Promise<IDBDatabase> {
  try {
    return await openDb();
  } catch {
    return openDb();
  }
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("The journal save was aborted."));
  });
}

function getAll<T>(db: IDBDatabase, store: StoreName): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, "readonly").objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function loadHarbor(): Promise<{
  settings: Settings;
  meals: Meal[];
  symptoms: SymptomEntry[];
  signals: SignalDay[];
  events: HealthEvent[];
}> {
  const db = await openWithRetry();
  try {
    const [settings, meals, symptoms, signals, events] = await Promise.all([
      new Promise<Settings>((resolve, reject) => {
        const request = db.transaction("settings", "readonly").objectStore("settings").get(SETTING_KEY);
        request.onsuccess = () => resolve({ ...EMPTY_SETTINGS, ...(request.result as Settings | undefined) });
        request.onerror = () => reject(request.error);
      }),
      getAll<Meal>(db, "meals"),
      getAll<SymptomEntry>(db, "symptoms"),
      getAll<SignalDay>(db, "signals"),
      getAll<HealthEvent>(db, "events"),
    ]);
    return { settings, meals, symptoms, signals, events };
  } finally {
    db.close();
  }
}

async function writeStore<T>(store: StoreName, value: T): Promise<void> {
  const db = await openWithRetry();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(value);
  await txDone(tx);
  db.close();
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await openWithRetry();
  const tx = db.transaction("settings", "readwrite");
  tx.objectStore("settings").put(settings, SETTING_KEY);
  await txDone(tx);
  db.close();
}

export async function putMeal(meal: Meal): Promise<void> {
  await writeStore("meals", meal);
}

export async function putSymptom(entry: SymptomEntry): Promise<void> {
  await writeStore("symptoms", entry);
}

export async function putEvent(event: HealthEvent): Promise<void> {
  await writeStore("events", event);
}

export async function replaceJournal(settings: Settings, data: JournalData, events: HealthEvent[]): Promise<void> {
  const db = await openWithRetry();
  const tx = db.transaction(["settings", "meals", "symptoms", "signals", "events"], "readwrite");
  tx.objectStore("settings").put(settings, SETTING_KEY);
  for (const name of ["meals", "symptoms", "signals", "events"] as const) tx.objectStore(name).clear();
  for (const meal of data.meals) tx.objectStore("meals").put(meal);
  for (const entry of data.symptoms) tx.objectStore("symptoms").put(entry);
  for (const signal of data.signals) tx.objectStore("signals").put(signal);
  for (const event of events) tx.objectStore("events").put(event);
  await txDone(tx);
  db.close();
}

export async function clearJournal(settings: Settings): Promise<void> {
  await replaceJournal(settings, { meals: [], symptoms: [], signals: [] }, []);
}

export function journalForExport(data: JournalData) {
  return {
    meals: data.meals.map((meal) => ({ ...meal, imageDataUrl: undefined })),
    symptoms: data.symptoms,
    signals: data.signals,
    photosOmitted: true,
  };
}

export async function checkDatabase(): Promise<{ ok: boolean; message: string; counts: Record<StoreName, number> }> {
  const db = await openWithRetry();
  try {
    return {
      ok: true,
      message: "The journal on this device opened.",
      counts: {
        meals: (await getAll(db, "meals")).length,
        symptoms: (await getAll(db, "symptoms")).length,
        signals: (await getAll(db, "signals")).length,
        events: (await getAll(db, "events")).length,
      },
    };
  } finally {
    db.close();
  }
}

export async function repairDatabase(): Promise<{ restored: boolean; message: string }> {
  let snapshot: Awaited<ReturnType<typeof loadHarbor>> | null = null;
  try {
    snapshot = await loadHarbor();
  } catch {
    snapshot = null;
  }
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
  if (!snapshot) {
    await openWithRetry();
    return { restored: false, message: "The journal file was rebuilt empty because the old one could not be read." };
  }
  await replaceJournal(snapshot.settings, snapshot, snapshot.events);
  return { restored: true, message: "The journal was rebuilt and your saved entries were put back." };
}
