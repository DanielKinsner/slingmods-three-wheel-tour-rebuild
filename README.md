# SlingMods: Three-Wheel Tour — P03A1

Existing standalone Three.js / TypeScript / Rapier rebuild. Astra review02 directs P03A1: targeted fascia, wheel, cockpit and material fidelity corrections plus compact lighting and complete orbit framing. The signed-wheel RPM correction, simulation and pad shadow policy are preserved. G3 remains pending. See `director-kit/director-addenda/review-02/CODEX_NEXT.md` and `director-kit/production/state.json`.

## Local launch

Node 24.15.0 and npm 11.6.2 were used on Windows 11 Pro. From the existing repository:

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5187/. The normal entry opens the P03A1 candidate inspection bay. `Inspect` exposes front/side/rear/cockpit/material views and a moving light. `Drive` takes the same GLB to the pad. Diagnostics are toggled separately. Development server: `npm run dev`, http://127.0.0.1:5186/.

Explicit routes remain `/?scene=bay&asset=p03a1`, `/?scene=vehicle&asset=p03a1` (neutral inspection), `/?scene=pad&asset=p03a1`, `/?scene=calibration`, and `/?scene=vehicle&asset=p01` (preserved clay). The pre-existing `asset=fleet` contains scale blockouts only; it is not additional finished-vehicle work.

Drive with W/up, brake with S/down, steer with A/D or left/right, X requests reverse after braking to near rest, C changes near/far chase, hold R continuously for one second to reset, Escape pauses/resumes. Losing focus pauses and clears held input. Inspect views support orbit/zoom. No controller support or physical controller test is claimed.

## Source and verification

Editable hero: `assets/blender/vehicles/slingshot-p03a1.blend`; runtime: `public/assets/vehicles/slingshot-p03a1.glb`; authored maps: `public/assets/textures/p03a1/`. The accepted P01 source/export and physical contact layout remain unchanged. Bay source/export is `assets/blender/inspection-bay-p03a1.blend` / `public/assets/inspection-bay-p03a1.glb`.

Background Blender 4.5.2 LTS reproduction, using the ignored local portable installation:

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --factory-startup --python scripts/vehicle_p03a1_build.py -- --finish
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --factory-startup --python scripts/inspection_bay_p03a1.py
```

These commands regenerate the named P03A1 outputs; they do not modify P01 or P03A. The Blender download is excluded from the ZIP. A separately installed Blender 4.5.2 executable can replace that path. All runtime maps are newly authored; reference photos are research, not game textures.

`npm test` runs the normal simulation/save/shadow suite. `npm run build` includes TypeScript checking. To independently capture a built preview with installed isolated Playwright Chromium:

```powershell
npx playwright install chromium
node scripts/build-review03.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P03A1/a-new-capture-folder'
node scripts/capture-p03a1-stills.mjs
```

The still-capture tool refuses an existing folder. Set `VERIFY_BUILD=1` to verify build inputs and served bytes. Use another fresh `EVIDENCE_DIR` with `node scripts/record-p03a1.mjs` for a 13-second fully framed orbit and 20-second pad maneuver. These are actual runtime frames encoded at 12 fps; camera/light steps and simulation controls are scripted. Both movies are silent and do not claim real-time rendering, keyboard capture or human driving. FFmpeg must be available for movie encoding. `scripts/verify-p03a1-browser.mjs` requires a fresh `EVIDENCE_DIR` and checks routes, actual wheel/steering/caliper presentation and renderer counts. All browser work runs in isolated headless Chromium, without desktop input. Capture/audit commands assume the full Git checkout; ordinary ZIP launch does not need Git metadata.

Historical capture scripts may use fixed G0/G1/G2 locations. Do not run them over accepted evidence. `npm run preview:accepted` / `gate:g0` / `gate:g1` / `gate:g2` validate historical evidence integrity only, not current aesthetics or handling. The small review ZIP intentionally omits the full historical archive, so use `npm run preview` there; full historical gate validation requires the intact repository archive.

## Explicit limits

P03A1 is a fidelity candidate; the focused review records acceptance or specific remaining blockers. It is an inspection/driving checkpoint, not a finished game. No rider, interactive garage/workshop, race, opponents, upgrades/shop/campaign, night road sample, engine/tire audio or new driving camera suite is implemented. Instruments and infotainment are visual approximations, with no fabricated live readout claim. Broad environment lighting approximates a studio; it is not a measured physical lighting simulation.

The pad uses the same showroom-detail mesh. A racing LOD, texture compression and physical GPU performance remain unvalidated. Silent SwiftShader recordings can run slower than real time and do not establish hardware frame rate or subjective handling quality. Physics coefficients are simcade estimates; the existing severe high-speed curb hop remains a known limitation. The RPM fix preserves the documented tick-start coupling approximation, idle/clutch and shift model. G3 must remain pending for later P03B/P03C evidence.

Review02 P03A remains explicitly available with `asset=p03a`; its source and maps are preserved. The P03A1 wheel contacts, physics, signed-RPM tests and caster policy remain unchanged. Read `director-kit/production/evidence/P03A1/REVIEW-ME-FIRST.md` for the delivered candidate status and evidence version.
