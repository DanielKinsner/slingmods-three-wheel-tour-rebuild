# Astra Review04 — read first

Project root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`

Runtime/capture checkpoint: `982d12d3d0a83b8dd78ed5ce9c2fda4f0475c264`. The later packaging checkpoint is recorded in root `PACKAGE-MANIFEST.json`; it changes review metadata/package tooling only. Source and served bytes were checked against the build-input manifest before/after final capture. Continue this repository. No reset, restart, old-game import or deployment occurred. Historical sources/evidence remain in the checkout; this ZIP carries the selected current evidence.

**P03A2: specific local shell repair passed independent review and bounded mirrored integration; provisional default. Whole-vehicle fidelity remains HOLD. P03B1: bounded input, chase and practice assignment passed automated/independent review, with limits below. G3 remains pending. Stop for Astra.**

## Install and play

From the existing root (or an extracted package directory for standalone review):

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5187/. Node24.15/npm11.6.2 used. If that port already serves this checkout, reuse it. No tools/Blender/node_modules/dist are bundled. README contains optional Blender and isolated capture commands; game launch does not require Blender or Git.

The compact inspection bay opens the mapped P03A2 Slingshot. Inspect exposes front/side/rear/cockpit/material views, orbit/zoom and a light sweep. Drive uses the same GLB on the retained physics pad, starting on an18-cone launch/slalom/sweeper/stop guide. The cones do not collide or constrain driving. Inspect returns to the bay. This is a practice prototype, not a race.

Keyboard W/S and A/D (or arrows), C near/far chase, held B look-back, X direction request, hold R one continuous second to reset, Escape pause/resume. Standard gamepad: RT/LT analog, left stick, top face camera, LB look-back, right face direction, hold bottom face reset, Menu pause. Real production `navigator.getGamepads` reader; unknown mappings use keyboard. Focus loss/disconnect pauses and clears controls; deliberate resume and neutral release rearm. Speed/gear visible, I diagnostics, expandable controls and reset button.

## What changed and what is held

One evaluated local front-shell candidate. An independent editable master uses four boundary curves and a connected quad top/underside with an explicit leading lip/return; the former broad planar end-cap bands were removed. After neutral runtime proof review, only the two brows were replaced in the full candidate. All717 other source objects, protected wheel/contact/steering transforms,16 existing maps and the inspection bay remain unchanged. Source: assets/blender/vehicles/slingshot-p03a2*.blend; export: public/assets/vehicles/slingshot-p03a2.glb.211431 triangles,59 primitives,9,940,912 bytes. Same source RGBA8 texture cost57,671,680 bytes, estimated full mip76,895,573 bytes; not a runtime GPU allocation measurement. Below250k showroom ceiling, above140k racing-LOD aim.

The long edge remains rounded, upper ridge subdued, tires/grooves/machining approximate. No final OEM-match or whole-car visual PASS. Instruments, screen and lamp surfaces remain passive, mirrors are not live. P01/P03A/P03A1 are preserved historical variants; fleet is scale blockouts only. No new other vehicle, rider, audio, upgrades, garage commerce/customization, campaign, race scoring, AI, weather or nighttime race was implemented.

P03B1 separates input interpretation from retained60Hz physics, sanitizes fractional stick/trigger values, arbitrates meaningful device changes, latches keyboard taps, and preserves direction braking interlock. Reset requires continuous monotonic hold; camera changes are damped along the ordinary frame path. No tire/drivetrain/contact/collision/suspension/shadow tuning was changed. Near held-lookback clips the lower nose and occupies much of the lower frame; rearward road/cones stay visible and release returns coherently. This is a disclosed framing limit. Physical-controller behavior, sustained hardware FPS, obstruction-transition/resize quality and subjective driving feel are not certified.

## Evidence and validation

`director-kit/production/evidence/Review04-final/` contains exactly six selected current runtime PNGs: three explicitly labelled unilateral neutral-gloss proof views, full mapped default bay, practice route and held look-back. The4-second reflection film is the local diagnostic variant. No Blender render substitutes for runtime evidence.

`practice-driving-SILENT.mp4`:30.000 seconds,360frames at12fps. A controlled virtual standard-device trace passes through the ordinary reader/InputResolver/DrivingSession/60Hz fixed step and unsnapped ChaseCamera. Each60Hz camera/pose/input update runs; only selected frames rasterize. No `advance`, `renderFrame` or snapped camera shortcut drives this film. Logical schedule30s, last captured sample29.9167s;1734 advancing physics ticks=28.9s because pause/reset stop ticks, plus the normal initial2s settling. Wall capture163.272s on software renderer. Reflection48frames/4s,25.796s wall. Both films have no audio stream and fully decode. No human driving or physical-controller claim.

43/43 `npm test`,5/5 focused signed RPM checks, TypeScript/Vite build pass. Existing chunk-size warning retained. The same fixed-physics maneuver trace at30/60/120/144 presentation rates gives maximum deviation from60Hz: camera position0.358m, target0.050m, FOV0.009degrees; documented tolerances0.45m/0.15m/0.15degrees. Ordinary frame motion<1.5m at30Hz; explicit reset excluded. The inspection-framing regression remains in the passing suite.

Separate `Review04-browser/browser.json` verifies final served bytes, actual presented wheel/cockpit signs in both fractional directions, analog throttle, direction interlock, normal camera switch/look-back/release, neutral resume, and actual browser-keyboard quick Escape/focus/reset. An actual focused child iframe emits window blur in isolated Chromium. Headless tab-switch visibility is unsupported on this backend; hidden-tab behavior is unit/source-covered, not represented as a real OS tab test. No desktop input.

Environment: Windows11 build26200; Blender4.5.2 LTS background; Node24.15; npm11.6.2; Chromium153.0.8010.12 headless SwiftShader. Review used a separate read-only agent. `RESULTS.json`, `capture.json`, `build-inputs.json` and root package manifest record method, exact hashes and limits. Failed preliminary harness attempts remain locally preserved and are excluded from this compact package.
