# Phase 2 closing gate: pipeline parity complete; performance HOLD

- Calibration now uses the shared HDR/post stack, quality presets and preset-aware resize. The retained pad/garage warms that same post path before ready. Production road tests, quick races and career already use `src/express.ts`; their rendering, Sport v5 physics/input, saves, historical records, products/fitment, routes/colliders, 2026 geometry, branding and Tour Wall are unchanged. The only road-loop addition records the existing resolution scale in opt-in profiling.
- `scripts/perf/sustained.mjs` runs two complete four-car Harbor dusk-rain races (at least 90 active seconds; maximum three) per invocation. It uses the current control-only Sport v5 driver, actual simulation/rivals, real RAF and active game audio. No screenshots, tracing, draw wrappers, skipped raster, fake results or outlier removal during scoring. Full phase rows and every failed attempt survive. Percentiles are nearest-rank; worst-1% ms is the mean of the slowest ceil(N/100) intervals, and 1%-low FPS is 1000 divided by that mean. The older 400-frame sampler now labels itself diagnostic and reports both p99 and worst-1%.
- Acceptance is unchanged: each attempt needs p95 <=20 ms, p99 <=33.4 ms and maximum active interval <=100 ms (1e-6 ms numerical tolerance only). The inherited Phase 2A High uncapped budget also requires <=10 ms average and <=16.6 ms worst-1%. This representative bound does not clear the phase-wide HOLD or authorize Phase 3. The final results below come from the final package; rejected transparent-material cache experiments remain separate and are absent from the shipped renderer.
- Verification: typecheck, normal production build, curated package, four calibration presets/resizes, all three road routes/story entry, comparison/fallback checks, and a fresh garage -> Shakedown -> validated reward -> garage loop pass. All 380 tests pass with `node --import tsx --test --test-concurrency=1 tests/*.test.ts tests/*.test.mjs`. Two parallel full-suite runs failed the existing audio-capture timing test (379/380); its isolated 2/2 pass and serial suite do not erase those failures. No audio assertion, threshold or production source was changed. Cause remains unproven.
- Reproduce one bounded case using the PowerShell commands below. Use low/medium/ultra for the preset report; `high native harbor` is the separate normal-pacing check. See `PHASE-2-CLOSING-VALIDATION.json` for all attempt results, scales, source/package hashes and local raw-evidence paths. Run one benchmark at a time. Next is bounded performance diagnosis on the same machine. Phase 3 remains blocked and the prior heartbeat remains unchanged.

All measurements below: RTX 4080 / i9-12900K / Windows 11 / Chromium ANGLE D3D11, 2560x1440 output, DPR 1. Each row pools two full races for description; acceptance uses each attempt separately. Low/Medium/High may render below full resolution; Ultra is fixed at 100%. Native RAF is headless browser timing, not physical-display certification.

| Preset / pacing | Active s | Avg ms | Worst 1% ms | 1%-low FPS | p95 ms | p99 ms | Max ms | Attempt verdicts |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Low / uncapped | 154.15 | 12.42 | 33.83 | 29.56 | 17.50 | 32.50 | 36.40 | PASS, PASS |
| Medium / uncapped | 154.19 | 12.02 | 32.77 | 30.52 | 16.00 | 30.20 | 35.40 | PASS, PASS |
| High / uncapped | 154.27 | 16.87 | 43.03 | 23.24 | 32.00 | 39.50 | 58.10 | HOLD, HOLD |
| Ultra / uncapped | 154.25 | 18.37 | 53.10 | 18.83 | 34.30 | 46.90 | 83.50 | HOLD, HOLD |
| High / native pacing | 154.19 | 17.30 | 34.32 | 29.13 | 16.80 | 33.40 | 50.10 | PASS, PASS |

Raw frames/failures remain local in ignored `.tools`; the tracked JSON receipt includes hashes and complete per-attempt summaries. Unrelated owner apps were left running. Final timing differences from earlier samples are unresolved and are not assigned to an invented software regression, thermal issue or background process. No thresholds or quality presets were lowered.

Sustained coverage is the representative Harbor race. Express, Ridge and career have functional coverage here; their sustained performance is not certified by this sample.

From the repository root, build and serve the package in one PowerShell terminal:

```powershell
npm run deploy:build
$env:PORT='5209'
node scripts/serve-demo.mjs --publish
```

In a second terminal, choose a new evidence directory for each run:

```powershell
$env:BASE_URL='http://127.0.0.1:5209'
$env:EVIDENCE_DIR='.tools/phase2-followup-high'
node scripts/perf/sustained.mjs high uncapped harbor
```
