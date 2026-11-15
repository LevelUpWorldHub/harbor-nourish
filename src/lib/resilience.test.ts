import { describe, expect, it } from "vitest";
import { fetchWithTimeout, runAttempts } from "@/lib/resilience";

describe("self-healing attempts", () => {
  it("retries once and then returns the successful result", async () => {
    const result = await runAttempts({
      retries: 1,
      backoffMs: 0,
      sleep: async () => undefined,
      run: async (attempt) => {
        if (attempt === 1) throw new Error("timeout");
        return "ok";
      },
      fallback: () => "fallback",
    });
    expect(result).toMatchObject({ value: "ok", source: "primary", attempts: 2 });
    expect(result.events.map((event) => event.ok)).toEqual([false, true]);
  });

  it("uses the fallback when every attempt fails", async () => {
    const result = await runAttempts({
      retries: 1,
      backoffMs: 0,
      sleep: async () => undefined,
      run: async () => {
        throw new Error("down");
      },
      fallback: () => "local",
    });
    expect(result).toMatchObject({ source: "fallback", value: "local", attempts: 2 });
  });

  it("turns a stalled fetch into a timeout without a network call", async () => {
    const fetchImpl: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    await expect(fetchWithTimeout("https://api.x.ai/v1/responses", { method: "POST" }, 20, fetchImpl)).rejects.toThrow("timeout");
  });
});
