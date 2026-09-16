# P09C internal critique and repair

## Driving result

The old command ceiling interpreted a no-slip bicycle steering angle as the complete usable request. The downstream tire model still needed slip angle to generate lateral force. At65mph/150m this exhausted the command before reaching the requested path; the matched v2 run has5.573m RMS error and7.246m peak. At50mph/90m v2 already meets the requested path:0.934m RMS. Do not present that easier case as a previously impossible corner.

Final v3 uses a finite, speed-decaying steering reserve and a0.10s response, with no brake multiplier. The same controller achieves0.963m RMS at50mph and1.105m at65mph, both directions, for eight scored seconds after four seconds settling. Maximum path error is1.316m, speed variation stays below0.7%, and average command is66–72%. The50mph improvement is command headroom, not lower path error. Combined tire forces remain bounded by the original three-contact friction calculation. No tire grip, engine power, direct yaw/velocity intervention or world changes were made.

The first larger reserve passed circles but could roll during sustained hard input. It was rejected. motion-01/02/03, maneuvers-01/02 and transitions-01/02 retain intermediate data. The selected motion-final, maneuvers-final and transitions-03 retain all baseline/current rows. The final candidate passes the full/partial brake-turn, coast/lift, changing35–70mph,50mph-crossing,90/110mph lane-change and keyboard-tap/hold cases. The severe curb test intentionally still overturns; actual detected overturn and explicit upright recovery are tested. This is a game with recovery, not a claim that crashes are impossible.

Straight braking retains the v2 measurement definitions and distances:36.032m from60mph and116.366m from110mph. The measured0–60 time remains4.733333s. Current stock, removed suspension and street setup are byte-equivalent in the new test. The retained v2 implementation matches the original main simulation across3,600 complete telemetry ticks. Existing named legacy/v1/v2 tests remain; one Chapter02 new-entry expectation intentionally uses CURRENT_HANDLING_PROFILE.

## Profile and save review

Reviewed each entry seam rather than only freshRecipe: direct Harbor time trial, duel and crew; fresh Express/Harbor preview/test/race; showroom recipe/preset; Chapter02 new entries; frozen attempts and Cups. Player simulation, input, field and race metadata resolve the same version. Historical recipes stay v1/v2; the current-copy action preserves their recipe bytes and makes no career purchase. Stock comparison keeps the tune. Historical non-Cup retry previously opened a newly versioned attempt; retry now carries the active frozen recipe. Completed records and receipts are not rewritten.

Actual isolated-browser profile-entry and career-loop evidence covers loaded originals, current copies, returning drafts, reload, owned/removed parts, all four earned Chapter02 race results, both Cup legs and final ownership. Source tests also exercise historical frozen Cups and incompatible record keys. The legacy best-time table is not repurposed as a mixed-version leaderboard.

## Retained presentation and audio

128 required Review18 runtime/editable assets match their prior hashes. Review18 ZIP bytes remain unchanged. The source changes do not replace the UI/sound bank, vehicle, products, showroom or routes. UI bounds pass at720/768/1080/1440 heights. Powered display values, selected build thumbnail, actual Thermal departure pause/resume/skip and gesture audio remain functional. Preparation failure/cancel/retry and repeated route transitions pass.

The service-level audio fixture imports source modules, so its first run against the curated static server correctly failed to load source. It was rerun against the local dev server. A subsequent harness attempt raced the intended same-tab sound restoration and tried clicking an already-hidden Enable sound button. The new harness accepts the verified enabled state; all original audio behavior assertions remain. The static integration and film separately prove built audio behavior.

## Additional test setup repairs

The first film attempt reused the test query key as its diagnostic profile selector; the visible HUD and trace exposed the wrong profile. It is explicitly rejected. The second capture stopped because the test tried Back to Showroom before opening the pause menu after restart. The third capture completes the full sequence. No failed comparison is represented as a successful old/new take.

The extra first-finisher regression initially finished second. Its evidence-only planner was qualified with an inner line and no traffic speed planning. It still supplies ordinary controls to the unchanged player physics, collisions, rivals and gate validation. It really finishes first; pause freezes the waiting field and prevents an early reward, and resume awards the correct single result. All preceding nonqualifying attempts remain. This planner is not used by ordinary gameplay, the film race or native timing matrix.

## Film review

The selected capture uses the current vehicle, real native-clock simulations and the live post-limiter game master. Four comparison takes use the same controller/protocol at matched50/65mph; the pad is explicitly identified as a diagnostic fixture. Every recorded row is compared with the corresponding numerical run. Small browser/Node derived-math differences (maximum under2e-11) are listed; all-field bitwise equality is not claimed. The final instant of a v2 oscillation can cross the target again, so review the whole scored interval and its RMS/peak, not a single endpoint screenshot. The film adds trace-derived diagnostic annotations for that reason.

Ordinary keyboard driving shows braking/turn input, released/repressed reverse, explicit held-R restart, the current full race with three rivals, cockpit/display and return to the same build. It does not pretend the restart was an organically captured rollover. Actual severe-curb recovery is in the separate physics test. Loading/navigation and disclosed A/V sync markers are cut; no speed changes or replacement audio. Human listening and subjective fun remain unverified.

## Performance and deployment disposition

Consult PERFORMANCE.md and P09C-VALIDATION.json for the completed native matrix and exact hosted/remote-recovery status. This critique does not predeclare those pending results. Keep previous failed/stalled native evidence if any; no100ms samples may be removed. Main may be pushed only as a completed tested checkpoint to the existing owner-authorized rebuild integration. No release/fidelity/device approval is inferred from internal checks.
