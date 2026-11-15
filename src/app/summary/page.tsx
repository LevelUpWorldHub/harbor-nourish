"use client";

import { useMemo, useState } from "react";
import { CitationList } from "@/components/citation-list";
import { useHarbor } from "@/components/harbor-provider";
import { Button } from "@/components/ui/button";
import { DEMO_START } from "@/lib/demo-persona";
import { buildSummary, summaryToHtml } from "@/lib/summary";

export default function SummaryPage() {
  const { meals, symptoms, signals, nowIso, settings } = useHarbor();
  const [start, setStart] = useState(settings.demoLoaded ? DEMO_START : nowIso.slice(0, 10));
  const [end, setEnd] = useState(nowIso.slice(0, 10));
  const model = useMemo(() => buildSummary({ meals, symptoms, signals }, start, end), [end, meals, signals, start, symptoms]);

  return (
    <div className="flex flex-col gap-5">
      <div className="no-print">
        <h1 className="text-4xl">Visit summary</h1>
        <p className="mt-2 text-lg leading-relaxed">A plain record for an appointment. Print it, or save it as a PDF from the print dialog. It is not a diagnosis.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-col gap-1"><span className="font-bold">From</span><input className="min-h-12 rounded-lg border border-input bg-transparent px-3" type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label>
          <label className="flex flex-col gap-1"><span className="font-bold">To</span><input className="min-h-12 rounded-lg border border-input bg-transparent px-3" type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={() => window.print()}>Print or save as PDF</Button>
          <Button type="button" variant="outline" onClick={() => {
            const blob = new Blob([summaryToHtml(model)], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "harbor-visit-summary.html";
            link.click();
            URL.revokeObjectURL(url);
          }}>Download HTML summary</Button>
        </div>
      </div>
      <article id="clinician-summary" className="flex flex-col gap-4 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-3xl">{model.title}</h2>
        <p>{model.rangeLabel}</p>
        <p className="rounded-xl bg-accent px-3 py-3">{model.safety}</p>
        <p>{model.mealCount} meals · {model.checkInCount} check-ins · {model.flareCount} flare marks</p>
        <section>
          <h3 className="text-2xl">Flare marks</h3>
          {model.flares.length === 0 ? <p>None in this range.</p> : null}
          <ul className="mt-2 flex flex-col gap-2">{model.flares.map((flare) => <li key={flare.when}>{flare.when} — {flare.note}</li>)}</ul>
        </section>
        <section>
          <h3 className="text-2xl">Patterns in this journal</h3>
          <p className="mt-2">{model.patternNote}</p>
          {model.patterns.map((pattern) => (
            <div key={pattern.id} className="mt-3">
              <h4 className="text-xl">{pattern.title}</h4>
              <p>{pattern.explanation}</p>
              <CitationList citations={pattern.citations} />
              <p className="mt-2">{pattern.clinicianLine}</p>
            </div>
          ))}
        </section>
        <section>
          <h3 className="text-2xl">Meals</h3>
          <ul className="mt-2 flex flex-col gap-2">{model.meals.slice(0, 20).map((meal) => <li key={`${meal.when}-${meal.name}`}>{meal.when} — {meal.name} ({meal.tags}; {meal.source})</li>)}</ul>
        </section>
        <section>
          <h3 className="text-2xl">Check-ins</h3>
          <ul className="mt-2 flex flex-col gap-2">{model.checkIns.slice(0, 12).map((entry) => <li key={entry.when}>{entry.when} — {entry.line}</li>)}</ul>
        </section>
        <section>
          <h3 className="text-2xl">Signals</h3>
          <p>{model.signalNote}</p>
          <ul className="mt-2 flex flex-col gap-2">{model.signals.slice(0, 14).map((signal) => <li key={signal.when}>{signal.when} — {signal.line}</li>)}</ul>
        </section>
        <p>{model.aiNote}</p>
      </article>
    </div>
  );
}
