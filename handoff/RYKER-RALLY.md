# Redstone Rally (2026-09-28)

The owner requested a Ryker-exclusive rally mode and a new dirt track with drifting and richer scenery,
including new Blender models, and explicitly authorized pushing the completed work to main.

## Play

Open **Race -> Redstone Rally -> Start Rally**. The fourth destination is available with any showroom
vehicle selected; entering supplies a Ryker when necessary. An existing Ryker build carries its fitted
parts into the stage. **Explore the stage** opens an untimed recce.

One timed lap covers 2.14 km of compacted dirt, loose gravel shoulders, quarry hairpins, and forest
esses, with 32 ordered checkpoints and approximately 10.6 m of elevation change. Orange/cream flags
mark the corridor; sector boards and HUD notes announce the next bend. Brake before the corner,
hold **Space / controller X** with steering to rotate, then release and countersteer. Rally enables
the established catchable handbrake slide, with automatic boost rewards disabled.

Lap time and drift points are separate objectives. Only forward progress through new road distance
scores; stationary donuts, repeated bends, reversing, grass, pause, and post-finish movement do not.
Linking slides raises the multiplier up to 3x. A valid completed lap saves the fastest time and highest
drift score independently for that build. Records live in `slingmods-redstone-rally-v1`; recce is
unscored. Reset/retry resets the attempt. No career credits or certified career results are awarded.

## Implementation

- `src/rally/route.ts`: original tangent-continuous closed course, exact surface meshes, dirt/gravel grip.
- `src/rally/presentation.ts`, `vegetation.ts`: textured ruts, soil banks, continuous terrain support,
  physical scenery obstacles, flags/signs, 1,431 new-kit placements plus 335 broadleaf trees and 1,070
  understory placements. Distance batching limits scenery draw calls and shadow casters.
- `scripts/build-rally-scenery.py` and `assets/blender/rally/`: nine new original Blender models and
  editable packed source. Asset provenance is documented in that folder.
- `src/rally/entry.ts`, `score.ts`, `run.ts`: exclusive entry, fixed-tick scoring, records, rally HUD/results.
- The showroom destination, loading art, public URL allowlist, and curated deploy asset manifest include
  rally. A foreign build fragment is replaced along with the visual query to avoid a redirect loop.

Rally has its own scene, route version and event identity. It does not extend the existing saved road
destination enum, change old route geometry, change vehicle handling profiles, or alter career saves.
Road challenges, series, ghosts, rivals, and arcade rewards do not run on this stage. Existing road
drives keep their original default drift/boost behavior.

## Validation

- `npm test`: 541 passing tests, including a real Rapier lap through all checkpoints, bounded dirt
  handbrake slides, no rally boosts, score anti-farming, record separation/storage denial, and entry isolation.
- `npm run deploy:build`: TypeScript, production build, and curated publication stage pass.
- All nine original GLBs validate with zero errors and zero warnings (`rally-evidence/assets.json`).
- Packaged browser checks pass: Slingshot showroom entry supplies a Ryker, desktop/mobile event layout,
  a valid 2:02.93 physical lap, saved record after reload, retry reset, pause freeze, recce handbrake
  slides, and all three existing road/vehicle combinations. Zero browser errors or failed asset requests.
- Ordinary keyboard input on a timed stage produces 193 drift points and 49 active slide ticks, with
  no boost and no premature record. `rally-evidence/packaged/scored-drift.json` and its screenshot
  retain the result. `scripts/rally/verify-drift.mjs` reproduces this independently.
- Sustained frame timing is recorded alongside this document. The main browser/performance scripts
  are `scripts/rally/verify-browser.mjs` and `scripts/rally/measure-performance.mjs`.
- **Normal display cadence PASS:** two valid laps, 245.89 active seconds and 14,754 frames at
  2560x1440 High. Average 60.00 FPS, p95 16.7 ms, p99/max 16.8 ms, zero frames over 33.4 ms.
  Resolution stays at 1.0 throughout both laps. Browser errors and failed asset requests: zero.

Browser validation uses an isolated profile and ordinary menu/input actions; the controlled clock is
for reproducible functional checks, not performance evidence. Performance runs use native RAF at
2560x1440 with sound enabled and the repository's existing unchanged frame thresholds. Both normal
display cadence and an explicitly uncapped stress lane are retained separately.

### Uncapped stress limitation

`rally-evidence/performance/summary.json` retains the first two full uncapped laps. High's average
and worst-1% budgets pass (2.19 / 2.11 ms averages, 9.32 / 7.39 ms worst-1% means), but the 100 ms
maximum-frame gate fails: 150.3 / 112.9 ms maxima, with 11 frames over 100 ms across 246.5 active
seconds. Shader program count stays at 80; the long intervals follow long render submissions.
Dynamic resolution ranges from 0.8 to 1. This is a retained uncapped stress limitation, not a claim
that the complete uncapped gate passed, and it does not supersede the older road-course gate.
Normal display-paced results are recorded separately in `rally-evidence/performance-native/summary.json`.
Both lanes use the owner's RTX 4080, Chromium ANGLE D3D11, High graphics and two valid physical laps;
they do not establish performance on other hardware.

Run against a freshly built publication stage:

```powershell
$env:PORT='5271'
node scripts/serve-demo.mjs --publish
# In another terminal:
$env:BASE_URL='http://127.0.0.1:5271'
$env:EVIDENCE_DIR='handoff/rally-evidence/packaged'
node scripts/rally/verify-browser.mjs
node scripts/rally/verify-drift.mjs
$env:EVIDENCE_DIR='handoff/rally-evidence/performance'
node scripts/rally/measure-performance.mjs
$env:CADENCE='native'
$env:EVIDENCE_DIR='handoff/rally-evidence/performance-native'
node scripts/rally/measure-performance.mjs
```
