# P08A independent delivery evidence audit

2026-09-15. Bounded read-only inspection of saved evidence. No browser, build, Blender, recording or benchmark was started by the reviewer. This supplements `independent-review-final.md`; it does not certify the unfinished film, ZIP, remote push or final recovery receipt.

## Candidate and method

All three native benchmark receipts identify implementation **ec6876551542ec39111fbf26253c4528c2290cfc**; runtime snapshots identify build `ec6876551542`. Browser: Chromium **153.0.8010.12**, ANGLE / NVIDIA GeForce RTX 4080 / Direct3D11. Actual drawing buffers are 1920×1080 or 1280×720 as listed below. The audio graph was enabled in all initial runtime snapshots; browser output was muted. This is not a listening pass.

The benchmark uses native wall-clock requestAnimationFrame and the existing control-only evidence driver, real opponents and the shared physical simulation. It records no screenshots/film during scored racing. Timing is RAF interval timing; CPU render-submission values are not GPU timings. Automated driving does not constitute physical controller/human driving approval.

## Independently recomputed active-race metrics

Read each complete `run.json`, selected `phaseCode=2` (running) and the matching attempt, sorted raw `intervalMs`, and recomputed nearest-rank p95/p99, maximum, sample count and intervals over 100ms. Every result exactly matches its saved summary before display rounding.

| Evidence | Attempt | Samples | p95 ms | p99 ms | Maximum ms | >100ms | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Equipped crew, 1920×1080 | 1 | 9,955 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| Equipped crew, 1920×1080 | 2 | 9,950 | 16.7 | 16.8 | 33.4 | 0 | PASS |
| Stock crew, 1280×720 | 1 | 9,952 | 16.7 | 16.8 | 33.3 | 0 | PASS |
| Stock crew, 1280×720 | 2 | 9,955 | 16.7 | 16.8 | 16.8 | 0 | PASS |
| Equipped Maya duel, 1280×720 | 1 | 4,710 | 16.7 | 16.8 | 16.8 | 0 | PASS |

Limits applied: **p95 ≤20ms, p99 ≤33.4ms, maximum ≤100ms**. Zero collector overflow and zero page errors in every run. Full profile row counts are 21,663 / 21,672 / 5,445 respectively; scored subsets are explicit rather than a truncated recent-frame window.

Both crew attempts in each repeated run finished validly in third place; every actual rival also finished, with no DNF substituted for completion. Crew player times were approximately 165.905s equipped and 165.903s stock. The duel finished validly first at 78.484s; Maya finished at 83.308s. Retry attempt IDs are distinct. Those separate races/resolutions are not a controlled claim that the product improves lap time.

Renderer allocation counters were stable across each repeated pair: equipped 314 geometries / 80 textures; stock 306 / 80. Duel ends at 314 / 72. These are renderer object counts, not measured GPU memory or a universal leak proof.

### Preserved outliers and limits

Across all phases there is one interval over 100ms per run: 200ms, 200ms and 183.4ms. All three occur in **ready, attempt 0, tick 0**, before scored racing. They remain present in raw evidence and are excluded by the explicit active-race filter. This audit does not claim all-phase maximum ≤100ms.

Program-count increases remain recorded; this is not proof of zero runtime shader compilation. These measurements certify the recorded host/browser/candidate only, not another machine, low-end device, hosted site, physical display/controller or final media-encoding performance.

## Final complete-loop evidence

Inspected `loop-final-02/verification.json`, its underlying milestone snapshots and the validator source. Receipt reports PASS, 14 recorded steps, no page errors, and runtime build `ec6876551542` throughout. This uses a controlled clock for functionality and is deliberately not used for the performance table above.

- Fresh real career starts at 0 credits with no suspension or legacy crew bypass.
- Existing solo lap earns 800; new Maya duel earns 750; purchase deducts 1000 once.
- Saved front C8/R10 maps in the actual crew simulation to **4598 / approximately 4332 N·s/m**; rear coefficients remain 6500 / 6500. Snapshot confirms the configured model reaches the next event.
- Removal/reload retains owned suspension, chosen setup and 550 credits while equipped=false. Reinstallation restores the configuration without a second charge.
- Existing crew podium earns 550, retry earns 150 with zero repeated chapter bonus and a new attempt ID. Final balance is 1250.
- Durable chapter reload preserves installed suspension and completed crew progression. Prepared demo starts separately at zero demo credits with no suspension; the later real-career snapshot is independently deep-equal to the saved pre-demo career.

Duplicate submission/proof validation and exact sampled stock equivalence were already inspected in `independent-review-final.md`; this audit does not replace those focused checks with a successful happy-path race.

## Conclusion and held gates

The saved final loop and five recorded active-race attempts support bounded P08A functional completion and the stated local performance limits. No new correctness blocker was found in these receipts.

Film review, ZIP size/content verification, remote branch/pushed SHA and final recovery receipt are not yet certified by this audit. Public hosting remains pending and is not a development blocker. G3/G4, final fidelity, physical hardware, listening and release/publication approval remain held.
