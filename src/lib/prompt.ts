import { foodWordsOnly, isSafeCopy } from "@/lib/safety";
import { isTagId, TAGS } from "@/lib/tags";

export const DEFAULT_MODEL = "grok-4.7";
const MAX_DATA_URL_LENGTH = 5_500_000;

export function mealPrompt(foodWords: string): string {
  const tagList = TAGS.map((tag) => tag.id).join(", ");
  const hint = foodWords
    ? `Food words the person typed, with health details removed: ${foodWords}. Use them only as a hint.`
    : "No food words were included.";
  return [
    "Look at this meal image and help log the food.",
    "Return JSON only with keys meal_name, ingredients, tags, uncertainty, notes.",
    "ingredients is an array of foods you can see.",
    `tags is an array using only these ids: ${tagList}.`,
    "If you are unsure, use fewer tags and say so in uncertainty.",
    "notes is a short description of what is visible.",
    "Do not identify any person.",
    "Do not give medical advice, a diagnosis, or a treatment suggestion.",
    "Do not mention diseases, symptoms, or medications.",
    hint,
  ].join("\n");
}

export function validateImageDataUrl(url: string): string | null {
  if (!/^data:image\/(png|jpeg|jpg);base64,[a-z0-9+/=\r\n]+$/i.test(url)) {
    return "Use a JPEG or PNG photo.";
  }
  if (url.length > MAX_DATA_URL_LENGTH) {
    return "That photo is too large. Try a smaller one, under about 4 megabytes.";
  }
  return null;
}

export function buildResponsesBody(args: { model?: string; imageDataUrl: string; description?: string }): {
  body: {
    model: string;
    store: false;
    input: [
      {
        role: "user";
        content: [
          { type: "input_image"; image_url: string; detail: "low" },
          { type: "input_text"; text: string },
        ];
      },
    ];
  };
  foodWordsOmitted: boolean;
} {
  const food = foodWordsOnly(args.description ?? "");
  return {
    foodWordsOmitted: food.omitted,
    body: {
      model: args.model?.trim() || DEFAULT_MODEL,
      store: false,
      input: [
        {
          role: "user",
          content: [
            { type: "input_image", image_url: args.imageDataUrl, detail: "low" },
            { type: "input_text", text: mealPrompt(food.text) },
          ],
        },
      ],
    },
  };
}

export type ParsedMeal = {
  mealName: string;
  ingredients: string[];
  tags: string[];
  uncertainty: string;
  notes: string;
};

export function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  if (Array.isArray(record.output)) {
    const chunks: string[] = [];
    for (const item of record.output) {
      if (!item || typeof item !== "object") continue;
      const content = (item as { content?: unknown }).content;
      if (typeof content === "string") chunks.push(content);
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
            chunks.push((part as { text: string }).text);
          }
        }
      }
    }
    if (chunks.length) return chunks.join("\n");
  }
  const choices = record.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const content = (choices[0] as { message?: { content?: unknown } }).message?.content;
    if (typeof content === "string") return content;
  }
  return "";
}

export function parseMealModelText(text: string): ParsedMeal | null {
  const fenced = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fenced.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  const mealName = typeof record.meal_name === "string" ? record.meal_name.trim().slice(0, 140) : "";
  const ingredients = Array.isArray(record.ingredients)
    ? record.ingredients
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((item): item is string => typeof item === "string" && isTagId(item.trim()))
    : [];
  const uncertainty = typeof record.uncertainty === "string" ? record.uncertainty.trim().slice(0, 400) : "";
  const notes = typeof record.notes === "string" ? record.notes.trim().slice(0, 400) : "";
  if (!mealName && ingredients.length === 0) return null;
  if (!isSafeCopy([mealName, uncertainty, notes, ...ingredients].join("\n"))) return null;
  return { mealName: mealName || ingredients[0] || "Meal", ingredients, tags, uncertainty, notes };
}
