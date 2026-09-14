# P06 measured rendering review

Five completed configurations / seven complete native four-car races, current runtime8d3931f. Fresh isolated Chromium153/D3D11 on RTX4080, DPR1, actual1280x720/1920x1080 buffers, standard quality, real audio active with host output muted. No recording/readback/controlledclock/full inspect in scored loop. All rows/phases retained. User applications untouched; no globally idle-host guarantee.

| Case | Races | p95 ms | p99 ms | Max racing ms | >100 ms | Clipped sim ms |
|---|---:|---:|---:|---:|---:|---:|
| verified-scored-equipped1080 | 2 | 16.7 | 16.8 | 33.3 | 0 | 0.0 |
| verified-scored-equipped1080-repeat-resumed02 | 2 | 16.7 | 16.8 | 50.0 | 0 | 0.0 |
| verified-scored-equipped720 | 1 | 16.7 | 16.8 | 16.8 | 0 | 0.0 |
| verified-scored-stock1080 | 1 | 16.7 | 16.8 | 16.8 | 0 | 0.0 |
| verified-scored-stock720 | 1 | 16.7 | 16.8 | 16.8 | 0 | 0.0 |

All current completed cases meet p95<=20ms/p99<=33.4ms with no >100ms racing interval. The resumed heavy pair contains one50ms interval; it is retained, with no unsupported causal attribution. One loading/ready interval>100ms appears in each completed run; exact row, preceding RAF and synchronous preparation timing are in performance-summary.json. These precede authoritative racing and are not erased or represented as race stalls.

The original finalrepeat stopped after the user-reported Codex app interruption, with only provenance/logs saved; no buffered measurements survived. A fresh retry first hit connection-refused because the local preview had also stopped. Both incomplete/pre-race attempts remain explicit unscored records. After restoring the same frozen dist without rebuild, resumed02 completed the required heavy pair. No completed run was discarded.

Resident spotlight/area slots remain6/2; geometry197 and texture52 counts are invariant in all scored runs. Programs increase20→21 once early in each first race, then remain21 through the rest of the circuit and retry; this is an explicit preparation reservation, not a claim that every program was prewarmed. A separate instrumented short native forward-drive did not reproduce the extra link; it does not establish the late variant's cause. There is no recurring program-count churn or associated >100ms interval. It does not justify speculative physics/renderer surgery or a universalperformance claim.

The heavy paired baseline versus final expanded scene submitted308–619 versus363–723 calls and1.231–2.182million versus0.919–1.914million triangles; observed render-submission CPU p95 was5.6 versus5.0ms for those pairs. New scenery uses real UV/PBR maps, shared materials and bounded spatial instance cells/frustum culling. No heroLOD/resolution reduction or dynamiclight removal was used. CPU submission/counts are not GPU milliseconds/VRAM, and this small uncontrolled-host comparison is not a statistically general speedup claim.

Historical Review10's original366.6ms stock720 outlier and33.4/50ms equipped1080repeat p95/p99 remain unresolved at their original paths under P05. Current clean results do not explain or delete them. Global G3/G4, physicalcontroller feel, foregrounddisplay latency and release approval remain pending.
