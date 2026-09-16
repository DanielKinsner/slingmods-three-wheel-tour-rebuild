# P09C native performance

**16/16 matrix attempts pass**, with 0 active intervals over100ms. Every raw row is retained.

| Viewport | Route | Build | Attempt | p95 ms | p99 ms | Max ms | >100 ms | Result |
|---|---|---|---:|---:|---:|---:|---:|---|
| 1280 near | harbor | stock | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1280 near | harbor | stock | 2 | 16.70 | 16.80 | 33.30 | 0 | PASS |
| 1280 near | harbor | equipped | 1 | 16.80 | 16.80 | 16.80 | 0 | PASS |
| 1280 near | harbor | equipped | 2 | 16.70 | 16.80 | 33.40 | 0 | PASS |
| 1280 near | express | stock | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1280 near | express | stock | 2 | 16.70 | 16.80 | 33.30 | 0 | PASS |
| 1280 near | express | equipped | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1280 near | express | equipped | 2 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 near | harbor | stock | 1 | 16.80 | 16.80 | 33.40 | 0 | PASS |
| 1920 near | harbor | stock | 2 | 16.80 | 16.80 | 16.80 | 0 | PASS |
| 1920 near | harbor | equipped | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 near | harbor | equipped | 2 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 near | express | stock | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 near | express | stock | 2 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 near | express | equipped | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 near | express | equipped | 2 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1280 cockpit | harbor | stock | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |
| 1920 cockpit | express | equipped | 1 | 16.70 | 16.80 | 16.80 | 0 | PASS |

## Method

Windows11 Pro26200, i9-12900K16cores/24threads, RTX4080 driver32.0.16.1692. Hardware inventory and separate actual browser-backend probe retained. Each run records its browser version and runtime. 720p low /1080p standard, DPR1, same quality choices as Review18. Native wall-clock RAF, real control-only player input and shared-physics rivals/gates. Actual audio graph enabled; host output muted. No video, screenshots or tracing during scored races. No unrelated user jobs stopped.

Thresholds unchanged: p95<=20ms, p99<=33.4ms, max active interval<=100ms,1e-6ms numeric tolerance. All phase2/running rows for the corresponding attempt are scored; startup/countdown/results remain in full run.json. No outlier exclusions or overflow. CPU render-submission time is not actual GPU execution time.

Runtime 5b2c99af2c567c04b5ea9d896765e7a6ddeec25e. Later evidence/docs/ZIP commits do not change the game source/assets. Fresh-remote checks are separate. Passing current samples do not explain away every historical spike or guarantee other hardware.

Rivals and player use the same current profile. The native test driver uses ordinary inverse-mapped controls and real gates; no outcome or body transforms. The special first-finisher planner is confined to its separate controlled-clock functional regression and is not used in this native matrix.
