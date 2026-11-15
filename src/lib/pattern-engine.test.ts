import { describe, expect, it } from "vitest";
import { DEMO_NOW, buildAveryJournal } from "@/lib/demo-persona";
import { activeNotices, findPatterns } from "@/lib/pattern-engine";
import { CLINICIAN_LINE, isSafeCopy } from "@/lib/safety";
import type { JournalData } from "@/lib/types";

describe("personal pattern engine", () => {
  const journal = buildAveryJournal();

  it("cites Avery's own logs for food, sleep, stress, steps, and heart rate", () => {
    const findings = findPatterns(journal);
    const ids = findings.map((finding) => finding.id);
    expect(ids).toEqual(expect.arrayContaining(["food:ultra-processed", "food:high-sodium", "sleep", "stress", "steps", "resting-hr"]));
    expect(ids).not.toContain("food:nightshade vegetables");
    expect(ids).not.toContain("food:omega-3");
    expect(ids).not.toContain("food:high-fiber");
    for (const finding of findings) {
      expect(finding.citations.length).toBeGreaterThan(0);
      expect(finding.clinicianLine).toBe(CLINICIAN_LINE);
      expect(isSafeCopy(finding.explanation)).toBe(true);
      expect(isSafeCopy(finding.howCounted)).toBe(true);
      expect(finding.explanation.toLowerCase()).not.toContain("you should");
    }
  });

  it("warns gently when the recent days resemble past flares", () => {
    const notices = activeNotices(journal, DEMO_NOW);
    expect(notices).toHaveLength(1);
    expect(notices[0].message.toLowerCase()).toContain("not a prediction");
    expect(notices[0].why.toLowerCase()).toContain("sleep");
    expect(notices[0].why.toLowerCase()).toContain("stress");
    expect(notices[0].citations.some((citation) => citation.logType === "meal")).toBe(true);
    expect(isSafeCopy(notices[0].message)).toBe(true);
    expect(isSafeCopy(notices[0].why)).toBe(true);
  });

  it("stays quiet when there are not two flares to compare", () => {
    const quiet: JournalData = {
      meals: journal.meals,
      signals: journal.signals,
      symptoms: journal.symptoms.filter((entry) => entry.id !== "flare-2026-10-16"),
    };
    expect(findPatterns(quiet)).toEqual([]);
    expect(activeNotices(quiet, DEMO_NOW)).toEqual([]);
  });
});
