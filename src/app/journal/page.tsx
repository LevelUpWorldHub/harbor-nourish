"use client";

import { useState } from "react";
import { useHarbor } from "@/components/harbor-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatWhen } from "@/lib/dates";

type Scores = { pain: number; stiffness: number; fatigue: number; brainFog: number; stomach: number; stress: number };
const EMPTY: Scores = { pain: 0, stiffness: 0, fatigue: 0, brainFog: 0, stomach: 0, stress: 0 };
const FIELDS: { key: keyof Scores; label: string; hint: string }[] = [
  { key: "pain", label: "Pain", hint: "0 is none. 10 is the worst you personally use." },
  { key: "stiffness", label: "Stiffness", hint: "How hard it is to get moving." },
  { key: "fatigue", label: "Fatigue", hint: "How drained you feel, separate from pain." },
  { key: "brainFog", label: "Brain fog", hint: "How hard it is to think or find words." },
  { key: "stomach", label: "Stomach upset", hint: "0 is settled. 10 is very upset." },
  { key: "stress", label: "Stress", hint: "Your sense of pressure today, not a test score." },
];

export default function JournalPage() {
  const { symptoms, settings, nowIso, addSymptom } = useHarbor();
  const [scores, setScores] = useState<Scores>(EMPTY);
  const [flare, setFlare] = useState(false);
  const [note, setNote] = useState("");
  const [when, setWhen] = useState(nowIso.slice(0, 16));
  const [more, setMore] = useState(false);
  const [saved, setSaved] = useState("");
  const fields = more || !settings.fatigueMode ? FIELDS : FIELDS.filter((field) => field.key === "pain" || field.key === "fatigue");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl">Journal</h1>
        <p className="mt-2 text-lg leading-relaxed">You decide what a flare is. Harbor does not decide for you. A flare means a clear worsening you would want your clinician to know about.</p>
      </div>
      <form
        className="flex flex-col gap-5 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10"
        onSubmit={(event) => {
          event.preventDefault();
          void addSymptom({
            id: `checkin-${crypto.randomUUID()}`,
            at: when.length === 16 ? `${when}:00` : nowIso,
            ...scores,
            flare,
            note: note.trim() || (flare ? "You marked this as a flare." : ""),
          }).then(() => {
            setSaved(flare ? "Saved your flare mark on this device." : "Saved your check-in on this device.");
            setScores(EMPTY);
            setFlare(false);
            setNote("");
          });
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="font-bold">When</span>
          <input className="min-h-12 rounded-lg border border-input bg-transparent px-3" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
        </label>
        {fields.map((field) => (
          <fieldset key={field.key} className="flex flex-col gap-2">
            <legend className="flex w-full items-baseline justify-between gap-3"><span className="font-bold">{field.label}</span><span className="text-2xl">{scores[field.key]}</span></legend>
            <p className="text-muted-foreground">{field.hint}</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" aria-label={`Lower ${field.label}`} onClick={() => setScores((current) => ({ ...current, [field.key]: Math.max(0, current[field.key] - 1) }))}>−</Button>
              <input className="h-12 w-full accent-[var(--primary)]" type="range" min={0} max={10} step={1} value={scores[field.key]} aria-label={field.label} onChange={(event) => setScores((current) => ({ ...current, [field.key]: Number(event.target.value) }))} />
              <Button type="button" variant="outline" aria-label={`Raise ${field.label}`} onClick={() => setScores((current) => ({ ...current, [field.key]: Math.min(10, current[field.key] + 1) }))}>+</Button>
            </div>
          </fieldset>
        ))}
        {settings.fatigueMode && !more ? <Button type="button" variant="outline" onClick={() => setMore(true)}>Add stiffness, brain fog, stomach, and stress</Button> : null}
        <Button type="button" variant={flare ? "default" : "outline"} aria-pressed={flare} onClick={() => setFlare((value) => !value)}>{flare ? "Marked as a flare" : "Mark this as a flare"}</Button>
        <label className="flex flex-col gap-2">
          <span className="font-bold">Note, if you want one</span>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-28 text-base" placeholder="What you would want to remember." />
        </label>
        <Button type="submit">Save check-in</Button>
        {saved ? <p role="status">{saved}</p> : null}
      </form>
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">Recent check-ins</h2>
        {symptoms.length === 0 ? <p>No check-ins yet.</p> : null}
        <ul className="flex flex-col gap-3">
          {symptoms.slice(0, 8).map((entry) => (
            <li key={entry.id} className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
              <p className="font-bold">{formatWhen(entry.at)}{entry.flare ? " · Flare mark" : ""}</p>
              <p>Pain {entry.pain}/10 · Fatigue {entry.fatigue}/10 · Stress {entry.stress}/10</p>
              {entry.note ? <p>{entry.note}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
