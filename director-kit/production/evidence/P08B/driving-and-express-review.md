# P08B driving and Harbor Express — internal implementation review

This is the driving/Express implementation worker's self-audit. It is not an independent director approval, native frame-time certification, hardware test, film/ZIP receipt or remote commit receipt. G3/G4, final fidelity and release remain held.

## Implemented behavior

- Customer integration explicitly selects `slingmods-sport-v1`; `Simulation`, `RaceWorld`, drivetrain, input and cameras still default to `legacy-p08a` for existing reference tests. The lead owns saved result/ghost profile separation.
- Sport changes the existing equations through versioned estimates: torque scale1.30; shift interval0.18s; steering lock0.60rad, speed falloff0.021, lateral steering limit8.2m/s², rate2.7rad/s; asphalt tire grip scale1.15; tire stiffness8. Brake request scale0.70 and steering relief0.35 at full brake bound combined demand. No pose steering, extra tire channel, nitrous or manufacturer performance claim.
- Damping remains3800/6500N·s/m. DDM street estimates therefore still equal this profile's stock damping. Installation still uses the existing directional damping/perch seam. Hardware/product facts are not changed by Sport.
- At a near stop, release both pedals then freshly press S/down/LT to request reverse. That same brake pedal supplies reverse throttle; W/up/RT brakes while reversing, then release/fresh forward selects D near stop. Holding a pedal through a stop never changes direction. Simultaneous pedals do not choose a direction. Explicit X/right-face selection retains W/RT throttle and S/LT brake. Pause, disconnect, reset and focus quarantine still apply.
- Sport chase follow/heading rates16/12; near/far distance6/8.4m, height2.4/3.5m, FOV42–52°. Legacy constants unchanged. Camera impression is separate from measured vehicle motion.
- Harbor Express is a separate2,317.1608m authored loop:800m quay straight,200m marked braking zone,15m road,3m runoff each side,16 ordered checkpoints. Terminal sweeper, warehouse return, loading-yard transition and marina bend are connected. Visible rails and Rapier boxes consume the same oriented definitions. Existing Harbor geometry is not read to construct Express or rewritten.
- Editable route and world placement source is `src/express/route.ts` and `presentation.ts`; runtime uses the existing packed Harbor kit and textures. Source kit is `assets/blender/showcase-quality/built-waterfront.blend`. New runtime geometry is reproducible from TypeScript, including road, runoff, curbs, rails, center dashes and braking boards. Roadside warehouses, palms, docks, quay, boats and a gantry reuse current kit geometry.
- Express helper offers quick-race initialization/restart/step/disposal, with all4 cars sharing Sport. Express custom events never issue career award proof. Free drive accepts one safe centered grid participant and continues unscored past gates/laps. Original career events may carry profile-only metadata and still issue their original certified crew/duel proof; explicit custom event identity suppresses proof.

## Measurements and meaning

All values below come from fixed60Hz physical simulation, with the ordinary production InputResolver where indicated. These are not OEM/DDM claims, native RAF measurements or human-fun certification.

| Measure | Legacy P08A | Sport stock | Sport edited DDM setup |
|---|---:|---:|---:|
|0–60mph, supported analog full throttle|6.000s|4.733s|4.717s|
|60mph matched-speed full stop|36.842m|49.931m|49.910m|
|110mph matched-speed full stop|128.183m;0.179rad yaw drift|158.851m;~0rad yaw|158.690m;~0rad yaw|
|4m/s90° low-speed turn radius, left/right|6.182m|5.092m|see raw summary|
|20m/s90° turn time, left/right|6.933s|4.783s|see raw summary|
|20m/s90° mean path radius, left/right|88.655m|61.008m|see raw summary|
|35m/s55% steering90° radius, left/right|597.083m|391.543m|see raw summary|

The edited DDM test is front compression9/rebound10, rear compression7/rebound8, height+10mm. Tiny launch differences are emergent force/load behavior, not a guaranteed upgrade benefit. Street setup and removed setup are exactly equal to active Sport stock over1,200 compared telemetry ticks in tests. Default simulation and explicit legacy are exactly equal over another1,200 ticks. The old Spring/mass/contact/geometry/drivetrain curve remains unchanged; profile parameters are the only driving seam.

Sport reaches110mph after13.90s/434.20m from rest in the straight fixture, leaving room for the demonstrated159m stop in an800m straight. The unrestricted22s fixture reaches127.67mph, so113mph is not a hidden speed cap. Express race opportunities are measured at112.61–113.27mph with the control driver respecting curves.

Stock brake-turn-left/right, low/medium turns, sweepers, grass re-entry,80mm bump and wall reverse all retained three contacts throughout final fixtures. Full-power shifts occur near41.83/68.25/105.73mph, at3.15/5.68/12.33s. Output carries real RPM, gear, angular speed, tire loads/forces/slip and steering every tick. Wall-recovery reverse produced real negative signed speed and backward displacement; physical tests also verify the yaw sign reverses with vehicle direction.

Non-perfect keyboard corner entry (hard steering/pedal changes) and perturbed analog steering/braking were measured on both sides. All4 runs retained all3 contacts; maximum roll0.05295rad, keyboard peak60.42mph, noisy analog peak55.47mph. These fixtures deliberately avoid smooth pursuit input.

### Repeated route races

- **Express final calibration**: `express-final-repair01`, seeds11/29/47, all4 entrants finished valid each run. Peak112.61–113.27mph, maximum roll0.05218rad. These runs use full Rapier integration with control-only drivers. No snapping, relocations or extra vehicle forces. Custom career proof stays null.
- **Original Harbor Sport**: `harbor-sport-repair01`, seeds11/29/47, all4 entrants finished valid each run, total runtime146.85–146.97s including3s countdown. Peak76.81–76.84mph. Seed29 includes a Jett contact excursion up to0.6796rad roll and subsequent physical recovery; it is retained, not presented as pristine driving. No resets/teleports occurred. This folder predates the profile-only metadata certification repair; its snapshot label was legacy even though its world/driver were Sport. Later focused receipt tests prove the corrected profile-only award path; the lead is rerunning the final integrated career loop.
- Rivals share the active physical model and use estimated planning parameters: pace multiplier2.28, lateral planning multiplier1.8 on wide Express/1.4 on narrower Harbor, conservative original3.2–3.8m/s² planning deceleration,200m planning horizon. These are control choices, not hidden rival physics.

## Critique, failures and repairs retained

1. `driving` initial Sport brake-turn-left rolled. BrakeScale1.12, lateral demand9.2 and stiffness9 were excessive together. The first repair lowered lateral demand/stiffness and added bounded brake steering relief.
2. `driving-matched` exposed110mph full-brake yaw drift at brakeScale1.0. `driving-matched-repair01` (brake0.92) rolled; `driving-damper-trial01` increased damping and lost contacts. Both experiments were rejected, baseline damping restored. Brake0.70 (`driving-brake-trial02`, then final data) stopped straight with all3 contacts. This consciously lengthens stops rather than hiding instability.
3. `express` first seed11 lost Jett to track limits. Earlier curve braking/lower lateral planning repaired it. After the final brake-demand reduction, `express-final` all cars finished but had large contact excursions. Earlier planner braking produced `express-final-repair01`, all4 valid finishes and max3°roll across all3 seeds.
4. `harbor-sport-final02` seed29 invalidated the player at the original narrow course's curbed turn. Narrow-corridor planning reduction produced `harbor-sport-repair01`, all4 finish each seed. One recovered contact excursion remains, disclosed above.
5. Integration screenshot `integration/express-first.png` exposed downward road ribbon winding: front faces were culled and the ground showed through. Winding and negative-edge orientation were corrected; a regression test now checks upward normals and a closed seam. Frontage was moved into primary views, shore/docks brought closer and gantry placed ahead of the grid. The lead owns final refreshed screenshots.
6. Integration `career-01` caught using explicit custom event IDs merely to stamp Sport, suppressing career proof. Constructor now allows profile-only metadata; only explicit custom event identity/free drive suppresses proof. `p08b-driving-awards.test.ts` proves Sport crew+duel proofs, custom no-proof and rejection of a lap override without separate event identity. `crew.ts` constructor was the only integration line this worker changed.
7. Failing test outputs final02 retain test-fixture mistakes: the reconnect test accidentally removed its own pad before testing ownership; the4s reverse steering assertion observed wrapped yaw after a complete maneuver. Corrected tests retain the pad and measure2s directional behavior. Focused final05 has16 tests passing.

## Relevant evidence map

- `driving-final/`:13 ordinary analog fixtures per legacy/Sport profile, full compressed tick data + summary.
- `driving-matched-final/`:8 matched-speed steering/braking fixtures per profile, full compressed tick data + summary.
- `driving-modified-final/`, `driving-matched-modified-final/`:same fixtures with edited DDM setup.
- `driving-imperfect/`:4 non-perfect keyboard/noisy analog fixtures, raw device/input/physics data.
- `express-final-repair01/`:3 final Express physical races, full all-car telemetry/race/controller data.
- `harbor-sport-repair01/`:3 final narrow-course controller races, full all-car data, metadata caveat above.
- `driving-tests-final05.txt`:16 focused tests passing. `driving-source-sha256.json`:owned source snapshot hashes, not final commit certification.
- `express-route.json`, `express-route-map.svg`:full layout and readable plan view.
- All intermediate folders listed above retain failures/experiments. Do not substitute them for final results.

## Exact rerun commands (PowerShell, repository root)

```powershell
npx tsx --test tests/p08b-driving-awards.test.ts tests/p08b-driving.test.ts tests/p08b-express.test.ts
npx tsc --noEmit
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/next-driving'
npx tsx scripts/p08b-driving-diagnostics.ts
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/next-matched'
npx tsx scripts/p08b-driving-maneuvers.ts
$env:BUILD='modified'
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/next-modified'
npx tsx scripts/p08b-driving-diagnostics.ts
Remove-Item Env:BUILD
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/next-imperfect'
npx tsx scripts/p08b-driving-perturbations.ts
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/next-express'
npx tsx scripts/p08b-express-diagnostics.ts
$env:ROUTE='harbor'
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/next-harbor'
npx tsx scripts/p08b-express-diagnostics.ts
Remove-Item Env:ROUTE
```

For isolated served-browser proof, import `scripts/p08b-driving-evidence-agent.ts`, instantiate `EvidenceDriver(route,seed)` and feed `driver.sample(telemetry,field,dt)` through the scene's isolated `setDeviceSample`; this exercises the real InputResolver/session/fixed-step bridge. It throws if reverse recovery is requested instead of pretending a button toggled direction. Label that lane an evidence-only virtual player, not a hardware controller or human drive.

## Remaining scope held

The lead owns native/browser loop, visual review, packaged source/assets, performance/film capture, ZIP integrity, remote feature-branch commit and cross-machine handoff. This worker has not independently certified those unfinished artifacts. Public hosting is not a development blocker. Human driving feel/controller hardware, G3/G4, final brand/vehicle fidelity and release approval remain ungranted.

## Final historical legacy regression

After the final worker edits, `scripts/verify-p08a-physics.ts` was rerun under `P08B/legacy-regression`. The 4,200-row complete traces for baseline, default stock, street estimate and removed hardware all deep-equal the accepted baseline. Their uncompressed telemetry SHA-256 values also exactly equal the preserved `P08A/physics-final` hashes. This is an actual historical-data comparison, in addition to the profile-default tests. See `legacy-regression/historical-comparison.json` and its raw compressed traces.
