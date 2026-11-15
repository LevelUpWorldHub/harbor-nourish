"use client";

import { useState } from "react";
import { useHarbor } from "@/components/harbor-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { journalForExport } from "@/lib/db";
import { AVERY } from "@/lib/demo-persona";

export default function PrivacyPage() {
  const { settings, meals, symptoms, signals, updateSettings, eraseJournal, loadDemo } = useHarbor();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl">Privacy</h1>
        <p className="mt-2 text-lg leading-relaxed">The journal lives in this browser’s storage. Harbor does not have an account and does not upload your check-ins.</p>
      </div>
      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl">Meal photo consent</h2>
            <p className="mt-1">Off by default. Turn it on only if you want Grok to look at a meal photo.</p>
          </div>
          <Switch checked={settings.consentToAi} onCheckedChange={(checked) => void updateSettings({ ...settings, consentToAi: checked })} aria-label="Consent to send meal photos to Grok" />
        </div>
      </section>
      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <h2 className="text-2xl">What can leave this device</h2>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
          <li>A meal photo, only after consent, and only when you ask for a suggestion.</li>
          <li>Food words you typed, with health words removed first.</li>
          <li>Nothing else. Not your name, flares, symptoms, stress, sleep, steps, or heart rate.</li>
        </ul>
        <p className="mt-3">The request asks xAI not to store it, and it does not turn on web search or X search.</p>
      </section>
      <section className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-2xl">Stronger contrast</h2><p>Darker text and borders.</p></div>
          <Switch checked={settings.strongContrast} onCheckedChange={(checked) => void updateSettings({ ...settings, strongContrast: checked })} aria-label="Stronger contrast" />
        </div>
      </section>
      <div className="flex flex-col gap-3">
        <Button type="button" variant="outline" onClick={() => {
          const payload = { about: "Harbor journal export. Photos were left out. This file can contain health notes, so store it carefully.", syntheticDemo: settings.demoLoaded, ...journalForExport({ meals, symptoms, signals }) };
          const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
          const link = document.createElement("a");
          link.href = url;
          link.download = "harbor-journal.json";
          link.click();
          URL.revokeObjectURL(url);
        }}>Export journal</Button>
        <Button type="button" variant="outline" onClick={() => {
          if ((meals.length > 0 || symptoms.length > 0) && !confirmDemo) {
            setConfirmDemo(true);
            return;
          }
          void loadDemo();
          setConfirmDemo(false);
        }}>{confirmDemo ? "Replace this journal with the synthetic demo" : `Load ${AVERY.name} synthetic demo`}</Button>
        <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>Delete journal on this device</Button>
      </div>
      <p className="text-muted-foreground">Prototype by Level Up Inc. for the NIH NOURISH Autoimmunity Digital Health Challenge.</p>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-lg text-base">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete this journal?</DialogTitle>
            <DialogDescription className="text-base">This removes meals, check-ins, and the simulated feed from this browser. Export first if you want a copy.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>Keep it</Button>
            <Button type="button" variant="destructive" onClick={() => { void eraseJournal(); setConfirmDelete(false); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
