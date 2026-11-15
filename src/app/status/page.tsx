"use client";

import { useState } from "react";
import { useHarbor } from "@/components/harbor-provider";
import { Button } from "@/components/ui/button";
import { formatWhen } from "@/lib/dates";
import { runAttempts } from "@/lib/resilience";

export default function StatusPage() {
  const { events, settings, meals, symptoms, signals, logEvent, runDatabaseCheck, repair, updateSettings } = useHarbor();
  const [server, setServer] = useState("Not checked yet.");
  const [dbMessage, setDbMessage] = useState("Not checked yet.");
  const [practice, setPractice] = useState("");
  const [busy, setBusy] = useState(false);

  async function runChecks() {
    setBusy(true);
    try {
      const database = await runDatabaseCheck();
      setDbMessage(`${database.message} ${database.counts.meals} meals, ${database.counts.symptoms} check-ins, ${database.counts.signals} signal days.`);
      await logEvent("info", "On-device journal check passed.");
    } catch {
      setDbMessage("The journal did not open. Repair can rebuild the local file.");
      await logEvent("error", "On-device journal check failed.");
    }
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("status");
      const body = (await response.json()) as { aiConfigured: boolean; model: string; searchTools: string; storeImages: boolean };
      setServer(body.aiConfigured
        ? `App server is up. Model ${body.model} is configured. Search tools are ${body.searchTools}. Image requests set store to ${String(body.storeImages)}.`
        : `App server is up. No xAI key is set, so meal photos use the on-device match. Search tools are ${body.searchTools}.`);
      await logEvent("info", "App server health check passed.");
    } catch {
      setServer("The app server did not answer. Your journal on this device still works.");
      await logEvent("warn", "App server health check failed. On-device journal is still available.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl">Status</h1>
        <p className="mt-2 text-lg leading-relaxed">Harbor retries a failed meal suggestion once, then matches tags on this device. These checks do not send your journal anywhere.</p>
      </div>
      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-2xl">Right now</h2>
        <ul className="mt-2 flex flex-col gap-2">
          <li>Journal entries on this device: {meals.length} meals, {symptoms.length} check-ins, {signals.length} signal days.</li>
          <li>Meal photo consent: {settings.consentToAi ? "on" : "off"}.</li>
          <li>Demo journal: {settings.demoLoaded ? "loaded and labeled synthetic" : "not loaded"}.</li>
          <li>Service worker: registered for installed use when the app is built for production.</li>
        </ul>
        <div className="mt-4 flex flex-col gap-3">
          <Button type="button" disabled={busy} onClick={() => void runChecks()}>{busy ? "Checking…" : "Run checks"}</Button>
          <p role="status">{dbMessage}</p>
          <p role="status">{server}</p>
        </div>
      </section>
      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-2xl">Practice a failure</h2>
        <p>These buttons simulate a slow or missing suggestion. They do not contact xAI.</p>
        <div className="mt-3 flex flex-col gap-3">
          <Button type="button" variant="outline" onClick={() => void runAttempts({
            retries: 1, backoffMs: 0, sleep: async () => undefined,
            run: async (attempt) => { if (attempt === 1) throw new Error("Simulated timeout"); return "recovered"; },
            fallback: () => "fallback",
          }).then(async (result) => {
            const message = `Practice recovery: attempt 1 failed, attempt ${result.attempts} ${result.source === "primary" ? "succeeded" : "used the fallback"}.`;
            setPractice(message);
            await logEvent("info", message);
          })}>Practice a recovered failure</Button>
          <Button type="button" variant="outline" onClick={() => void runAttempts({
            retries: 1, backoffMs: 0, sleep: async () => undefined,
            run: async () => { throw new Error("Simulated outage"); },
            fallback: () => "on-device fallback",
          }).then(async (result) => {
            const message = `Practice outage: ${result.attempts} attempts failed, then Harbor used the ${result.value}.`;
            setPractice(message);
            await logEvent("warn", message);
          })}>Practice a full outage</Button>
          {practice ? <p role="status">{practice}</p> : null}
        </div>
      </section>
      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-2xl">Repair local storage</h2>
        <p>If the journal file is damaged, repair rebuilds it and puts back any entries it can still read.</p>
        <Button type="button" className="mt-3" variant="outline" onClick={() => void repair().then(setDbMessage)}>Repair journal file</Button>
      </section>
      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-2xl">Phone apps later</h2>
        <p>Phase 2 can wrap this same web app with Capacitor so it installs on iOS and Android. The journal can stay in the on-device browser storage inside that wrapper until a native store is reviewed.</p>
        {settings.demoClock ? (
          <Button type="button" className="mt-3" variant="outline" onClick={() => void updateSettings({ ...settings, demoClock: null })}>Use this device’s clock</Button>
        ) : settings.demoLoaded ? (
          <Button type="button" className="mt-3" variant="outline" onClick={() => void updateSettings({ ...settings, demoClock: "2026-10-24T15:00:00" })}>Return to the demo clock</Button>
        ) : null}
      </section>
      <section>
        <h2 className="text-2xl">Recent events</h2>
        {events.length === 0 ? <p className="mt-2">No events yet.</p> : null}
        <ul className="mt-2 flex flex-col gap-2">{events.slice(0, 8).map((event) => <li key={event.id}>{formatWhen(event.at)} · {event.level} · {event.message}</li>)}</ul>
      </section>
    </div>
  );
}
