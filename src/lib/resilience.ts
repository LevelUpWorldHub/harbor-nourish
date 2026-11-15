export type AttemptEvent = { attempt: number; ok: boolean; message: string };

export async function runAttempts<T>(options: {
  retries: number;
  run: (attempt: number) => Promise<T>;
  fallback: () => T;
  sleep?: (ms: number) => Promise<void>;
  backoffMs?: number;
}): Promise<{ value: T; source: "primary" | "fallback"; attempts: number; events: AttemptEvent[] }> {
  const retries = Math.max(0, options.retries);
  const events: AttemptEvent[] = [];
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const backoff = options.backoffMs ?? 400;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      const value = await options.run(attempt);
      events.push({ attempt, ok: true, message: "ok" });
      return { value, source: "primary", attempts: attempt, events };
    } catch (error) {
      events.push({ attempt, ok: false, message: error instanceof Error ? error.message : "failed" });
      if (attempt <= retries) await sleep(backoff * attempt);
    }
  }

  return { value: options.fallback(), source: "fallback", attempts: retries + 1, events };
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new Error("timeout");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
