# Astra Director Review08 — Make It Yours

**Decision: accept the functional product/career loop for continued development. Hold night readability and real-time performance. Authorize P04B2: Night Drive. No restart and no extra products/opponents in this packet. G3/G4 remain pending.**

Reviewed September 11, 2026. Input: `Astra-Review-08.zip`; captured source `dd2c3f9d3b917aec1a7f2e6750f93afe17505292`, packaging `dc62adfd1e79ce3248f81752301d5a4d10453b80`. This packet is review/instructions, not an implementation overlay. No game-source changes were made to the submitted snapshot during this review.

## 1. What is accepted

The first real-product loop is implemented, rather than merely represented by buttons. The supplied UI progression, ordinary-path traces, source and receipts support: valid Harbor result, game credits, return to the bay, preview and cancellation, purchase/install, color selection, night entry and retained build. The capture correctly labels the skipped middle of the day lap and the separate full night trace.

I independently replayed both 10,200-row trajectories through fresh instances of the submitted `RaceAttempt`. Each reproduced a valid **78,719.20388459373 ms** finish. Feeding those actual attempt IDs and reconstructed valid results through the submitted career transition function, with the recorded purchase between them, reproduced **0 → 800 → 200 → 300** credits. Re-delivering each award ID did not mutate its already-committed state. Appearance and chapter flags matched the reported final inventory. This is an independent rule/wallet replay, not a new physical lap or proof of IndexedDB durability. Evidence: `evidence/independent-recorded-loop.json`.

I independently executed **31 focused tests, all passing**: input, wheel-speed/drivetrain, coherent audio mapping, race rules, existing saves and the five new career tests. The source uses a read-modify-write inside an IndexedDB readwrite transaction for durable state; pure transition and memory fallback tests are not substitutes for real two-tab browser testing. Evidence: `evidence/independent-tests.log`.

The packet's 304 manifest entries and all 230 captured input hashes matched their supplied hashes. Of 41 declared protected foundation files, 38 can be directly compared between both supplied review archives and all 38 match. Three legacy/source files are not present in one or both archives; their local preservation is reported rather than independently confirmed here. The current repaired car GLB, rear rig/presenter, driver, course, contacts, simulation and retained sound resources are included in the comparable foundation. Evidence: `evidence/independent-inspection.json`.

The separate accessory GLB is **89,992 bytes, 2,368 triangles, two primitives/materials, zero texture images**. It is a small addition, not a remeshed car. All 10,200 matched day-stock/night-equipped telemetry rows are exactly equal. This supports the cosmetic-only boundary for that input sequence; it is not exhaustive proof across every input.

Retain the wallet amounts, current product identity, fitment guard, once-only receipts, temporary preview distinction, story flags, deliberate store link, current save namespace and the disclosed storage fallback. Do not implement a second economy or wipe saves to simplify the next assignment.

## 2. The product exists, but the night payoff is weak

The matched stock/installed bay images show a real red patch under the vehicle. It is not an absent light system. However, the sampled ordinary night chase views do not show a clear, satisfying installed-kit difference. The supplied moving-corner still is a cockpit view; it cannot establish how the underbody kit reads from chase. The local agent correctly returned a visual HOLD. Evidence: `evidence/stock-night.png`, `evidence/installed-night.png`, `evidence/night-sheet.jpg`.

`src/presentation/product.ts` constructs two area emitters, each 0.035 m × 1.3 m, with intensity `appearance.brightness * 14`. At default brightness 0.6, intensity is 8.4. Applying Three.js's documented/source power relation `power = intensity × width × height × pi` gives **approximately 1.20 nominal lumens per emitter, 2.40 total**. At the recorded cyan/0.7 setting, the getter-equivalent total is approximately 2.80. These are renderer parameters, not measured output of the actual product; RGB color, receiver materials and tone mapping affect apparent brightness. This is a concrete underpowered starting point to examine, not a physical product specification.

The lights face downward as intended: a local -Z normal rotated -pi/2 about X becomes -Y. Do not reverse them on the assumption that the faint effect is an orientation error. The existing side placement and four visible strip regions remain approximate. No new kit geometry or harness-routing work is required.

Correct the light calibration in the existing scene. Preserve the stock illumination and exposure for matched comparisons. Do not darken the whole harbor, flood it with bloom, or add a camera-facing colored card. See `references/RENDERING-NOTES.md` for the primary source and bounded tuning direction.

## 3. The wall-clock footage reveals a real hold, not its cause

The supplied short real-time observations contain one interval above 50 ms in each measured window:

| State | Samples | Mean interval | Worst interval | Elapsed time before worst interval |
|---|---:|---:|---:|---:|
| Stock | 560 | 21.4575 ms | 2,699.8 ms | 5.3998 s |
| Equipped | 442 | 27.1860 ms | 4,666.5 ms | 5.3998 s |

The worst interval occurs at **zero-based sample 324 in both runs**. That repeated location is more informative than comparing two averages. Outside that isolated interval, the cadence in these short windows is near 16.7 ms. This does not prove that the accessory caused the difference in stall durations. Neither mean is a valid sustained-hardware verdict.

The supplied profiler records video, enables `test=1` (which enables `preserveDrawingBuffer`) and calls the comprehensive `__HARBOR.inspect()` every animation frame. That method copies frame history, reads localStorage, scans world material/texture statistics and queries graphics information as well as returning telemetry. Those observation costs must be separated from ordinary production execution. In addition, the current sample history stops growing at 1,800 entries; it is not sufficient for a longer scored run without a new bounded measurement collector.

### Strongest source-level lead: changing active streetlight counts

`src/presentation/harbor-lighting.ts` allocates a four-light practical pool in standard mode but changes each slot's `visible` flag at 55 m. From the submitted trajectory, the active practical count changes from three to four at logical time 5.7 s, then back at 6.633 s and repeatedly thereafter. The controlled trajectory does not give the exact pose of the wall-clock stall, so this is **not an exact time-alignment proof**.

Three.js's WebGL shader program parameters/cache keys include light counts. A newly encountered count can need a new shader variant. The game does not explicitly prepare its final light/material combinations with `compileAsync` before releasing the player. This is a plausible explanation for a repeatable first-encounter freeze and is the first hypothesis to isolate locally. It is **not a confirmed root cause** without program/trace evidence or a controlled A/B.

The product presenter also adds/removes its two area lights as preview, equipment or power changes. Stabilize the light-slot lifecycle or prepare all required variants before an interactive transition. Report resident slots separately from emitting lights; do not pretend a zero-intensity reserved slot is active illumination.

## 4. What not to reopen

The car and harbor are still provisional, and this is not a final graphics approval. Do not use this audit to restart their art passes. The rear repair is preserved; the accepted input/drivetrain/race behavior is intact. The new product/state loop deserves to stay.

The next milestone is one useful experience: **a readable installed kit on a smooth first night drive**. No rival or second product is authorized until this local runtime hold is assessed properly. If instrumentation proves the stall is capture-only, document that and preserve a clean production measurement rather than "optimizing" unrelated simulation code.

## 5. Verification boundary

The submitted packet reports 72/72 full-suite tests, a successful TypeScript/Vite build, 14 career browser checks, six retained UI checks, lifecycle checks, real IndexedDB contention and transaction-abort checks. I did not independently rerun those browser/full-build results.

This container could not resolve the npm registry. I additionally attempted an isolated native IndexedDB browser harness made from the actual source modules; local Chromium blocked its localhost navigation with `ERR_BLOCKED_BY_ADMINISTRATOR` before any case ran. That is an environment limitation, not a game defect, and was not bypassed. The actual attempt is preserved in `evidence/browser-attempt-blocked.json`.

I inspected the supplied stills and sampled the progression, controlled night movie and wall-clock movie. I did not audition audio, drive with a physical controller, benchmark the full game here, or approve real-world photometry. The full limit record is `evidence/VERIFICATION-LIMITS.json`.

## 6. Next authorization

Execute `CODEX_NEXT.md` and `packets/P04B2-NIGHT-DRIVE.md`. Preserve the current repository and append to the real ledger. Return `Astra-Review-09.zip`, including actual wall-clock measurements with meaningful cold/warm separation and the matched night visual proof. Acceptance cases in this kit are future requirements, not passed tests.
