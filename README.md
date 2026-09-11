# SlingMods: Three-Wheel Tour — First Drive (P03B2)

Continue the existing rebuild. The current P03A2 Slingshot, bay/pad, maps and accepted physics are frozen. P03B2 adds a separate fitted Blender driver, cockpit, quick rearward glance and telemetry-driven game sound. Whole-car visual fidelity and G3 remain held/pending. Current authority: director-kit/director-addenda/review-04/CODEX_NEXT.md.

## Launch

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5187/. Inspect offers the retained unoccupied bay. Drive opens the same car with its helmeted driver on the existing pad. Use Enable sound in the driving page; silent play remains available. Mute and volume persist independently of camera preference. A controller gesture alone does not guarantee browser audio activation.

| Action | Keyboard | Standard controller |
|---|---|---|
| Throttle/brake | W/S or arrows | RT/LT analog |
| Steer | A/D or arrows | Left stick |
| Near → far → cockpit | C | Top face |
| Quick held rearward glance | B | LB |
| Request direction | X | Right face |
| Reset practice start | Hold R one second | Hold bottom face one second |
| Pause/resume | Escape | Menu |

Release controls and resume deliberately after blur/disconnect. Inspect returns to the bay. I toggles diagnostics; speed, gear and RPM stay visible. The18 cones are noncolliding practice guides. No race, campaign, AI, vehicle selector/customizer, live shop, upgrades or new track. Historical vehicle variants remain in the checkout; the compact Review05 archive includes only the current runtime car.

## Authoring and checks

Separate driver: assets/blender/drivers/test-driver.blend; public/assets/drivers/test-driver.glb and attachment JSON.28,411 triangles/4 material groups, compact original1K PBR maps. Actual wheel matrix drives bounded arm IK and alternating regrips; supporting hand may slide along the rim. No vehicle reshaping to fit the person. Helmet/head hide only in cockpit. Gaze and view switching are presentation choices, not measured OEM vision.

Original local synthesis bank: public/assets/audio/p03b2/. Three estimated RPM bands each have loaded/lifted beds, plus road, wind and actual-shift transient. Provisional timbre; no authentic exhaust or auditory approval claim. Source settings/permission basis/hashes are in provenance.json. Runtime and offline evidence use the same Web Audio graph, source buffers and pure telemetry mapper. No paid service, external generation or client credentials.

With Blender4.5.2/Python with numpy installed, the authoring scripts are scripts/driver_p03b2_build.py, scripts/driver_p03b2_materials.py and scripts/audio-p03b2.py. They regenerate their named driver/audio outputs; do not run regeneration over historical evidence unintentionally. Downloaded Blender and dependencies are excluded from review archives.

```powershell
npm test
npx tsx --test tests/input.test.ts tests/drivetrain-wheel-speed.test.ts
npx playwright install chromium
node scripts/build-review05.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/Review05-new'
node --import tsx scripts/capture-review05.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/Review05-browser-new'
$env:VERIFY_BUILD='1'
node scripts/verify-first-drive-audio-final.mjs
$env:DIAGNOSTIC_DIR='director-kit/production/evidence/Review05-diagnostics-new'
node scripts/verify-review05-diagnostics.mjs
```

Capture commands require a running preview, FFmpeg and a Git checkout; ordinary launch does not. Choose fresh output directories. Isolated Chromium uses SwiftShader and mutes physical output, without overriding autoplay policy. The35s film uses120Hz controlled ordinary presentation, retained60Hz physics and24fps raster. Full logical telemetry/input/camera/driver/lifecycle timeline schedules shared-graph OfflineAudioContext sound, then muxes it without stretching. This is offline runtime-graph evidence, not live hardware recording, a physical controller test or sustained FPS. Review guide/results record exact verdicts and limits. Stop for Astra after Review05; no deployment or G3 advancement.
