# Astra director review 10 — First Night at the Harbor
**Reviewed September 14, 2026. Decision: accept the functional chapter for continued development; retain presentation and performance reservations.**

## 1. What was reviewed

Source: `Astra-Review-10.zip`, runtime `7fe1e881b0712be2fa09b4c4eec6baa9d0ebb0d6`, packaging checkpoint `0c6e1be9a575674cfe96e793db4435b055b02cc5`. The package contains the current implementation, public assets, tests, reviews, raw telemetry, native-RAF measurements, and a continuous silent race recording. It is not the original project or a new restart.

I verified all **439 package-manifest entries** and all **276 declared build-input hashes**. There were no mismatches. Of assets present in both Review09 and Review10, **42 common public files are byte-identical**, as are **32 common source files**. Ten common source files changed, including the explicitly authorized shared-world integration. This is not a claim to have compared every locally retained file or unchanged Blender source: large unchanged `.blend` sources were omitted from this archive.

Evidence: [independent inspection](evidence/independent-inspection.json).

## 2. What I independently executed

Using the submitted source and a diagnostic Node TypeScript loader, **53 tests passed, zero failed**. Coverage includes input/rearming, drivetrain wheel-speed behavior, audio pitch coherence, solo lap/save rules, career migration/transitions, chapter behavior, competitive timing/ranking, rival stabilization, and crew menu behavior.

These are actual executions, not repetitions of a reported green check. The loader transforms TypeScript without editing the source; it is not a TypeScript type check or a substitute for the Vite build. An initial expanded attempt could not load the separate physics-dependent audio test because Rapier was unavailable; the clean 53-test subset excludes that dependency-bound file. The method is recorded in `tools/README.md` and the passing log is [here](evidence/independent-tests.log).

The submission reports **102 full-suite tests**, a successful TypeScript/Vite build, and **4,200 full solo telemetry objects matching the earlier implementation**. It also reports isolated-browser IndexedDB migration/concurrency/write-failure tests, audio-graph tests, and four-body collisions. I inspected those reports and corresponding source paths, but did **not** independently execute the full browser/Rapier suite. Registry DNS resolution was unavailable in this review container; the required packages were not locally present. No human control-feel, physical-controller, auditory-quality, or new GPU benchmark is claimed.

## 3. The racing chapter is connected

The production source contains a shared `RaceWorld`, four dynamic vehicle participants, one common fixed-step world update, and per-car control inputs. The rival controllers plan speed, braking and lanes, sense traffic, and have bounded recovery behavior. The race evaluator controls ordered checkpoints, the two-lap finish, and fractional finish timing. This is materially different from moving three visual cars on rails.

I replayed **every row in two supplied physical-trajectory recordings** through fresh instances of the actual `CrewRace` module: **10,441 + 10,261 = 20,702 simulation samples**. All four participants' final snapshots reproduced **exactly** in both fixtures. Repeated terminal updates did not change the player's result/proof.

| Recorded fixture | Player result reproduced | All four finishers |
|---|---:|---|
| `podium-11` | Third, 2:45.827 rounded | Valid |
| `field-player-97` | Fourth, 2:47.783 rounded | Valid |

This independently exercises the race rules against the recorded positions. It does **not** recreate the forces, collisions, or driving in a new simulation. The 199.12-second runtime video is a separate run; its third-place time is 2:45.906, not the fixture time above.

I then consumed the real manager-issued proofs in the pure career transitions. Starting with a constructed valid solo award, the sequence was **0 → 800 → 200 after the existing kit purchase → 750 after third plus the first-podium bonus → 850 after a separate fourth-place finish**. Re-delivering those same crew proofs did not add credits. Owned/equipped state, cyan appearance, and chapter clear state survived those transitions. This is a pure-state check, not an independent browser-storage persistence test.

Evidence: [full replay](evidence/independent-race-career-replay.json), [execution summary](evidence/independent-replay.log). Relevant source: `src/simulation/index.ts`, `src/competition/{race,rival,stability}.ts`, `src/career/store.ts`, `src/crew.ts`.

**Acceptance:** retain the shared simulation, rivals, chapter/results/rewards, optional upgrade, and normal menu integration. Do not reconstruct those systems merely to get a different code layout.

## 4. Functioning rivals do not yet prove a compelling race

The first raw fixture records one player pass shortly after launch, then the same order for the rest of the race. In the other fixture the player stays fourth, while two rivals exchange positions later. The inspected continuous footage likewise primarily establishes stable completion and a connected experience, not sustained close competition or human enjoyment.

The controller's `passes` counter increments when selecting a passing maneuver; it must not be cited as a count of **completed** overtakes. Future racecraft evidence should pair an actual authorized-progress order change with a legitimate on-road encounter. Do not force a theatrical pass, pin an opponent alongside the player, or change standings to satisfy an evidence checklist.

The next packet permits bounded traffic/race-readability improvement, not a new physics model or compulsory outcome. The existing distinct third/fourth outcomes are valuable and should be retained as baselines.

## 5. Presentation remains clearly provisional

The current [grid](evidence/current-grid.png) has long stretches of repeated barriers, thin palm crowns, simple white buildings, and large flat unarticulated ground areas. Daylight exposes that sparsity too: [current day view](evidence/current-day-course.png). The [garage](evidence/current-garage.png) remains a plain inspection room with development labels and a crowded product panel. These are visual judgments from the actual runtime captures, not failed numerical tests.

The local report appropriately acknowledges this debt. It is time for a coordinated environment, showroom and interface pass—not another vehicle-nose revision, but also not multiplication of the same provisional scenery across five tracks.

### Headlights

At the grid, the rival directly ahead is washed nearly white, obscuring the very paint/accent differences meant to identify it. The lighting source creates two strong player spotlights with a shallow target direction down the road. Beam calibration, material response and exposure should be tested together. This is a **source-supported lead**, not proof that a single intensity constant is the entire cause.

Correct it with matched day/night views at three, eight and twenty meters, normal chase/cockpit cameras, visible road edges and recognizable rival colors. Preserve working underglow, the stable practical-light pool, and the road's nighttime readability. Do not hide the defect by making every car matte black, disabling headlights, or excluding rivals from ordinary lighting.

### Sound evidence

The main video contains **no audio stream**, as its SILENT label says. Separate graph tests establish signal/state activity, not whether the mix sounds good. The next evidence workflow should capture the actual running game mix without requiring a microphone, access to Dan's desktop audio, or a human recording task. A Web Audio media-stream destination can receive a tap from the existing graph; this is a recording capability, not automatic proof of A/V synchronization. See [primary references](references/TECHNICAL-SOURCES.md).

## 6. Performance: preserve both the failures and the clean followups

I recalculated nearest-rank percentiles from the supplied **native, unrecorded, active-race RAF rows**. These are measurements from the submitted isolated Chromium / RTX 4080 environment, not measurements made on my own hardware.

| Run | Active samples | p95 / p99 / maximum interval, ms |
|---|---:|---:|
| Equipped 1080p | 19,787 | 16.8 / 16.8 / 66.7 |
| Equipped 1080p repeat | 17,082 | 33.4 / 50.0 / 83.4 |
| Equipped 720p | 9,794 | 16.8 / 33.3 / 66.7 |
| Stock 1080p | 9,854 | 16.8 / 16.8 / 50.0 |
| Stock 720p | 9,823 | 16.8 / 16.8 / 366.6 |
| Later stock 720p | 9,948 | 16.8 / 16.8 / 16.8 |
| Later equipped 1080p, two races | 19,910 | 16.7 / 16.8 / 16.8 |

The original 366.6-ms racing interval clipped 266.6 ms under the retained catch-up cap. The original equipped repeat missed the declared percentile targets. The later runs do not erase either observation. A separate trace did not reproduce the pause or establish a source cause. Stable programs/lights at the original burst and a short GC in a **different** run do not justify declaring it a shader or garbage-collector defect. Later competing-application activity does not establish historical blame either.

The correct status is **functional acceptance with performance reservation**, not “all stalls fixed” and not “the whole game must stop for another profiling-only handoff.” Preserve the original outlier, use bounded baseline/final measurements, and investigate a reproducible new failure during the next integrated run. Broad G3/G4 and general hardware-performance approval remain pending.

The source reports a substantial render workload in the four-car scene (roughly 465 calls and 1.72 million submitted triangles at a sampled burst). That is a reason to budget, instance, cull and use detail levels before adding environment density—not proof of the pause's cause. Resource counts are not GPU timings or memory-byte measurements.

## 7. Director decision and next assignment

**Keep P05 as the playable first chapter. Execute P06 — Harbor Showcase as one longer local run.** Raise the existing chapter's setting, lighting, showroom, readable race presentation and audio evidence together, with resource headroom and regression testing inside that run. No new vehicle roster, new track, economy, accessory, or Chapter2 is authorized here.

This explicit decision supersedes the older freeze on environment/showroom presentation for the scope specified in `CODEX_NEXT.md`. It does not authorize rebuilding the accepted Slingshot, moving its contact points, undoing the rear assembly repair, changing real-product identity, or wiping saves. All decisions should be recorded locally without making Dan mediate routine choices.

This review delivers an audit and a production assignment. It has not built P06, deployed a game, or approved final vehicle/visual/audio quality.
