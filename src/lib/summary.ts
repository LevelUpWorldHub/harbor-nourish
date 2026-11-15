import { formatDay, formatHours, formatWhen } from "@/lib/dates";
import { findPatterns } from "@/lib/pattern-engine";
import { CLINICIAN_LINE } from "@/lib/safety";
import { tagPlain } from "@/lib/tags";
import type { JournalData, PatternFinding } from "@/lib/types";

export type SummaryModel = {
  title: string;
  rangeLabel: string;
  mealCount: number;
  checkInCount: number;
  flareCount: number;
  meals: { when: string; name: string; tags: string; source: string }[];
  checkIns: { when: string; line: string; note: string }[];
  flares: { when: string; note: string }[];
  signals: { when: string; line: string }[];
  patterns: PatternFinding[];
  patternNote: string;
  safety: string;
  aiNote: string;
  signalNote: string;
};

export function buildSummary(data: JournalData, start: string, end: string): SummaryModel {
  const meals = data.meals
    .filter((meal) => meal.confirmed && meal.at.slice(0, 10) >= start && meal.at.slice(0, 10) <= end)
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));
  const symptoms = data.symptoms
    .filter((entry) => entry.at.slice(0, 10) >= start && entry.at.slice(0, 10) <= end)
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));
  const signals = data.signals.filter((signal) => signal.date >= start && signal.date <= end).slice().sort((a, b) => a.date.localeCompare(b.date));
  const patterns = findPatterns({ meals, symptoms, signals });
  const flares = symptoms.filter((entry) => entry.flare);
  return {
    title: "Harbor visit summary",
    rangeLabel: `${formatDay(start)} – ${formatDay(end)}`,
    mealCount: meals.length,
    checkInCount: symptoms.filter((entry) => !entry.flare).length,
    flareCount: flares.length,
    meals: meals.map((meal) => ({
      when: formatWhen(meal.at),
      name: meal.name,
      tags: meal.tags.map(tagPlain).join(", ") || "No tags",
      source:
        meal.source === "grok"
          ? "Grok suggestion, confirmed by the user"
          : meal.source === "on-device"
            ? "On-device match, confirmed by the user"
            : "Entered by the user",
    })),
    checkIns: symptoms
      .filter((entry) => !entry.flare)
      .map((entry) => ({
        when: formatWhen(entry.at),
        line: `Pain ${entry.pain}/10 · Stiffness ${entry.stiffness}/10 · Fatigue ${entry.fatigue}/10 · Brain fog ${entry.brainFog}/10 · Stomach upset ${entry.stomach}/10 · Stress ${entry.stress}/10`,
        note: entry.note ?? "",
      })),
    flares: flares.map((entry) => ({ when: formatWhen(entry.at), note: entry.note || "The user marked this as a flare." })),
    signals: signals.map((signal) => ({
      when: formatDay(signal.date),
      line: `Sleep ${formatHours(signal.sleepHours)} h · Steps ${signal.steps.toLocaleString("en-US")} · Resting heart rate ${signal.restingHr}`,
    })),
    patterns,
    patternNote:
      patterns.length === 0
        ? "Harbor did not describe a pattern in this date range. It waits for at least two flares you marked, plus enough meals around them. Guessing earlier would not be fair."
        : "Patterns below describe this journal only. They are not a cause and they are not a forecast.",
    safety: CLINICIAN_LINE,
    aiNote:
      "If a meal says it was a Grok suggestion, the person confirmed it before it was saved. Harbor sends a meal photo only after consent, without a name, symptoms, or condition. Search tools are not used.",
    signalNote:
      "Sleep, steps, and resting heart rate in this prototype come from a simulated feed unless a future version connects a real device. They are labeled simulated here.",
  };
}

export function summaryToHtml(model: SummaryModel): string {
  const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const items = (rows: string[]) => rows.map((row) => `<li>${row}</li>`).join("");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>${escape(model.title)}</title>
<style>body{font-family:"Segoe UI",sans-serif;color:#1c1915;line-height:1.45;margin:2rem}h1{font-size:1.6rem}h2{font-size:1.15rem;margin-top:1.6rem}.note{background:#f6f1e7;padding:.8rem 1rem}</style>
</head><body>
<h1>${escape(model.title)}</h1><p>${escape(model.rangeLabel)}</p>
<p class="note">${escape(model.safety)}</p>
<p>${model.mealCount} meals · ${model.checkInCount} check-ins · ${model.flareCount} flare marks</p>
<h2>Flare marks</h2><ul>${items(model.flares.map((flare) => `${escape(flare.when)} — ${escape(flare.note)}`)) || "<li>None in this range.</li>"}</ul>
<h2>Patterns in this journal</h2><p>${escape(model.patternNote)}</p>
${model.patterns
  .map(
    (pattern) =>
      `<h3>${escape(pattern.title)}</h3><p>${escape(pattern.explanation)}</p><p>${escape(pattern.howCounted)}</p><ul>${items(pattern.citations.map((citation) => escape(citation.label)))}</ul><p>${escape(pattern.clinicianLine)}</p>`,
  )
  .join("")}
<h2>Meals</h2><ul>${items(model.meals.map((meal) => `${escape(meal.when)} — ${escape(meal.name)} (${escape(meal.tags)}; ${escape(meal.source)})`))}</ul>
<h2>Check-ins</h2><ul>${items(model.checkIns.map((entry) => `${escape(entry.when)} — ${escape(entry.line)}`))}</ul>
<h2>Signals</h2><p>${escape(model.signalNote)}</p><ul>${items(model.signals.map((signal) => `${escape(signal.when)} — ${escape(signal.line)}`))}</ul>
<h2>About suggestions</h2><p>${escape(model.aiNote)}</p>
</body></html>`;
}
