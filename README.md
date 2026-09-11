# SlingMods: Three-Wheel Tour — P03A2 / P03B1

Continue this standalone rebuild. Review03 permits bounded front-shell repair and independent controls/camera/practice development. P03A2 is the provisional default after local shell/integration review; broader vehicle fidelity remains held. G3 pending. See director-kit/director-addenda/review-03/CODEX_NEXT.md and production/state.json.

## Launch

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5187/. Inspect opens compact bay views/orbit/light sweep. Drive uses the same Slingshot on the existing pad with an18-cone practice guide: launch, gentle slalom, broad sweeper, stop box. Cones are noncolliding; no route constraint, race or scoring. Speed/gear remain visible; I toggles diagnostics. Dev: npm run dev, port5186.

| Action | Keyboard | Standard controller |
|---|---|---|
| Throttle / brake | W/S or up/down | RT/LT analog |
| Steer | A/D or left/right | Left stick |
| Near/far chase | C | Top face |
| Held look-back | B | Left shoulder |
| Request direction | X | Right face |
| Reset practice start | Hold R one second | Hold bottom face one second |
| Pause/resume | Escape | Menu/right center |

Focus loss/disconnect pauses and clears controls; resume deliberately and release controls to rearm. Unknown mappings fall back to keyboard. A controller may need a button gesture before the browser exposes it. No physical-controller claim. Keyboard and controller share the retained60Hz physics and direction/braking interlock.

## Sources and isolated verification

Default: public/assets/vehicles/slingshot-p03a2.glb; editable assets/blender/vehicles/slingshot-p03a2.blend. Diagnostic proof01/master remain separate. P03A1, all other vehicle parts/maps, inspection bay and physics/shadow policy are preserved. New local construction uses independent boundary curves and connected quad lip/return; it does not certify final OEM fidelity.211431 triangles,59 primitives; same16 embedded maps; showroom asset on pad remains above racing-LOD target.

With Blender4.5.2 installed (replace executable path if needed):

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' -b --python scripts/vehicle_p03a2_proof01.py
& '.tools/blender-4.5.2-windows-x64/blender.exe' -b --python scripts/vehicle_p03a2_integrate.py
& '.tools/blender-4.5.2-windows-x64/blender.exe' -b --python scripts/practice-p03b1.py
npm test
npx tsx --test tests/drivetrain-wheel-speed.test.ts
```

Rebuild scripts regenerate only their named outputs; retain historical files before intentional regeneration. Blender/tools excluded from ZIP. Runtime maps are authored, not research photos. P03A1 .blend and retained export batcher are included dependencies.

With isolated Playwright Chromium and FFmpeg installed:

```powershell
npx playwright install chromium
node scripts/build-review04.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/Review04-new'
node --import tsx scripts/capture-review04.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/Review04-browser-new'
$env:VERIFY_BUILD='1'
node scripts/verify-p03b1-browser.mjs
```

Use fresh evidence directories. Build/capture audit expects Git checkout and running preview; ordinary ZIP launch needs no Git.30-second SILENT film uses virtual standard inputs through the real reader/session/unsnapped camera with controlled clock60Hz; GPU/HUD captured12fps. No desktop control, fabricated audio, snapped-camera shortcut, physical FPS or human driving claim. Separate real browser-keyboard focus/reset check. Node24.15/npm11.6.2, Windows11, Chromium153/SwiftShader, Blender4.5.2 LTS. Historical routes asset=p03a1/p03a/p01 and calibration remain; fleet is scale blockouts only. No upgrades, live infotainment, driver, campaign, races or audio implemented in this packet.
