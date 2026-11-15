import { addDaysKey, dayKey, formatDay, formatHours, formatWhen, hoursBetween } from "@/lib/dates";
import { CLINICIAN_LINE, reviewCopy } from "@/lib/safety";
import { tagPlain } from "@/lib/tags";
import type { ActiveNotice, Citation, JournalData, Meal, PatternFinding, SignalDay, SymptomEntry } from "@/lib/types";

const MEAL_WINDOW_HOURS = 48;
const STRESS_WINDOW_HOURS = 24;
const MIN_FLARES = 2;
const MIN_PRE_MEALS = 4;
const MIN_TAGGED_PRE_MEALS = 3;
const MIN_PRE_RATE = 0.5;
const MIN_LIFT = 0.25;

function flaresOf(data: JournalData): SymptomEntry[] {
  return data.symptoms.filter((entry) => entry.flare).slice().sort((a, b) => a.at.localeCompare(b.at));
}

function inMealWindow(meal: Meal, flare: SymptomEntry): boolean {
  const hours = hoursBetween(meal.at, flare.at);
  return hours >= 0 && hours <= MEAL_WINDOW_HOURS;
}

function mealCitation(meal: Meal): Citation {
  return { logId: meal.id, logType: "meal", label: `Meal · ${formatWhen(meal.at)} · ${meal.name}` };
}

function flareCitation(entry: SymptomEntry): Citation {
  return { logId: entry.id, logType: "symptom", label: `Flare mark · ${formatWhen(entry.at)}` };
}

function signalCitation(signal: SignalDay, detail: string): Citation {
  return { logId: signal.id, logType: "signal", label: `Simulated signal · ${formatDay(signal.date)} · ${detail}` };
}

function strength(count: number): PatternFinding["strength"] {
  return count >= 3 ? "repeating" : "early";
}

function safeFinding(
  finding: Omit<PatternFinding, "explanation" | "howCounted" | "clinicianLine"> & { explanation: string; howCounted: string },
): PatternFinding {
  return {
    ...finding,
    explanation: reviewCopy(finding.explanation).text,
    howCounted: reviewCopy(finding.howCounted).text,
    clinicianLine: CLINICIAN_LINE,
  };
}

export function findPatterns(data: JournalData): PatternFinding[] {
  const flares = flaresOf(data);
  if (flares.length < MIN_FLARES) return [];
  const confirmed = data.meals.filter((meal) => meal.confirmed);
  const findings: PatternFinding[] = [];
  const preMeals = confirmed.filter((meal) => flares.some((flare) => inMealWindow(meal, flare)));
  const otherMeals = confirmed.filter((meal) => !preMeals.includes(meal));

  if (preMeals.length >= MIN_PRE_MEALS) {
    for (const tag of new Set(preMeals.flatMap((meal) => meal.tags))) {
      const tagged = preMeals.filter((meal) => meal.tags.includes(tag));
      const otherTagged = otherMeals.filter((meal) => meal.tags.includes(tag));
      const preRate = tagged.length / preMeals.length;
      const otherRate = otherMeals.length ? otherTagged.length / otherMeals.length : 0;
      const distinctFlares = flares.filter((flare) => tagged.some((meal) => inMealWindow(meal, flare)));
      if (
        tagged.length < MIN_TAGGED_PRE_MEALS ||
        distinctFlares.length < MIN_FLARES ||
        preRate < MIN_PRE_RATE ||
        preRate < otherRate + MIN_LIFT
      ) {
        continue;
      }
      const plain = tagPlain(tag);
      findings.push(
        safeFinding({
          id: `food:${tag}`,
          kind: "food-tag",
          title: `Meals tagged “${plain}” showed up before flares you marked`,
          strength: strength(distinctFlares.length),
          explanation: `In your logs, ${tagged.length} of ${preMeals.length} meals in the 48 hours before a flare carried the tag “${plain}”. On your other days, ${otherTagged.length} of ${otherMeals.length} meals had that tag. This is a pattern in your notes. It does not show that the food caused a flare.`,
          howCounted:
            "Counted confirmed meals in the 48 hours before each flare mark, then compared that share with meals outside those windows. At least two flares had to include the tag.",
          citations: [...tagged.slice(0, 4).map(mealCitation), ...distinctFlares.map(flareCitation)],
        }),
      );
    }
  }

  const flareDays = new Set(flares.flatMap((flare) => [addDaysKey(dayKey(flare.at), -1), dayKey(flare.at)]));
  const flareSignals = data.signals.filter((signal) => flareDays.has(signal.date));
  const otherSignals = data.signals.filter((signal) => !flareDays.has(signal.date));
  if (flareSignals.length >= MIN_FLARES && otherSignals.length >= 2) {
    const mean = (rows: SignalDay[], pick: (row: SignalDay) => number) =>
      rows.reduce((sum, row) => sum + pick(row), 0) / rows.length;
    const sleepFlare = mean(flareSignals, (row) => row.sleepHours);
    const sleepOther = mean(otherSignals, (row) => row.sleepHours);
    if (sleepFlare <= 6 && sleepOther - sleepFlare >= 1) {
      findings.push(
        safeFinding({
          id: "sleep",
          kind: "sleep",
          title: "Sleep was shorter around flares you marked",
          strength: strength(flares.length),
          explanation: `On the flare day and the day before, your recorded sleep averaged ${formatHours(sleepFlare)} hours. On your other days it averaged ${formatHours(sleepOther)} hours. Short sleep showed up alongside flares in your notes. That is not proof that sleep caused them.`,
          howCounted:
            "Compared simulated or recorded sleep on the flare date and the day before with every other day in this journal. The simulated feed is labeled and is not a medical device.",
          citations: [
            ...flareSignals.slice(0, 4).map((signal) => signalCitation(signal, `${formatHours(signal.sleepHours)} hours of sleep`)),
            ...flares.map(flareCitation),
          ],
        }),
      );
    }
    const stepsFlare = mean(flareSignals, (row) => row.steps);
    const stepsOther = mean(otherSignals, (row) => row.steps);
    if (stepsFlare <= 4000 && stepsOther - stepsFlare >= 2000) {
      findings.push(
        safeFinding({
          id: "steps",
          kind: "steps",
          title: "Step counts were lower around flares you marked",
          strength: strength(flares.length),
          explanation: `Steps averaged ${Math.round(stepsFlare).toLocaleString("en-US")} on flare days and the day before, and ${Math.round(stepsOther).toLocaleString("en-US")} on other days. Fewer steps can also happen because you already felt worse. This is a pattern, not a cause.`,
          howCounted:
            "Compared step totals on the flare date and the day before with other days. In this prototype those totals come from the labeled simulated feed.",
          citations: [
            ...flareSignals.slice(0, 4).map((signal) => signalCitation(signal, `${signal.steps.toLocaleString("en-US")} steps`)),
            ...flares.map(flareCitation),
          ],
        }),
      );
    }
    const hrFlare = mean(flareSignals, (row) => row.restingHr);
    const hrOther = mean(otherSignals, (row) => row.restingHr);
    if (hrFlare - hrOther >= 8) {
      findings.push(
        safeFinding({
          id: "resting-hr",
          kind: "resting-hr",
          title: "Resting heart rate was higher around flares you marked",
          strength: strength(flares.length),
          explanation: `Resting heart rate averaged ${Math.round(hrFlare)} beats per minute around flares you marked, and ${Math.round(hrOther)} on other days. A higher number in your log is something you can show your clinician. Harbor does not read it as an illness.`,
          howCounted:
            "Compared resting heart rate on the flare date and the day before with other days. These values are from the labeled simulated feed in this prototype.",
          citations: [
            ...flareSignals.slice(0, 4).map((signal) => signalCitation(signal, `${signal.restingHr} beats per minute`)),
            ...flares.map(flareCitation),
          ],
        }),
      );
    }
  }

  const highStressBefore = flares.filter((flare) =>
    data.symptoms.some((entry) => {
      if (entry.id === flare.id || entry.flare) return false;
      const hours = hoursBetween(entry.at, flare.at);
      return hours > 0 && hours <= STRESS_WINDOW_HOURS && entry.stress >= 7;
    }),
  );
  const outside = data.symptoms.filter((entry) => {
    if (entry.flare) return false;
    return !flares.some((flare) => {
      const hours = hoursBetween(entry.at, flare.at);
      return hours > 0 && hours <= STRESS_WINDOW_HOURS;
    });
  });
  const outsideHigh = outside.filter((entry) => entry.stress >= 7);
  const outsideRate = outside.length ? outsideHigh.length / outside.length : 0;
  if (highStressBefore.length >= MIN_FLARES && highStressBefore.length / flares.length >= outsideRate + MIN_LIFT) {
    findings.push(
      safeFinding({
        id: "stress",
        kind: "stress",
        title: "Higher stress marks showed up the day before flares",
        strength: strength(highStressBefore.length),
        explanation: `${highStressBefore.length} of ${flares.length} flares had a stress mark of 7 or more in the 24 hours before the flare mark. Outside those windows, ${outsideHigh.length} of ${outside.length} check-ins were that high. Stress in your notes can sit next to a flare without being the reason for it.`,
        howCounted: "Looked at check-ins in the 24 hours before each flare mark, not counting the flare mark itself.",
        citations: [
          ...data.symptoms
            .filter((entry) =>
              highStressBefore.some((flare) => {
                const hours = hoursBetween(entry.at, flare.at);
                return hours > 0 && hours <= STRESS_WINDOW_HOURS && entry.stress >= 7;
              }),
            )
            .slice(0, 4)
            .map((entry) => ({
              logId: entry.id,
              logType: "symptom" as const,
              label: `Check-in · ${formatWhen(entry.at)} · stress ${entry.stress} of 10`,
            })),
          ...highStressBefore.map(flareCitation),
        ],
      }),
    );
  }

  return findings;
}

export function activeNotices(data: JournalData, now: string): ActiveNotice[] {
  const findings = findPatterns(data);
  const recentFlare = data.symptoms.some(
    (entry) => entry.flare && hoursBetween(entry.at, now) >= 0 && hoursBetween(entry.at, now) <= 18,
  );
  if (recentFlare || findings.length === 0) return [];

  const parts: string[] = [];
  const citations: Citation[] = [];
  const today = dayKey(now);
  const lastNight =
    data.signals.find((signal) => signal.date === today) ?? data.signals.find((signal) => signal.date === addDaysKey(today, -1));
  const sleepFinding = findings.find((finding) => finding.kind === "sleep");
  if (sleepFinding && lastNight && lastNight.sleepHours <= 6) {
    parts.push(
      `Last night’s sleep was ${formatHours(lastNight.sleepHours)} hours. In your logs, sleep was shorter around flares than on your other days.`,
    );
    citations.push(signalCitation(lastNight, `${formatHours(lastNight.sleepHours)} hours of sleep`), ...sleepFinding.citations.slice(0, 2));
  }

  const recentMeals = data.meals.filter(
    (meal) => meal.confirmed && hoursBetween(meal.at, now) >= 0 && hoursBetween(meal.at, now) <= MEAL_WINDOW_HOURS,
  );
  const foodFinding = findings.find(
    (finding) => finding.kind === "food-tag" && recentMeals.some((meal) => meal.tags.includes(finding.id.slice("food:".length))),
  );
  if (foodFinding) {
    const tag = foodFinding.id.slice("food:".length);
    const meal = recentMeals.find((item) => item.tags.includes(tag));
    parts.push(
      `A recent meal was tagged ${tagPlain(tag)}. That tag has shown up more often in the 48 hours before flares you marked than on other days.`,
    );
    if (meal) citations.push(mealCitation(meal));
    citations.push(...foodFinding.citations.slice(0, 2));
  }

  const stressFinding = findings.find((finding) => finding.kind === "stress");
  const recentStress = data.symptoms
    .filter((entry) => !entry.flare && hoursBetween(entry.at, now) >= 0 && hoursBetween(entry.at, now) <= STRESS_WINDOW_HOURS)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  if (stressFinding && recentStress && recentStress.stress >= 7) {
    parts.push(
      `Your latest stress mark was ${recentStress.stress} out of 10. Higher stress marks showed up in the day before flares you marked.`,
    );
    citations.push({
      logId: recentStress.id,
      logType: "symptom",
      label: `Check-in · ${formatWhen(recentStress.at)} · stress ${recentStress.stress} of 10`,
    });
  }

  if (!parts.length) return [];
  const seen = new Set<string>();
  return [
    {
      id: "check-in",
      title: "A gentle check-in",
      message: reviewCopy(
        "The last day or two looks similar to days you later marked as flares. This is a reminder to notice how you feel. It is not a prediction.",
      ).text,
      why: reviewCopy(parts.join(" ")).text,
      citations: citations
        .filter((citation) => {
          const key = `${citation.logType}:${citation.logId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 6),
      clinicianLine: CLINICIAN_LINE,
    },
  ];
}
