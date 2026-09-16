# P09B diagnostic separation

The instrumented1080p Express equipped near-camera run completed with valid production results and no browser errors. Its timing is excluded from the native16-attempt matrix. The complete compressed Chrome trace and146,774events are retained in diagnostic-trace-01. Nested/inclusive category durations overlap and must not be added together.

| Trace category | Count | Maximum duration ms |
|---|---:|---:|
| FireAnimationFrame | 10954 | 24.154 |
| FunctionCall | 11896 | 23.987 |
| UpdateLayoutTree | 5498 | 1.085 |
| Layout | 1581 | 3.182 |
| Paint | 3904 | 0.253 |
| MinorGC | 209 | 4.224 |
| MajorGC | 4 | 6.880 |

## Interpretation and limits

No active interval over100ms was reproduced in the final matrix or this diagnostic. The observed GC/layout slices therefore do not establish the cause of historical Review17 stalls. Bounded repairs removed per-render structuredClone of player telemetry and unnecessary repeated numeric HUD writes; existing caches were retained. We make no claim that GC or host contention explained all older spikes.

native-costs.json separates recorded CPU-frame time, WebGL render-submission time, collector overhead, initial loading and preparation stages for all8configurations. CPU-frame residual includes simulation, input, UI, display/audio mapping and other JavaScript; the profiler does not separately instrument each of those functions. WebGL submission is not actual GPU execution time. No GPU timer-query or source-level physics/audio timing attribution is claimed. decode/preparation occurs before racing; preparation-final-02 records individual resource timings and cancellation/retry lifetimes.

Matched1080p Express equipped near and cockpit cases both completed2attempts with audio enabled and all products. Near max16.8/16.8ms; cockpit max33.4/16.8ms. Cockpit events explicitly show both attempts using cockpit view. One selected-build thumbnail was captured;1448changed-value texture uploads occurred across the full session, bounded at10Hz. That practical feature-cost case passes; it is not an isolated nanosecond measurement of the display alone.

Renderer counts remain stable across repeated transitions. Actual VRAM, physical display/controller behavior, mobile and non-Chromium browsers remain outside this proof.
