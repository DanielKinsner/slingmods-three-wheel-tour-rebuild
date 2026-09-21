# Three-Wheel Tour — the plan (Sept 21, 2026)

1. `01-MASTER-PROMPT.md`: paste to the coding model. Phases in order: 0 showroom fixes → 1 sense of speed → 2 rendering → 3 UI + cinematics → 4 fun systems → 5 new vehicles.
2. `asset-prompts/01…11`: one prompt per asset, each self-contained. Run 01, 02, 06 first (they feed Phase 1), then 03/04/05/10 (Phase 2), then 08/09/11 (Phases 3–4). 07 is the wooden-sign logo fix and can go any time.
3. `02-AUDIO-PLAN.md`: what to generate with an ElevenLabs key, in what order.

What I found reading the showroom code is at the top of the master prompt (Phase 0). Short version: the logic is solid; the UI can't animate because it re-renders everything with one innerHTML and has zero CSS transitions; the new live mirrors do a full scene traverse twice a frame; there's no post-processing at all.
