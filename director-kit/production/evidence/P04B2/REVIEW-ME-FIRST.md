# Astra Review09 — Night Drive

P04B2 repairs the reproduced shader-first-use stall and calibrates the existing SM-133 light output. The accepted car, rear repair, driver, course geometry, physics, audio, race rules, career economy and save stores are retained. G3/G4 remain pending; this is a bounded local runtime/presentation review, not a new content milestone.

## Root and launch

Project root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`

Frozen runtime commit: `f5649fb95c81f12ad9531343655767db5ad9bf86` on `main`. Review08 baseline packaging: `dc62adfd1e79ce3248f81752301d5a4d10453b80`. A later metadata-only packaging commit is identified separately in PACKAGE-MANIFEST.json. Every captured source/public input is hashed in build-inputs.json; its packagingOnlyInputs field separately hashes the archive-only still-count correction; served build files are in served-build.json and public asset GET hashes accompany final trials.

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:5187/` for the existing bay. **Build · Make it yours** opens the compact product menu. Use an existing earned build or finish a valid Harbor lap, buy/install the base kit, choose color, then **Drive at night**. Direct existing event: `http://127.0.0.1:5187/?scene=harbor&preset=night`. Preparation finishes before Start lap becomes available. An extracted package without Git uses the review-package build label. Do not overlay an older package onto a newer checkout.

Driving controls remain W/S or arrows for pedals, A/D steering, C camera, held B rearward, X direction, held R restart and Escape pause. Standard controller retains triggers, steering stick and camera/restart/pause mappings. Build uses native Tab/arrows/Enter and D-pad/confirm/back. Actual physical controller and human listening/handling approval remain unavailable; browser tests use the existing ordinary virtual-device path.

## Diagnosis, change and preserved behavior

The old capture had confounded recording, preserved buffers and full inspection overhead. A clean no-recording baseline reproduced a roughly four-second render stall at a five-to-six spotlight transition with 14→27 programs. A separate expanded GL diagnostic traced 13 blocking getProgramInfoLog calls within the same first-use render. This establishes a shader-variant synchronization cause for the reproduced stall; it does not assign every possible future scheduling outlier to shaders.

The practical pool now stays resident with its original fade/placement and zero intensity out of range. The two existing product area lights also stay resident, emitting zero when unowned, unequipped or off. Unequipped hardware remains detached. Preparation initializes textures, compiles the configured scene, renders unseen mesh/shadow paths and waits for completion under a visible veil. Culling settings are restored before play. No timer/throttle is advanced by preparation and no quality preset, global exposure or shadow-map budget was reduced. A cross-tab equipment update during preparation retains the newest equipment state.

The profiler now separates permission for virtual input from screenshot buffer preservation. Production-equivalent measurements use preserveDrawingBuffer=false, native RAF timestamps, a bounded lightweight collector and lightweight driver telemetry. Immutable world statistics and graphics identity are cached outside the loop. See diagnosis.md and measurement-notes.md for historical instrumentation limits, the corrected first-interval sentinel and the difference between CPU submission time and GPU timing.

The economy remains **800** total for the first valid unique Harbor completion, **100** for each later unique valid attempt, **600** for the one base kit. No invalid/incomplete reward, extra product, cash, store points or retroactive PB award was added. Local IndexedDB receipts/ownership and original PB/settings namespace remain. The existing session-only memory fallback remains disclosed. The outbound product link remains a deliberate user action with noopener/noreferrer; no real purchase or cart operation was performed.

## Kit appearance

TricLED SM-133 RGB **Base Kit #1 / RF remote**, existing 2024 Slingshot R fitment guard; all optional wheel/interior/halo/swingarm/grille and other add-ons remain excluded. Existing Blender hardware and attachment geometry are byte-identical. Six solid colors, saved power and 15–85% brightness remain.

Each downward side emitter is still 0.035 m × 1.3 m. Chosen output is **900 renderer nits at 60% UI brightness**, scaled linearly as 900 × brightness / 0.6. This corresponds to about 128.65 nominal renderer lumens per side, not a product specification. A single matched 300/900/1800 sweep informed the choice. Red and cyan were both reviewed; no environment darkening, bloom, card/decal trick or new shadow maps were used. Fine occluder shadows, exact photometry and front-strip pavement output remain approximations. The original supplied installation reference does not establish exact 2024 harness routing.

## Evidence map and environment

All paths below are under `director-kit/production/evidence/P04B2/` unless stated otherwise.

- `performance-summary.json` summarizes complete raw `run.json` records. Only the five `scored-*` runs are the final unrecorded performance matrix. Each is a fresh browser/context with a first full lap and same-context retry; the equipped 1080p case is repeated. Intermediate/baseline data is explicitly separate.
- `video-final/night-drive-silent.mp4` is a separate continuous 25-second actual wall-clock excerpt, **SILENT**, with normal input/camera behavior. Its raw intervals include recorder overhead. It is not assembled from controlled-clock screenshots and carries no audio approval.
- `final-stills/` contains matched stock/red/cyan near-chase at less-lit and streetlit poses plus far chase. `smoke-frozen/bay-installed.png` is the eighth image. Diagnostic poses are explicitly labeled and preserve opaque bodywork; they do not claim a new physical lap. Daylight review evidence is described separately without bloating the eight-image package.
- `smoke-frozen/smoke.json` covers the cloned earned 300-credit build, ownership/color/PB/settings reload, twelve stock/power cycles, no charges/receipts, stable programs and unowned-preview removal on race entry. The 26 legitimate power/color writes advance the career revision counter while preserving wallet, receipts, flags and the final saved appearance. User browser saves were never edited.
- `physics-final/physics.json` compares all 10,200 telemetry objects with kit off/on under matched ordinary input and controlled time solely for determinism. This is not a performance benchmark. `tests-frozen.log` and `ui-frozen/` retain full source tests and six native keyboard/virtual-controller UI regressions.
- `protected-baseline.json` retains 45 unchanged foundation/economy inputs. `helper-review.md` records the single bounded independent read-only helper review. No reviewer swarm or unbounded art iteration was used.

Host: Windows, NVIDIA RTX 4080, ANGLE Direct3D 11, isolated Chromium with DPR 1 at actual 1920×1080 or 1280×720 drawing buffers, standard quality. Exact browser/version and renderer strings accompany every trial. Node 24.15.0 and the installed pinned Three.js 0.186.0 were used. Retained UI regressions explicitly use SwiftShader, separate from hardware performance observations. Browser/driver/OS shader caches were not forcibly cleared. These are fresh-application measurements, not a claim of a pristine GPU-driver cache or all-device certification.

Final measured results and remaining limits are recorded in final-review.md and performance-summary.json. All outliers and preparation times remain available. No rival, new vehicle/course/product, vehicle/scenery remodeling, spending, deployment or gate advancement occurred. Stop for Astra's review.
