# Execute P04A — Harbor Shakedown

Astra's fifth director addendum · 11 September 2026

## 0. Existing project, not another start

Continue only in:
`C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`

The reviewed runtime was `f55d83971d278fb31b9d5c502065efcb5373ec3c`; packaging was `2fd926c38c7bf3b959d0fe3726e522ade1f8d483`. Inspect the current tree and status before work. Never reset to those hashes or overwrite newer/unrelated work. Retain the original `slingmods game` folder, all historical projects/deployments and all evidence untouched.

Read this file, `HARBOR_SHAKEDOWN_SPEC.md`, `AUDIO_FIX.md`, and `EVIDENCE_REQUEST.md`. Archive this addendum under a new `director-kit/director-addenda/review-05/` folder. Append its decision to the existing ledger; do not replace the full ledger with the review archive's abbreviated excerpt.

This packet **explicitly authorizes a small environment kit and the first timed-event loop before G3's final visual/aural/hardware criteria pass**. It replaces the next assignment only, not the project's ambitions. G3 and G4 remain pending; record the scoped director authorization instead of fabricating gate passes. Do not execute the original full P04 garage/rivals/products packet.

## 1. What you are building

**Biscayne Harbor — Shakedown:** one closed circuit, the current Slingshot and driver, one standing-start timed lap, daytime and nighttime presets, valid ordered checkpoints, result/personal best and instant retry.

This must be an event the owner can start, finish and attempt to beat. It is not another empty pad, a decorative road nobody can complete, or a menu of promised features.

Use the same accepted car, driver, dynamics, input system, near/far/cockpit/rearward cameras and shared audio graph. Correct the bounded engine-layer mismatch first or in a separate owned task. Do not replace the powertrain or make new engine claims.

## 2. Execute in this order; do not ask Dan to choose

### A. Freeze the known-good base and fix pitch coherence

Record current status and source baseline. Run the 16 existing focused input/RPM tests and the included pitch regression; retain its expected original failure. Implement `AUDIO_FIX.md`, then run the revised focused/full tests and build.

A dedicated audio worker may own `src/audio/mapper.ts` and its regression only. It must not touch simulation or create another audio bank. One diagnosed fix, not a sound-design campaign.

### B. Author the actual route and connect it to the same simulation

Create one flat, closed, approximately 1.0–1.4 km harbor layout with a 10–12 m usable roadway. Target 1.2 km for this event; the larger campaign can extend it later. Design a readable fast straight, a broad sweeper, a slower decisive corner and linked left/right direction changes with real braking and recovery space. Follow the detailed specification; choose sensible geometry yourself.

Use Blender for the roadway/curbs/barriers and all visible props. Export a shared route/collision/surface/start/checkpoint description along with render assets. The vehicle is physically free to leave the road and collide; no steering or progress attachment to a spline.

The current simulation hard-codes `PAD`/`surfaceAt`, and `DrivingSession.reset()` hard-codes `PRACTICE_START`. **A minimal environment-definition and reset-pose seam is authorized.** Preserve the old pad as the default fixture so existing calls/tests still work. Route geometry, collision, surface classifications and camera obstruction must come from the same course data. Do not leave the old pad obstacles or rectangular grass logic invisibly active under the new road. Keep exact tire/drivetrain equations, mass, contact layout and step rate unless a demonstrated bug forces a separately documented minimal repair.

Before environment dressing, run one real closed-route driving trace and the basic checkpoint validity checks. The local lead reviews them without owner intervention. If the route cannot be completed because of radius/width/obstacle choices, correct the route locally before decorating it. No new testing framework or full engine architecture.

### C. Complete the event loop, then light and dress that one route

Implement countdown → one lap → validated result → best-time persistence → retry/return. Add the clean race HUD and one selectable day/night lighting pair from `HARBOR_SHAKEDOWN_SPEC.md`.

Now use a compact Blender-authored harbor kit: convincing road surfaces, concrete edges, barriers/fences, palms, a warehouse/paddock building family, poles/luminaires, dockside details and water backdrop. Prioritize a 150–250 m start/finish waterfront section as the visual benchmark; the entire remaining loop still needs coherent readable dressing, not a bare gray backside. Reuse assets intelligently. No full city or sprawling freeroam.

The eye anchor, steering grip and character silhouette are frozen. Small cockpit sightline/framing adjustments for seeing the actual upcoming apex are allowed. Do not make a new driver/car or orbit the look-back camera again.

### D. Integrate, exercise and return the package

Run focused old regressions, new course/race/save tests, full suite and build. Complete at least one valid real-physics timed lap in each preset using the ordinary input/presentation path. The test driver can be an explicitly labelled local control agent, but it must drive through the real throttle/brake/steering interface, respect physics and finish validity, and must not teleport between checkpoints. It is not a released AI opponent or proof of human enjoyment.

Capture the compact evidence in `EVIDENCE_REQUEST.md`, assemble `Astra-Review-06.zip`, report its full path/size, then stop for Astra. Do not stop at a proposal or ask Dan to approve internal substeps. If a capability really blocks the assignment, return a precise partial-state report and existing valid work; never fake a pass or throw away the build.

## 3. Ownership and merge discipline

Use small specialists only where parallel files are independent. Suggested ownership: environment artist owns new Blender/texture/route outputs; audio worker owns the bounded mapper/test; gameplay engineer owns course/session/timing modules; the lead owns application integration/UI and validates all results. Freeze the route schema before parallel integration. Do not let two workers edit the same central file. A reviewer judges the exported runtime, not only implementation prose. No automatic self-awarded final visual pass.

Avoid making `workbench.ts` much larger. Add a narrowly scoped event entry/controller and shared presentation helpers only as needed. Leave the current inspection bay and test-pad URLs working. Do not refactor the entire application for hypothetical later features.

## 4. Boundaries

No campaign, AI opponents, ghosts, multiplayer, product installation, catalog refresh, checkout/cart integration, currency/rewards, other hero vehicles, rain/dynamic time cycle, destructible city, music/narration or new paid services. No storefront/domain/deployment changes or new plugin/service signups. No mouse/desktop takeover. Keep tests isolated and credentials out of logs, assets and archive.

No new polished full garage: use the existing bay as the entry backdrop with one obvious **Start Shakedown** action. Day/night is chosen before the run; do not stream a huge menu into the drive view. Preserve volume/mute/camera preferences and add the lap record safely without touching old/unrelated save namespaces.

Do not reopen hood/wheel/cockpit modeling or character tailoring under cover of this packet. Whole-car/aural realism remains an explicit backlog item, not a reason to stall the event. Any performance optimization must preserve source assets and respond to measured rendering cost; do not blindly decimate the car or remove all lighting to report a fast empty scene.

**Success:** Dan launches the existing rebuild, chooses day or night, drives a real lap through a coherent harbor, gets a trustworthy time, and can immediately have another go. The sound stays tied to one engine RPM. G3/G4 remain honest about the work still outstanding.
