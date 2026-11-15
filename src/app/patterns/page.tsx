"use client";

import { CitationList } from "@/components/citation-list";
import { useHarbor } from "@/components/harbor-provider";
import { findPatterns } from "@/lib/pattern-engine";

export default function PatternsPage() {
  const { meals, symptoms, signals } = useHarbor();
  const findings = findPatterns({ meals, symptoms, signals });
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl">Patterns</h1>
        <p className="mt-2 text-lg leading-relaxed">Harbor looks at the 48 hours before flares you marked and compares those notes with your other days. It uses your journal only. It does not use other people’s data, and it does not guess from a single flare.</p>
      </div>
      {findings.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">Harbor needs at least two flares in your journal, plus meals around them, before it will describe a pattern. Guessing early would not be fair to you.</p>
      ) : (
        findings.map((finding) => (
          <article key={finding.id} className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
            <p className="text-sm font-bold tracking-wide text-primary uppercase">{finding.strength === "early" ? "Early pattern" : "Repeating pattern"}</p>
            <h2 className="text-2xl">{finding.title}</h2>
            <p className="leading-relaxed">{finding.explanation}</p>
            <details>
              <summary className="cursor-pointer font-bold">How this was counted</summary>
              <p className="mt-2 leading-relaxed">{finding.howCounted}</p>
            </details>
            <h3 className="text-lg">From your logs</h3>
            <CitationList citations={finding.citations} />
            <p>{finding.clinicianLine}</p>
          </article>
        ))
      )}
    </div>
  );
}
