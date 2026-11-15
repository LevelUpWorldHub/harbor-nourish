import { describe, expect, it, vi } from "vitest";
import { analyzeMeal } from "@/lib/analyze-meal";
import { AVERY } from "@/lib/demo-persona";

const PNG = "data:image/png;base64,iVBORw0KGgo=";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

describe("meal analysis", () => {
  it("does not call the network without consent", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await analyzeMeal({
      consent: false,
      imageDataUrl: PNG,
      description: "boxed macaroni and salted crackers",
      apiKey: "test-key",
      fetchImpl,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.source).toBe("on-device");
    expect(result.tags).toContain("ultra-processed");
  });

  it("uses the deterministic tagger when no key is configured", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await analyzeMeal({
      consent: true,
      imageDataUrl: PNG,
      description: "oats, blueberries, and walnuts",
      apiKey: "",
      fetchImpl,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.source).toBe("on-device");
    expect(result.tags).toEqual(expect.arrayContaining(["high-fiber", "omega-3"]));
    expect(result.warnings.join(" ").toLowerCase()).toContain("no xai key");
  });

  it("accepts a safe Grok payload and never puts the persona in the request", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
      const serialized = String(init?.body);
      expect(serialized).not.toContain(AVERY.name);
      expect(serialized.toLowerCase()).not.toContain("arthritis");
      expect(serialized).toContain('"store":false');
      expect(serialized).not.toContain("web_search");
      return jsonResponse({
        output_text:
          '{"meal_name":"Salmon plate","ingredients":["salmon","rice"],"tags":["omega-3"],"uncertainty":"looks like salmon","notes":"a plate of fish and rice"}',
      });
    });
    const result = await analyzeMeal({
      consent: true,
      imageDataUrl: PNG,
      description: "salmon and rice",
      apiKey: "test-key",
      fetchImpl,
      sleep: async () => undefined,
    });
    expect(result.source).toBe("grok");
    expect(result.mealName).toBe("Salmon plate");
    expect(result.tags).toEqual(["omega-3"]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("blocks a medical model reply and falls back on device", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        output: [{ content: [{ type: "output_text", text: '{"meal_name":"Soup","ingredients":["broth"],"tags":["high-sodium"],"uncertainty":"you should start treatment","notes":""}' }] }],
      }),
    );
    const result = await analyzeMeal({
      consent: true,
      imageDataUrl: PNG,
      description: "canned soup",
      apiKey: "test-key",
      retries: 0,
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("on-device");
    expect(result.warnings.join(" ").toLowerCase()).toContain("blocked");
    expect(result.uncertainty.toLowerCase()).not.toContain("treatment");
  });

  it("retries a timeout and then uses the on-device match", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error("timeout");
    });
    const result = await analyzeMeal({
      consent: true,
      imageDataUrl: PNG,
      description: "boxed macaroni and salted crackers",
      apiKey: "test-key",
      retries: 1,
      sleep: async () => undefined,
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.source).toBe("on-device");
    expect(result.attempts).toBe(2);
    expect(result.tags).toContain("high-sodium");
  });
});
