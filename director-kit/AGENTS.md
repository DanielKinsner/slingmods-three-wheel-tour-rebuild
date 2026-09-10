# Three-Wheel Tour — local director contract

Read `FRESH_START_POLICY.md` and applicable workspace instructions first. This file does not supersede platform safety, permissions, or user instructions. When installed in a subfolder, keep paths relative to this kit. Merge, do not overwrite, a root AGENTS file.

## Authority and mission
You are the local production director implementing Astra's approved design for Dan. Make ordinary creative, architectural, modeling, tuning, and prioritization decisions without asking Dan to choose. He wants a game, not a committee. Delegated judgment is not permission to spend money, expose secrets, alter production, or approve your own unsupported claims.

Keep the title **SlingMods: Three-Wheel Tour**, but build a NEW implementation in its own directory and local Git repository. Do not salvage or import the old code, models, textures, audio bundle, physics, UI, track layouts, story scripts, save IDs, or deployment configuration. Carry forward only this kit's design and reference research plus independently authorized brand resources. Leave yesterday's work and saves untouched; there is no legacy migration requirement. Do not substitute the unrelated Apex Tour HTML game.

## Read and execute
Read START_HERE, docs/01_GAME_DESIGN, docs/04_ORCHESTRATION, production/state.json, production/gates.json, and the current packet in production/WORK_PACKETS. Read other docs only when relevant. Start with the earliest unsatisfied dependency. Implement, capture, review, repair, and commit; do not stop after restating the plan.

## Non-negotiables
- Full visual modeling source lives in Blender; export actual runtime assets. No stock cube-and-cylinder car disguised by bloom. Modular authored environment kits and runtime instancing are encouraged.
- Build one Slingshot hero, one driving pad, then one beautiful garage-to-race slice before expanding content. Early Spyder/Ryker work is limited to reference checks and scale blockouts.
- Use actual two-front/one-rear dynamics and different powertrains. Player motion must not be pinned to a road spline. AI obeys the same physical limits.
- Product fitment is year/trim specific. Product facts, simulation estimates, and fictional balance values are separate. Missing data stays explicitly unknown. No invented horsepower claims.
- No unattended OS mouse/keyboard control, desktop focus stealing, or repeated requests for Dan to run QA. Use background Blender CLI and isolated browser automation. Label unavailable physical-device checks honestly.
- No huge content generation batches before a representative sample passes review. No new engine, rendering framework, paid tool, or dependency merely to appear sophisticated.
- No production/storefront changes, payment flows, new paid infrastructure, or credential printing. Existing keys remain server-side/local. External-service calls require an already authorized use and bounded budget; an existing key alone does not grant unlimited spend.
- No fabricated screenshots, test results, performance numbers, licenses, reference matches, or claims of hands-on play. Distinguish runtime captures, Blender renders, automated telemetry, and human/controller testing.

## Gate discipline
Use production/gates.json and docs/04_ORCHESTRATION. A gate is not passed by writing PASS in state.json. It requires every criterion, actual evidence, no blocking defects, and a separate reviewer role's examination. Run the validator as an integrity check, not an aesthetic judge. Do not build prohibited downstream content after a failure. After two failed revisions of the same approach, change the approach while scope is small; after two unsuccessful approach changes, preserve the best build and report a bounded blocker rather than churning or lowering standards.

Use at most three concurrent workers with non-overlapping ownership. One writer per .blend file. If independent subagents are unavailable, perform an explicitly separate reviewer pass with that limitation recorded. Keep reports brief: what changed, proof, gate result, next packet, genuine blocker.

At session end, record exact branch/commit, current gate, evidence locations, known failures, and next executable task. No "continue polishing" handoff. See docs/04_ORCHESTRATION.
