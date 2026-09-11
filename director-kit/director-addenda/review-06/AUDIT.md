# Astra Director Review 06 — Harbor event accepted for development; rear assembly correction required

Prepared for Dan Kinsner · September 11, 2026

## Decision

KEEP THE PROJECT. Accept the corrected engine-layer RPM mapping and the time-trial/event foundation for continued development. Do not treat the whole vehicle, environment, physical control feel, or audio timbre as approved. G3/G4 remain pending.

Dan supplied two additional rear-quarter/rear screenshots during the review and identified the rear tire, swingarm and shock occupying the apparent storage/body region. This prompted a new geometry check that demonstrates an actual tire/body intersection. This is a substantive defect, not subjective polish. Astra should have caught it in earlier rear views. Front-shell acceptance never established rear packaging or suspension articulation correctness; the earlier blanket “no vehicle work” restriction is overridden ONLY for the rear assembly.

The previously suggested next product-upgrade loop is deferred. The next packet corrects the rear assembly first and allows a bounded, independent harbor presentation pass. No new whole-game restart, no new physics system, no campaign or additional vehicles.

## Source and scope

Submitted: `Astra-Review-06.zip`. Runtime commit `e1fafb5ec4d371635bfbeca51663fc67734a40ca`; packaging commit `3f200c43bf33262d6bf6aaeccd8805e2f0bb83ba`.

The manifest checks 261 listed files with no hash/size discrepancies; 179 available captured build inputs matched their recorded hashes. All 25 selected protected files matched the Review05 baseline, accounting for the explicitly declared line-ending normalization. This establishes those comparisons, not overall correctness. A preserved defect can still be a defect.

Files search returned no parsed archive content, so this review used the mounted archive and source files. No changes were made to the submitted game. All diagnostics and this handoff live outside the source tree.

## 1. Confirmed rear-tire/body collision — blocking rear acceptance

`public/assets/vehicles/slingshot-p03a2.glb` contains a closed rear-firewall component within `body_static__Textured_Polymer`. It matches the source object `rear_firewall` constructed in `scripts/vehicle_p03a_build.py`.

All coordinates below are metres in the vehicle's exported rest space: X right, Y up, negative Z forward.

| Item | Exported coordinates/bounds |
|---|---|
| Rear wheel pivot | `(0, 0.345500, 1.333500)` |
| Contact-layout rear center | `(0, 0.345500, 1.333500)` |
| Rear tire bounds | X `[-0.156160, 0.156160]`; Y `[0, 0.691000]`; Z `[0.988000, 1.679000]` |
| Rear-firewall bounds | X `[-0.240000, 0.240000]`; Y `[0.330000, 0.870000]`; Z `[1.040000, 1.170000]` |

Bounding boxes alone would not prove a mesh intersection. The independent diagnostic identifies the actual watertight 96-vertex/188-triangle firewall component and uses generalized winding-number containment on the actual exported tire surface. **200 unique tire surface vertices are strictly inside this solid at rest.** A representative contained point has a conservative oriented-plane interior margin of approximately 64 mm. The containment test does not assume the component is perfectly convex and is not merely a bounding-box overlap assertion.

Evidence: `evidence/rear-assembly-diagnostic.json`; reproducer `tools/inspect_rear_snapshot.py` (uses numpy/trimesh in the review environment). This is an observation of the submitted GLB, not proof that a repair has been implemented.

The wheel's exported pivot agrees with the simulation contract to floating-point precision. Therefore “move the tire backward/down until it looks right” is not an acceptable first repair: that could detach the render from its actual contact/axle. Internal coordinate agreement is not independent OEM dimensional certification; matched model-year references still determine the correct body/suspension packaging.

Polaris's 2024 manual identifies a storage compartment behind each seat, accessed by tilting the seatback. The current body/storage enclosures and central wheel clearance need to be designed as an assembly against those references, not concealed behind another generic solid box. See `REFERENCES.md`.

## 2. Rear articulation is incomplete — source-supported finding

Both `src/presentation/hero.ts` and `src/workbench.ts` translate the rear wheel from wheel-center telemetry. They also translate the rear brake-caliper island. Neither path articulates the swingarm, rear axle or shock geometry in `suspension_rear`; those meshes remain attached in chassis space.

The submitted day timeline moves the rear hub vertically from approximately 0.319496 to 0.366976 m. Relative to the authored fixed axle center at 0.345500 m, the maximum vertical separation is approximately **26 mm**. This is a source-plus-telemetry measurement of the missing visual connection, not a new Rapier simulation.

The repair must keep the displayed hub connected to the axle/arm and the shock ends attached through travel. A vertical-raycast wheel path is an approximation, not an exact fixed-length swingarm arc. The local engineer must document a small visual kinematic compromise instead of promising both mathematically incompatible paths or silently changing the tire dynamics. Rear spin must not spin the arm or shock.

Evidence: `evidence/rear-source-excerpts.md`, `evidence/rear-assembly-diagnostic.json`.

## 3. Time-trial and audio work worth preserving

Astra independently executed **26 focused tests** against the submitted modules: three engine-pitch checks, five drivetrain wheel-speed checks, five lap/gate checks, two save checks and eleven input checks. All passed. Execution used an installed TypeScript transpilation loader; this is not an independent typecheck or a run under the project's pinned compiler.

The corrected audio mapper commands a common engine RPM across contributing bands, preserving finite coverage and mute/pause behavior. This passes the numerical coherence regression. It does not establish pleasing or OEM-authentic engine timbre; no auditory approval is made.

The exported course length is approximately **1,230.867 m**, with sixteen directed planes (finish plus fifteen intermediate gates). Fresh `RaceAttempt` instances replayed 5,099 supplied physics-state pairs per preset. Both reproduced the supplied valid **78,719.2038846 ms** result with exact matching elapsed time, checkpoint count and invalidity state. Repeating the terminal tick did not change the result. 616 sampled centerline surface queries returned asphalt.

This replay independently exercises race evaluation on supplied trajectories. It does NOT independently regenerate the trajectories, run Rapier or prove a human enjoyed the controls. The identical day/night lap is consistent with the recorded controller trajectory and same dry physics; it is not a claim of two independent human performances.

The footage/timelines show the countdown-to-result loop, camera changes and a peak of approximately **51.6 mph** in gears 1 and 2. Day video is 85 seconds at 1280×720/24 fps with aligned encoded audio. Night video is a 25-second excerpt from a separately logged full night attempt. Audio is reconstructed through the game graph and recorded logical state, not captured live from speakers. The package discloses a local scripted controller and controlled clock.

Evidence: `evidence/independent-tests.log`, `evidence/independent-race-replay.json`, `evidence/independent-inspection.json`, `evidence/08-valid-result.png`.

## 4. Harbor art judgment — still a prototype

The event now provides a complete loop to evaluate, but the environment is not at the requested high-end visual standard. The normal driving frames show visibly angular palm fronds, repetitive longitudinal road shading/banding, broad empty ground and repeated buildings. Night illumination produces conspicuous isolated pools; the road remains readable but the setting does not yet feel cohesively lit. These are visual judgments from the supplied runtime captures, not inferred from triangle counts.

The submitted harbor GLB has 118,400 triangles, nine primitives/materials and nine embedded images. Those are verified asset counts, not a quality score. Do not respond by adding arbitrary mesh density or maximum bloom.

A secondary bounded pass is authorized for palm silhouettes, road material scale/variation and coherent lighting at the existing waterfront. Keep the route, barriers, ground/collision alignment and checkpoint data unchanged. Do not repeat the former land/road depth conflict; the current land exclusion correction remains protected. No new city layout, new track or expansion into empty fields is required in this packet.

## 5. What was not independently verified

The submitted package reports 64/64 full tests, 22/22 focused input/drivetrain tests, a successful TypeScript/Vite build and browser/lifecycle checks. Astra independently ran the 26-test subset above and event replay; the full pinned dependency/browser/physics suite was not rerun because dependencies were unavailable and container DNS could not resolve external hosts.

No physical controller, human playtest, audio listening judgment, sustained hardware profile or OEM geometry certification was performed here. Short local offscreen RTX 4080 measurements in the submitted package remain reported measurements, not universal frame-rate approval.

## Handoff

Read `CODEX_NEXT.md`. Execute **P04A1 — Rear Assembly Integrity**, then finish **P04A2 — Waterfront Presentation Cleanup** (the second lane may run independently while rear verification is in progress). Ship no new upgrade loop until the rear assembly clears its local evidence checks. The next return is `Astra-Review-07.zip`. Do not mark G3/G4 passed. Preserve historical evidence; record this new defect and its resolution rather than retroactively changing prior reviews.
