# Fleet rendering continuation — 2026-09-23

Owner asked to keep improving the game after `5a14717`. This continuation removes repeated CPU work.
Model geometry, texture detail, quality presets, reflection frequency, steering, physics, routes and
saves remain unchanged. Work is local; no push, deployment or purchase.

## Implemented

- **Rider matrices:** update the vehicle/control ancestor paths and the rider, instead of all vehicle
  meshes during every rider solve. The hand/foot solver reads matrices already made current and updates
  each changed joint's descendants before the next solve. Cached node references avoid repeated name
  searches. The eventual scene update still prepares every mesh for rendering.
- **Fleet materials:** the three rivals share 66 owned opaque trim materials instead of 198 separate
  copies. Eligibility is restricted to semantic metal/rubber/interior, fully opaque, non-emissive parts.
  Paint, accents, decals, glass, lights, active displays, unbound materials and the player's materials remain independent.
  Reference counting keeps a surviving rival's materials alive when another rival is disposed.
- **Evidence switches:** `?test=1&profile=1&perf=legacy-rider,legacy-materials` restores these two paths
  for comparison. Material selection happens when rivals are created; reload to switch that path.
  `legacy-rider` can also switch in a running evidence scene. Prior render fixes remain enabled unless
  explicitly selected. The historical `legacy` switch still means all fixes off.

## Verification

483 tests pass serially, including exact rider matrix/report equality across all three current vehicles,
moving roots, steering, cockpit visibility, acceleration, resets and regrip history. Material ownership,
opt-out cases and disposal are tested. Typecheck and the curated production build pass.

The paired static-grid diagnostic uses the same packaged build, High wet Harbor, 2560×1440, uncapped
Chromium/ANGLE D3D11. An ABBA sequence collects 300 real RAF frames per sample. All sampled frames remain
in the report. GL entry points are wrapped for counts, so this is **diagnostic, not race acceptance**.

| Measure | Original path | Updated path | Change |
|---|---:|---:|---:|
| CPU frame mean | 13.20 ms | 11.77 ms | −10.8% |
| Render submission mean | 11.94 ms | 10.93 ms | −8.5% |
| Tracked uniform submissions/frame | 6,697.53 | 5,923.54 | −11.6% |
| Texture bindings/frame | 1,712.5 | 1,218.5 | −28.8% |
| Program switches/frame | 405.25 | 291.25 | −28.1% |
| Draw calls/frame | 1,906 | 1,906 | unchanged |

Raw evidence: `.tools/fleet-cost-20260923/`. The in-app preview and other owner applications were left
alone. Timing is specific to this machine and sample; CPU submission is not GPU execution time.

Final visual and sustained results are recorded in `FLEET-RENDER-VALIDATION.json`.
The initial visual comparison is retained in `.tools/fleet-visual-20260923/`; it precedes the final
direct matrix-read optimization. The final comparison is `.tools/fleet-visual-final-20260923/`.

The final comparison covers 36 paired views (player, two rivals; three angles; all vehicles/routes),
51.84 million pixels. 68 pixels differ; three exceed 8/255, with maximum channel difference 25/255.
The images are visually equivalent at normal inspection but not bit-identical. The rider bone matrices
are bit-identical in the independent old/new pose tests. Geometry/texture counts and shader-program
counts remain equal between paths; no missing requests or browser errors were observed.

The final sustained checks each completed two valid races, with all four participants finishing and
no browser errors or missing requests. The existing performance gate remains **HOLD**.

| Preset | Active time | Mean frame | Mean FPS | Worst 1% | p95 | p99 | Maximum |
|---|---:|---:|---:|---:|---:|---:|---:|
| High | 154.32 s | 13.57 ms | 73.70 | 55.11 ms | 29.20 ms | 42.40 ms | 95.60 ms |
| Ultra | 155.92 s | 17.53 ms | 57.05 | 102.19 ms | 40.70 ms | 47.50 ms | 485.50 ms |

These are pooled descriptive statistics, not a substitute for the per-attempt gate. Both attempts
at each preset fail its unchanged limits. High used its existing dynamic resolution at 60–65% of
2560×1440; Ultra stayed at 100%. High had no intervals over 100 ms. Ultra's second attempt contains
41 intervals over 100 ms, including the 485.50 ms maximum; all remain in the evidence. The timing
variation is unresolved and is not attributed to other applications. Raw captures are retained in
`.tools/fleet-high-20260923/` and `.tools/fleet-ultra-20260923/`.

## Reproduce

```powershell
node --import tsx --test --test-concurrency=1 tests/*.test.ts tests/*.test.mjs
npm run demo:build
$env:PORT='5226'
node scripts/serve-demo.mjs
```

In a second terminal, set `BASE_URL` to that server and a fresh `EVIDENCE_DIR` for each run:
`node scripts/perf/fleet-render-ab.mjs`, `node scripts/perf/fleet-cost-ab.mjs`, then the unchanged
`node scripts/perf/sustained.mjs high uncapped harbor` and `ultra uncapped harbor`.
Run GPU checks sequentially. Keep raw stalls and failures; never infer sustained acceptance from the
short instrumented sample. Raw `.tools` captures and versioned `demo-dist` builds remain local.

## Next

Continue the performance gate from the recorded final results. Wet reflections still repeat vehicle
draws; this pass reduces their submission overhead without altering reflected geometry or cadence.
Distance-model authoring, higher-detail source textures and remaining validator warnings from
`QUALITY-AND-PERFORMANCE.md` remain separate work. No claim of universally finished assets or phase-wide
performance clearance follows from these optimizations.
