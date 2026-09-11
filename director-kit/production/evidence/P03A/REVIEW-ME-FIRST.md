# Astra Review 02 — narrowed P03A

Runtime implementation checkpoint: `fbe89bf31cd81af7b77ec60358c0bcd65056e53a`. Project root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`. The ZIP's `PACKAGE-MANIFEST.json` records its later review-ledger checkpoint and per-file hashes; final captures name the runtime checkpoint and exact compiled/source bytes. Later ledger changes do not change those runtime inputs.

## Open the current build

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open **http://127.0.0.1:5187/**. Normal entry is the inspection bay. **Inspect** opens view/light controls; **Drive** loads the same new Slingshot on the existing pad. W/S drive/brake, A/D steer, X reverse request, C near/far chase, hold R one second reset, Escape pause/resume. Explicit calibration and P01 inspection remain available; see README. The ZIP contains source, so build it locally; dependencies and dist are deliberately excluded.

## Delivered changes

- Separate signed-wheel RPM fix at `9add1f9`: combine signed rolling and overspeed before magnitude. Astra's unchanged reproduction passes 4/4; integrated wheelspin, wet braking/recovery, reverse and shifts are covered. Existing tick-start coupling/idle/clutch/shift approximations remain disclosed in the G2 addendum.
- Blender-authored Slingshot primary surfaces, cockpit, lamps and wheel details; reference-guided blue fade/graphics, actual paint/polymer/rubber/seat/metal maps and transparent glass. Source: `assets/blender/vehicles/slingshot-p03a.blend`; runtime: `public/assets/vehicles/slingshot-p03a.glb`; external authored maps: `public/assets/textures/p03a/`.
- Compact authored bay, minimal Inspect/Drive actions, toggled diagnostics. The same exported asset follows existing wheel/steering/suspension contacts on the pad; rear caliper follows suspension travel without spinning.
- Moving pad shadow bands diagnosed through caster isolation and continuous keyboard reproduction. Ground/paint now receive shadows; vehicle and genuine obstacles still cast them. Before/after policy recordings and diagnosis are included.

## Evidence and results

The normal test suite passes **29/29**. TypeScript/Vite production build passes (existing large-chunk warning remains). Exact whole-asset bounds and all 18 protected wheel/mount transforms match P01. Export has **52 primitives, 176,218 triangles, 16 embedded authored maps**; GLB is **7,726,756 bytes**, SHA256 `5ca79ccf1608491a4c82079d570d0928c85c3581f5ebcf7d557404864250cee2`.

Read `REVIEW.md`, `review-final.md`, `STATISTICS.md`, `final-02/capture-report.json`, and `verification-final-02/browser-verification.json` under `director-kit/production/evidence/P03A/` for final route/animation/movie results and provenance. Seven current runtime images include all six requested views plus an unflattering front. Two current runtime movies show a full turn/light sweep (145 synchronized runtime frames encoded at 12 fps) and actual keyboard pad acceleration, both corners, braking and camera change. See CAPTURE-CORRECTION.md for the superseded partial capture and repaired bay Rear/orbit boundary. **SILENT: audio is not implemented.** Separate old-policy/repaired-policy shadow clips use the preserved P01 for controlled diagnosis, not as final P03A art evidence.

Environment: Windows 11 Pro build 26200; Node 24.15.0, npm 11.6.2, Python 3.13.5, Blender 4.5.2 LTS; Three.js 0.186.0, Rapier 0.20.0, Vite 8.3.0; isolated headless Chromium 153.0.8010.12 with SwiftShader. Simulation/video timing can be slower than real time. No desktop input takeover or repeated owner QA was used.

## Honest limits and gates

**G3 remains pending.** P03A is one locally reviewed inspection/pad checkpoint, not a finished game or OEM-CAD replica. Graphics, spoke shapes and cabin details remain reference-guided approximations. Instruments/infotainment are passive, and mirror reflections are not a live rear-view system. Lamp optics are visible materials, not a validated nighttime beam system. Bay lighting uses broad environment/specular approximations; no measured physical-lighting claim.

There is no finished rider, gamepad implementation, engine/tire audio, full camera set, interactive garage, day/night race course, rivals, races, upgrades or campaign. The other two vehicles remain the original scale blockouts. The pad uses the showroom mesh above the provisional racing-LOD budget; no LOD, compression or physical GPU/FPS approval is claimed. The documented severe high-speed curb hop and estimated drivetrain/suspension behavior remain. G0/G1/G2 historical evidence and P01 are unchanged, with the new RPM finding appended separately. Stop here for Astra; P03B/P03C and G3 are not advanced.

Packaging excludes Git, dependencies, downloaded Blender/tools, dist, environment files, credentials, backups and redundant historical/failed-revision archives. Those historical files remain preserved in the original workspace. Historical gate validators require that full archive, intentionally absent from this small review ZIP.

Capture framing: the completed turntable uses tight framing and may crop lower edges; full neutral stills show the complete silhouette. Normal ZIP launch needs no Git metadata; capture/audit scripts assume the full Git checkout.
