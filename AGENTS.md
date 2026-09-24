# Phase 4 fun systems - current (2026-09-24)

Owner order A -> B -> C. Read `handoff/PHASE-4-FUN-SYSTEMS.md`. A: racecraft (rivals hold their line beside you,
race at a closer gap, personalities, slipstream, scrape-not-spin contact, Quick Race catch-up). B: handbrake drift ->
boost arcade layer (Space / X). C: horn, perfect-start boost; sector splits already existed. New physics is opt-in per
race: time trials, challenges and records are byte-identical; career gets racecraft but never drift/boost/catch-up.
Open owner decisions: gymkhana arena (none drivable today) and whether parts/levels should change handling.
515 tests pass; everything is pushed to main (deploys Vercel). Earlier headers below are history.

---
# Phase 3 UI and cinematic transitions (2026-09-24)

Owner asked to start Phase 3 after the performance gate passed. Read `handoff/PHASE-3-TRANSITIONS.md`. The
showroom panel now morphs in place (`src/game/morph.ts`) instead of rebuilding; parts fly onto the car with
sparks and an underglow pulse (`src/presentation/install-motion.ts`); camera moves rack focus; the departure is
letterboxed; photo mode adds focus blur, film look and underglow colour; the HUD has a shift light. Deferred with
reasons: part highlight sweep, live photo time of day. Physics, saves, routes, products and the perf-gated race
render paths are unchanged. 508 tests pass; everything is pushed to main (deploys Vercel).
Earlier headers below are history.

---
# Performance gate passed (2026-09-24)

Owner asked to work on performance. Read `handoff/PERFORMANCE-GATE.md`. The sustained High and Ultra gates on
Harbor dusk-rain now PASS with unchanged thresholds (High worst 1% 14.9-15.4 ms vs 16.6; average ~6.9 ms);
Smoky Ridge High passes widely. Cause: vehicle draw calls (rival distance proxies, player shadow/reflection
stand-in, player static-part merge in drives), a smaller wet-reflection target, and mirrors alternating with the
puddle pass on High. `?perf=legacy-proxy` restores the old path for A/B. Physics, saves, routes, products and the
showroom are unchanged. One workstation; modest High margin. Phase 3 is not started: that is the owner's call.
Earlier headers below are history.

---
# Polish pass 2 (2026-09-23)

Follow-up to the visual polish pass, owner-authorized and pushed to main. Read `handoff/POLISH-PASS-2.md`.
The Ridge start-line step is now fixed in physics (off-road only; road heights bit-identical, tested).
Also: garage vehicle sync, Slingshot calipers and console icons, rider gloves/balaclava, lamp lenses,
floor moire, road paint, back-button wording. Editing slingshot-2026.glb requires the SM-133 refit (see doc).
Sustained run (idle PC): High 11.9 ms / Ultra 13.8 ms average, no 100 ms stalls, but HOLD remains (see doc).
Earlier headers below are history.

---
# Visual polish pass (2026-09-23)

Owner asked to reduce bloom, fix the F3 underglow red line, upgrade weak assets, clean up UI
inconsistencies and clipping, and remodel the Ryker Panther kit and Treal exhaust, straight on main.
Read `handoff/VISUAL-POLISH.md`. All of it is committed and pushed. Physics, steering, saves, routes and
product bindings are unchanged (the Ridge start-line seam is a visual blend; its physics fix awaits owner
approval). Performance HOLD remains; no sustained measurement was run. Earlier headers below are history.

---
# Career entry repair - current (2026-09-23)

The owner reported a repeated loading failure after Continue Career. Reproduced the Spyder
Chapters 02-03 hub falling through the Slingshot workshop, producing an invalid preview recipe.
Read `handoff/CAREER-ENTRY-REPAIR.md` and its validation receipt. Vehicle-specific workshops,
earlier saved-vehicle resolution, retained startup diagnostics and header spacing are repaired.
491 tests pass; packaged Continue Career/reload/workshop checks preserve all three vehicle fixtures.
No save reset, migration, physics/steering change, asset replacement, push or deployment.
Resume the bounded quality/performance work below; its sustained performance HOLD remains.
Earlier headers below are history.

---
# Fleet rendering continuation (2026-09-23)

Owner asked to keep improving after `5a14717`. Read `handoff/FLEET-RENDER.md` and its validation
receipt. Rider IK reuses current matrices and cached node references; rivals share immutable opaque
trim materials with independent ownership. No model/texture reduction or quality-preset change.
The paired instrumented diagnostic reduces CPU frame time about 11%; this is not sustained acceptance.
483 tests pass. Continue from the recorded race results; preserve the performance HOLD unless its
unchanged gate is actually met. Physics, steering, saves, sources and product bindings remain intact.
Local work only; no push/deployment or spending. Earlier headers below are history.

---
# Quality and performance continuation (2026-09-23)

The owner requested continued fidelity, optimization and roadmap implementation. Read
`handoff/QUALITY-AND-PERFORMANCE.md` and its validation receipt. Implemented 4K photo export,
vehicle shader reuse, shared KTX2 sources, fast material comparison and 29 audited geometry-only
scenery derivatives. Original models, physics, steering, routes, saves and product bindings remain intact.
Current work is local on main; no new push/deployment or spending is authorized by this continuation.
The latest purchased biker and surface shaders are now in a sustained measurement: performance HOLD
remains. Continue bounded rendering/LOD work with visual evidence before claiming the gate passed.
Earlier headers below are history; do not repeat completed roadmap features or use old timing as current proof.

---
# Biker rider + realistic vehicle surfaces (2026-09-23)

The owner's purchased rigged biker now rides every vehicle (2026 Slingshot, Ryker, Spyder, rivals), fitted per
vehicle by `scripts/build-biker-rider.py`; the purchased source stays out of this public repo. Every vehicle also
gets physically based surfaces (`src/presentation/vehicle-surfaces.ts`). Read `handoff/BIKER-RIDER-AND-SURFACES.md`.
Codex's SPYDER01 work is committed. Physics, routes, rewards and saves unchanged. Performance remains HOLD and the
new surfaces are not yet in a measurement. Earlier headers below are history.

---
# GX game-feel overhaul — current (2026-09-23)

The owner handed the project over to make it truly feel like a video game (slicker, more fun UI, generated assets
allowed, everything on main and pushed). Read `handoff/GX-GAME-FEEL.md`. The game shell, title screen, tile menu,
GX screens, race FX/results, Time Attack with ghosts and medals, Quick Race difficulty, crew portraits and radio,
achievements, Options and Tour Log live under `src/game/`. Physics, routes, race rules, reward certification and
the career save schema are unchanged. Performance remains HOLD; do not start Phase 3 automatically. Pushing main
deploys the existing Vercel game. Earlier headers below are history.

---
# Current cross-machine transfer (2026-09-22)

The owner explicitly authorized committing the remaining work and pushing main so it can be
pulled on another system. This supersedes earlier local-only/no-push restrictions for this
transfer. Read `handoff/NEXT-MACHINE.md` first. All four rider/UI/cinematic/audio worktrees and
the subsequent rider-hand repair are integrated. Continue from main; no old worktree is needed.
Preserve physics, saves, approved assets and historical evidence. Performance remains HOLD;
no automatic Phase 3, subagents, spending or separate deployment. The original untracked
`P06C-HOME-KICKOFF.md` is untouched; a byte-identical historical copy is now tracked under
`handoff/history/` for recovery. Earlier headers below describe completed assignments.

---
# Rider hands repaired (2026-09-22)

The owner reported malformed rider hands after integration. Read `handoff/RIDER-HANDS.md`
and its validation receipt. The Tour glove geometry is rebuilt with stable curl sections;
its opted-in grip pose follows the tilted Slingshot wheel and horizontal Ryker bars.
Preserve the merged rider/UI/cinematic/audio work, original rider, vehicle physics,
career saves and owner file. Performance HOLD, one lead and local-only policy remain.

---
# Four completed worktrees integrated on main (2026-09-22)

The owner authorized merging the rider, premium racing UI, race cinematics and audio
worktrees and repairing their combined behavior. Read `handoff/WORKTREE-INTEGRATION.md`
and `handoff/WORKTREE-INTEGRATION-VALIDATION.json` for recovery points and verification.
The original worktrees and `codex/integration-baseline-20260922` remain recoverable.
Preserve the complete Ryker, Slingshot tuning/history, routes, reward certification,
career saves and Phase 2 render fixes. Both soundtrack systems share Music off;
scene music yields during cinematic scoring on the captured master graph.
Performance remains HOLD; no Phase 3. One lead, no subagents, spending, push or
deployment. The owner handles publication. Preserve untracked `P06C-HOME-KICKOFF.md`.
Earlier headers below record completed work.

---
# Ryker 900 complete vehicle — local implementation (2026-09-22)

The owner authorized Ryker-owned physics and the shared interfaces needed for a fully playable
second vehicle, superseding the prior visual-only restriction. Read `handoff/RYKER-COMPLETE.md`,
`handoff/RYKER-VALIDATION.json`, `assets/ryker/PHYSICS.md` and `assets/ryker/PRODUCT-REFERENCES.md`.
Implementation commit: `7b5018570ed0bb40f83e25e9c6bba96b435aca9e`.
The purchased originals remain untouched. The complete assembled vehicle, independent CVT,
articulated stock/Elka parts, four upgrades, original engine synthesis, earned career workshop,
immutable run identities and Blender showroom route relief are implemented locally.

Preserve Slingshot tuning/history, routes, reward certification, UI repairs and Phase 2 render fixes.
Performance remains HOLD; this work does not start Phase 3. One lead; no subagents, spending,
source publication, push or deployment. The owner handles any later publication. Preserve the
untracked owner `P06C-HOME-KICKOFF.md`. Earlier headers below are history.

---
# Phase 2 performance: render CPU fixes (2026-09-22)

Read `handoff/PHASE-2-PERF-FIX.md` and `PHASE-2-PERF-FIX-VALIDATION.json`. High harbor dusk-rain
CPU per frame 13.6 -> 9.7 ms with three exact fixes (transparent halves through one shader program,
transforms once per frame, rear presenter measured on demand); pixels unchanged (72-view A/B).
Each fix has an evidence switch (`?perf=legacy-transparency|matrix|rear`, `__EXPRESS.setPerf`).
Gate still HOLD: a quiet attempt met p95/p99/max and the 10 ms average but not worst-1% (24.8 ms);
the final High/Ultra run needs a quiet PC. Committed locally; the owner pushes.

---
# UX, career and showroom repair (2026-09-22)

Owner-assigned repair of all 15 findings in `handoff/ux-audit-packet/` plus a UI pass. Read
`handoff/UX-REPAIR.md` and `UX-REPAIR-VALIDATION.json`. The player career garage (`?scene=bay`)
now runs on the signature showroom in career mode (`src/showroom/garage.ts`); the retired
workbench bay is a developer tool (`?workbench=1` or its fixture params). Camera containment,
presets and snapshots live in `src/presentation/showroom-camera.ts`; the Continue resolver is
`nextCareerStep()`; temporary careers travel via `src/career/transfer.ts` and the read-only
`src/career/context.ts`. Preserve Sport v5 physics/input, routes, products, saves, reward
certification and history. Pushed to main by the owner; Vercel deployed `5486206` and
it is live and kept.
Phase 2 performance HOLD unchanged; do not start Phase 3.

---
# Phase 2 closing gate - pipeline parity done, performance HOLD (2026-09-22)

Read `handoff/PHASE-2-CLOSING-GATE.md` and its validation receipt. The bounded
1440p sustained runs retain a performance HOLD. Do not start Phase 3.
Calibration/test warmup and statistics are repaired; production road rendering,
Sport v5 physics/input, assets, products, saves and history are unchanged.
Continue one lead on main and the existing hosted game. No subagents, new site,
vehicle, dependency, archive or spending. Leave the prior heartbeat unchanged.

---
# Phase 2H - shared surface textures (2026-09-22)

Remaining flat scenery and garage materials now use the existing texture sets
through one shared pass. Preserve Sport v5 physics/input, routes, products,
progress, vehicle finishes and all historical records.
Read `handoff/PHASE-2H-SURFACES.md` and its validation receipt. Next is the
Phase 2 benchmark/pipeline and sustained-performance gate before Phase 3.
Continue one lead on main and the existing hosted game; no subagents, new site,
vehicle, dependency, archive or spending. Older sections are history.

---
# Phase 2G - shared Ridge forest (2026-09-22)

Ridge career events, quick races and test runs share the existing P11 trees,
wind, terrain textures, ground cover and forest atmosphere. Preserve Sport v5
physics/input, routes/colliders, products, progress and historical records.
Read `handoff/PHASE-2G-FOREST.md` and its validation receipt. Next is 2H.
Continue one lead on main and the existing hosted game; no subagents, new site,
vehicle, dependency, archive or spending. Older sections are history.

---
# Phase 2F - driving contact and stable chase shadows (2026-09-22)

The owner asked to continue the next roadmap slice. All production road modes
now share terrain-projected contact shadows and a stabilized chase sun map.
Preserve Sport v5 physics/input, products, progress and historical records.
Read `handoff/PHASE-2F-SHADOWS.md` and its validation receipt. Next is 2G.
Continue one lead on main and the existing hosted game; no subagents, new site,
vehicle, dependency, archive or spending. Older sections are history.

---
# Phase 2E - shared vehicle effects (2026-09-21)

The owner asked to take over the next roadmap tasks after driving parity.
Phase 2E is implemented in the shared road runtime: pooled wheel/contact effects,
session skids, brake glow, headlight fog and fitted-exhaust effects. Preserve the
Sport v5 physics/input, existing builds, progress and history. Read
`handoff/PHASE-2E-VEHICLE-EFFECTS.md` and its validation receipt. Next is 2F.
Continue one lead on main and the existing hosted game; no subagents, new site,
vehicle, dependency, review archive or spending. Older sections are history.

---
# Story and driving parity (2026-09-21)

The owner requested uniform use of the best completed driving/build work across
career/story, quick races and test runs, with no new feature or physics retune.
All production road entries now use `src/express.ts`, including Chapter 01 via
`src/career-experience/chapter-one-race.ts`. Sport v5 is used for every new drive,
retry and resumed entry; historical recipes/results remain archived. Completed
Cup stages keep their original tune and remaining stages use current physics
with the Cup's original equipment. Do not restore mode-specific old runtimes or
optional old driving defaults. The retained pad and showroom also use v5.

The completed Phase 2D water work at `582c937` is included. Existing models,
products, camera/effects, mirrors and graphics pipeline are shared with story.
Read `handoff/STORY-PARITY.md` and its validation receipt. One lead; no new
features, subagents, review ZIP, site or spending. Earlier handoffs are history.

---
# Static console detail (2026-09-21)

Latest owner request: restore visual R/N/D/M center-console buttons only.
No shifting, controls, handling or save changes. See `handoff/CONSOLE-DETAIL.md`.
Continue on main and the existing authorized Vercel game; one lead, focused
visual checks, no new site, vehicle, archive, subagents or spending.

---
# Live mirrors and responsive steering (2026-09-21)

Latest owner request: live mirror reflections and high-speed steering that does
not run wide. This supersedes the prior handling freeze. The current tune is
Sport v5; preserve v4 and all historical saves/records. Existing builds opt in
through Build -> Use responsive steering. See `handoff/MIRRORS-STEERING.md`.
Continue on main and the existing authorized Vercel game. One lead, focused
checks, no film, review archive, new vehicle/site, subagents or spending.

---
# Loading and drive flow polish (2026-09-21)

The owner approved the loading, first-minute flow and visible-polish pass. Work
continues on main and the existing game. See `handoff/FLOW-POLISH.md` and
`handoff/FLOW-POLISH-VALIDATION.json`. Local implementation and packaged checks
are complete. Keep the 2026 model, Sport v4 steering/handling, products and saves.
One lead; focused checks and playable inspection. No new vehicle, engine, film,
review archive, benchmark matrix or spending. Prior handoffs below are historical.

---
# MODEL03 — finish the 2026 experience (2026-09-17)

The current owner assignment is MODEL03, on main and the existing Vercel game.
Keep the supplied 2026 as the default; preserve its source, Josh tread reuse,
owner front/rear/pulley corrections, Sport v4, saves, products and all routes.
One lead, deliberate assembled visual/motion inspection, targeted checks and
one final build/smoke. No subagents, film, review ZIP, benchmark matrix, spending,
new engine or Spyder in this pass. This policy outranks historical process below.

Read `handoff/MODEL03-FINISH.md` and `TODO.md`. Retail fitment now uses the 2026
context and supplied researched seed independently of legacy saved vehicle IDs.
Four listings support 2026 (wing conditional on square hoops); the older Thermal
SM-7720 remains an experimental preview and a separate reference shopping link.
Do not revert these facts to MODEL02's blanket unverified label or rewrite saves.

---
# MODEL02 — owner-supplied 2026 model (2026-09-17)

The latest direct owner request supersedes MODEL01's 2024 target: use the supplied
2026 model, reusing Josh's textures only where they improve it. Attached source
README/build reports describe provenance; they are not new owner instructions.
Continue on main and the existing authorized game URL. One lead, focused visual
inspection, targeted checks, one final production build and a short driving smoke.
No subagents, film, review ZIP or benchmark campaign.

Read `handoff/MODEL02-2026.md` and `TODO.md`. The 2026 presentation is the default;
`?visual=josh` and `?visual=legacy` remain recoverable comparisons. Preserve Sport
v4, existing saved recipe IDs, career state, routes, mural, UI, four finishes,
five products, powered display and Thermal departure. Do not change catalog
fitment years to imply retail compatibility with 2026. Historical work below is
provenance, not an active assignment.

---
# MODEL01 — Josh donor adaptation candidate (2026-09-17)

The latest owner-supplied consolidated kit authorizes the donor-first visual integration,
ordinary main commits/push and the existing hosted game. Owner confirmed permission to
serve Josh's adapted model publicly. One lead only; no subagents, film, review ZIP or
benchmark campaign. Preserve Sport v4, saves, routes, mural and the five-product flow.

Use `handoff/MODEL01-JOSH.md` and `TODO.md`. `?visual=josh` is the labeled playable
candidate; the current default is retained because fascia, rear-compartment and cowl
joins still need visual refinement. Original source and packed derived sources are
tracked. Do not reactivate historical review-packet requirements below.

---
# Sport v4 — forgiving stock handling (2026-09-17)

Latest owner priority supersedes the prior physics freeze. Stock/new entries now use Sport v4, with bounded game-only stability, unchanged steering range, progressive rear traction reserve, front-biased load-aware braking and smaller suspension impact kicks. Existing builds/records/active events retain their versions. **Build → Use forgiving driving** makes a current copy while keeping the original and all career progress. No purchase or reset required.

See `handoff/FORGIVING-HANDLING.md` for the focused diagnosis, assist bounds and smoke-test results. Continue on main through the existing Vercel Git deployment. This assignment adds no review ZIP, film, vehicle, performance project or reviewer agents. Historical handoffs below remain provenance, not current tune instructions.

---

# P10B Cinematic Identity — complete, Review21 delivered

Continue on main. Frozen playable runtime: `bc657a1f9cd77506569e2ac1ee368d75431c42e2`. Cinematic entry/build/destinations/shop/career/HUD/results, scoped studio lighting/materials/framing, transitions and the physical left-side Tour Wall are implemented. All existing gameplay, Sport v3, routes, products, finishes, ownership/saves, dashboard and Thermal departure are preserved. The first-use finish hitch was repaired before final capture.

269 tests and 10 native races pass. Full UI/save/career/audio/display/departure regressions, real reference comparisons and remote-clone build/browser proof pass. Existing canonical hosted root was exercised through full race/retry/return, three destinations and physical mural; all111 public assets match Git. Runtime/source details, precise limits and commands: `handoff/P10B-CINEMATIC-IDENTITY.md`, `P10B-VALIDATION.json`. The 194-second current film includes actual game audio and a continuous race. Source remains stylized relative to photographic concepts; no G3/G4, final OEM fidelity, physical hardware or human listening/fun approval is implied.

Play: https://slingmods-three-wheel-tour-rebuild.vercel.app/ . Local http://127.0.0.1:5197/ ; recover with `npm ci`, `python scripts/verify-p10b-assets.py`, `npm run demo:build`, then PowerShell `$env:PORT='5197'` and `npm run demo:preview`. Required runtime/editable inputs: `P10B-REQUIRED-ASSETS.json` (166 files); all303 runtime input bytes match the frozen candidate. Git attributes preserve historical line endings across machines; their content was not rewritten.

Completed `Astra-Review-21-Lean.zip` (47,863,446 bytes) and its receipt are committed to main at archive commit `04d2fa325ae2218ac788693c7fc9b58d52755d10`, and verified after remote retrieval. `P10B-PACKET.json` records the archive after creation; `P10B-DELIVERY.json` records final remote retrieval and latest hosted identity after the archive push. All 310 ZIP entries, 145 numerical members and 619 original evidence files pass retrieval checks. Read `handoff/P10B-DELIVERY.json` for distinct runtime, packaging, archive, recovery and hosted identities. Final source and raw media are recoverable from Git; tools, credentials and personal browser saves are not.

Next action after delivery: Astra/owner Review21 feedback. Preserve historical evidence/ZIPs and unrelated owner folder `SlingMods-Astra-Director-Review-17/`. No spending, new project/site/vehicle/route/engine, physics retune, visibility change, desktop takeover or force push.

---

# Historical completed assignments

# Current handoff - P10A Ridge Run, on main

P10A is implemented, internally repaired and validated. Frozen gameplay/native/film candidate: `28daf3a4dfb702e2b4829ffda683cffeb117c858`. Fresh remote recovery and complete hosted gameplay: `f4bc5720afa70cec91dfebacf16c8ee6e92be106`. All 263 tests and 22 native race attempts pass. The physically elevated Smoky Ridge route, two lighting conditions, free drives/races and three-event Chapter 03 are playable. Sport v3, all products, prior routes, showroom, vehicle, audio, ownership and saves remain.

Play at https://slingmods-three-wheel-tour-rebuild.vercel.app/ . Local: `npm ci`, `npm run demo:build`, then PowerShell `$env:PORT='5197'` and `npm run demo:preview`; open http://127.0.0.1:5197/ . Read `handoff/P10A-RIDGE-RUN.md` for exact next-machine/asset/validation commands.

Deliverable: `Astra-Review-20-Lean.zip`, with current continuous full-lap film and actual game audio. Exact ZIP size/hash and packaging/runtime commits are in `handoff/P10A-PACKET.json`. `P10A-VALIDATION.json` records completed tests; `P10A-DELIVERY.json` records final remote archive retrieval and hosted identity after the archive push. Resolve archive commit with `git log -1 --format=%H -- Astra-Review-20-Lean.zip`; resolve actual main using `git ls-remote origin refs/heads/main`. Later receipt-only commits do not imply another gameplay version. Full runtime/editable assets and all original evidence/media are in Git; browser saves, tools, drivers and credentials are not.

Next action: Astra/owner review of Review20 and driving feedback. No new assignment inferred. Continue on main; preserve every historical packet and unrelated owner folder `SlingMods-Astra-Director-Review-17/`. No spending, new project, account/visibility changes, desktop takeover or force push. Severe sustained rail wedging can retire AI; ordinary brush recovery passes. Art remains stylized; physical hardware breadth, human fun/listening, G3/G4 and global OEM fidelity remain unapproved.

---

# Historical completed assignment

# Current handoff — P09C Freedom to Drive, on main

P09C is implemented, internally repaired and validated. Continue on **main**. The current remote is https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git and reports PUBLIC; do not change visibility. Preserve older assignments and all owner work below as historical context.

Tested game implementation: `5b2c99af2c567c04b5ea9d896765e7a6ddeec25e`. Fresh remote recovery: `07be27016bd93b3a166ee064594e21ba26bb2fe0`. Complete hosted gameplay: `b45c13695cfb1f8277cb4755a63ca80b4fe4e8c7`. Later proof/archive/receipt commits do not change the game inputs. Resolve the current main tip with `git rev-parse HEAD` and `git ls-remote origin refs/heads/main`; resolve the archive-addition commit with `git log -1 --format=%H -- Astra-Review-19-Lean.zip`.

Sport v3 provides bounded steering reserve, smoother response and steering available under braking. New ordinary entries consistently use it; explicit historical recipes and frozen event/Cup versions retain their tune. **Build Presets → Use current driving → Save build** creates a durable current version while preserving the original. All existing ownership, progress, UI, sounds, display, Thermal departure, showroom, vehicle refinements and products remain.

Validation: 250 tests, normal/curated/Vercel builds, matched motion and transitions, historical v2 equivalence, full browser profile/career/save/audio regressions, all 16 native race attempts and two cockpit attempts pass. The fresh remote checkout also passes the entry matrix and a native race. Complete original/final data, failures, raw captures and selected film are in `director-kit/production/evidence/P09C/`.

Play locally at http://127.0.0.1:5197/ after `npm ci`, `npm run demo:build`, then `$env:PORT='5197'` and `npm run demo:preview`. The server prints its owned PID and stop command. The existing authorized hosted root is https://slingmods-three-wheel-tour-rebuild.vercel.app/. Its curated output excludes source, evidence, ZIPs and editor assets; missing files return404. Vercel reports only its `vercel.json` checkout change, with no tracked runtime input changes; the truthful hosted `-working` label remains. Actual root/gameplay and effective HTTP behavior are verified separately.

Review packet: repository-root `Astra-Review-19-Lean.zip`. `handoff/P09C-PACKET.json` records its exact hash, size and packaging identity after creation. `handoff/P09C-VALIDATION.json` and `handoff/P09C-FREEDOM-TO-DRIVE.md` contain scope, measurements and portable commands. Required runtime/editable assets: `handoff/P09C-REQUIRED-ASSETS.json` (128 preserved inputs). Later remote archive verification belongs in `handoff/P09C-DELIVERY.json`; these identity records are separate to avoid recursive hashes. Preserve the unchanged Review18 ZIP.

The owner requires the completed archive and all required source/editable/runtime assets on main. Browser saves, tools and caches do not transfer through Git. The full checkout is approximately4GB because historical evidence is retained; the lean ZIP is the smaller review transfer. See the focused handoff for exact installation/evidence commands and cache disclosure.

Next action: send Review19 to Astra and collect owner driving feedback. Do not invent a new assignment. Human enjoyment/listening, physical controllers/destination hardware, G3/G4 and final OEM fidelity remain open. No spending, account/plan/visibility changes, unrelated sites, desktop takeover or force-push.

---

# Historical completed assignment

# Current assignment state — main / P09B complete

The owner explicitly authorized merging and continuing directly on main. Merge/push completed at ea58b4f9c1df98ab16629bce24721596b6a43e32. Work directly on main for subsequent owner instructions; do not resume an older feature branch. The prior no-main restrictions below are historical and superseded. No public deployment, spending, account changes or desktop takeover.

P09B Signature Finish is implemented, internally repaired and validated. Read HANDOFF.md, handoff/P09B-SIGNATURE-FINISH.md, handoff/P09B-VALIDATION.json and handoff/P09B-PACKET.json for tested runtime, remote recovery, final media, exact packaging identity and limitations. Retain existing gameplay, schema4 saves, all products, owner front/hoop/showroom art and historical evidence. G3/G4, final OEM fidelity, physical hardware and human listening/release approval remain open. Next action is Astra review of Review18; do not invent a new assignment. Continue authorized future work on main.

Delivery policy: the owner requires completed review ZIPs and all source, editable/runtime assets, evidence and portable handoff needed on another machine to be committed and pushed to main. The current tracked archive is Astra-Review-18-Lean.zip. Preserve its reviewed bytes and use its receipt for verification. Secrets, tool installs and personal browser saves do not belong in Git.

---

# Historical owner assignments

# Current owner refinement - roll hoops and Review17 update

The latest request authorizes removing the four invented rear hoop braces while keeping the existing finish, and including this plus the front correction in the updated Astra Review17 ZIP. Preserve all other game/asset work. Read HANDOFF.md and handoff/HOOP-REFINEMENT.json; previous headers below are historical. Existing feature-branch push authorization and no spending/publication/main-merge/desktop-takeover boundaries continue.

Local completion: runtime 5b2c99af2c567c04b5ea9d896765e7a6ddeec25e; 250 tests and both builds pass. All 16 native race attempts and two cockpit attempts pass. Film and complete failed/final data are retained under director-kit/production/evidence/P09C. Fresh remote recovery, canonical hosted gameplay and final archive delivery are the remaining checks.

---

# Current owner assignment - bounded front fascia refinement

The latest direct request authorizes front gap closure, continuous accent lamps, a fuller splitter and honeycomb grille. Preserve the center lamp, non-target model, showroom/game/UI/saves and reviewed outputs. Read HANDOFF.md and handoff/FRONT-REFINEMENT.json. Continue the existing feature branch with ordinary commits/push; background Blender and isolated browsers only. No main merge, publication, spending, desktop takeover or gate approvals. Earlier assignment headers below are historical.

---

# Current assignment - P09A Own the Build / Review17

The latest owner request authorizes `director-kit/director-addenda/review-16/CODEX_NEXT.md` and its linked packets, plus explicit crash/flip recovery. Continue `feature/p09a-own-the-build` from P08B 51f34a341200cf76bf69106bdfae300590419e88. One lead plus two bounded implementers; isolated browser testing only. Preserve showroom, finishes, departure, five free previews, historical dynamics/evidence and career progress. Authorized changes: versioned Sport v2 braking/contact policy, responsive preparation, earned existing-product chapter, explicit recovery. Ordinary feature-branch commits/push authorized. No main merge, publication, spending, account changes, desktop takeover or gate approval. Prior headers below are historical, not active next actions. Current delivery status is in HANDOFF.md and handoff/P09A-VALIDATION.json when complete.

---

# Historical assignments (all headers below are historical)

# Current owner refinement � showroom materials, bay exit and swingarm palette

The latest owner request and four photographs are recorded without credentials in `director-kit/director-addenda/review-16-owner-refinement/OWNER-REQUEST.md`. They authorize the bounded showroom texture/lift/closed-door refinement, skippable presentation exit, swingarm accent fix, suitable generated door audio, and updated Review16 packet. Continue the current P08B feature branch and preserve historical source/evidence. Ordinary feature-branch commits/push remain authorized; no main merge, publication, account changes, desktop takeover or gate approval. One bounded ElevenLabs generation used the owner-supplied temporary credential; never write a credential to source, evidence or a review packet.

---

# Current assignment — P08B SlingMods Signature Experience / Review16

The owner authorizes director-kit/director-addenda/review-15/CODEX_NEXT.md and all six packets. Continue feature/p08b-slingmods-experience from P08A ef592752741333faee496edff95b8abb68b76840. This supersedes older freezes only for the authorized Sport handling, Express, showroom/vehicle repairs, five-product free configuration and overall UI. One integrator and up to three non-overlapping workers are authorized by the current packet. Isolated browser testing and background Blender only. Preserve the original Harbor, historical evidence, career saves and reviewed outputs. Ordinary commits and push to the existing private feature branch are authorized. No main merge, publication, spending, desktop takeover or account/store changes. G3/G4, final OEM fidelity, hardware, human listening/fun and release approval remain held. Public hosting is pending separately, not a development blocker. Read HANDOFF.md and handoff/P08B-VALIDATION.json for the final tested identities.

---

# Current return point — P08A Build Matters / Review15

Dan's 2026-09-15 directive authorizes the bounded builder-racer expansion and ordinary feature-branch commits/push. Read HANDOFF.md, handoff/P08A-DESIGN.md and handoff/P08A-VALIDATION.json. Preserve the implementation and historical evidence; no automatic new assignment. Branch feature/p08a-build-matters; game implementation ec6876551542ec39111fbf26253c4528c2290cfc. No merge to main, deployment, spending, desktop takeover, account/site changes or G3/G4/final fidelity/hardware/release approval. Public hosting remains pending and is not a development blocker. One lead and one bounded independent reviewer; isolated browser tests and background Blender only. Older restriction headers below are historical and superseded only within P08A.

---

# Current return point - P07B local preflight and remote handoff complete

Read HANDOFF.md first, then director-kit/director-addenda/review-14/CODEX_NEXT.md, AUDIT.md and packets/P07B-HOSTED-DEMONSTRATION.md. Review14 accepts the bounded P07A local demo. Do not restart P06C/P07A or re-export assets to launch it.

The owner's accompanying handoff/OWNER-DIRECTIVE-P07B.md explicitly authorizes intended commits and ordinary push to existing private DanielKinsner/slingmods-three-wheel-tour-rebuild main. This overrides older no-push instructions for this handoff. Preserve remote work and P06C-HOME-KICKOFF.md. No force pushes, resets/history rewriting, spending, deployment, account linking, unrelated process changes or desktop takeover.

P07B local launch/preflight and fresh remote clone verification are complete at tested commit886a0d41d87320b87ea4458f8f261ad07f637ac6; see handoff/P07B-VALIDATION.json. Do not repeat them automatically. External publication is pending explicit owner authorization and eligible target access. Preserve game source, all vehicle/driver/world/physics/rivals/rewards/storage; changes are static delivery, MIME, noindex, portability instructions and transfer verification only. One lead and one bounded reviewer. Preserve all historical proof. G3/G4 and global art/physical-device/listening approval remain held. Do not repeat completed content or begin a new assignment after this handoff. The next action is the pending publication step after owner authorization, using this candidate.


---

# Historical record below (superseded)

# Current return point — P07A Shareable Showcase / Review14

P07A is implemented and locally validated; Review14 is prepared as a lean review-only return. Read the final P07A review introduction and indexes. No automatic new work after delivery.

The latest user authorizes director-kit/director-addenda/review-13/CODEX_NEXT.md and all required packets, including LEAN-REVIEW-DELIVERY.md. Read HANDOFF.md for historical identity, RESUME.md and current production state. Continue the current checkout; P06C is retained and must not be restarted. Preserve P06C-HOME-KICKOFF.md, all source/history/evidence and protected simulation/vehicle/route/career contracts. P07A permits demo-profile isolation, visitor UI, approved branding/product connection, exact bay extraction, measured performance repair and allowlisted local static output. One lead, at most two bounded helpers, separate independent review. No heavy authoring/tests/media concurrent with benchmarks. No desktop takeover, unrelated process changes, spending, remote push/merge, account linking or deployment. Return one review-only Astra-Review-14-Lean.zip, target 60,000,000 bytes, cap 100,000,000 bytes, after internal repair/validation. Performance uncertainty blocks SHARE-READY, not safe local work; G3/G4 and final art remain pending. Earlier headers below are historical.

# Completed local implementation — P06C Built Waterfront

Review13 is prepared with performance HOLD; read RESUME.md and the P06C REVIEW-ME-FIRST.md. Last accepted director review is Review12. Do not automatically repeat completed P06C or start new features; await the director decision. Second repeated-race p95 is 33.3 ms against 20 ms, reproduced twice; host contention is plausible but unproven. Preserve failed runs and unrelated jobs.

The user supplied SlingMods-Astra-Director-Review-12.zip on this machine and authorized P06C in the existing checkout. Read HANDOFF.md for baseline, RESUME.md for current progress, and director-kit/director-addenda/review-12/CODEX_NEXT.md plus its required packets. The implementation pause below is superseded only for this assignment. Preserve existing/uncommitted work; no restart, remote writes, deployment, spending or desktop takeover. Official Blender download and routine local setup/testing/recoverable commits are authorized. Finish the integrated assignment and prepare Astra-Review-13.zip; do not redo completed milestones. G3/G4 and final environmental art remain pending.

# Historical handoff authority — 2026-09-14

Read `HANDOFF.md` first. This is the existing standalone rebuild, already implemented through P06B and delivered for Review12. Do not repeat kickoff or create another game project. Resolve all paths relative to this checkout, not the originating machine's username.

The user explicitly authorized merging/pushing the complete handoff to main and selected the private repository `DanielKinsner/slingmods-three-wheel-tour-rebuild`. This overrides the older no-remote instruction only for this handoff. No deployment, spending, desktop takeover, unrelated history rewriting or new feature work is authorized. Implementation is paused awaiting Astra's next packet; do not automatically execute the last completed packet again. G3/G4 remain pending and the environment visual target is NOT met.

Preserve vehicle/rear/driver, shared physics, route/rules, products/ownership/saves and historical evidence. Source, editable Blender assets, director packets and selected current runtime evidence are in Git. `HANDOFF.md` describes local-only archives/tools/personal browser saves and next-machine validation. Use isolated browser tests and background Blender; do not control the user's desktop. Older absolute capture paths are historical provenance, not instructions to use the old workspace.

The sections below record historical authorizations; this current header and the user's latest instruction take precedence.

# COMPLETED ASSIGNMENT — P06B Environment Quality Lock

Read director-kit/director-addenda/review-11/CODEX_NEXT.md and required packets. Replace presentation-only scenery, road UV/materials, terrain, foliage, outdoor lighting and compact showroom finishes using verified free CC0 sources and editable Blender assets. Preserve physical course/collision, car/rear/driver, physics/input, rivals/rules/chapter/products/rewards/saves. One lead plus two bounded workers, independent local review. Benchmark then rollout and full runtime/performance validation in one run. Return Astra-Review-12.zip. Local recoverable commits permitted; NO remote changes, spending, deployment or desktop takeover. G3/G4 remain pending. This supersedes older push and rendering-freeze instructions.

# PRIOR ASSIGNMENT — P06 Harbor Showcase

Read director-kit/director-addenda/review-10/CODEX_NEXT.md and its required packets. P06 authorizes harbor/compact garage Blender art, lighting, UI, audio capture and measured rendering work while preserving hero/rear/driver geometry, route/collisions, physics, race rules, products and saves. One lead and at most two narrowly scoped workers; one final Review11. G3/G4 remain pending. The user's latest explicit instruction overrides the packet's no-push rule: finish on main and push the intended work to the confirmed remote; no deployment or spending. Review ignore rules while preserving local historical evidence and editable assets. The rebuild currently has no remote; obtain its intended destination before adding one.

# Historical assignments — context only, not active scope restrictions

Follow director-kit/AGENTS.md and director-kit/FRESH_START_POLICY.md. This is the new standalone implementation. All gate evidence belongs under director-kit/production/evidence. Do not modify the supplied sibling kit or import legacy game assets. Use background Blender and isolated headless browser tests. Independent reviewer required by the kit; at most three active workers, non-overlapping ownership.

The fresh-start requirement is already fulfilled by THIS standalone repository. Continue here; do not scaffold another project. The previous assignment was director-kit/director-addenda/review-01/CODEX_NEXT.md (Astra review01): targeted RPM correction plus P03A vehicle surfaces/maps, compact material-inspection bay and same-asset pad/shadow proof. Preserve P01 and historical evidence. No rider, full original P03, campaign, races, other vehicles or G3 PASS in this packet.

Current assignment: director-kit/director-addenda/review-03/CODEX_NEXT.md. Execute only P03A2 bounded front-shell proof and independently authorized P03B1 input/chase/practice route. P03A1 retained with visual HOLD; a locally reviewed P03A2 repair is provisional development use only. Preserve engineering, historical evidence and all unrelated work. Return Astra-Review-04.zip then stop; G3 pending.

Current superseding assignment: director-kit/director-addenda/review-04/CODEX_NEXT.md, P03B2 First Drive. Driver, cockpit, quick held rearward view and shared telemetry audio are explicitly authorized while whole-vehicle fidelity remains held. Keep the current car/source/maps, bay/pad, contact and accepted physics/shadow policy unchanged. No spending, campaign or G3 advancement. Return Astra-Review-05.zip then stop.

Current superseding assignment: director-kit/director-addenda/review-05/CODEX_NEXT.md, P04A Harbor Shakedown. Bounded audio pitch correction, one Blender harbor course and day/night timed event are explicitly authorized. Preserve car/driver and accepted equations; only documented environment/reset/event seams. G3/G4 remain pending. Return Astra-Review-06.zip then stop.

Current superseding assignment: director-kit/director-addenda/review-06/CODEX_NEXT.md. P04A1 rear assembly integrity overrides the vehicle freeze only for rear clearance and mechanical presentation. P04A2 permits exactly palms, road materials and waterfront lighting cleanup. Preserve front/cockpit/driver/physics/input/audio/event and route. Maximum two evaluated rear geometry revisions, then honest HOLD. Return Astra-Review-07.zip and stop; G3/G4 pending.

Current superseding assignment: director-kit/director-addenda/review-07/CODEX_NEXT.md. P04B1 Make It Yours: one cosmetic SM-133 base-kit ownership/credit/preview loop and existing Harbor night drive. Rear repair accepted for continued development, not global fidelity approval. Preserve current car/rear/driver/route/physics/audio; no scenery/bodywork/campaign/spend or G3/G4 advancement. Return Astra-Review-08.zip then stop. One lead and one bounded artist only.

Current superseding assignment: director-kit/director-addenda/review-08/CODEX_NEXT.md. P04B2 Night Drive permits measured lighting/renderer preparation/lifecycle and capture fixes only. Preserve geometry, physics, race/economy/saves. One lead plus one bounded helper; two evaluated fix cycles maximum. Return Astra-Review-09.zip then stop, G3/G4 pending.
