# SlingMods: Three-Wheel Tour — P03A

Existing standalone Three.js / TypeScript / Rapier rebuild. Astra review01 narrows this checkpoint to one surfaced Slingshot, a compact inspection bay, the same asset on the existing pad, the signed-wheel RPM correction, and shadow repair. G3 remains pending. See `director-kit/director-addenda/review-01/CODEX_NEXT.md` and `director-kit/production/state.json`.

## Local launch

Node 24.15.0 and npm 11.6.2 were used on Windows 11 Pro. From the existing repository:

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5187/. The normal entry opens the locally reviewed P03A inspection bay. `Inspect` exposes front/side/rear/cockpit/material views and a moving light. `Drive` takes the same GLB to the pad. Diagnostics are toggled separately. Development server: `npm run dev`, http://127.0.0.1:5186/.

Explicit routes remain `/?scene=bay&asset=p03a`, `/?scene=vehicle&asset=p03a` (neutral inspection), `/?scene=pad&asset=p03a`, `/?scene=calibration`, and `/?scene=vehicle&asset=p01` (preserved clay). The pre-existing `asset=fleet` contains scale blockouts only; it is not additional finished-vehicle work.

Drive with W/up, brake with S/down, steer with A/D or left/right, X requests reverse after braking to near rest, C changes near/far chase, hold R continuously for one second to reset, Escape pauses/resumes. Losing focus pauses and clears held input. Inspect views support orbit/zoom. No controller support or physical controller test is claimed.

## Source and verification

Editable hero: `assets/blender/vehicles/slingshot-p03a.blend`; runtime: `public/assets/vehicles/slingshot-p03a.glb`; authored maps: `public/assets/textures/p03a/`. The accepted P01 source/export and physical contact layout remain unchanged. Bay source/export is `assets/blender/inspection-bay-p03a.blend` / `public/assets/inspection-bay-p03a.glb`.

Background Blender 4.5.2 LTS reproduction, using the ignored local portable installation:

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --factory-startup --python scripts/vehicle_p03a_build.py -- --finish
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --factory-startup --python scripts/inspection_bay.py
```

These commands regenerate the named P03A outputs; they do not modify P01. The Blender download is excluded from the ZIP. A separately installed Blender 4.5.2 executable can replace that path. All runtime maps are newly authored; reference photos are research, not game textures.

`npm test` runs the normal simulation/save/shadow suite. `npm run build` includes TypeScript checking. To independently capture a built preview with installed isolated Playwright Chromium:

```powershell
npx playwright install chromium
node scripts/build-review.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P03A/a-new-capture-folder'
npm run capture:p03a
```

The capture tool refuses an existing output folder. It records actual runtime PNGs, a frame-stepped full orbit encoded at 12 fps, an actual keyboard driving video, source/served hashes, telemetry and renderer counters. The orbit synchronizes every CDP screenshot before encoding; it does not claim real-time capture performance. Bay orbit/zoom and the Rear preset remain in front of the rear wall. `scripts/verify-p03a-browser.mjs` similarly requires a new `EVIDENCE_DIR` and tests default/Inspect/Drive/calibration routes, actual wheel/steering presentation and comparable renderer counts. It does not use desktop input.

Historical capture scripts may use fixed G0/G1/G2 locations. Do not run them over accepted evidence. `npm run preview:accepted` / `gate:g0` / `gate:g1` / `gate:g2` validate historical evidence integrity only, not current aesthetics or handling. The small review ZIP intentionally omits the full historical archive, so use `npm run preview` there; full historical gate validation requires the intact repository archive.

## Explicit limits

P03A is a local inspection/driving checkpoint, not a finished game. No rider, interactive garage/workshop, race, opponents, upgrades/shop/campaign, night road sample, engine/tire audio or new driving camera suite is implemented. Instruments and infotainment are visual approximations, with no fabricated live readout claim. Broad environment lighting approximates a studio; it is not a measured physical lighting simulation.

The pad uses the same showroom-detail mesh. A racing LOD, texture compression and physical GPU performance remain unvalidated. Silent SwiftShader recordings can run slower than real time and do not establish hardware frame rate or subjective handling quality. Physics coefficients are simcade estimates; the existing severe high-speed curb hop remains a known limitation. The RPM fix preserves the documented tick-start coupling approximation, idle/clutch and shift model. G3 must remain pending for later P03B/P03C evidence.
