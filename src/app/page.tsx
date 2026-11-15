"use client";

import Link from "next/link";
import { CitationList } from "@/components/citation-list";
import { useHarbor } from "@/components/harbor-provider";
import { buttonVariants } from "@/components/ui/button";
import { formatHours, formatWhen } from "@/lib/dates";
import { activeNotices } from "@/lib/pattern-engine";

export default function TodayPage() {
  const { meals, symptoms, signals, nowIso, settings } = useHarbor();
  const notice = activeNotices({ meals, symptoms, signals }, nowIso)[0];
  const lastMeal = meals.find((meal) => meal.confirmed);
  const lastCheck = symptoms[0];
  const lastSignal = signals.find((signal) => signal.date <= nowIso.slice(0, 10));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl leading-tight">How is today going?</h1>
        <p className="mt-2 text-lg leading-relaxed">Log a meal or a check-in when you have the energy. Harbor will only talk about patterns it can point to in your own notes.</p>
      </div>
      {notice ? (
        <section className="notice-card rounded-2xl px-4 py-4" aria-labelledby="check-in-title">
          <h2 id="check-in-title" className="text-2xl">{notice.title}</h2>
          <p className="mt-2 text-lg leading-relaxed">{notice.message}</p>
          <p className="mt-2 leading-relaxed">{notice.why}</p>
          <div className="mt-3"><CitationList citations={notice.citations} /></div>
          <p className="mt-3">{notice.clinicianLine}</p>
        </section>
      ) : (
        <p className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
          {settings.demoLoaded
            ? "No gentle check-in right now. Open Patterns to see what Harbor counted in this demo journal."
            : "No gentle check-in yet. Harbor waits until your journal has at least two flares you marked."}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/journal" className={buttonVariants()}>Log how you feel</Link>
        <Link href="/meals" className={buttonVariants({ variant: "outline" })}>Log a meal</Link>
      </div>
      <section className="quiet flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-xl">Latest notes</h2>
        <p>{lastMeal ? `Last meal: ${lastMeal.name} · ${formatWhen(lastMeal.at)}` : "No meals saved yet."}</p>
        <p>{lastCheck ? `Last check-in: ${lastCheck.flare ? "Flare mark" : `fatigue ${lastCheck.fatigue}/10`} · ${formatWhen(lastCheck.at)}` : "No check-ins yet."}</p>
        <p>{lastSignal ? `Last night in the feed: ${formatHours(lastSignal.sleepHours)} hours of sleep. This feed is simulated.` : "No sleep numbers yet."}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-2">
          <Link className="underline" href="/signals">Signals</Link>
          <Link className="underline" href="/privacy">Privacy</Link>
          <Link className="underline" href="/status">Status</Link>
        </p>
      </section>
    </div>
  );
}
