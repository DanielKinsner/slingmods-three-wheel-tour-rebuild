# P05 native-RAF performance review

Fresh isolated Windows Chromium D3D11 RTX4080, native RAF, DPR1, actual buffers, stable standard quality. Audio graph active; commandline output muted. No recorder, readback, diagnostic clock or full inspection in scored racing loop. Virtual player input is disclosed. Driver/OS shader caches not cleared. All raw phases/outliers retained. CPU submission and resource counts are not GPU time or bytes. Loading includes preparation; do not sum overlapping durations. Percentiles use nearest rank. targetMet is a conservative mechanical check: p95<=20, p99<=33.4 and zero active intervals>100ms; the director asks that recurring stalls be absent and every outlier investigated. Neither clean followups nor this strict check overwrite the original matrix.

| Run | Actual buffer | Valid races | Racing p95 / p99 / max ms | Programs | Target |
|---|---|---:|---|---|---|
| verified-scored-equipped1080 | [1920, 1080] | 2 | 16.8 / 16.8 / 66.7 | [15] | met |
| verified-scored-equipped1080-repeat | [1920, 1080] | 2 | 33.4 / 50.0 / 83.4 | [15] | missed |
| verified-scored-equipped720 | [1280, 720] | 1 | 16.8 / 33.3 / 66.7 | [15] | met |
| verified-scored-stock1080 | [1920, 1080] | 1 | 16.8 / 16.8 / 50.0 | [15] | met |
| verified-scored-stock720 | [1280, 720] | 1 | 16.8 / 16.8 / 366.6 | [15] | missed |
| stock720-followup | [1280, 720] | 1 | 16.8 / 16.8 / 16.8 | [15] | met |
| heavy1080-followup | [1920, 1080] | 2 | 16.7 / 16.8 / 16.8 | [15] | met |

All raw ready/countdown/racing/finished rows remain in each run.json. Explicit preparation precedes event time; load includes preparation. One world step equals one session tick; four participants retained. Audio activated with real shared graphs; host output muted through Chromium flags. Recording is separate.

Racing intervals: 66,340. Racing intervals over100ms: 1. All-phase intervals over100ms: 8.

See performance-summary.json for CPU control/physics/submission/collector timings, resource ranges, first/retry results and every >100ms row. No GPU timer or memory-byte claim. No lowered resolution labeled1080p. Partial earlier scored-equipped1080 was interrupted for a separately confirmed session-handoff repair, is not scored and remains local.

## Assessment and followups

The original stock720 sample contains one 366.6ms active interval and 266.6ms clipped catch-up under the unchanged 100ms session cap. The original heavy repeat misses p95/p99 (33.4/50ms). Neither result is deleted, averaged away, or replaced by a later clean run. Every >100ms interval, including ready/loading, remains in the summary and raw profiles.

Later diagnostic stock720 and unrecorded stock720 followup both max16.8ms. Traced racing GC max5.770ms does not explain the historical pause. Stable programs/lights during the original burst do not implicate light-count compilation. Later competing Premiere activity establishes context only, not historical causality. The final heavy followup is listed separately above. See performance-diagnosis.md and AUTONOMOUS_RESUME.md.

P05-18 performance acceptance remains held. Functional chapter acceptance is separate. No speculative runtime change was made for an unconfirmed cause.