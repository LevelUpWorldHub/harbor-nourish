"use client";

import { useHarbor } from "@/components/harbor-provider";
import { formatDay, formatHours } from "@/lib/dates";

export default function SignalsPage() {
  const recent = useHarbor().signals.slice(0, 14);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl">Signals</h1>
        <p className="mt-2 rounded-2xl bg-accent px-4 py-3 text-lg leading-relaxed">Simulated feed. These numbers are not from a watch, ring, or medical device. They are a labeled stand-in so you can see how Harbor would read sleep, steps, and resting heart rate next to your journal.</p>
      </div>
      {recent.length === 0 ? <p>No signal days yet. Load the synthetic demo from Privacy if you want to see the stand-in feed.</p> : (
        <ul className="flex flex-col gap-4">
          {recent.map((signal) => (
            <li key={signal.id} className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
              <p className="font-bold">{formatDay(signal.date)}</p>
              <Bar label={`Sleep ${formatHours(signal.sleepHours)} hours`} value={signal.sleepHours} max={10} />
              <Bar label={`${signal.steps.toLocaleString("en-US")} steps`} value={signal.steps} max={10000} />
              <Bar label={`Resting heart rate ${signal.restingHr}`} value={signal.restingHr} max={100} />
            </li>
          ))}
        </ul>
      )}
      <p className="text-muted-foreground">Sleep hours are for the night that ended that morning. A real device connection is a later step, and it would still need your permission.</p>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="mt-2">
      <p>{label}</p>
      <div className="mt-1 h-3 rounded-full bg-muted" aria-hidden="true"><div className="h-3 rounded-full bg-primary" style={{ width: `${width}%` }} /></div>
    </div>
  );
}
