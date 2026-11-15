import { describe, expect, it } from "vitest";
import { AVERY } from "@/lib/demo-persona";
import { buildResponsesBody, extractOutputText, parseMealModelText } from "@/lib/prompt";

const TINY_PNG = "data:image/png;base64,iVBORw0KGgo=";

describe("de-identified Grok request", () => {
  it("sends store false, no search tools, and no persona or health details", () => {
    const built = buildResponsesBody({
      imageDataUrl: TINY_PNG,
      description: `${AVERY.name} has arthritis and a flare with fatigue`,
    });
    expect(built.foodWordsOmitted).toBe(true);
    expect(built.body.store).toBe(false);
    expect(built.body).not.toHaveProperty("tools");
    expect(built.body.model).toBe("grok-4.7");
    const serialized = JSON.stringify(built.body);
    expect(serialized).not.toContain(AVERY.name);
    expect(serialized.toLowerCase()).not.toContain("arthritis");
    expect(serialized.toLowerCase()).not.toContain("fatigue");
    expect(serialized).toContain(TINY_PNG);
    expect(serialized).not.toContain("web_search");
    expect(serialized).not.toContain("x_search");
  });

  it("reads responses API text and drops unsafe meal JSON", () => {
    expect(extractOutputText({ output: [{ content: [{ type: "output_text", text: "{\"meal_name\":\"Soup\"}" }] }] })).toContain("Soup");
    expect(
      parseMealModelText('{"meal_name":"Soup","ingredients":["broth"],"tags":["high-sodium","not-a-real-tag"],"uncertainty":"unsure","notes":"bowl"}'),
    ).toMatchObject({ mealName: "Soup", tags: ["high-sodium"] });
    expect(
      parseMealModelText('{"meal_name":"Soup","ingredients":["broth"],"tags":[],"uncertainty":"you should start treatment","notes":""}'),
    ).toBeNull();
  });
});
