# Ryker 900 completion

Implementation commit: `7b5018570ed0bb40f83e25e9c6bba96b435aca9e`.

Starting point: main at `7b041acea01be9f13ba0da6007158ebbd7191525`. This is the audit baseline, not a rollback. Purchased archives, editable masters, previous runtime assets and owner work were inspected locally and preserved. The supplied review and goal were recovered from the existing ZIP; readable copies are under `handoff/ryker-audit/Ryker_Review/`. No source was published or pushed, and no deployment or paid service was used.

## What is now playable

Select **Can-Am Ryker 900** in the existing garage or free builder. The bike uses a 380 kg loaded body, its measured three-wheel footprint, independent inertia/suspension/tire calibration and rear-driven CVT with reverse. Stock works without buying equipment. The HUD and actual handlebar instrument show D/R. The original synthesized three-cylinder engine follows applied RPM/load without five-speed shift effects; Treal does not borrow the Slingshot Thermal recording or add horsepower/flames.

The four selected upgrades have independent career purchase receipts and reversible installation: Elka Stage 3 front pair plus solo rear, Panther satin-black fascia/hood, TricLED Chaser Kit #1 steady-color approximation and the Treal Street exhaust. The workshop has paint controls, earned-credit status, fitment details and fitting-area cameras. Free previews never grant career ownership. Both vehicles preserve their own selection and equipment.

Every road uses the same complete assembled Ryker. Parts are composed before paint, motion and effects bind. Stock links, carriers, three individual coilovers, shafts/springs, rear swingarm and arm-mounted LEDs move separately. Upper-body lean/twist repairs full-lock rider reach; feet stay anchored. The animated departure has wheel/bar/hand motion and Ryker instrument/engine presentation. Two live mirrors remain on their moving mounts.

Chapter 01 now persists a frozen entry UUID/build/preset through reload and retry and records that build on its reward receipt. Chapters 02/03 and Cup stages retain their existing frozen-build mechanism, now accepting the explicit Ryker identity and tune. Slingshot equipment cannot secretly affect Ryker physics. Historical recipes, records and receipts are preserved.

The blank right showroom wall now has an original Blender **Find Your Line** relief: three sculpted contour panels, red route ribbons and extruded lettering. It is a single rigid mesh with six materials, no new texture download, shadow map or light. The existing left Tour Wall is preserved. Open **View → Route relief** to inspect it.

## Evidence checklist

All paths below are relative to `assets/ryker/evidence/complete/`. These are actual renderer captures and simulated/input-driven results, not generated marketing images.

| Acceptance | Evidence and result |
|---|---|
| Source stock reconstruction and part masks | `reconstruction/`: eight matched source/complete PBR views plus colored removable-part masks; exact source position/material corner reconstruction. Largest mean absolute pixel difference 0.000462 on an 8-bit scale; at most 0.00149% pixels differ by more than 3. Degenerate source zero normals are recorded and excluded only from directional-error division. Normal error <0.001. UV layers preserved. |
| Mounted products and motion | `committed-products/` (also earlier `mounted-final/`): stock and each added product, white combined build, left/right front travel, rear compression, both ±0.62 rad steering extremes. 27 independent moving groups with lighting; all grip and foot gaps under 2 cm. Elka has nine distinct body/shaft/spring channels. Actual close renders inspected. `lighting-final/` additionally verifies both moving light emitters, Panther hiding stock-grille strips and their restoration on removal. |
| Paint and build through full trip | `committed-preview/report.json` (also earlier `preview-complete/`): graphite plus all four parts, showroom → departure → road → hold-R restart → return → Slingshot → Ryker. Actual painted material colors and recipe match at each step. Selected Panther remains its specified satin black. |
| Contacts, control, hardware, audio | `hardware-final/`: contact overlay aligned to all three simulated centers within numerical precision; stock acceleration, steering/trail braking, stop, reverse at -5.41 m/s, D/R cockpit, both live mirrors, Express and Ridge driving. `engine-runtime.webm` is the actual post-limiter game audio graph, 48 kHz stereo, recorded with speaker output muted; no microphone or claimed OEM recording. |
| Bumps, braking and clearance | `dynamics/report.json`: left/right 80 mm one-wheel curbs and 120 mm ramp for stock and Elka, finite loads and stable stop; peak roll <0.093 rad. The 1.35 m corridor proves the Ryker does not retain a hidden wide Slingshot collider. |
| Complete career lap, reward, resume and return | `career-complete/`: fresh isolated career, white stock Ryker, reload retains entry UUID/build, all 15 Harbor checkpoints, valid 76.408 s lap, 800 credits exactly once, earned Panther purchase and durable garage return. No forged finish or injected credits. |
| Later chapters/Cup | `checks/final-vehicle-integration.log`: transaction-boundary tests cover every Ridge event, both Cup stages, switching vehicle, reload/retry and unchanged reward amounts. These fixtures are not represented as physical races; the actual browser lap is above. |
| Slingshot preservation | `dynamics/report.json`: 1,200 ticks each of Sport v1/v4/v5 compared field-for-field with the audit simulator, exact equality. Historical digest tests repaired by keeping Slingshot telemetry shape unchanged. Driver/audio/contact/recovery regressions pass. `slingshot-packaged/` also confirms an actual ordinary-keyboard drive in the committed production build. |
| Production | `checks/committed-production-build.log`: TypeScript plus curated production build passes. Local packaged game exercised; no deployment. Existing large Rapier bundle warning remains. |
| Performance | `performance-high-harbor-final/`: bounded native-clock High/1440p/Harbor dusk-rain four-car runs on RTX 4080. Two valid four-car races, 157.794 active seconds, 9,463 samples: 59.97 FPS average, p99 16.8 ms, worst 1% 17.67 ms, max 33.4 ms. CPU frame average 7.81 ms; submission average 6.10 ms. Geometry/texture counts stayed 490/122 after both races. Native frame-tail checks pass; existing Phase 2 HOLD remains. The final subsequent code change only corrects equipped-light presentation, verified separately. |

The initial integrated full run had 407 tests: 399 passed and 8 failed. The failures were repaired (six historical telemetry digests, one old namespace expectation, one denied-storage redirect). All 20 targeted repair tests passed. After two assembly tests and two additional career tests were added, 15 focused vehicle/integration tests and 28 shared presentation/audio/recovery tests passed; 7 departure/light-lifecycle tests and the new moving-emitter/Panther regression also pass. The logs retain the failed run as well as the successful repairs; this is not described as one later monolithic full-suite pass.

Failures and harness limitations are retained: `hardware-barrier-attempt/` drove full lock into a Harbor barrier and reached the recovery prompt; `hardware/` records the subsequently repaired outside-hand reach defect; `preview-final/` and `career-final/` record missing packaged evidence flags in the harness. The corrected scripts restore test/profile flags on navigation before inspecting. `performance-high-harbor/` is the first harness timeout: player-finished was wrongly treated as field-finished, fixed to count each attempt only after all participants finish. No gate threshold was loosened.

## Limits that remain explicit

The source year is unknown. Its approximately 1.198 m overall width / 1.0595 m track is narrower than BRP MY21/MY25 overall-width references. Those references do not specify front track. The chosen source geometry is preserved instead of blindly stretching or inventing axle mounts; physics matches that geometry. OEM dimensional fidelity is not claimed. `assets/ryker/PHYSICS.md` identifies every estimated physical parameter and the official power/torque/mass/travel references.

`assets/ryker/PRODUCT-REFERENCES.md` records exact current selected options and manufacturer/SlingMods links. Panther plus lighting is not retail-verified: the game omits stock-grille strips with Panther and restores them when removed, retaining headlamp/arm strips. No invented rebound adjustment, chaser controller, protective/downforce claim, exhaust power bonus or authentic recorded sound is advertised. These are reference-based game meshes, not manufacturer CAD or fitment certification.

Human enjoyment/listening and physical controller/device breadth require owner judgment. GPU submission measurements are not GPU execution time. This bounded measurement cannot release the pre-existing High/Ultra sustained-performance gate.

## Launch and reproduce

Node/npm dependencies are local. On another machine restore with `npm ci` (no global install), then:

```powershell
npm run demo:build
$env:PORT='5199'
npm run demo:preview
```

Open `http://127.0.0.1:5199/?scene=bay&play=career&visual=ryker` for the earned garage, or `http://127.0.0.1:5199/?scene=signature&screen=build&visual=ryker` for free configuration. Arrow keys/WASD drive, X selects direction, C cycles camera, hold R restarts/recovers. Activate sound explicitly with **Enable sound**. The server prints its owned PID and stop command. Browser saves stay in that browser/origin, not Git.

For browser acceptance, set `BASE_URL` and a fresh `EVIDENCE_DIR`; run `node scripts/ryker/check-preview.mjs`, `check-career.mjs` or `check-hardware.mjs`. These use isolated headless Playwright Chromium. Run `check-mounted.mjs` for product poses. Run `node --import tsx scripts/ryker/check-dynamics.ts` for physics/bump/Slingshot comparisons. Stock capture requires Vite on5198 (`npm run dev -- --host 127.0.0.1 --port 5198`); `check-stock.mjs` creates its isolated fixture.

Run `node scripts/ryker/check-performance.mjs high native harbor` separately with fresh `EVIDENCE_DIR`, `BASE_URL`, a quiet PC and no concurrent Blender/build/capture jobs. It preserves the closing gate's existing statistics and limits.

New editable assets and repeatable generators:

```powershell
& .tools/blender-4.5.2-windows-x64/blender.exe --background --factory-startup --disable-autoexec assets/ryker/Ryker-Game-Master.blend --python-exit-code 1 --python scripts/ryker/build-mods.py -- public/assets/ryker/complete assets/ryker/Ryker-Complete-Parts.blend
node scripts/ryker/assemble-glb.mjs
& .tools/blender-4.5.2-windows-x64/blender.exe --background --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/ryker/build-showroom-relief.py
```

Blender is an already discovered local tool, not committed. Originals, semantic part map, new editable .blend files, assembled GLBs, scripts and evidence are committed locally. Reference photographs, browser profiles, credentials and installed tools are excluded. The owner `P06C-HOME-KICKOFF.md` remains untracked and untouched. No new review ZIP is required.


Final packaged identity: `7b5018570ed0-working`, directory `demo-dist/2026-09-23T02-42-20-942Z-7b5018570ed0-working` (290 files, 407,029,454 bytes). Runtime paths match implementation commit `7b50185`; the truthful `-working` suffix reflects root handoff/AGENTS and Git-attribute edits. Exact input/output hash manifests are retained in `evidence/complete/checks/`. Final evidence/handoff commit can be resolved with `git log -1 --format=%H -- handoff/RYKER-VALIDATION.json`; it does not introduce another gameplay version.

At delivery the loopback static server is owned PID23704 on5199. No external hosting changed. Next action is owner play/listening feedback; no new assignment or Phase 3 work is inferred.
