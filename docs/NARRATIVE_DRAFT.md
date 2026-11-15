# Phase 1 narrative draft

**Header for the submission PDF:** Level Up Inc. · Team leader: Mark Yukhimets · Idea title: Harbor

**Status:** Draft for the owner to edit, format, and verify. It is not the submission PDF. The challenge requires one English PDF, at most 6 pages, 11-point Calibri, 1-inch margins, and the page limit includes references, figures, and tables. [Confirm the template and portal clock before submission.] Deadline stated on nourishchallenge.org and the NIH announcement: **8 January 2027, 8:00 PM ET (5:00 PM PT).**

Do not submit invented study results, invented quotes, or a claim that community testing already happened. Brackets mark work still required.

---

## 1. Understanding of the problem, scientific rationale, and scope

People living with autoimmune disease have asked for a practical way to see diet, symptoms, and flares together. The NIH NOURISH Autoimmunity Digital Health Challenge was built around that gap. The announcement describes autoimmune disease as affecting more than 8% of the U.S. population, estimates 23.5 to 50 million people living with these conditions, and describes economic impact above $100 billion per year, and it points to the 2022 National Academies report and the NIH-Wide Strategic Plan for Autoimmune Disease Research. [NEEDS VERIFICATION: quote the primary sources, not only the challenge page, and check every number before it appears in the PDF.] The announcement also says there are more than 140 autoimmune diseases, that they affect women, men, and young people differently, and that many remain understudied. [NEEDS VERIFICATION against the cited papers.]

The first NOURISH ideation challenge, as summarized by NIH, grouped winning ideas into four themes. Harbor sits in theme 3, personalized and data-driven nutrition, and it is shaped by theme 4, community voice. It is not a diet trial and not a microbiome study.

**Scope of this prototype.** Harbor is a personal journal. The person logs meals, marks symptoms on simple 0–10 scales (pain, stiffness, fatigue, brain fog, stomach upset, and stress), and decides when a day is a flare. Optional context is sleep, steps, and resting heart rate. In this phase those three streams are a **simulated feed**, labeled as simulated, so the pattern screen can be demonstrated without a device and without pretending a sensor is connected.

These scales are **patient-reported marks the person defines**. They are not a validated disease-activity index, not a lab biomarker, and not an immune assay. Phase 1 shows the slot where a validated measure would go. Candidates a clinician partner might later consider include a short rheumatoid arthritis activity form, a fatigue PROM, or a gastrointestinal symptom score. [NEEDS VERIFICATION: instrument name, license, respondent burden, and whether each form is appropriate across more than one disease. Do not name a final instrument until a clinician has agreed.] The rationale for starting with plain scales is burden. Flares and fatigue make long forms hard to finish. Harbor’s fatigue-day path asks only for pain, fatigue, and an optional flare mark.

**What Harbor will not claim.** It does not say a food caused a flare. It does not estimate immune activity. It does not tell the person what to eat. A verifier blocks generated text that sounds like a diagnosis or a treatment. Every pattern screen ends with: this is not a diagnosis or a treatment plan; discuss what you notice with your clinician.

**Why a personal pattern is still in scope.** Diet responses in autoimmunity are widely described as individual, but this draft does not cite an effect size, because we have not re-checked the primary literature and we will not invent one. [NEEDS VERIFICATION: if the final PDF mentions heterogeneity of diet response, attach a real citation or delete the sentence.] Harbor’s method is descriptive and n-of-1: compare the person’s own 48 hours before flares they marked with their other days, and show the logs. That can make a visit more concrete. It is not evidence of a dietary effect.

The same journal structure is not tied to one diagnosis. A person can track joint symptoms, gut symptoms, fatigue, and brain fog together. That is the intended path to more than one autoimmune condition. Disease-specific scores can be added later without changing the meal log or the rule that the person confirms every tag.

## 2. Engagement

Judges will ask who shaped the tool. This draft answers honestly.

**What already informed the design, from public challenge material.** The NIH announcement lists the tools patients and partners asked for after the first NOURISH challenge: symptom and flare diaries, diet logs, wearables, and AI help that identifies what is in a food and what patterns sit next to symptoms. Harbor’s screens follow that list. The fatigue-day path, large type, plain words, and “you decide what a flare is” come from the practical constraint that logging competes with feeling ill. Those are design choices made for the prototype. They are **not** a record of interviews.

**What has not been done yet.** [NOT YET DONE] No person living with autoimmune disease, caregiver, dietitian, or clinician has yet tested this build. No advocacy organization is a partner. No quote in this draft is from a community member. Do not add one.

**Plan to complete before or during Phase 1 review, and to carry into Phase 2.** [Owner to fill names and dates.]

1. Two to four conversations with people who live with different autoimmune conditions, plus a caregiver if they want one. Ask what they already track, what they abandon when fatigued, what they would show a clinician, and what would feel like blame. Change the prototype from that, and write the changes down.
2. One review with a clinician or dietitian of the visit summary, the tag list, and the sentence “this is not a cause.” Ask which validated score is worth the burden. [NEEDS VERIFICATION of that person’s willingness to be named.]
3. A short read-through with an advocacy group, even if they only comment on the safety language and the synthetic-demo label. [NOT YET DONE. Do not imply an endorsement.]

Interdisciplinary work so far is software design plus the public clinical frame in the challenge announcement. The owner’s own contribution, and any community contribution, must be stated in the first person in the final PDF. AI assistance is disclosed below and in `docs/AI_DISCLOSURE.md`. It does not replace that human account.

## 3. Potential impact

If the journal is usable, a person can walk into a visit with dates, meals, flares they chose to mark, and a short list of patterns that point back at those dates. That is a monitoring and communication aid. It may reduce the “I think it was something I ate, but I cannot remember” problem. It may also help a research team later, if a person chooses to export a file. This prototype does not submit data to a study.

**No outcome claim.** We have not measured quality of life, flare frequency, diet quality, or clinician time. [Do not add percentages.]

**Practical choices already in the build.**

- Confirm-before-save on every meal tag, so a bad photo guess does not become a health record.
- Citations on every pattern, so the person can disagree with the count by opening the log.
- A print or “save as PDF” visit summary, plus an HTML download, with simulated signals labeled.
- A fatigue-day control that enlarges type and shortens the check-in.
- Consent off by default for photos. The rest of the app works with no AI key.

**Path to real use.** Phase 1 is a prototype and a video. Phase 2, if invited, is beta testing with the people above, repair of what they find confusing, and builds on both iOS and Android. Phase 3 would be a live demonstration. Sustained use depends on trust: local storage, a visible AI switch, and language that does not overclaim. A hosted account is intentionally absent until a privacy review says it is needed.

## 4. Feasibility

The prototype runs as a Next.js and TypeScript progressive web app. Meals, check-ins, flares, simulated signals, and settings are stored in IndexedDB in the browser. There is no login. Export and delete are on the Privacy screen.

**AI is optional.** With `XAI_API_KEY` unset, meal tags come from a fixed word list on the device. With a key, a consented photo goes to the xAI Responses API (`grok-4.7` unless `XAI_MODEL` overrides it). The call times out, retries once, and falls back to the on-device list. Unsafe replies are dropped. Unit tests cover this with a fake network. They do not call xAI.

**Self-healing.** The Status screen checks that the local database opens and that the app server answers, without sending the journal. A person can practice a timeout and a full outage. Repair rebuilds the local database and puts back entries it can still read. The point is that a failed model call does not take the journal down.

**Privacy and security.** The analyze route accepts only consent, a photo, and food words. Prompts are de-identified. `store: false` is set so the request asks xAI not to keep the default 30-day Responses history. Search tools are not enabled. [NEEDS VERIFICATION of xAI retention and of the team’s account terms on the submission date.] Photos in the local export are omitted. This is not a HIPAA certification, and the draft should not say it is. A photo sent to xAI is still a disclosure the person must choose.

**Accessibility.** Base type is large. Atkinson Hyperlegible is bundled so the app does not call a font service. Contrast can be strengthened. The fatigue path shortens the form. Controls are buttons and steppers, not tiny targets only. We have not completed a formal WCAG audit. [NOT YET DONE.]

**Interoperability and phones.** Phase 1 is a mobile-first installable web app (manifest, and a service worker in the production build). The challenge expects Phase 2 tools to run on both iOS and Android. The plan is to wrap this app with Capacitor rather than rewrite it. Wearable and CGM connections are out of scope until consent, labeling, and a real device path exist. The simulated feed is the placeholder.

**Maintenance.** The pattern rules and the claim list are ordinary TypeScript with tests. There is no model fine-tune to host. Ongoing cost is the owner’s time plus xAI calls only when a person opts in.

**Eligibility still to confirm.** [NEEDS VERIFICATION] Level Up Inc. is incorporated and has its primary place of business in the United States; the submitting individuals are U.S. citizens or permanent residents; no one on the team is a federal employee acting in scope or a challenge judge; federal grant or contract funds are not used to build the submission. Registration on nourishchallenge.org is [NOT YET DONE].

## 5. Innovation

Many apps log food or symptoms. Fewer keep the person in charge of an automated guess, and fewer refuse to speak unless they can cite that person’s logs.

Harbor’s specific choices:

1. **Autonomy with a human confirm.** Grok may name foods in a photo. The person sees the tags, deletes the wrong ones, and only then saves. The pattern engine may point at a resemblance to past flares. It says the check-in is not a prediction, and it links the meals and check-ins it used.
2. **A verifier between the model and the journal.** Replies that sound like diagnosis or treatment are discarded. The fallback is a transparent word list, not a second model.
3. **De-identified vision.** The photo call is consent-gated, symptom-free, and sent with search tools off and storage requested off. Health data is not put into web or X search.
4. **Personal counts, not a borrowed diet.** Tags such as “ultra-processed” or “high sodium” describe the plate. They become a “pattern” only if that person’s own flares line up with them more than their other days do. A tag that is common on ordinary days stays quiet. The demo persona is constructed so this can be shown; it is not a finding about a disease.
5. **Reliability as a feature.** Timeouts, one retry, on-device fallback, and a status panel are part of the product, not an afterthought. A missing key is a supported mode.

Broad use across conditions comes from keeping scores and tags configurable and from refusing a single therapeutic diet. Whether that design actually helps is a Phase 2 question, to be answered by the people in section 2, not by this prototype.

## AI use, as required in the narrative

AI is used in two places, and both are disclosed. First, the running app may call xAI Grok vision (`grok-4.7` by default) to suggest meal ingredients after consent. Second, this prototype and these drafts were written with Cursor’s Grok coding agent. The agent is not a clinician and did not interview patients. The owner must describe what they personally decided, tested, and will change. Full detail is in `docs/AI_DISCLOSURE.md`. No user journal is used to train a Harbor model. Harbor does not operate a training pipeline.

## What the video will show

A 3–5 minute recording, scripted in `docs/DEMO_SCRIPT.md`, walks through Avery Chen’s synthetic journal: the gentle check-in and its citations, the pattern rules, the flare journal, an on-device meal confirmation, the simulated signal banner, the visit summary, consent, and a practiced failure. Narration states that community testing is still ahead.

## References to resolve before the PDF

Do not leave this list in the PDF unless each item has been opened and cited correctly. The six-page limit includes references.

1. NIH NOURISH Autoimmunity Digital Health Challenge announcement, including judging criteria and the 8 January 2027, 8:00 PM ET deadline. https://www.nih.gov/challenges/nourish-autoimmunity-digital-health-challenge and https://www.nourishchallenge.org/ [NEEDS VERIFICATION of any sentence copied from these pages.]
2. Primary sources behind the announcement’s prevalence, cost, and National Academies statements. [NEEDS VERIFICATION. Not copied here, so they are not accidentally mis-cited.]
3. xAI image understanding and Responses `store` behavior. https://docs.x.ai/ [NEEDS VERIFICATION on the submission date.]
4. Any patient-reported measure actually chosen for Phase 2. [NOT YET SELECTED.]

## Owner checklist before 8 January 2027, 5:00 PM PT

- [ ] Register, and keep proof of registration.
- [ ] Confirm eligibility facts in section 4.
- [ ] Replace bracketed gaps with real engagement or say plainly that it is scheduled.
- [ ] Format this draft to the 6-page rules after the edits. Cut, do not shrink the font.
- [ ] Record the video from `docs/DEMO_SCRIPT.md`.
- [ ] Re-read every number and citation.
- [ ] Add a first-person note of what Mark Yukhimets and Level Up Inc. did, separate from the coding agent.
