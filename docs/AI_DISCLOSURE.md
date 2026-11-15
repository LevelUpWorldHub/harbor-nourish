# AI disclosure — Harbor

This file is the disclosure to include with a NOURISH Phase 1 submission. The challenge allows AI tools if all AI use is fully disclosed, and it asks participants to show their own contribution and to engage people with lived experience. Source code may be requested for review and is not meant to be publicly released by NIH. See the challenge FAQ. [Confirm the current wording before submission.]

## 1. AI inside the product

Harbor can call the xAI Responses API to look at a meal photo.

- Model: `XAI_MODEL`, default `grok-4.7`, checked against the xAI image-understanding guide (Responses API, `input_image` plus `input_text`).
- Endpoint: `XAI_BASE_URL` or `https://api.x.ai/v1`, path `/responses`.
- The call happens only after the person turns on meal-photo consent, and only when they tap “Suggest ingredients with Grok.”
- The request contains the image and, if present, food words. Health-like words in that text are removed first. The prompt does not include the person’s name, conditions, symptoms, flares, stress, sleep, steps, or heart rate.
- `store` is set to `false`. xAI documents that Responses are stored for 30 days by default, and that image requests should not be stored. [NEEDS VERIFICATION against the docs and contract in force on the submission date.]
- No tools are sent. Web search and X search are not enabled. Harbor does not send health data to those tools.
- The reply must be JSON with a meal name, ingredients, and tags from a fixed list. A verifier drops replies that sound like a diagnosis, a treatment, or an instruction about medicine or diet. The person edits and confirms tags before anything is saved.
- If the key is missing, the call times out, the service errors, or the reply is unusable, Harbor matches tags on the device from the words the person typed. That path is deterministic and does not use a model.
- Harbor does not use the model to interpret symptoms, predict flares, or write the visit summary. Those are local rules with cited logs.

Harbor does not claim that xAI is a covered health service or that `store: false` is a complete privacy control. A person still sends a photo to xAI when they consent. They can decline and use the on-device match.

## 2. AI used to build this prototype

This repository was implemented in Cursor with Grok 4.7 as the coding agent, at the request of the project owner. The agent scaffolded the Next.js app, wrote the journal, pattern engine, safety checks, tests, and these drafts, and checked them with unit tests and a browser pass.

That is development assistance, not a clinical model. Before submission, Mark Yukhimets / Level Up Inc. should add, in their own words:

- Which parts a person designed, reviewed, changed, or rejected.
- Who ran the prototype, and whether anyone with lived experience, a clinician, or a dietitian tried it. As of this draft, that engagement is [NOT YET DONE].
- Any other AI tools used later (writing, design, video, meal tests).

Do not describe the coding agent as a clinical co-author or as a substitute for community engagement. The challenge text warns that judges will look for engagement with people who have lived experience.

## 3. What AI is not allowed to do here

- Diagnose, stage, or name a disease for the user.
- Recommend starting, stopping, or changing medicine, supplements, or a diet.
- Decide that a day is a flare. The person marks flares.
- Send the journal to a model, a search index, or a social-network search.
- Hide uncertainty. Suggestions are labeled “Grok suggestion” or “On-device match.”

## 4. Synthetic data

Avery Chen is an invented persona used for the demo and tests. The journal entries are generated in `src/lib/demo-persona.ts`. They are not records from a person, a clinic, or a study. Do not present Avery’s patterns as research results.

## 5. Still to confirm before 8 January 2027

- [NEEDS VERIFICATION] Current xAI model name, image limits (documented as JPEG/PNG, up to 20 MiB), retention, and whether `store: false` is honored for `grok-4.7`.
- [NEEDS VERIFICATION] Whether Level Up Inc.’s xAI account terms allow a health-adjacent photo, even with symptoms excluded.
- [NOT YET DONE] Human review of prompts and of the verifier’s word list by someone with clinical or lived-experience perspective.
- [NOT YET DONE] A short statement of the team’s own work, in the narrative, next to this disclosure.
