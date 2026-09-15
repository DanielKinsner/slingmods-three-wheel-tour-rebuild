# P06C validation and single-return contract

## Preservation and genuine regressions

Snapshot the current source and working tree. Keep unrelated untracked work untouched. Reuse and update the existing protected raw/source manifests. Protect at least the accepted vehicle/rear/driver/product assets, physics/input, route/collision envelope, AI, event rules, chapter/career/rewards and save schema. Compare against the actual starting commit, not whichever historical hash is easiest to satisfy.

If a protected file is truly necessary for a presentation integration, make the smallest scoped change, explain it and add evidence. This is not permission to change vehicle performance or course layout. Never fake identical hashes or suppress tests. Scene-model changes must be validated against the actual clearance envelope including suspension/driver/camera needs; the existing geometry/ground checks are a minimum rather than a claim of exhaustive collision proof.

Run the full installed test suite and production build. Retain tests for material image bindings, color/channel handling, LOD coherence, input, drivetrain, audio, competitive rules/rewards, saves and actual scene transitions. Add focused checks for any new shader/baked alpha/road pipeline. Correct tests only for an intentional documented behavior change, not to hide a visual or functional regression.

Exercise fresh and existing saves, product preview/installed/stock comparisons, valid/invalid lap, race payout idempotence, retry, garage return, reload, pause/focus/device loss, camera cycling/look-back and audio. Keep test hooks guarded. Virtual controls must enter the ordinary input path; no scripted transform motion or fake results.

## Local visual review

Use at least the eight existing matched district camera positions, targets and FOVs as before/after anchors. Add the longest weak service views plus normal on-road motion through all new ensembles. Identity metadata must show the actual frozen source/assets and active renderer path. Capture with the full intended environment; a diagnostic mode is labeled, never substituted for ordinary play.

Record what each construction method changed and what criticism remained. Revisit the criticized normal viewpoint after repairs. 'PBR maps exist', 'more vertices', and 'all tests passed' are engineering facts, not a visual verdict. Do not mark G3/G4 passed or claim AAA, photorealistic, authentic measured optics or universal FPS.

## Native timing and resources

Use the existing same-machine reference workflow, standard quality/DPR1, with hardware renderer details and exact viewport. Keep performance capture separate from video, screenshots, readback and heavy diagnostic serialization. Measure COMPLETE active races, retaining all phases and outliers in raw data. No controlled-clock footage as performance proof.

Repeat the established five configurations/six complete races: stock1080, stock720, equipped1080, equipped720, and two races in one equipped1080 retry context following scene transitions. Also run daylight if the new foliage/material path differs significantly; a night pass cannot certify the day renderer automatically.

Working reference thresholds remain p95<=20 ms, p99<=33.4 ms and no active interval>100 ms. These are same-machine development gates, not a shipping performance promise. Stock720 was already at the p99 boundary in Review12; retain that limited headroom. Do not lower the target, silently lower resolution/quality, ignore failed early runs, or terminate the benchmark before a costly part of the lap. If the environment exceeds budget, repair visible-near/far LOD, batching, material sharing, masked foliage overdraw or preparation based on measurements—not unrelated physics.

Report ready/loading events separately and retain them. The early22→23 shader variant and isolated116.6 ms ready-screen event were unresolved; do not claim either explained without a reproducing experiment. Recheck repeated-race resource stability and scene disposal. Logical texture/geometry counts are not VRAM measurements.

## Return exactly one integrated review package

Create `Astra-Review-13.zip` in the existing project root with a fresh numbered name if it already exists. Preserve relative paths. Do not commit the review ZIP itself into the game. The ZIP must include:

1. `REVIEW-ME-FIRST.md`: runtime/packaging commits, exact root/run steps, completed/held items, the actual remaining art issues, full-vs-focused test provenance, hardware/virtual-control/capture limits and a short ordinary-player entry route.
2. Current reviewable source, scripts, tests, package/lock/build config, current active runtime models/materials/maps/HDR, source/license/hash manifests and the actual changed editable Blender sources/bakes. For unchanged heavy original authoring inputs already supplied, path/size/hash provenance is sufficient; do not omit anything needed to run the current build. Do not nest every previous director kit or full evidence archive.
3. Eight matched district day/night comparisons, selected normal service-section views, road long-view/detail and palm near/mid/far/transition comparisons. Keep a small representative set; captions distinguish runtime, authoring, diagnostic and before/after.
4. A continuous ordinary daylight lap and one continuous two-lap crew race through result/garage with actual synchronized game audio. Audio limitations or silence must be explicit. Keep actual input, physics, rivals, camera, UI and reward paths; no glamour-only fly-through or offline Blender video presented as gameplay.
5. Full-test/build logs, preservation/clearance/material/LOD results, local art critique/revision record, and raw whole-phase native timing for the required runs with computed statistics and errors. Include each first scored run even if bad, along with later fixes and a causal explanation only where actually demonstrated.
6. A concise change map and asset/license/provenance manifest; hash every archive entry except the manifest itself. No .git, node_modules, installed Blender/tools, dist, .env, keys, caches, temp media or redundant full sources/evidence history.

No paid downloads, secret disclosure, remote fetch/push/merge, deployment, domain edits, storefront mutation, desktop takeover or user QA chores. If time/context expires, leave a recoverable local checkpoint and `RESUME.md` with completed units, exact blocker, active files, test state, next command and limitations. Do not pretend unexecuted work or future background runs happened.
