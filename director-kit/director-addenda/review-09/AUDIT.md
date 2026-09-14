# Astra Director Review09 — accepted night-drive repair; authorize a complete chapter

Prepared for Dan Kinsner · 14 September 2026.

## Decision

Accept **P04B2 Night Drive for continued development**. The submitted evidence supports the repair of the reproduced first-use shader stall and now-readable base-kit underglow. Preserve this implementation. Do not schedule another lighting-only or parked-vehicle review.

Authorize **P05 — First Night at the Harbor**, one autonomous, integrated first-chapter assignment. The local agent handles intermediate implementation, tests, visual review, repairs and recoverable commits; Dan receives one final review package, not a package after every internal checkpoint. The corresponding chapter has NOT been implemented by this review. The next packet specifies the work.

G3/G4 remain pending. Functional acceptance of this bounded repair is not final visual, aural, fleet, campaign, performance-on-every-device, or release approval. The car, rear presentation and harbor remain visibly provisional. This decision advances racing depth without relabeling the current art as finished.

## Source and provenance

Input: `Astra-Review-09.zip`.

- Frozen runtime: `f5649fb95c81f12ad9531343655767db5ad9bf86`.
- Packaging commit: `ba8aeca94ab5151cbd9546909c9615f58175f898`.
- Correct continuing root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.
- All 328 manifest entries matched the delivered bytes and sizes.
- All 241 captured input hashes matched, accounting for the explicitly listed packaging-only correction to `scripts/package-astra-review09.py`.
- Served public asset hashes in all five scored runs matched the supplied files.
- 41 protected files could be compared byte-for-byte with the actual Review08 archive; all matched. Four protected originals were not available in both packages: three `.blend` sources and the superseded `slingshot-p03a2.glb`. The package's broader 45-file assertion is reported, not independently certified here.

Source/data evidence and reproduction code: `evidence/independent-inspection.json`, `tools/inspect_review09.py`. This checks internal provenance consistency, not a cryptographic attestation of the remote host or a new physical playtest.

## 1. What caused the reproduced stall

I recalculated the supplied clean baseline's worst render submission at approximately **3,982.8 ms**, with the following RAF interval about 3,983.2 ms. This baseline disabled recording and preserved drawing buffers. Its program-count event changes from 14 to 27 when the visible lighting configuration changes.

The separate expanded GL diagnostic contains **13 blocking `getProgramInfoLog` calls** inside its worst first-use render. The local diagnosis describes thirteen newly encountered shader variants. Its exact historical instrumented source was not frozen separately, so this is strong trace/source support for that reproduced fault, not a freshly rerun causal experiment by Astra. It does not diagnose every possible future scheduling pause.

Current `src/presentation/harbor-lighting.ts` keeps the practical spotlight slots resident and uses zero intensity for inactive slots, rather than adding/removing them from the gathered light configuration. `src/presentation/product.ts` likewise retains two zero-intensity area-light slots while removing unowned/unequipped hardware. The equipment-preparation helper restores the latest ownership state across asynchronous work.

`src/presentation/prepare.ts` initializes discovered textures, calls `compileAsync`, renders the unseen geometry/shadow paths and performs one loading-only synchronization behind an explicit preparation overlay. Original culling settings are restored in `finally`; the preparation does not advance race simulation. This puts work into a visible loading stage instead of pretending the cost disappeared.

The official Three.js renderer documentation describes precompilation after configuring scene lighting and texture initialization before first use; see `references/TECHNICAL-SOURCES.md`. The shipped pinned library still governs implementation. No engine/dependency change is required.

## 2. Independently recalculated recorded performance

I did NOT run these GPU tests here. I recalculated the metrics from the delivered raw RAF rows, checked the timestamp differences, flags, draw-buffer sizes, phase labels, resource counts, errors and provenance. They are measurements from the supplied Windows RTX 4080 / ANGLE Direct3D11 / isolated Chromium environment, using ordinary virtual-device inputs and a native RAF clock. They are not human or physical-controller trials.

| Scored run | Valid first/retry results | p95 / p99 racing interval | Worst racing interval |
|---|---:|---:|---:|
| Equipped, 1920×1080 | 2 | 16.7 / 16.8 ms | 16.8 ms |
| Equipped, 1920×1080 repeat | 2 | 16.7 / 16.8 ms | 16.8 ms |
| Equipped, 1280×720 | 2 | 16.7 / 16.8 ms | 16.8 ms |
| Stock, 1920×1080 | 2 | 16.7 / 16.8 ms | 16.8 ms |
| Stock, 1280×720 | 2 | 16.7 / 16.8 ms | 33.2 ms |

Across **47,049 racing intervals**, aggregate p95 was 16.7 ms, p99 16.8 ms, maximum 33.2 ms, and none exceeded 33.4 ms. Programs remained at 14; six spot and two area-light slots remained resident. Scored runs did not record video, use the expanded GL tracer, use the old full inspection hot path, or preserve drawing buffers. No raw timestamp-difference mismatch or buffer overflow was found.

All ten recorded results are valid 78,402.539 ms laps. These same-path controller results are expected to be repeatable; they are not ten different human driving styles. They also do not establish spare performance capacity for three opponents. Re-measure the full new grid.

Source entry-to-ready load times were about 1.85–2.40 seconds; preparation within those totals was about 1.08–1.48 seconds. **Do not add those two overlapping durations together.** Ready/menu intervals reached 116.7 ms; their cause was not isolated. OS/driver shader caches were not cleared. The results support no recurrence of this racing stall in the named trials, not universal 'stutter-free' operation, low-end performance, mobile readiness, or a cold GPU-driver-cache guarantee.

## 3. Underglow and supplied motion

I inspected the matched red/cyan examples and decoded the complete supplied 25-second silent MP4 into samples. The light is plainly distinguishable near the rear/side pavement in the sampled ordinary chase views, including turns and practical-light transitions. It remains spatially tied to the vehicle. This resolves the earlier 'the upgrade barely shows up while driving' concern sufficiently to proceed.

The visual technique remains an approximation: two narrow downward area emitters, no fine underbody/wall occluder shadows, simplified front-strip contribution and no measured real-product photometry. The chosen 900 renderer-nit calibration at 60% UI brightness is an artistic parameter, NOT a manufacturer rating. Do not turn it into a catalog claim. The daylight caveat and the stationary far-camera HUD-label mismatch remain disclosed, nonblocking presentation debt.

See `evidence/current-streetlit-cyan.png`, `current-underlit-red.png` and `night-drive-samples.jpg`. The samples are inspection aids, not a replacement for the MP4 or the unrecorded timing traces. The source movie is SILENT; I have not auditioned or approved the engine sound.

## 4. Tests: executed vs. reported

**Independently executed:** 31 tests against the supplied input resolver, drivetrain, audio mapper, race evaluator, personal-best saves and career transitions. All passed. The audit uses installed TypeScript only to load the original `.ts` modules; it does not replace Three.js, Rapier or the game's behavior with mocks. It is NOT a full typecheck or production build. Output: `evidence/independent-tests.log`.

**Reported by the package, not reexecuted here:** 74 full source tests; production type/build success; six browser UI regressions; owned/unowned equipment preparation and reload smoke tests; 10,200 exactly equal kit-off/on simulation objects; hardware profiling. The fresh `npm ping` attempt here failed with `EAI_AGAIN registry.npmjs.org`. I did not run the full browser/physics suite or the two Three-dependent light-lifecycle tests.

## 5. Important design decision for the next run

The current `Simulation` creates, owns and steps one Rapier world for one car. Instantiating three more independent `Simulation.create()` objects will not give us a physically interacting field. A narrow shared-world extraction is therefore necessary and is explicitly authorized in the next packet. Keep the single-car facade and use differential regression tests to preserve accepted forces, gearing and contact behavior.

This is why the next task is larger than 'add three moving models.' It includes shared physics, genuine controller-driven rivals, validated multi-lap racing, story transitions, safe progression updates, presentation/audio integration, and end-to-end profiling. Those are internal checkpoints of ONE assignment, not reasons to stop and ask Dan for six more uploads.

## Limits and retained visual debt

The scene remains a functional prototype: sparse harbor dressing, thin palms, simplified car/driver surfaces and synthetic engine sources. Those are not being approved as the eventual high-end result. The next objective is a complete first race with recognizable opponents and a reason to retry. A cohesive visual art pass and the other two vehicles follow a successful integrated chapter; no promised delivery date or universal runtime is attached.

Human fun, physical gamepad feel, foreground-display responsiveness, audio quality and broader hardware/mobile performance remain unverified. The next packet contains tests and evidence requirements intended to reduce—not misrepresent—those gaps.
