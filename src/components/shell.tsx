"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { HarborProvider, useHarbor } from "@/components/harbor-provider";
import { SafetyNote } from "@/components/safety-note";
import { Button } from "@/components/ui/button";
import { AVERY } from "@/lib/demo-persona";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/meals", label: "Meals" },
  { href: "/journal", label: "Journal" },
  { href: "/patterns", label: "Patterns" },
  { href: "/summary", label: "Visit" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <HarborProvider>
      <Frame>{children}</Frame>
    </HarborProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, error, settings, updateSettings, startEmpty, loadDemo } = useHarbor();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-5">
        <p className="text-2xl">Opening your journal on this device…</p>
      </main>
    );
  }

  if (!settings.onboardingDone) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-10">
        <p className="text-sm tracking-wide text-primary uppercase">Harbor</p>
        <h1 className="text-4xl leading-tight">A flare-watch companion that stays under your control.</h1>
        <ul className="flex flex-col gap-3 text-lg leading-relaxed">
          <li>Harbor does not tell you what illness you have, what to eat, or what medicine to take.</li>
          <li>Your meals, check-ins, and notes stay in this browser unless you choose to export them.</li>
          <li>A meal photo goes to Grok only after you turn that on. Your name, symptoms, and flares are not part of that request.</li>
        </ul>
        {error ? <p role="alert">{error}</p> : null}
        <div className="flex flex-col gap-3">
          <Button type="button" onClick={() => void startEmpty()}>Start an empty journal</Button>
          <Button type="button" variant="outline" onClick={() => void loadDemo()}>Load the synthetic demo</Button>
          <p className="text-base text-muted-foreground">{AVERY.name} is a {AVERY.label.toLowerCase()}. Not a real person.</p>
        </div>
        <SafetyNote />
      </main>
    );
  }

  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="no-print mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-4">
        <Link href="/" className="text-2xl font-bold text-primary">Harbor</Link>
        <Button
          type="button"
          variant={settings.fatigueMode ? "default" : "outline"}
          aria-pressed={settings.fatigueMode}
          onClick={() => void updateSettings({ ...settings, fatigueMode: !settings.fatigueMode })}
        >
          {settings.fatigueMode ? "Fatigue day on" : "Fatigue day"}
        </Button>
      </header>
      <main id="content" className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-4 pb-36">
        {error ? <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3">{error}</p> : null}
        <DemoBanner />
        {children}
        <SafetyNote className="no-print" />
      </main>
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-16 items-center justify-center px-1 text-center text-sm sm:text-base ${active ? "font-bold text-primary" : "text-foreground"}`}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
