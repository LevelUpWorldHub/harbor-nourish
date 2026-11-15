import { addDaysKey } from "@/lib/dates";
import type { JournalData, Meal, Settings, SignalDay, SymptomEntry } from "@/lib/types";

export const DEMO_START = "2026-10-01";
export const DEMO_NOW = "2026-10-24T15:00:00";

export const AVERY = {
  label: "Synthetic demo persona",
  name: "Avery Chen",
  summary: "Not a real person. This journal was invented so reviewers can see a full month without anyone’s health data.",
  tracks:
    "Avery’s check-ins use pain, stiffness, fatigue, brain fog, stomach upset, and stress. Condition labels Avery chose to track: rheumatoid arthritis and autoimmune thyroid disease. Harbor did not assign them.",
};

const FLARE_DAYS = new Set(["2026-10-08", "2026-10-16"]);
const SHORT_DAYS = new Set(["2026-10-07", "2026-10-08", "2026-10-15", "2026-10-16", "2026-10-22", "2026-10-23", "2026-10-24"]);

function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDaysKey(cursor, 1);
  }
  return days;
}

function dayBeforeFlare(day: string): boolean {
  return FLARE_DAYS.has(addDaysKey(day, 1));
}

function signatureMeal(day: string, slot: "lunch" | "dinner"): boolean {
  if (FLARE_DAYS.has(day)) return slot === "lunch";
  if (dayBeforeFlare(day)) return true;
  if (day === "2026-10-22" || day === "2026-10-23") return true;
  if (day === "2026-10-24") return slot === "lunch";
  if (day === "2026-10-03" && slot === "dinner") return true;
  if (day === "2026-10-11" && slot === "lunch") return true;
  return false;
}

function quietMeal(day: string): { name: string; ingredients: string[]; tags: string[] } {
  const index = Number(day.slice(-2)) % 3;
  if (index === 1) return { name: "Oats, blueberries, and walnuts", ingredients: ["oats", "blueberries", "walnuts"], tags: ["high-fiber", "omega-3"] };
  if (index === 2) {
    return {
      name: "Grilled salmon, brown rice, and broccoli",
      ingredients: ["salmon", "brown rice", "broccoli", "olive oil"],
      tags: ["omega-3", "high-fiber"],
    };
  }
  return {
    name: "Black beans, brown rice, salsa, and lettuce",
    ingredients: ["black beans", "brown rice", "salsa", "lettuce"],
    tags: ["high-fiber", "nightshade vegetables", "leafy-greens"],
  };
}

const PACKAGED = {
  name: "Boxed macaroni and salted crackers",
  ingredients: ["boxed macaroni", "salted crackers", "processed cheese"],
  tags: ["ultra-processed", "high-sodium", "gluten-containing grains"],
};
const NOISE = {
  name: "Instant ramen and salted crackers",
  ingredients: ["instant ramen", "salted crackers"],
  tags: ["ultra-processed", "high-sodium", "gluten-containing grains"],
};

export function buildAveryJournal(): JournalData {
  const meals: Meal[] = [];
  const symptoms: SymptomEntry[] = [];
  const signals: SignalDay[] = [];
  const today = DEMO_NOW.slice(0, 10);

  for (const day of eachDay(DEMO_START, today)) {
    const slots: Array<"lunch" | "dinner"> = day === today ? ["lunch"] : ["lunch", "dinner"];
    for (const slot of slots) {
      const noisy = (day === "2026-10-03" && slot === "dinner") || (day === "2026-10-11" && slot === "lunch");
      const food = signatureMeal(day, slot) ? (noisy ? NOISE : PACKAGED) : quietMeal(day);
      meals.push({
        id: `meal-${day}-${slot}`,
        at: `${day}T${slot === "lunch" ? "12:30:00" : "18:30:00"}`,
        name: food.name,
        ingredients: food.ingredients,
        tags: food.tags,
        source: "manual",
        confirmed: true,
        note: "Synthetic demo meal.",
      });
    }
    const flareDay = FLARE_DAYS.has(day);
    symptoms.push({
      id: `checkin-${day}`,
      at: `${day}T09:00:00`,
      pain: flareDay ? 6 : 2,
      stiffness: flareDay ? 6 : 2,
      fatigue: flareDay ? 7 : 3,
      brainFog: flareDay ? 5 : 2,
      stomach: 2,
      stress: flareDay || day === "2026-10-24" ? 8 : dayBeforeFlare(day) ? 5 : 2,
      flare: false,
      note: "Synthetic demo check-in.",
    });
    if (flareDay) {
      symptoms.push({
        id: `flare-${day}`,
        at: `${day}T18:00:00`,
        pain: 8,
        stiffness: 8,
        fatigue: 8,
        brainFog: 6,
        stomach: 3,
        stress: 7,
        flare: true,
        note: "Evening worsening Avery chose to mark as a flare. Synthetic demo entry.",
      });
    }
    const short = SHORT_DAYS.has(day);
    signals.push({
      id: `signal-${day}`,
      date: day,
      sleepHours: short ? 5 : 7.6,
      steps: short ? 2800 : 7400,
      restingHr: short ? 76 : 62,
      source: "simulated",
    });
  }
  return { meals, symptoms, signals };
}

export function demoSettings(): Settings {
  return {
    onboardingDone: true,
    consentToAi: false,
    fatigueMode: false,
    strongContrast: false,
    demoLoaded: true,
    demoClock: DEMO_NOW,
  };
}
