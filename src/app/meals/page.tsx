"use client";

import { useState } from "react";
import Link from "next/link";
import { useHarbor } from "@/components/harbor-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatWhen } from "@/lib/dates";
import { tagFromDescription } from "@/lib/fallback-tagger";
import { fetchWithTimeout } from "@/lib/resilience";
import { TAGS, tagPlain } from "@/lib/tags";
import type { MealSource, MealSuggestion } from "@/lib/types";

const SAMPLES = [
  { name: "Salmon, rice, and broccoli", description: "grilled salmon, brown rice, and broccoli", colors: ["#c47a4a", "#d8c39a", "#3f7d4e"] },
  { name: "Oats with berries and walnuts", description: "oats, blueberries, and walnuts", colors: ["#c4a574", "#5d4e8c", "#8a6234"] },
  { name: "Boxed macaroni and salted crackers", description: "boxed macaroni and salted crackers", colors: ["#e2b13c", "#d8c7a1", "#c46b3a"] },
];

type Draft = { mealName: string; ingredients: string[]; tags: string[]; uncertainty: string; source: MealSource; warnings: string[] };

export default function MealsPage() {
  const { meals, settings, nowIso, addMeal, logEvent } = useHarbor();
  const [step, setStep] = useState<"list" | "compose" | "review">("list");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [when, setWhen] = useState(nowIso.slice(0, 16));
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState("");

  function reset() {
    setStep("list");
    setDescription("");
    setImage("");
    setWarnings([]);
    setDraft(null);
    setWhen(nowIso.slice(0, 16));
  }

  function matchOnDevice(extra: string[] = ["Matched on this device. Nothing was sent."]) {
    if (!description.trim()) {
      setWarnings(["Type the foods you see. Harbor can match tags on this device from those words."]);
      return;
    }
    const local = tagFromDescription(description);
    setDraft({ ...local, source: "on-device", warnings: extra });
    setStep("review");
  }

  async function askGrok() {
    if (!settings.consentToAi) {
      setWarnings(["Photo suggestions stay off until you turn them on in Privacy. You can still match tags on this device."]);
      return;
    }
    if (!image) {
      setWarnings(["Add a JPEG or PNG photo first, or match tags from the words you typed."]);
      return;
    }
    setBusy(true);
    setWarnings([]);
    try {
      const response = await fetchWithTimeout("/api/analyze-meal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent: true, imageDataUrl: image, description }),
      }, 20_000);
      const data = (await response.json()) as MealSuggestion;
      if (data.status !== "ready") {
        setWarnings(data.warnings);
        await logEvent("warn", data.warnings[0] ?? "Meal suggestion needs more detail.");
        if (description.trim()) matchOnDevice(data.warnings);
        return;
      }
      setDraft({
        mealName: data.mealName,
        ingredients: data.ingredients,
        tags: data.tags,
        uncertainty: data.uncertainty,
        source: data.source === "grok" ? "grok" : "on-device",
        warnings: data.warnings,
      });
      await logEvent(data.source === "grok" ? "info" : "warn", data.warnings[0] ?? "Meal suggestion is ready to confirm.");
      setStep("review");
    } catch {
      await logEvent("warn", "Meal suggestion did not answer. Used the on-device match when food words were present.");
      if (description.trim()) matchOnDevice(["The suggestion service did not answer. Tags were matched on this device."]);
      else setWarnings(["The suggestion service did not answer. Type what you see and match tags on this device."]);
    } finally {
      setBusy(false);
    }
  }

  if (step === "review" && draft) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl">Confirm this meal</h1>
        <p className="text-lg">Nothing is saved until you say it looks right. Remove any tag that does not belong.</p>
        <p className="rounded-2xl bg-accent px-4 py-3">{draft.source === "grok" ? "Grok suggestion" : "On-device match"}. {draft.warnings.join(" ")} {draft.uncertainty}</p>
        <label className="flex flex-col gap-2">
          <span className="font-bold">Meal name</span>
          <Input value={draft.mealName} onChange={(event) => setDraft({ ...draft, mealName: event.target.value })} />
        </label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const on = draft.tags.includes(tag.id);
            return (
              <button key={tag.id} type="button" aria-pressed={on} className={`min-h-12 rounded-full px-4 text-left ${on ? "bg-primary text-primary-foreground" : "bg-muted"}`} onClick={() => setDraft({ ...draft, tags: on ? draft.tags.filter((item) => item !== tag.id) : [...draft.tags, tag.id] })}>
                {tag.plain}
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground">Tags describe the food. They are not a list of foods you must avoid.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={() => {
            if (!draft.mealName.trim()) return;
            const keepPhoto = image.startsWith("data:image/") && image.length < 1_500_000;
            void addMeal({
              id: `meal-${crypto.randomUUID()}`,
              at: when.length === 16 ? `${when}:00` : nowIso,
              name: draft.mealName.trim(),
              ingredients: draft.ingredients,
              tags: draft.tags,
              source: draft.source,
              confirmed: true,
              note: draft.uncertainty,
              hasPhoto: keepPhoto,
              imageDataUrl: keepPhoto ? image : undefined,
            }).then(() => {
              setSaved("Saved. You confirmed this meal before it entered your journal.");
              reset();
            });
          }}>This looks right — save</Button>
          <Button type="button" variant="outline" onClick={() => setStep("compose")}>Back</Button>
        </div>
      </div>
    );
  }

  if (step === "compose") {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl">Log a meal</h1>
        <label className="flex flex-col gap-2">
          <span className="font-bold">When</span>
          <input className="min-h-12 rounded-lg border border-input bg-transparent px-3" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-bold">What do you see?</span>
          <Input value={description} placeholder="Example: salmon, rice, broccoli" onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-card px-4 py-4 text-center">
          <span>{image ? "Photo ready on this device" : "Add a JPEG or PNG photo"}</span>
          <input className="sr-only" type="file" accept="image/jpeg,image/png" capture="environment" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!["image/jpeg", "image/png"].includes(file.type)) {
              setWarnings(["Use a JPEG or PNG photo."]);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => { setImage(String(reader.result)); setWarnings([]); };
            reader.readAsDataURL(file);
          }} />
        </label>
        {image ? (
          // User-selected data URL. Next Image does not optimize in-memory photos.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Meal photo you added, still on this device" className="max-h-64 rounded-2xl object-cover" />
        ) : null}
        <div>
          <p className="mb-2 font-bold">Or use a sample plate drawing</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {SAMPLES.map((sample) => (
              <button key={sample.name} type="button" className="rounded-2xl bg-card p-3 text-left ring-1 ring-foreground/10" onClick={() => { setDescription(sample.description); setImage(""); }}>
                <svg viewBox="0 0 120 80" role="img" aria-label="Simple drawing of a plate" className="h-20 w-full">
                  <rect width="120" height="80" rx="16" fill="#f4efe4" />
                  <ellipse cx="60" cy="42" rx="40" ry="24" fill="#fffdf8" stroke="#d9cbb6" />
                  <circle cx="46" cy="42" r="10" fill={sample.colors[0]} />
                  <circle cx="66" cy="38" r="8" fill={sample.colors[1]} />
                  <circle cx="74" cy="50" r="7" fill={sample.colors[2]} />
                </svg>
                <span className="mt-2 block font-bold">{sample.name}</span>
                <span className="text-sm text-muted-foreground">Sample drawing, not your food.</span>
              </button>
            ))}
          </div>
        </div>
        {warnings.map((warning) => (
          <p key={warning} role="status">{warning} {warning.includes("Privacy") ? <Link className="underline" href="/privacy">Open Privacy</Link> : null}</p>
        ))}
        <div className="flex flex-col gap-3">
          <Button type="button" disabled={busy} onClick={() => void askGrok()}>{busy ? "Asking Grok…" : "Suggest ingredients with Grok"}</Button>
          <Button type="button" variant="outline" onClick={() => matchOnDevice()}>Match tags on this device</Button>
          <Button type="button" variant="ghost" onClick={reset}>Cancel</Button>
        </div>
        <p className="text-muted-foreground">Grok sees the photo and food words only, and only after consent. Symptoms, flares, and your name stay here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl">Meals</h1>
        <p className="mt-2 text-lg leading-relaxed">Take a photo or name the plate. You confirm the ingredients and tags before they are saved.</p>
      </div>
      <Button type="button" onClick={() => setStep("compose")}>Log a meal</Button>
      {saved ? <p role="status">{saved}</p> : null}
      {meals.length === 0 ? <p>No meals yet. A short description is enough on a tired day.</p> : null}
      <ul className="flex flex-col gap-3">
        {meals.slice(0, 12).map((meal) => (
          <li key={meal.id} className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
            <p className="font-bold">{meal.name}</p>
            <p>{formatWhen(meal.at)}</p>
            <div className="mt-2 flex flex-wrap gap-2">{meal.tags.map((tag) => <Badge key={tag} variant="secondary" className="h-auto min-h-8 px-3 py-1 text-sm">{tagPlain(tag)}</Badge>)}</div>
            <p className="mt-2 text-muted-foreground">{meal.source === "grok" ? "Grok suggestion you confirmed" : meal.source === "on-device" ? "On-device match you confirmed" : "Entered by you"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
