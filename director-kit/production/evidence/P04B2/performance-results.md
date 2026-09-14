# Final unrecorded performance results

All five scored trials meet the bounded planned frame targets on the named RTX 4080 host. Each uses a fresh browser/context, ordinary virtual-controller motion, two complete valid laps and native immediate Retry. Ten valid results were 78,402.5393138 ms. This RAF-driven agent starts feeding controls at GO and differs from the older 120 Hz capture's longer neutral lead-in; it does not imply changed tire/race equations.

| Configuration | First / retry p95 ms | p99 ms | Worst racing ms | Source load / prep ms |
|---|---:|---:|---:|---:|
| equipped1080 | 16.7 / 16.7 | 16.8 | 16.8 | 1846.5 / 1081.9 |
| equipped1080-repeat | 16.7 / 16.7 | 16.8 | 16.8 | 2187.8 / 1359.9 |
| equipped720 | 16.7 / 16.7 | 16.8 | 16.8 | 2402.1 / 1477.6 |
| stock1080 | 16.7 / 16.8 | 16.8 | 16.8 | 2146.0 / 1245.8 |
| stock720 | 16.8 / 16.7 | 16.8 | 33.2 | 1847.0 / 1080.8 |

Across 47,049 racing intervals, none exceeded 33.4/50/100 ms. The one 33.2 ms interval occurred on the 720p stock retry and was retained. No catch-up time was clamped while racing. Each context kept 14 shader programs, six resident spotlights and two resident area-light slots through both laps and camera changes. Stock area slots emit zero; hardware is detached.

Source loading was 1846.5–2402.1 ms, with explicit preparation 1080.8–1477.6 ms. Initial ready-menu intervals up to 116.7 ms are retained. Their cause was not isolated; they occurred before racing. Loading figures cover source module entry through readiness, not process startup or prior JS fetching/parsing.

Mean observed collector cost was 0.0047–0.0088 ms per racing frame. The route-following virtual-controller agent averaged 0.173–0.218 ms per callback. These are quantized CPU-clock observations, not GPU timings. No recorder ran in scored trials.

Resident resources stayed at 87 geometries / 36 textures from ready through finish in both configurations because preparation reserves the same small asset/material/light resources. Matched finish endpoints were stock 164 calls / 808,819 submitted triangles and equipped 166 / 811,187. These are draw/resource counters, not GPU memory bytes or spare-capacity measurements. The existing one shadow map is retained.

The separate video run is in performance-summary.json and video-final/. Fresh browser contexts did not clear OS/driver caches. Broader hardware, foreground display, physical-controller and subjective driving/aural approval remain unclaimed. G3/G4 remain pending.
