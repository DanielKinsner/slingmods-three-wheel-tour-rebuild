# Performance gate: PASSED (2026-09-24)

The long-standing performance HOLD is cleared on this machine. The High and Ultra sustained gates on Harbor
(dusk-rain, uncapped, 2560x1440, two complete races per run) now pass, with the same unchanged thresholds
(`scripts/perf/frame-statistics.mjs`). Smoky Ridge High passes by a wide margin.

## Results (packaged builds, `scripts/perf/sustained.mjs`)

| Harbor dusk-rain | Before this work | High run A | High run B | Ultra | Gate |
|---|---:|---:|---:|---:|---:|
| Average frame | 11.91 ms (High) / 13.77 (Ultra) | 6.96 | 6.86 | 7.93 | High <= 10 |
| Worst 1% | 35.06 / 41.17 | 15.43 | 14.90 | 17.99 | High <= 16.6 |
| p95 | 19.5 / 29.4 | 10.8 | 10.6 | 12.3 | <= 20 |
| p99 | 30.9 / 36.6 | 13.4 | 13.0 | 15.3 | <= 33.4 |
| Max | 46.1 / 47.1 | 33.6 | 34.0 | 41.8 | <= 100 |
| Verdict | HOLD | PASS | PASS | PASS | |

All four High races pass individually (worst 1% 15.79, 15.06, 15.00, 14.78 ms). Smoky Ridge High: average 4.6 ms,
worst 1% 11.5 ms, PASS. Raw evidence (local only): `.tools/perf-mirrorhold-high-1/`, `-2/`, `.tools/perf-final2-ultra/`,
`.tools/perf-final-ridge-high2/`, and every intermediate step under `.tools/perf-*`.

Caveats: one workstation (RTX 4080), headless Chromium ANGLE D3D11, the owner's Chrome open in the background.
The High worst-1% margin is ~1.2 ms. Low-preset calibration showed a ~16 ms worst-1% floor from the browser on this
machine, so treat High as passing with modest headroom, not by a mile.

## What changed and why (draw calls per frame, Harbor dusk-rain High, mid-race)

Diagnosis (`.tools/claude-polish/census.mjs`): the four cars were about two-thirds of CPU draw submission, drawn
in the view, the sun shadow map and the wet-road reflection. Later the wet-road reflection's pixel cost dominated
the slow-frame tail.

| Commit | Change | Main pass | Wet reflection |
|---|---|---:|---:|
| start | - | 1257 | 718 |
| `c9e75db` | Rival distance proxies (one baked mesh per moving part beyond 22 m, lamps kept); player-car stand-in for shadow + puddles; proxy shaders compiled while loading | 852 | 244 |
| `40a793f` | Rivals always shadow/reflect through their proxy, near or far (race start) | 657 | ~107 |
| `cd97f69` | Player's static parts merged during drives (products untouched; showroom unchanged) | 544 | 95 |
| `624d805` | Wet reflection target 0.5 -> 0.35 of the screen (it cost ~65% of the main view's pixels) | same | same, half the pixels |
| `30018e8` | On High, mirrors skip the puddle frames (both passes no longer stack on one frame) | | |

A/B switch: `?test=1&profile=1&perf=legacy-proxy` restores the old vehicle path. Visual checks (on/off side by
side): rivals at 20+ m, player shadow in daylight, puddle reflections at night, chase/rear/cockpit views of the
merged player car, grid shadows. Tests: `tests/vehicle-proxy.test.ts`, the new mirror-hold test in
`tests/vehicle-mirrors.test.ts`. 503/503 tests pass.

## Next opportunities (not needed for the gate)

- High's dynamic resolution still drops to ~0.6-0.8 even though frames are CPU-bound: Ultra at full resolution is
  about as fast. A GPU-aware controller would make High visibly sharper at little cost.
- The harbour scenery (~228 draws, 131 unique) is now the largest single draw bucket.
- The race start (first ~5 s, all cars near at full detail) remains the heaviest stretch.
- Only Harbor and Ridge were measured here; Express was not.

## How to re-run

```powershell
npm run demo:build
$env:PORT='5225'; node scripts/serve-demo.mjs
# separate terminal, one GPU measurement at a time, fresh evidence folder each run:
$env:BASE_URL='http://127.0.0.1:5225'; $env:EVIDENCE_DIR='.tools/perf-new-high'; node scripts/perf/sustained.mjs high uncapped harbor
```
