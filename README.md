# Harbor

Harbor is a Phase 1 prototype for the [NIH NOURISH Autoimmunity Digital Health Challenge](https://www.nourishchallenge.org/). It is a nutrition and flare-watch companion for people living with autoimmune conditions.

The person stays in control. Harbor can suggest ingredients from a meal photo, but nothing is saved until they confirm it. Pattern notes cite their own logs. The app does not diagnose, prescribe, or tell them what to eat.

Owner: Mark Yukhimets, Level Up Inc.

## What works in this prototype

- Meal logging from a photo, a typed description, or a labeled sample plate. Optional Grok vision (xAI) after consent, with an on-device tagger when there is no key or the call fails.
- A symptom and flare journal, with a shorter path on fatigue days.
- A simulated sleep, steps, and resting-heart-rate feed, labeled as simulated.
- A pattern engine that compares the person’s own notes before flares they marked, and a gentle check-in that cites those logs.
- A visit summary that prints or saves as PDF, plus an HTML download.
- On-device storage (IndexedDB), a medical-claim check, and a status panel with retries and fallbacks.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The dev server for this workspace is started on port **4317**. On your own machine, `npm run dev` uses port 3000 unless you pass `-p`.

```bash
npm test
npm run lint
npm run build
npm start
```

Leave `XAI_API_KEY` empty to use the deterministic on-device tagger. Set `XAI_MODEL` to override the default `grok-4.7`.

## Synthetic demo

On the first screen, choose **Load the synthetic demo**. Avery Chen is not a real person. The demo clock is 24 October 2026, 3:00 PM, so the gentle check-in has something to point at.

## Phone apps

This Phase 1 build is an installable web app. A production build registers a service worker. Phase 2, which the challenge expects to run on both iOS and Android, can wrap the same app with [Capacitor](https://capacitorjs.com/) without rewriting the journal. See `docs/ARCHITECTURE.md`.

## Docs

- `docs/ARCHITECTURE.md` — structure and data boundaries
- `docs/NARRATIVE_DRAFT.md` — draft of the 6-page Phase 1 narrative
- `docs/AI_DISCLOSURE.md` — AI used in the product and in building it
- `docs/DEMO_SCRIPT.md` — 3–5 minute prototype video

## Safety

Harbor is not a medical device and not medical advice. Discuss what you notice with your clinician.
