# Astra Review12 — P06B Environment Quality Lock

Project root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.
Frozen runtime commit: **9348fa90311c5fbdfd74529feb50548582cdca17**. Current source/assets are identified by `director-kit/production/evidence/P06B/build-inputs-verified.json`. The package manifest separately identifies the local packaging commit. The corrected daylight capture and startup diagnostic tools are independently hashed evidence-only additions after the runtime freeze; see `capture-tooling-amendment.json`.

**Local art verdict: visibly improved, but the realistic environment target is not fully met.** Roads now have correctly scaled photographed aggregate and pale concrete construction; the terminal, connected quay/docks, service paving, palms, outdoor sky/water and compact garage are substantially reworked. The sparse broad lawns, repeating asphalt pattern, repetitive distant facades and thin palm silhouettes remain too simple. This is an integrated review candidate, not an environment-quality approval or a release. **G3/G4 remain pending.**

## Start here

1. Watch `director-kit/production/evidence/P06B/video-final/complete-race-LIVE-AUDIO.mp4`: one continuous actual two-lap crew race through result and saved garage. Virtual player input is disclosed; the production rivals and shared physics are unchanged. The player earns third place, not a supplied winner. Actual live stereo game audio is synchronized with three retained diagnostic chirps/flashes; the silent loading/bay portion is documented.
2. Watch `director-kit/production/evidence/P06B/day-final-02/garage-day-SILENT.mp4`: ordinary garage preview and a complete valid daylight lap. This secondary film is explicitly silent.
3. Compare all eight paired district images in `matched-before/` and `final-visual-02/`, under the same evidence root. Their normal near-camera positions/targets/FOVs are verified identical. Final detail/overview and near/far/cockpit/color checks are in the latter folder; stock/installed day/night room views are in `bay-final/`.
4. Read `final-stationary-art-review.md`, `final-media-review.md`, `PERFORMANCE-REVIEW.md` and `VALIDATION-METHODS.md`. The raw scored runs and engineering reports accompany them. Stationary fixtures are never presented as ordinary driving or performance evidence.

## Install and play

Node24.15.0/npm11.6.2 were used. From the existing root, or the extracted archive root:

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:5187/`. No account, service, download during play, diagnostic URL or new project is required. Use the existing preview if that port is already occupied by this rebuild. For source checks: `npm test`, `npx tsx scripts/parity-p06b.ts`, and `python scripts/validate-review12.py`. Full browser/audio tests additionally require the installed Playwright Chromium (`npx playwright install chromium` on a fresh test machine) and FFmpeg in PATH; their tested environment is recorded in environment.json. Blender authoring/reproduction instructions are in `assets/blender/showcase-quality/README.md`; ordinary play does not require Blender or Python.

W/S or arrows accelerate/brake, A/D steer, C cycles near/far/cockpit, B is a quick held rear glance, X requests direction, Escape pauses, and holding R resets the attempt. Standard virtual controller testing covers RT/LT, left stick, top-face camera, LB glance, Menu pause and bottom-face confirmation/reset. Release held controls after pause/focus loss/disconnect before driving again. Physical-device feel has not been certified.

## What is playable

The existing First Night at the Harbor chapter remains intact. A fresh valid solo lap earns800 fictional credits; later unique valid laps earn100. The single TricLED SM-133 base kit costs600 game credits, previews stock/installed and day/night in Build, saves ownership/equipment/color/brightness, and links deliberately to the real product page. No real purchase occurs. The crew event has three actual independently controlled Slingshots—Maya, Jett and Nico—in the same Rapier world, with two validated laps, position rewards, a one-time first-podium bonus, immediate retry and durable garage return. Separate day/night solo time trials retain personal bests. The original practice pad and inspection/calibration tools remain available. There are no new vehicles, opponents, products, course layouts or chapters in P06B.

## What changed and what was preserved

New editable `quality-foundation.blend` and `quality-kit.blend` contain photo PBR surfaces, metre-scaled UVs, curb/barrier construction, actual terminal/warehouse depth, dock planks/braces, swept hulls, contained planting pockets, curved palms with real near/mid/far geometry and compact room finishes. All active maps are packed; source/download/derivation/license/channel/scale/hash records identify33 selected CC0 material/HDR records. Original photos are included, not storefront preview images. The selected pure-sky HDR supplies daylight display and a separately prefiltered probe with its concentrated sun capped; a matching direct sun avoids double counting. Night has an authored sky/probe and restrained practical pools. Water uses the outdoor probe and world-space ripples/shore response; it does not reflect actual boats/buildings.

Runtime fixes include true shared material binding by embedded-image hashes, pruning of unused room/outdoor resources, coherent per-cell palm LOD, preparation of all levels, explicit bay/probe disposal, and reversed-depth or logarithmic fallback while preserving the cockpit near plane. Overlapping paving/land was rebuilt as connected surfaces with real holes; missing distant mainland was filled. These causal geometry/depth repairs replace the earlier attempts that merely moved clipping limits.

The accepted car/rear/driver/product exports, physical route/collision envelope, physics/input, rivals/race rules, chapter/rewards and saves are unchanged. Raw protected hashes,56 Git-filtered comparisons and the exact4,200-row solo replay support this. New ground passes3,080 route/runoff clearance rays and87 distant-coverage rays. Original accepted vehicle/driver/product Blender sources remain local and in prior review packages; their unchanged path/size/SHA records are in `unchanged-authoring-sources.json`. The new sources and required unchanged original harbor Blender foundation are included here. Three pre-existing unrelated untracked files were preserved, not folded into this packet.

## Verification and limits

119 tests and the production TypeScript/Vite build pass. Fresh earned-credit/purchase/actual-podium/reload, four full races with three retries, scene transitions, controller/audio/UI checks and720p/1080p interface review pass. Shared logical resource counts remain272 geometries/72 textures across repeated races; this is not a driver-VRAM measurement. All five clean native configurations/six races meet the working racing limits; `PERFORMANCE-REVIEW.md` retains every raw outlier and the comparison with P06. The first stock720 run is at the33.4ms p99 boundary; an isolated116.6ms ready-screen interval and the exact early shader variant remain unresolved. The movie uses actual live game audio: stereo signal checks found no clipped/non-finite samples, and three-anchor synchronization residual is under19ms. This is technical capture proof, not human listening or fun approval.

The final stills include current runtime bindings and exact frozen hashes. Two capture-only mistakes were rejected and preserved locally: a fixture without SHOWCASE=full and a daylight driver without the guarded test token. The ZIP contains the corrected evidence, with the failures and provenance amendment disclosed in `capture-review.md`. No game guard was weakened and no controlled-clock video substitutes for native timing.

The measured reference is Windows11/i9-12900K/RTX4080, NVIDIA32.0.16.1692, Chromium153.0.8010.12 with hardware ANGLE D3D11, DPR1 and standard quality. Software rendering was used only for the labeled solo UI fallback regression. No other hardware/mobile, physical controller, human audio/handling judgment or universal frame-rate claim is supplied. Historical P05/P06 outliers remain preserved and are not explained away by current results.

Remaining presentation debt includes sparse terrain and repetitive skyline, visible road tiling, wiry palms, simple distant props, approximate water reflections and underglow photometry, provisional car/driver surfaces, simplified mirrors/instruments and synthetic telemetry-driven engine sound. Rae's chapter communication remains text; there is no full campaign, voiced story, multiplayer or extra inventory. These limitations are not hidden behind night lighting.

## Milestone and handoff

Internal material/geometry benchmark, changed construction methods, full-course rollout, compact garage, independent runtime review and functional regression are integrated. Current performance findings and any reservations are recorded in the accompanying performance report and state excerpt. The overall realistic art target remains held for Astra; no unsupported gate was advanced. Local recoverable commits preserve each stage. The latest packet forbids remote changes: no remote was added, fetched, pushed, merged remotely or deployed. No spending or desktop/mouse takeover occurred.

`PACKAGE-MANIFEST.json` lists every other archive entry with bytes and SHA-256. Dependencies, .git, tools/Blender downloads, dist, .env/credentials, caches, backups and the redundant evidence archive are excluded. Historical work remains in place. Review the integrated result before assigning more work; this packet does not authorize another implementation expansion.
