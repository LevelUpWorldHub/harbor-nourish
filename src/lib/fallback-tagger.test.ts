import { describe, expect, it } from "vitest";
import { tagFromDescription } from "@/lib/fallback-tagger";
import { isSafeCopy } from "@/lib/safety";

describe("on-device tagger", () => {
  it("tags a packaged meal from words", () => {
    const result = tagFromDescription("Boxed macaroni and salted crackers");
    expect(result.tags).toEqual(expect.arrayContaining(["ultra-processed", "high-sodium", "gluten-containing grains"]));
    expect(result.ingredients).toContain("salted crackers");
    expect(isSafeCopy(result.uncertainty)).toBe(true);
  });

  it("leaves an unmatched food without invented tags", () => {
    const result = tagFromDescription("cucumber slices");
    expect(result.tags).toEqual([]);
    expect(result.uncertainty.toLowerCase()).toContain("no tags");
  });
});
