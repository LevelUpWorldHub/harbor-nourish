import { TAGS } from "@/lib/tags";
import type { TagId } from "@/lib/types";

export function tagFromDescription(description: string): {
  mealName: string;
  ingredients: string[];
  tags: TagId[];
  uncertainty: string;
} {
  const mealName = description.trim().replace(/\s+/g, " ").slice(0, 140);
  const ingredients = mealName
    .split(/,| and | with /i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 80);
  const tags = TAGS.filter((tag) => tag.patterns.some((pattern) => pattern.test(mealName))).map((tag) => tag.id);
  return {
    mealName: mealName || "Meal",
    ingredients: ingredients.length ? ingredients : mealName ? [mealName] : [],
    tags,
    uncertainty: tags.length
      ? "Matched from the words on this device. Change anything that looks wrong before you save."
      : "No tags matched these words. You can add tags yourself.",
  };
}
