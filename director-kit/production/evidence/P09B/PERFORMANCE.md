# P09B native performance

Final matrix: **16/16 passing attempts**, 0 active intervals over100ms. Every attempt and every raw row is retained.

| Viewport | Route | Build | Attempt | p95 ms | p99 ms | Max ms | >100 ms | Result |
|---|---|---|---:|---:|---:|---:|---:|---|
| 1280 | harbor | stock | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1280 | harbor | stock | 2 | 16.80 | 16.80 | 16.80 | 0 | PASS |
| 1280 | harbor | equipped | 1 | 16.80 | 16.80 | 33.40 | 0 | PASS |
| 1280 | harbor | equipped | 2 | 16.70 | 16.80 | 33.40 | 0 | PASS |
| 1280 | express | stock | 1 | 16.70 | 16.80 | 50.00 | 0 | PASS |
| 1280 | express | stock | 2 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1280 | express | equipped | 1 | 16.80 | 33.30 | 66.60 | 0 | PASS |
| 1280 | express | equipped | 2 | 16.80 | 16.80 | 66.80 | 0 | PASS |
| 1920 | harbor | stock | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 | harbor | stock | 2 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 | harbor | equipped | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 | harbor | equipped | 2 | 16.70 | 16.80 | 33.40 | 0 | PASS |
| 1920 | express | stock | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 | express | stock | 2 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 | express | equipped | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 | express | equipped | 2 | 16.70 | 16.80 | 16.80 | 0 | PASS |

## Method and attribution

Windows / Intel i9-12900K / NVIDIA RTX4080, Chromium153.0.8010.12 ANGLE D3D11, DPR1. 720p uses the existing low quality preset;1080p uses standard, unchanged from prior matrix conventions. Native wall-clock RAF; complete real races with all three rivals and valid production gates, control-only evidence driver. First attempt and retry both included. Actual audio graph enabled; host output muted. No screenshot/video/trace capture during scored races. No unrelated processes stopped. Runtime bf1297c9770357cf5a331288b14cae82d5510d86. Packaging/docs commits do not change runtime inputs.

Thresholds: p95<=20ms, p99<=33.4ms, maximum active interval<=100ms;1e-6ms numeric tolerance only. No spike exclusion or overflow. run.json retains ready/loading/countdown/results rows as well as scored running rows. Functional controlled-clock tests and instrumented traces never count as native performance.

## Baseline and bounded changes

Current-art P09A baseline55ea675 was measured separately at1080p Express stock, two full races, both passing (p95~16.7/16.8,p99~16.8,max16.8/33.4ms). That is one matched baseline configuration, not a fresh eight-case baseline. It did not reproduce every historical Review17 stall. Presentation telemetry now reuses storage, and numerical HUD writes use cached nodes/diffed text at10Hz. Existing order/menu caches were already present. Display uploads are changed-value/visible-only at<=10Hz; selected-build thumbnail is captured only on build changes. Audio banks decode once per document and one-shot concurrency is capped at8. These reduce specific work; they do not prove that every historical stall was GC or host contention.

## Resources and feature costs

preparation-final-02 proves four transitions and stable repeated Express173geometry/72texture and Harbor309geometry/81texture counts, one reachable active AudioContext per scene. These are renderer resource counts, not measured VRAM. Additional native cockpit and instrumented diagnostic cases are recorded in native-matrix.json and DIAGNOSTIC.md where available. GPU work cannot be separated into actual GPU execution time using CPU submission timings alone.

Additional native-extra-cockpit-01/summary.json: attempt1 p95=16.70, p99=16.80, max=33.40ms PASS, attempt2 p95=16.80, p99=16.80, max=16.80ms PASS
