# Review17 — retain the expansion; finish the interface and sound
**Decision: retain P09A and the later owner-requested front/hoop refinements for continued development. Performance, overall art/UI finish, listening, physical-device, G3/G4 and release approval are not granted.**

## 1. Exact candidate and evidence boundaries

| Identity | Value |
|---|---|
| Uploaded archive | Astra-Review-17-Lean.zip |
| Archive bytes | 76,097,348 |
| Archive SHA-256 | 8251ea2bd523fd4eace6eee757a361aec830dba79bd80fe2ec438f35395e8ec7 |
| Latest packaged visual runtime | 55ea67553562c859968b15d14339a8de35c6db0d |
| Packaging commit | 82d50a0e146e85c7335627c898d3f3680394581e |
| Verified remote tip | b967d6f887593d3c84181aa4f88d2a42ce79221d |
| Branch | feature/p09a-own-the-build |
| Earlier P09A measured gameplay runtime | 049c1cdd154f4ca83d087f99e0dad76040c049f7 |

The remote tip is an archive-receipt follow-up. Its recorded archive hash, size and runtime/packaging identities match the uploaded file. These identities are references, not instructions to revert a newer checkout.

The supplied P09A film and native performance matrix predate the later front/hoop edits. Current refinement images and verification reports are separate. Do not represent an older film or benchmark as a fresh test of the final art.

## 2. Useful work to keep

P09A adds Open It Up, the Jett duel and a two-event Coastline Cup; earned ownership/equipping of the already modeled exhaust, wing and bags; schema-4 migration and attempt/build binding; and explicit stuck/overturned-vehicle recovery. All five products remain freely previewable. This assessment comes from submitted source, handoff, screenshots, scoped tests and supplied browser reports, not my own end-to-end playthrough.

Sport v2 addresses the weak braking identified in Review16. I independently summed the supplied fixed-step position traces: the approximately 60 mph near-stop distance is **36.032 m**, compared with the previous supplied Sport-v1 result **49.931 m**. The new 110 mph near-stop trace is **116.370 m**. These numbers use the first sample at target minus 0.05 m/s through the first sample below 0.2 m/s absolute body-forward speed; they are simulated horizontal path lengths, not exact full-stop road tests or real product/OEM claims. New trace lateral displacement is negligible in these straight-line cases.

The revised brake demand uses supported tire loads; passive wheel guards no longer collide with flat road while the chassis retains floor collision and guards retain non-floor collision. This is a scoped simulation construction, not proof of an underlying Rapier engine defect. Failed alternatives and their original traces remain important.

The entry work introduces real preparation stages, cancellation/retry, earlier fetch and asynchronous shader preparation. One native configuration reports ready-menu availability at approximately 2.90 seconds, with first driving tick separately reported. Other submitted preparation cases use different boundaries/warm states. This is useful progress, not proof that all transitions are instantaneous or that every loading stall is fixed.

The latest owner revisions close selected front gaps, change lens/grille/splitter presentation and remove four invented diagonal hoop supports. Preserve these changes. The supplied close-ups still show simplified surfaces/materials; no blanket OEM-fidelity acceptance is implied.

## 3. UI judgment

The owner's criticism is supported by the supplied screens. The configurator has a tall right slab, seven nearly equal boxed navigation rows, eight little boxed camera/presentation buttons and a thick footer. Important descriptions and action labels feel small compared with panel titles and unused space. Career event/parts screens use another large-card rhythm; product thumbnails have conspicuous empty/white bands.

The next work changes hierarchy and composition, not just corner radii. Keep the good information architecture: vehicle at the center; categories; contextual product choices; free preview distinct from earned ownership; useful return/test/shop actions. Reduce repeated borders, visual chrome and competing calls to action, and bring career, HUD, settings, pause and results into the same design system.

See `evidence/ui-evidence-1.jpg` and `ui-evidence-2.jpg`. These are review contact sheets derived from supplied screens, not new running-game captures.

## 4. Performance is still HOLD

I independently recalculated **all 16 native race attempts** from their complete raw running-phase rows. Results exactly match the submitted matrix within 1e-6 ms floating-point tolerance:

- 13 pass all existing limits; **3 fail the maximum-interval limit**.
- **8 active-racing intervals exceed 100 ms**; worst **200 ms**.
- p95 is about 16.7–16.8 ms and p99 at or below 33.4 ms. Good percentiles do not erase the long frames.
- Every reported race has a valid player finish and four finishers; these are provided local-agent runs, not human playtests.

The clean matrix uses native RAF and a control-only automated driver on the reported Windows/RTX4080 host, separately from capture. CPU submission time is not GPU execution time. The traced diagnostic is overhead-bearing and not interchangeable with clean timing. The final owner art has not been freshly certified by this older matrix.

No bottleneck is established. Source review shows repeated HUD queries/value updates and full telemetry/snapshot allocations; these are investigation candidates, not a diagnosis. Standings and menus already have some change-key caching, so do not claim they rebuild unconditionally each frame. UI/audio/display changes must avoid unnecessary per-frame DOM work, decoding, texture uploads and duplicate contexts.

## 5. Independent verification actually performed here

- Verified **488 manifest-listed payloads**, zero mismatches (489 ZIP entries including MANIFEST.json).
- Independently decompressed and verified all **212 indexed P09A evidence entries** and **21 refinement evidence entries**. These counts overlap archived files and are not additive totals of unique assets.
- Ran **71 focused tests**, all pass, zero failures/skips. Covers input, career/chapter/save/race, build-menu rearm, demo profiles, drivetrain sign coherence, configuration, departure/door lifecycle and new career logic.
- The read-only Node TypeScript loader enabled local source tests without modifying submitted game code. `npm ci --offline --ignore-scripts` could not obtain uncached Vite; the log is retained.
- Independently recalculated native frame statistics and Sport-v2 braking from raw evidence. This is not a newly run physics/browser benchmark.

The submission reports 215 tests/build/recovery for the original P09A candidate and 218 tests for the updated art candidate. I did not independently execute either complete suite, a full build, a browser/renderer, or a physical controller here. No human fun/listening approval is made.

The included 174.805-second film contains H.264 1280×720/25 fps and stereo 48 kHz AAC. It is an edited actual-game capture with automated inputs and disclosed synchronization. Some career/workshop sections are authentically silent. Stream existence and measured synchronization are not judgments of sound quality. The film is from the older P09A runtime.

## 6. New owner audio and display request

The supplied `thermal sport sound.wav` is **10.427083 seconds, 48 kHz stereo PCM16**, SHA-256 **b5e726379308a2e381e55fb3bbe6309b26eac04ebd358dafd7a6fea52a3265ab**. Numeric sample peak is -2.266 dBFS; no full-scale samples were found. No by-ear, true-peak, loudness or authenticity claim follows. The original is bundled unchanged.

Current engine audio uses synthesized multi-RPM load/lift loops. The Sport treatment is a gain/rate/filter change to that bank, not the newly supplied recording. The departure animation lasts **5.8 seconds**, while the new file lasts about 10.43 seconds; do not blindly start the full clip over it and leave a tail after the transition.

Use the owner's clip for the **SM-7720-equipped cinematic exit**, with explicit edit/cue timing, lifecycle handling and actual mixed capture. Stock builds must not pretend to have the Thermal exhaust. A separate running-engine pass must inspect source suitability and improve the mix/bank rather than looping one changing rev recording over the whole RPM range.

The display work is an in-car visual simulation of the relevant Slingshot RIDE COMMAND home/Driver layout, with an independently authored vehicle thumbnail and game data. Polaris's reference guide describes display power following ignition and Driver Screens as the startup view. Source links are in `references/SOURCES.md`; no copied manual artwork or live OEM service is bundled.

## 7. Next assignment

**P09B — Signature Finish.** Deliver the full interface refinement, integrated interaction sound family, equipped Thermal departure, powered physical dash display and an engine-source/mix improvement attempt. Resolve or precisely characterize the frame spikes on the current final candidate. Preserve all earned and free-preview features, current owner geometry and existing route/handling work. No new chapter, vehicle or scenery campaign. One meaningful return: **Astra-Review-18-Lean.zip** with current visual and live-audio proof.
