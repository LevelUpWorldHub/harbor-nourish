import { tagFromDescription } from "@/lib/fallback-tagger";
import {
  DEFAULT_MODEL,
  buildResponsesBody,
  extractOutputText,
  parseMealModelText,
  validateImageDataUrl,
} from "@/lib/prompt";
import { fetchWithTimeout, runAttempts } from "@/lib/resilience";
import type { MealSuggestion } from "@/lib/types";

export type AnalyzeMealInput = {
  consent: boolean;
  imageDataUrl?: string;
  description?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  sleep?: (ms: number) => Promise<void>;
};

function localSuggestion(description: string, warnings: string[], attempts: number): MealSuggestion {
  const local = tagFromDescription(description);
  return {
    status: "ready",
    source: "on-device",
    mealName: local.mealName,
    ingredients: local.ingredients,
    tags: local.tags,
    uncertainty: local.uncertainty,
    note: "",
    attempts,
    warnings,
  };
}

function empty(status: MealSuggestion["status"], warnings: string[]): MealSuggestion {
  return {
    status,
    source: "none",
    mealName: "",
    ingredients: [],
    tags: [],
    uncertainty: "",
    note: "",
    attempts: 0,
    warnings,
  };
}

export async function analyzeMeal(input: AnalyzeMealInput): Promise<MealSuggestion> {
  const description = (input.description ?? "").trim();
  const image = input.imageDataUrl?.trim() ?? "";
  const warnings: string[] = [];

  if (!input.consent) {
    if (!description) {
      return empty(
        image ? "needs_consent" : "needs_description",
        image
          ? ["Meal photos stay on this device until you consent in Privacy."]
          : ["Type the foods you see, or add a photo after you consent."],
      );
    }
    return localSuggestion(description, ["Matched on this device. The photo was not sent."], 0);
  }

  const key = input.apiKey?.trim() ?? "";
  if (!key || !image) {
    if (!description) {
      return empty("needs_description", [
        key
          ? "Add a photo for Grok, or type the foods for an on-device match."
          : "No xAI key is set. Type the foods and Harbor will match tags on this device.",
      ]);
    }
    warnings.push(
      key ? "No photo was attached, so Harbor matched tags on this device." : "No xAI key is set, so Harbor matched tags on this device.",
    );
    return localSuggestion(description, warnings, 0);
  }

  const imageError = validateImageDataUrl(image);
  if (imageError) {
    if (description) return localSuggestion(description, [imageError], 0);
    return empty("needs_description", [imageError]);
  }

  const built = buildResponsesBody({
    model: input.model || DEFAULT_MODEL,
    imageDataUrl: image,
    description,
  });
  if (built.foodWordsOmitted) {
    warnings.push("Health words were left out of the request. Only the photo and food words are eligible to send.");
  }

  const endpoint = `${(input.baseUrl || "https://api.x.ai/v1").replace(/\/$/, "")}/responses`;
  const attempt = await runAttempts({
    retries: input.retries ?? 1,
    backoffMs: input.sleep ? 0 : 400,
    sleep: input.sleep,
    fallback: () => null,
    run: async () => {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify(built.body),
        },
        input.timeoutMs ?? 12_000,
        input.fetchImpl ?? fetch,
      );
      if (!response.ok) throw new Error(`status ${response.status}`);
      const parsed = parseMealModelText(extractOutputText(await response.json()));
      if (!parsed) throw new Error("unusable response");
      return parsed;
    },
  });

  if (attempt.source === "fallback" || !attempt.value) {
    const reason = attempt.events.some((event) => event.message === "unusable response")
      ? "The model reply was blocked or could not be read. Harbor did not turn it into advice."
      : "Grok did not answer in time. Harbor used the on-device match instead.";
    if (description) return localSuggestion(description, [...warnings, reason], attempt.attempts);
    return {
      ...empty("needs_description", [...warnings, reason, "Type what you see in the photo to match tags on this device."]),
      attempts: attempt.attempts,
    };
  }

  return {
    status: "ready",
    source: "grok",
    mealName: attempt.value.mealName,
    ingredients: attempt.value.ingredients,
    tags: attempt.value.tags,
    uncertainty: attempt.value.uncertainty || "Suggested from the photo. Please confirm or edit before saving.",
    note: attempt.value.notes,
    attempts: attempt.attempts,
    warnings,
  };
}
