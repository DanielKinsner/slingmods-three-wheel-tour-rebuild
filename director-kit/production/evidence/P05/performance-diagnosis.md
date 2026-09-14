# P05 performance diagnosis — held, not attributed

Frozen runtime: `7fe1e881b0712be2fa09b4c4eec6baa9d0ebb0d6`. This analysis is read-only. No runtime repair was made because the later trace did not establish the cause of the original stall.

The original stock720 run contains one 366.6ms active-racing RAF interval near 48.3s race time. The unchanged 100ms catch-up cap discarded 266.6ms. Adjacent timers show render-submission spans 109.9/97.3ms and a 103.7ms physics span; those are elapsed timers, not proof of actual CPU execution in those functions. Programs 15, spot/area slots 6/2, calls 465, submitted triangles 1,722,635, geometries 87 and textures 48 remained stable during that burst.

## Reproduction and retained performance result

| Unrecorded run | Racing samples | p95 ms | p99 ms | Maximum ms | Clipped catch-up ms |
|---|---:|---:|---:|---:|---:|
| verified-scored-stock1080 | 9854 | 16.8 | 16.8 | 50.0 | 0.0 |
| verified-scored-equipped1080 | 19787 | 16.8 | 16.8 | 66.7 | 0.0 |
| verified-scored-stock720 | 9823 | 16.8 | 16.8 | 366.6 | 266.6 |
| verified-scored-equipped720 | 9794 | 16.8 | 33.3 | 66.7 | 0.0 |
| verified-scored-equipped1080-repeat | 17082 | 33.4 | 50.0 | 83.4 | 0.0 |
| stock720-followup | 9948 | 16.8 | 16.8 | 16.8 | 0.0 |

Percentiles use nearest-rank over native-RAF rows with phase=running. Original outliers remain in the scored data. The clean stock720 follow-up did not reproduce the stall (maximum 16.8ms). The separate traced stock720 run also had maximum 16.8ms, but its timings are diagnostic and are not substituted for clean performance scores. Both used the same failing stock720/seed97 configuration. Non-reproduction does not explain or erase the original.

The heaviest repeated equipped1080 run misses the requested p95<=20ms/p99<=33.4ms targets: 33.4/50ms, maximum 83.4ms. Its lack of >100ms stalls is not a pass for the other targets. Performance acceptance remains held for that repeat and the unresolved historical stall.

## What the trace establishes

The 426,765,809-byte diagnostic trace contains 2,708,588 events. During the player active-racing phase, it contains no complete CPU/GPU/timeline event lasting 16ms or more. The longest FunctionCall is 15.788ms elapsed. Renderer-main outer GC events are 576 MinorGC events (maximum 1.329ms) and 40 MajorGC events (maximum 5.770ms, corresponding maximum thread CPU 4.846ms). The largest GC anywhere in the trace is an outside-racing MinorGC at 7.085ms. These observations do not support blaming the historical 366.6ms stall on GC, audio allocation or a specific allocation site.

Long driver/API waits do appear during loading and bay entry, outside the player active-racing phase. For example, bay-entry GetProgramiv spans 350.395ms elapsed but only 0.261ms `tdur`; nested Finish/WaitForCmd/GPU-service spans overlap it. They cannot be added together. `tdur` is time consumed by the reporting CPU thread; a GPU-service thread value is not GPU device execution time. Large elapsed/thread-time differences establish waiting or non-CPU elapsed portions, but do not independently identify which process/device caused the wait.

Per-frame telemetry cloning, driver vector/quaternion work and audio parameter objects are real source allocations. No traced evidence makes any one of them the cause of the original failure. Phase classification aligns the crew navigationStart trace clock with native RAF phase boundaries; complete events are classified by start time, with possible one-callback uncertainty near a boundary. The long waits are far outside racing boundaries.

## Contention and next action

`host-contention.json` measured Premiere using 19.921875 aggregate CPU-seconds during a later 2.66599-second video sample, with GPU utilization 38%. Multicore CPU-seconds may exceed wall time. That sample establishes competing activity during that later window only. It was not collected during the original stall or throughout the heavy repeat and is not causal proof for either result. No user applications were stopped.

Next: repeat the exact equipped1080 first-race/retry case during an observed idle-host window, retain host/load context, and trace any reproducible stall separately. Repair a specific app cause only if supported by that evidence. Do not reduce the advertised resolution, alter physics, delete outliers, or label this diagnostic a fix. G3/G4 and human/foreground approval remain outside this report.

## Provenance and compact trace selection

Full trace remains locally at `diagnostic-stock720/diagnostic-trace.json`; SHA-256 `762ff71e7aa5e15b8d2899cb34ce8a3278edf64cec64c4ea7179585f8071d916`. `performance-diagnosis.json` contains input/run hashes, counts, phase ranges, GC and elapsed/thread-time statistics.

`trace-selection.json.gz` contains exactly 734 selected events: all metadata/navigation, every complete GC-family event>=1ms, and every complete event>=16ms. It is explicitly a selection, not the full trace. Nested/background events are retained, labeled with their thread and phase, and must not be summed as independent pauses. Selection SHA-256 `b26f908c1e6aebab131792742c351ccd246228d27d7ba9b3f75e44cb718e7239`.


## Lead followup after this diagnostic review

The final unrecorded heavy1080-followup ran two complete equipped 1920x1080 races at the same frozen runtime. All four finished valid in both. Across 19,910 active rows, p95=16.7ms, p99=16.8ms, maximum=16.8ms, with no >100ms active intervals or clipped catch-up. Pre-run read-only Premiere sampling was 0.515625 aggregate CPU-seconds over 2.0772 seconds; it is a before-run sample, not continuous host monitoring. This demonstrates the target on this setup during the followup, without proving the cause of the earlier missed repeat or stall. Original failures and held acceptance remain. The followup raw run/provenance/bay and performance-summary.json are included.
