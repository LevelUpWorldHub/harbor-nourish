export type TagId =
  | "ultra-processed"
  | "high-sodium"
  | "added-sugar"
  | "alcohol"
  | "caffeine"
  | "dairy"
  | "gluten-containing grains"
  | "nightshade vegetables"
  | "high-fiber"
  | "omega-3"
  | "fermented"
  | "leafy-greens"
  | "fried"
  | "spicy";

export type MealSource = "grok" | "on-device" | "manual";

export type Meal = {
  id: string;
  at: string;
  name: string;
  ingredients: string[];
  tags: string[];
  source: MealSource;
  confirmed: boolean;
  note?: string;
  hasPhoto?: boolean;
  imageDataUrl?: string;
};

export type SymptomEntry = {
  id: string;
  at: string;
  pain: number;
  stiffness: number;
  fatigue: number;
  brainFog: number;
  stomach: number;
  stress: number;
  flare: boolean;
  note?: string;
};

export type SignalDay = {
  id: string;
  date: string;
  sleepHours: number;
  steps: number;
  restingHr: number;
  source: "simulated";
};

export type HealthEvent = {
  id: string;
  at: string;
  level: "info" | "warn" | "error";
  message: string;
};

export type Settings = {
  onboardingDone: boolean;
  consentToAi: boolean;
  fatigueMode: boolean;
  strongContrast: boolean;
  demoLoaded: boolean;
  demoClock: string | null;
};

export type JournalData = {
  meals: Meal[];
  symptoms: SymptomEntry[];
  signals: SignalDay[];
};

export type Citation = {
  logId: string;
  logType: "meal" | "symptom" | "signal";
  label: string;
};

export type PatternKind = "food-tag" | "sleep" | "stress" | "steps" | "resting-hr";

export type PatternFinding = {
  id: string;
  kind: PatternKind;
  title: string;
  explanation: string;
  howCounted: string;
  strength: "early" | "repeating";
  citations: Citation[];
  clinicianLine: string;
};

export type ActiveNotice = {
  id: string;
  title: string;
  message: string;
  why: string;
  citations: Citation[];
  clinicianLine: string;
};

export type MealSuggestion = {
  status: "needs_consent" | "ready" | "needs_description";
  source: "grok" | "on-device" | "none";
  mealName: string;
  ingredients: string[];
  tags: string[];
  uncertainty: string;
  note: string;
  attempts: number;
  warnings: string[];
};

export const EMPTY_SETTINGS: Settings = {
  onboardingDone: false,
  consentToAi: false,
  fatigueMode: false,
  strongContrast: false,
  demoLoaded: false,
  demoClock: null,
};
