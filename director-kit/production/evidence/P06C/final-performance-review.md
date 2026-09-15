# P06C independent final performance review

## Disposition

**Performance HOLD.** Preserve the original failed equipped-1080 repeat and failed `heavy1080-followup`; neither pooled percentiles nor a later clean run can erase these observations. The available data support further shared-host-contention diagnosis, not an established cause or an arbitrary reduction in environment quality. Review packaging can proceed with that limitation explicit.

This review read the completed two raw profiles, host CPU/GPU logs, existing crew/render/audio lifecycle code and capture harness. No browser, capture, source change, external-project inspection or process termination was performed.

## Per-attempt scoring

Values below are nearest-rank RAF intervals in milliseconds, rounded only for display. The gate requires every complete attempt to have p95 <=20, p99 <=33.4 and no active interval >100 ms; comparisons retain the disclosed 0.000001 ms floating-point tolerance.

| Run | Attempt | Samples | p95 | p99 | Maximum | Active >100 ms | Verdict |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Original equipped1080 repeat | 1 | 9,955 | 16.7 | 16.8 | 16.8 | 0 | Pass |
| Original equipped1080 repeat | 2 | 9,174 | 33.3 | 33.4 | 50.0 | 0 | **HOLD: p95 fails** |
| heavy1080-followup | 1 | 9,897 | 16.8 | 16.8 | 33.4 | 0 | Pass |
| heavy1080-followup | 2 | 9,243 | 33.3 | 33.4 | 50.1 | 0 | **HOLD: p95 fails** |

These results were independently recomputed from the raw active-phase rows. The four separate single-attempt matrix entries are recorded as passing in the reviewed first-matrix summary; this narrower diagnosis does not independently recompute those four or the separate daylight run. Complete original raw files remain authoritative.

## Observations

- Both second attempts have whole-attempt p95 about 33.3 ms. The original second-attempt 120–150 second window has frame CPU/render-submission p95 28.4/22.4 ms; its first-attempt matched window is 5.0/3.6 ms. Physics CPU per RAF also rises from 0.6 to 2.9 ms, partly confounded by multiple fixed ticks in a slower frame. Render submission accounts for most of the measured frame cost increase.
- The follow-up second-attempt 150-second-to-finish window reaches interval p95 50.0 ms and CPU/render-submission p95 40.6/31.6 ms. Its corresponding first-attempt tail also briefly slows: interval p95 33.3 ms, CPU/render p95 23.1/17.9 ms, despite the whole first attempt meeting the gate. This weakens a strictly second-attempt-only leak explanation.
- Draw-call and submitted-triangle averages for matched race windows are essentially unchanged between attempts. Program/resource counts remain stable. That excludes a simple increase in submitted scene size as the demonstrated explanation; it does not measure all driver allocations.
- Original/follow-up collectors contain 20,903/20,842 rows, 360 trace samples each and 345 events each. The 30,000-row bounds are not reached. Driver p95 is 0.1 ms; recorded collector p95 rounds to zero. These bounded append-only arrays are not repeatedly scanned by the scoring loop while the race runs. GC pressure is still possible, but no growing per-frame array scan was found.
- Host CPU telemetry rises to roughly 30.9% mean in the 30-second bin beginning around 19:19:03 local and 49.8% in the following bin. GPU temperatures remain approximately 38–46 C in the logged run; reported clocks are mostly 2505 MHz with intermittent higher clocks. There is no thermal clock-collapse evidence in these measurements. Global CPU load correlates with the late follow-up slowdown but cannot identify its process source or prove causality.

## Static lifecycle findings

Retry uses the existing renderer, scene, lights, audio context/graphs and physics world. It resets vehicle state and replaces the three bounded rival controllers. The runtime/harness each installs one RAF loop for the document; retry does not install another loop. Showcase LOD selection visits a fixed collection and updates a water-time uniform. UI text updates and small fixed-participant sorts have no attempt-sized collection. No direct retry allocation of another harbor, renderer or persistent audio bus was found.

One separate hypothesis is audio automation history: `audio/graph.ts` calls `setTargetAtTime` for loop gain/rate, filter and master each frame, and opponent pan does likewise. The source does not explicitly cancel/prune historical automation. Whether Chromium prunes these events sufficiently is unmeasured here. This cannot currently explain away the render-submission-dominated slowdown, and it does not justify changing audio behavior in this frozen candidate.

## Ranked hypotheses and discriminating experiments

1. **Shared CPU/driver scheduling contention:** best supported by the cross-subsystem timing rise, global CPU correlation, stable scene size and intermittent first-race slowdown. Repeat the exact frozen two-race run when the host is naturally idle, with lightweight global/process CPU timestamps. Do not terminate or change unrelated work. An idle run is an additional result, not a replacement for failed evidence.
2. **Browser/driver or GC pressure over document lifetime:** possible, not shown by stable logical renderer counts. In a separately labeled diagnostic, sample process memory/JS heap outside scored timing and compare a later race in the same document with a fresh-document race at similar host load. This distinguishes document age from course position and attempt number.
3. **Audio automation or profiling history:** lower-confidence source-based candidates. Only after host isolation, compare diagnostic runs with audio never unlocked, or profiling/trace collection omitted using external timing. These change the measurement conditions and cannot substitute for required audio-active scored races. If either removes the growth, profile that subsystem before making a bounded repair.

No hypothesis is certified as the cause. Final performance acceptance remains held, while the frozen functional and stationary review findings retain their separately stated scope.

## Scoring and package guard verification

The corrected scoring tool now requires a nonempty contiguous `1..N` set of sampled attempt indices matching completed-result/final counts, distinct result UUIDs and matching paired result/final/race UUIDs. Each per-attempt summary names its UUID. Day scoring asserts exactly one result and one sampled group. This resolves the missing-group reservation in the earlier `scoring-review.md`, which now includes a verified follow-through appendix.

The allowlisted amendment document still names only the scoring and packaging tools. Current after-hashes were checked directly against those two small files:

- `scripts/summarize-review13.py`: `ee4b80dd8e61fca3466444dbbffbcbdd061d964ec4f21e678f9bf3def291b6e4`
- `scripts/package-astra-review13.py`: `66049f1a53d54c8ebb8a0e576a9d4487e44628e7e6ef994b168f702bbc713481`

Their before-hashes match the frozen inventory. This targeted verification does not replace the final package's full inventory check. Unscored sampler and live-audio films were outside this performance review and cannot upgrade this HOLD.
