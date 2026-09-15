# P06C performance review — HOLD

The required first matrix completed all six crew races in five configurations, followed by daylight. Four standalone configurations and the first warm-context race passed. The second warm-context race failed p95. A fresh same-build two-race diagnostic repeated that failure. Both raw attempts and all phases remain intact. No active interval exceeded100ms, but that does not compensate for failed p95.

Frozen runtime: b4eef3c7dab3eb77b131a5100c3be0fd1110b095. Windows/i9-13900K/RTX4080, Chromium153, ANGLE D3D11; standard quality, DPR1, actual1920x1080 or1280x720 buffers. Audio graph active, host output muted. Native RAF and ordinary virtual player input; production rivals/shared physics. No recording, screenshots, readback, controlled time or full inspect in the scored racing loop. Driver/OS caches were not cleared.

| Complete attempt | p95 ms | p99 ms | Max ms | Verdict |
|---|---:|---:|---:|---|
| verified-scored-equipped1080 / 1 | 16.8 | 16.8 | 33.4 | PASS |
| verified-scored-equipped1080-repeat / 1 | 16.7 | 16.8 | 16.8 | PASS |
| verified-scored-equipped1080-repeat / 2 | 33.3 | 33.4 | 50.0 | HOLD |
| verified-scored-equipped720 / 1 | 16.7 | 16.8 | 16.8 | PASS |
| verified-scored-stock1080 / 1 | 16.7 | 16.8 | 16.8 | PASS |
| verified-scored-stock720 / 1 | 16.8 | 16.8 | 33.5 | PASS |
| heavy1080-followup / 1 | 16.8 | 16.8 | 33.4 | PASS |
| heavy1080-followup / 2 | 33.3 | 33.4 | 50.1 | HOLD |
| day-scored-equipped1080 | 16.7 | 16.8 | 16.8 | PASS |

## Scoring correction

The first quick interpretation pooled both races in the repeated context, producing p95=16.8ms and hiding the second attempt's p95=33.3ms. That claim was immediately corrected. The scoring tool now requires EVERY completed attempt to meet p95<=20ms, p99<=33.4ms and zero active intervals>100ms. Nonempty sample groups must correspond to all completed attempts and their recorded identities. Pooled values remain descriptive only. First-matrix statistics and raw records are preserved. Day scope is explicitly one complete sampled lap.

Only the scoring and packaging tools changed after the frozen build. post-build-tool-amendments.json records their original/current hashes and scope; the packager permits exactly those two files to differ. The original build manifest remains intact. Runtime, assets, input/physics/audio, native harness and tests did not change.

## Diagnosis and limit

Late intervals show increased frame/render-submission wall time with essentially matched course draw counts and unchanged logical306 geometry/76 texture counts. The diagnostic also briefly slows near the end of its first race, weakening an exclusively retry-created leak theory. Static review found no retry-created renderer/light/audio graph, no collector bound crossing and negligible driver/collector overhead.

External host telemetry shows substantial global CPU spikes around the slow portion while GPU clocks remain mostly2505MHz and temperatures stay moderate. A separate post-run process delta sample found several unrelated CPU-heavy audit jobs. This points to shared-host contention; global counters and a later process sample do not prove attribution or exclude a renderer issue. No unrelated process, desktop setting or other project was changed. No arbitrary scenery/LOD/physics reduction was made to mask this uncertainty.

Performance approval is blocked pending a controlled same-build run when the host is naturally quiet, with per-attempt scoring and time-aligned process/global CPU observations. Existing failed runs must remain. Further no-audio/no-profile diagnosis would be explicitly unscored comparisons, not replacements for the required standard matrix.

Ready/startup outliers and25-to26 program-count transitions remain in the raw data. They are reported separately, not deleted; no claim is made that the historical116.6ms ready event or22-to23 shader event has been explained. Logical counts are not VRAM measurements and CPU submission durations are not GPU timer results.

See final-performance-review.md for independent analysis and host-telemetry.json for raw external telemetry and its collection source. G3/G4 and final art remain pending.
