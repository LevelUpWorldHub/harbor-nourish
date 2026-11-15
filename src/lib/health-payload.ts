import { DEFAULT_MODEL } from "@/lib/prompt";

export function healthPayload(env: { XAI_API_KEY?: string; XAI_MODEL?: string }, nowIso: string) {
  const key = env.XAI_API_KEY?.trim() ?? "";
  return {
    ok: true,
    service: "harbor",
    model: env.XAI_MODEL?.trim() || DEFAULT_MODEL,
    aiConfigured: key.length > 0,
    searchTools: "disabled" as const,
    storeImages: false,
    time: nowIso,
  };
}
