import { describe, expect, it } from "vitest";
import { CLINICIAN_LINE, findMedicalClaims, foodWordsOnly, isSafeCopy, reviewCopy } from "@/lib/safety";

describe("medical claim verifier", () => {
  it("blocks diagnosis and treatment wording", () => {
    const hits = findMedicalClaims("You have lupus. You should start treatment at 10 mg.");
    expect(hits).toEqual(expect.arrayContaining(["you-have", "treatment", "you-should", "milligram"]));
  });

  it("allows the standard clinician line", () => {
    expect(isSafeCopy(CLINICIAN_LINE)).toBe(true);
    expect(isSafeCopy(`A pattern in your notes. ${CLINICIAN_LINE}`)).toBe(true);
  });

  it("holds back unsafe generated copy", () => {
    const reviewed = reviewCopy("This food will cause a flare. You must avoid these forever.");
    expect(reviewed.ok).toBe(false);
    expect(reviewed.text.toLowerCase()).not.toContain("will cause");
    expect(isSafeCopy(reviewed.text)).toBe(true);
  });

  it("drops health details from food words before a prompt", () => {
    expect(foodWordsOnly("grilled salmon, but my arthritis pain and fatigue are high")).toEqual({ text: "", omitted: true });
  });

  it("keeps plain food words", () => {
    expect(foodWordsOnly("grilled salmon, brown rice, and broccoli")).toEqual({
      text: "grilled salmon, brown rice, and broccoli",
      omitted: false,
    });
  });
});
