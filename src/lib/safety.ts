export const CLINICIAN_LINE =
  "This is not a diagnosis or a treatment plan. Discuss what you notice with your clinician.";

const BANNED: { id: string; pattern: RegExp }[] = [
  { id: "diagnosis", pattern: /\bdiagnos(?:is|e|ed|es|ing)\b/i },
  { id: "you-have", pattern: /\byou have\b/i },
  { id: "cure", pattern: /\bcure[sd]?\b/i },
  { id: "prescribe", pattern: /\bprescri(?:be|bed|ption)\b/i },
  { id: "treatment", pattern: /\btreat(?:ment|ing|ed|s)?\b/i },
  { id: "medication", pattern: /\bmedications?\b/i },
  { id: "dose", pattern: /\bdose[sd]?\b/i },
  { id: "milligram", pattern: /\bmg\b/i },
  { id: "you-should", pattern: /\byou should\b/i },
  { id: "you-must", pattern: /\byou must\b/i },
  { id: "stop-taking", pattern: /\bstop taking\b/i },
  { id: "start-taking", pattern: /\bstart taking\b/i },
  { id: "will-cause", pattern: /\bwill cause\b/i },
  { id: "causes-your", pattern: /\bcauses your\b/i },
  { id: "will-flare", pattern: /\bwill flare\b/i },
  { id: "disease-activity", pattern: /\bdisease activity\b/i },
  { id: "immune-claim", pattern: /\bimmune system is\b/i },
  { id: "unsafe-food", pattern: /\bthis food is (?:bad|dangerous|unsafe)\b/i },
  { id: "avoid-forever", pattern: /\bavoid (?:this|these) forever\b/i },
];

const HEALTH_DETAIL =
  /\b(arthritis|lupus|crohn|colitis|hashimoto|celiac|psoriasis|sjogren|flare|symptom|pain|fatigue|diagnosis|medication|prednisone|methotrexate|thyroid|autoimmune|disease|stiffness|brain fog)\b/i;

export function findMedicalClaims(text: string): string[] {
  const stripped = text.split(CLINICIAN_LINE).join(" ");
  return BANNED.filter((rule) => rule.pattern.test(stripped)).map((rule) => rule.id);
}

export function isSafeCopy(text: string): boolean {
  return findMedicalClaims(text).length === 0;
}

/** Review generated text. The standard clinician line is allowed. Static safety copy is not passed through here. */
export function reviewCopy(text: string): { ok: boolean; text: string } {
  if (isSafeCopy(text)) return { ok: true, text };
  return {
    ok: false,
    text: "Harbor held this wording back because it sounded like medical advice.",
  };
}

export function foodWordsOnly(description: string): { text: string; omitted: boolean } {
  const trimmed = description.trim().replace(/\s+/g, " ").slice(0, 400);
  if (!trimmed) return { text: "", omitted: false };
  if (HEALTH_DETAIL.test(trimmed) || !isSafeCopy(trimmed)) {
    return { text: "", omitted: true };
  }
  return { text: trimmed, omitted: false };
}
