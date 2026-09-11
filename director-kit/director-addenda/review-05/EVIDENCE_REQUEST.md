# Return Astra-Review-06.zip — compact evidence, complete playable event

Create a new review archive in the existing rebuild root. Do not overwrite a prior archive; number it if necessary. Capture after the final runtime implementation is frozen. Report captured source hash and any later packaging-only commit separately. Preserve unsuccessful local attempts without stuffing them all into this handoff.

## 1. REVIEW-ME-FIRST.md and manifest

Exact root/commit/install/build/preview commands; default launch action; what is now playable; final measured course length/width and light presets; implemented/partial/deferred status; known issues; changes to protected modules and why. Explain the scoped P04A authorization and keep G3/G4 pending. Include package/source hashes and provenance of every selected capture.

Explicitly separate locally run tests, separately reviewed results, software-rendering capture and physical/human validation. Never write “auditioned” when only numerical audio checks were available.

## 2. Runtime images: up to eight purposeful stills

1. Entry/bay card with Start Shakedown and day/night choice.
2. Whole-route overhead showing the actual connected course (runtime diagnostic view is fine; label it).
3–4. Matched day/night start-waterfront composition with vehicle.
5. An actual daytime corner approach in normal chase.
6. The same driving demand from cockpit, with apex visibility.
7. Night driving with actual road illumination and a turn ahead.
8. Valid result screen showing measured time, record state and retry.

Actual exported runtime, not Blender renders or generated concept art. Do not make flattering stills substitute for a completed event.

## 3. Motion/audio evidence

One uninterrupted full valid daytime attempt from countdown through finish/results, using the ordinary input/session/physics/render path and aligned game audio. Include meaningful left/right cornering, braking and gear change. Prefer 1280×720 at24 fps. If software capture is too expensive, a clearly labelled 12 fps diagnostic recording is acceptable with the full logical timeline; don't pretend it is hardware performance or a polished trailer. Do not splice successful corners from different attempts.

Complete a nighttime lap too. Supply its compact telemetry/result log and 20–30 seconds of ordinary-path video with stock beams visible and a real corner/braking sequence. This need not be a second full long film. Reuse the corrected shared graph for any offline sound render and record its relationship to the logical clock.

Disclose virtual input/control-agent identity, start/reset events, capture/render/simulation rates, wall time and all invalidations. A local test driver must obey the same player controls/dynamics; it is not an implemented rival. The first full valid event must not contain a secret transform reset or skipped checkpoint.

For the bounded audio correction: original failing coherence test, corrected passing test, and same-RPM before/after parameter or spectral comparison. Actual timbre/listening approval remains explicitly separate.

## 4. Focused functional evidence

Run all existing tests and build. Add small tests for directed checkpoint ordering; initial line crossing; backward/repeated finish; skipped gate/shortcut; invalid lap; reset; pause/resume; full countdown/run/finish/retry; record compatibility; preservation through settings writes and corrupt/unavailable storage. Exercise course collision/surface alignment and loop seam, plus original pad regressions. Capture one valid finish through the runtime—not solely a unit test that writes state directly.

Record an actual frame-time/load/draw-call measurement under an identified renderer where available; distinguish controlled capture from wall-clock playback. Do not demand owner QA or a physical controller if unavailable; record the limitation.

## 5. Reviewable implementation

Include current src/, tests/, scripts/, public/, package/config files, source Blender files needed to reproduce the new course/light assets and current driver, manifests and current state/review excerpt. Keep relative paths. Include the actual playable build inputs, not just screenshots and TODOs. Avoid unrelated historical assets when they are not runtime/build inputs.

Exclude .git, node_modules, downloaded tools, .env/secrets, caches, Blender backups, redundant captures and dist. Reconstruct from included source and pinned dependencies using normal commands. Include schema/provenance/license records for new assets; no ripped textures/models/audio or surprise paid downloads.

Return exact archive path and size, brief implemented/held summary, then stop for Astra. No unrequested deployment.
