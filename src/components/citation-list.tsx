"use client";

import { useState } from "react";
import { useHarbor } from "@/components/harbor-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatWhen } from "@/lib/dates";
import { tagPlain } from "@/lib/tags";
import type { Citation } from "@/lib/types";

export function CitationList({ citations }: { citations: Citation[] }) {
  const [active, setActive] = useState<Citation | null>(null);
  return (
    <>
      <ul className="flex flex-col gap-2">
        {citations.map((citation) => (
          <li key={`${citation.logType}:${citation.logId}`}>
            <button type="button" className="text-left text-base underline decoration-border underline-offset-4" onClick={() => setActive(citation)}>
              {citation.label}
            </button>
          </li>
        ))}
      </ul>
      <LogDetail citation={active} onClose={() => setActive(null)} />
    </>
  );
}

function LogDetail({ citation, onClose }: { citation: Citation | null; onClose: () => void }) {
  const { meals, symptoms, signals } = useHarbor();
  const meal = citation?.logType === "meal" ? meals.find((item) => item.id === citation.logId) : undefined;
  const symptom = citation?.logType === "symptom" ? symptoms.find((item) => item.id === citation.logId) : undefined;
  const signal = citation?.logType === "signal" ? signals.find((item) => item.id === citation.logId) : undefined;
  return (
    <Dialog open={Boolean(citation)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg text-base">
        <DialogHeader>
          <DialogTitle className="text-xl">{citation?.label ?? "Log"}</DialogTitle>
          <DialogDescription className="text-base">From your journal on this device.</DialogDescription>
        </DialogHeader>
        {meal ? (
          <div className="flex flex-col gap-2">
            <p>{formatWhen(meal.at)}</p>
            <p>{meal.ingredients.join(", ") || meal.name}</p>
            <p>Tags: {meal.tags.map(tagPlain).join(", ") || "None"}</p>
            <p>Source: {meal.source === "grok" ? "Grok suggestion you confirmed" : meal.source === "on-device" ? "On-device match you confirmed" : "You entered this"}</p>
          </div>
        ) : null}
        {symptom ? (
          <div className="flex flex-col gap-2">
            <p>{formatWhen(symptom.at)}</p>
            <p>Pain {symptom.pain}/10 · Stiffness {symptom.stiffness}/10 · Fatigue {symptom.fatigue}/10 · Brain fog {symptom.brainFog}/10 · Stomach upset {symptom.stomach}/10 · Stress {symptom.stress}/10</p>
            <p>{symptom.flare ? "You marked this as a flare." : "Check-in."}</p>
            {symptom.note ? <p>{symptom.note}</p> : null}
          </div>
        ) : null}
        {signal ? (
          <div className="flex flex-col gap-2">
            <p>Simulated feed. This did not come from a watch.</p>
            <p>Sleep {signal.sleepHours} hours · Steps {signal.steps.toLocaleString("en-US")} · Resting heart rate {signal.restingHr}</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
