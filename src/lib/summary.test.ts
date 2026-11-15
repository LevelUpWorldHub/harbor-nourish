import { describe, expect, it } from "vitest";
import { DEMO_NOW, DEMO_START, buildAveryJournal } from "@/lib/demo-persona";
import { healthPayload } from "@/lib/health-payload";
import { CLINICIAN_LINE, isSafeCopy } from "@/lib/safety";
import { buildSummary, summaryToHtml } from "@/lib/summary";

describe("clinician summary and health payload", () => {
  it("includes the safety line, simulated signals, and escaped html", () => {
    const journal = buildAveryJournal();
    journal.meals[0] = { ...journal.meals[0], name: "<script>alert(1)</script>" };
    const model = buildSummary(journal, DEMO_START, DEMO_NOW.slice(0, 10));
    expect(model.safety).toBe(CLINICIAN_LINE);
    expect(model.flareCount).toBe(2);
    expect(model.signalNote.toLowerCase()).toContain("simulated");
    expect(model.patterns.length).toBeGreaterThan(0);
    for (const pattern of model.patterns) expect(isSafeCopy(pattern.explanation)).toBe(true);
    const html = summaryToHtml(model);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain(CLINICIAN_LINE);
  });

  it("reports whether a key exists without returning the key", () => {
    const payload = healthPayload({ XAI_API_KEY: "secret-value", XAI_MODEL: "" }, "2026-10-24T15:00:00Z");
    expect(payload.aiConfigured).toBe(true);
    expect(payload.model).toBe("grok-4.7");
    expect(payload.searchTools).toBe("disabled");
    expect(payload.storeImages).toBe(false);
    expect(JSON.stringify(payload)).not.toContain("secret-value");
  });
});
