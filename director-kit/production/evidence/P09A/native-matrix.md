# Native frame-time matrix — final runtime049c1cd

All 16 actual races and retries completed with valid player results and every rival finished. **Performance HOLD:** three races exceeded the 100ms maximum; eight active frames were over100ms. No outlier was discarded.

| Resolution / route / build | Race | p95 ms | p99 ms | Maximum ms | >100ms | Target |
|---|---:|---:|---:|---:|---:|---|
| 1920 / express / stock | 1 | 16.8 | 16.8 | 16.8 | 0 | PASS |
| 1920 / express / stock | 2 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| 1920 / express / equipped | 1 | 16.8 | 16.8 | 16.8 | 0 | PASS |
| 1920 / express / equipped | 2 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| 1920 / harbor / stock | 1 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| 1920 / harbor / stock | 2 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| 1920 / harbor / equipped | 1 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| 1920 / harbor / equipped | 2 | 16.8 | 33.4 | 183.3 | 3 | FAIL |
| 1280 / express / stock | 1 | 16.8 | 16.8 | 133.4 | 1 | FAIL |
| 1280 / express / stock | 2 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| 1280 / express / equipped | 1 | 16.8 | 33.4 | 200.0 | 4 | FAIL |
| 1280 / express / equipped | 2 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| 1280 / harbor / stock | 1 | 16.8 | 16.8 | 16.8 | 0 | PASS |
| 1280 / harbor / stock | 2 | 16.8 | 16.8 | 33.4 | 0 | PASS |
| 1280 / harbor / equipped | 1 | 16.8 | 16.8 | 66.7 | 0 | PASS |
| 1280 / harbor / equipped | 2 | 16.7 | 16.8 | 16.8 | 0 | PASS |

Native RAF, isolated Chromium153 / ANGLE D3D11 / RTX4080 / i9-12900K (16cores,24threads), Windows. 1920x1080 standard and1280x720 low, DPR1. Stock and all-five-equipped; fresh isolated context per condition, two races using the same route instance. Actual audio graph enabled, isolated host output muted. No recording, builds, other browser tests or heavy tools ran concurrently. Existing unrelated host processes were preserved. OS/GPU driver caches were not cleared.

Thresholds: p95<=20ms; p99<=33.4ms; maximum<=100ms. Numerical summary allows1e-6ms floating arithmetic tolerance only. Original strict results and all intervals remain. CPU/render-submission timing is not GPU timing; logical geometry/texture counts are not VRAM.

The1080 Harbor equipped retry had183.3/116.6/133.4ms RAF intervals near62.75–63.18s race time. Both CPU-frame and render-submission durations rose; shader/light counts were unchanged. These observations do not identify a cause. Optional subsequent CDP tracing is a separate diagnostic with overhead and cannot replace the clean matrix or erase its failures.

Raw inputs: native-*-02/run.json and summary.json. The interrupted native-1920-express-stock-01 case is explicitly disqualified. Native-matrix.json includes every final row.
