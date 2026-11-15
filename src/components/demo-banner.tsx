"use client";

import { useHarbor } from "@/components/harbor-provider";
import { formatWhen } from "@/lib/dates";
import { AVERY } from "@/lib/demo-persona";

export function DemoBanner() {
  const { settings } = useHarbor();
  if (!settings.demoLoaded) return null;
  return (
    <div className="rounded-2xl bg-accent px-4 py-3 text-base leading-relaxed">
      <p>
        <strong>Synthetic demo.</strong> {AVERY.name} is not a real person. This journal was invented so you can look around without using anyone’s health data.
      </p>
      {settings.demoClock ? <p className="mt-2">Demo clock: {formatWhen(settings.demoClock)}. This is not the date on your device.</p> : null}
    </div>
  );
}
