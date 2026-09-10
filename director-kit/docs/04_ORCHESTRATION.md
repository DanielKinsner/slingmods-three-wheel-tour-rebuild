# 04 · The orchestration system

## Change the development loop, not just the adjectives

"More realistic," "AAA," and "keep polishing" are not work packets. The local lead must translate each goal into a small artifact, an observable comparison, and a decision. The first four gates are designed to reveal failure while it is still cheap to replace a model, camera, rendering approach, or dynamics subsystem.

The owner has delegated routine decisions. A completed gate advances without asking him to select an option. A failed gate does not advance just because significant work went into it. A safety/permission blocker remains a blocker; find a safe local alternative rather than repeatedly interrupting him.

## One director, bounded specialists

The local Codex lead owns integration, task scope, current state and final decisions. Use no more than three active workers. Small independent assignments outperform a swarm editing shared files. Each packet names one primary owner, exact writable paths, read-only contracts, and evidence. One writer owns each `.blend` file and a separate reviewer examines its exports.

| Role | Owns | Does not own |
| --- | --- | --- |
| Vehicle technical artist | references, vehicle Blender sources, part mounts, rig, UVs, LOD exports | physics tuning, arbitrary scene-wide postprocessing |
| Driving engineer | contact solver, drivetrain, input, dynamics tests, AI driving contracts | visual cheating or catalog facts |
| Environment / look-development artist | garage, track kit, materials, lights, quality presets | hiding inaccurate models with darkness |
| Gameplay / commerce engineer | race validation, rewards, saves, story delivery, fitment and shop adapter | undocumented horsepower gains or real storefront writes |
| Review / integration role | direct evidence inspection, regression and performance checks, accept/reject | generating a PASS from the implementer's summary alone |

The lead may perform specialist work sequentially. Use an independent reviewer agent when available. If the same agent must review in a separate pass, disclose that in the evidence manifest; do not invent an independent second person. Native Codex AGENTS/subagent facilities may be used where actually available [T5, T6]. This kit does not require an API-based agent framework, another subscription, or unattended cloud orchestration.

## Execution loop

Read state → select earliest runnable packet → verify prerequisites → assign narrow ownership → implement a representative sample → run relevant checks → capture evidence → reviewer examines evidence → repair or accept → commit accepted increment → update state and report the next executable packet.

Use `production/gates.json` as the acceptance registry and `production/state.json` as the working ledger. The latter is only a ledger; an entered status does not satisfy a gate. `tools/check_gate.py --gate Gx` validates the review/evidence manifest recursively through prerequisite gates. Integrate that check into the project's preview/merge workflow during G0 once actual commands are known. The included script alone does not install a Git hook or operate Codex.

Read the game brief once per lead session, not at every small edit. Subagents receive the current packet and relevant contracts, not 50 pages of aspirations. As a working allocation target, spend most of the session implementing and examining the result rather than rewriting plans.

## Gate sequence and stop rules

| Gate | The proof | What is still prohibited |
| --- | --- | --- |
| G0 · Fresh workbench | New standalone directory/Git repo, fresh runnable foundation, isolated saves, real Blender export/import and isolated capture; old game untouched | Old-code/asset imports, old-save migration, production mutation, paid batches |
| G1 · Recognition | Source-backed three-vehicle dimension/blockout pass and recognizable Slingshot clay geometry exported into the game | Full Spyder/Ryker detailing; full city construction |
| G2 · Driving | Real three-contact test-pad handling, correct steering, brakes, surfaces, camera and powertrain telemetry | Story sprawl; extra tracks; declaring physics finished from a library choice |
| G3 · Runtime presentation | Finished Slingshot, rider, garage, day/night, actual audio/drivetrain sync, 150–250 m hero track sample, measured render profile | Multiplying unreviewed assets or locations |
| G4 · Complete slice | One finished short race, three rivals, story beat, three parts, fitment, save/reward/shop loop, actual day/night footage with audio | Full fleet/campaign production before both look and play pass |
| G5 · Fleet | Finished F3-T and Ryker Rally, distinct six-speed/CVT behavior, riders, compatible initial parts and class balance | Campaign rollout with token reskins or identical handling |
| G6 · Campaign | Each of five destinations independently accepted; eight chapters, coherent economy, ghost and photo modes | Batch-generating locations and testing only the first |
| G7 · Release candidate | Regression, physical target checks, rights/secret/accessibility review, authorized deployment route | Claiming public release or production readiness with unresolved blockers |

G1 and G2 can run in parallel after G0 with separated ownership. Both must pass before G3. G3 must pass before G4; G4 before G5; G5 before G6; G6 before G7. Within G6, apply a miniature version of G3/G4 to one location at a time.

The clay car in G1 is explicitly a diagnostic asset. The test pad in G2 is explicitly not a finished environment. Passing either alone is not permission to market the game as realistic. The first player-facing complete slice is G4.

## Rejection protocol and early pivots

When a criterion fails, capture the failure and name the cause category: reference/geometry, material/export, rendering, dynamics/contact, input/camera, audio, race logic, or performance. Specify the smallest replacement that could fix it. Avoid vague instructions such as "increase fidelity globally."

Allow at most two reviewed revisions of the same approach. If the core failure persists, **change the method**, not the adjectives. Examples:

- Wrong vehicle silhouette after two script-generated meshes: rebuild primary body surfaces against matched references before generating detail; do not subdivide the wrong shape.
- Vehicle skates through turns: inspect contact load and combined tire-force response on the pad; don't compensate by increasing camera shake or locking the vehicle to the road.
- Beautiful Cycles render but poor exported materials: fix the material transport/bake/runtime path on one panel before retexturing the fleet.
- Night track is a black screen with neon: repair exposure, road illumination and motivated fill; adding more bloom is a failed remedy.
- Performance falls below budget: profile actual costly passes/assets. Reduce unnecessary shadows, overdraw, repeated materials and postprocessing before simplifying the hero beyond recognition.

After two unsuccessful approach changes for the same blocker, retain the best working build, report the specific limitation and the evidence, and move only to truly independent non-expansion work. Do not churn forever, pretend a gate passed, or silently redefine "good." A purchased/license-dependent solution can be documented without buying it. User authorization is reserved for genuine permission boundaries, not routine taste choices.

A technology pivot requires a small measured A/B probe and a written decision record: failing target, alternatives tested, evidence, migration cost and rollback. Do not engine-hop because of an unmeasured quality impression. Within this rebuild, preserve newly earned user data during later implementation changes. The old game remains untouched and out of scope; no legacy migration is required.

## Definition of evidence

Each gate review is written to `production/evidence/Gx/review.json`. Keep referenced artifacts under the kit directory using relative paths. Record build/commit, fixture/track, settings, hardware or software-renderer status, reviewer mode and concrete reason per criterion. Evidence files have SHA-256 hashes so a later regeneration cannot silently substitute different images or logs.

Accepted categories: runtime images, runtime video, test logs, telemetry/data, source manifests and diffs. A pretty concept render cannot satisfy a runtime image requirement. A text file saying "all tests pass" is not a test log. An actual command log must identify the command and outcome. Do not place API keys, private customer data or unrelated desktop content in recordings.

Review checklist: open the exact files; compare reference and runtime at matched views; watch a complete lap, including braking/corner exit; inspect audio and telemetry synchronization; verify part swap/stock restore; read failures and hardware notes. Screenshots and scripted tests cannot establish exact real-world handling, universal device compatibility, or human enjoyment. Claims remain proportional to what was inspected.

The validator checks manifest integrity, not truth or aesthetics. It rejects missing criteria, missing/hash-mismatched files, unresolved blockers, undeclared reviewer modes, and unmet dependencies. It cannot prevent an agent from lying; the workflow requires direct review and a protected integration path, not trust in the word PASS.

## User-facing cadence: let Dan enjoy it

Report milestones as a tiny show-and-tell: the strongest new capture or runnable local preview, what changed, gate result, the biggest remaining defect, and the next packet. Offer observations, not ten design questions. Do not ask Dan to move his mouse, approve every shade of red, tune tire coefficients, or run a test matrix.

Use headless Blender and isolated automation. Do not seize the active desktop/browser. If visible hardware testing is unavailable without interrupting him, record it as not run and finish other independent work. Actual controller/mobile play remains a release-test requirement; do not claim it from an emulated page.

## Handoff and continuity

Before a session ends, update state with: branch, actual commit, current gate, next packet, accepted assets, rejected approaches and why, unresolved blockers, evidence manifest, commands already validated, and a precise next action. No asynchronous promises. Future sessions resume from these files, not from invented memory.

When a later change invalidates an accepted dependency, set the affected review manifests to `decision: REVALIDATE` and update state; rerun their evidence review before integration. Updating the ledger alone does not invalidate a PASS manifest. Stable modules should be replaced behind existing contracts. Assets are versioned; experimental materials do not replace accepted ones until approved. Tests for steering, lap validation and idempotent rewards accompany any change that touches those paths. Any later migrations between versions of this NEW game include rollback copies. Yesterday's prototype remains untouched, not a dependency. Keep accepted checkpoints of the rebuild recoverable without a sunk-cost obligation to retain weak internals.
