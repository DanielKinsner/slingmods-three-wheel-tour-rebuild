# P09A driving repair — Sport v2

## Result

The explicit `slingmods-sport-v2` profile retains v1 power, gearing, launch, grip, suspension, mass, inertia, wheel geometry and nonbraking steering. It changes brake distribution, brake steering relief and passive guard/floor contact. Legacy remains the low-level default; integration selects v2 explicitly. Legacy/v1 are preserved diagnostic references.

| Matched asphalt diagnostic | Legacy | Sport v1 | Sport v2 stock |
| --- | ---: | ---: | ---: |
| Simulated0–60mph | 6.000s | 4.733s | 4.733s |
| 60mph near-stop path | 36.842m | 49.931m | **36.032m** |
| 110mph near-stop path | 128.183m | 158.851m | **116.370m** |
| 110mph accumulated yaw | 10.278° | approximately0° | approximately0° |
| 110mph lateral displacement | 8.497m | <0.00001m | <0.00001m |

Entry is the first60Hz tick at target minus0.05m/s. Near-stop means absolute body-forward speed below0.2m/s. Exact entry speeds/positions, all acceleration/braking rows and end states remain in the traces. These are estimated game-model results, never OEM measurements or human playtests.

## Instrumented diagnosis and retained failures

Before equation changes, optional read-only instrumentation recorded input, requested/actual longitudinal/lateral forces, saturation, load, travel/length, contact point/velocity, position/quaternion, linear/angular velocity and chassis/guard manifold normals/distances/reported impulses. `Simulation.enableDiagnostics()` only samples; ordinary production driving does not traverse manifolds.

Initial runs reproduce Review16 distances exactly. Six full60/110mph variants remain in `director-kit/production/evidence/P09A/driving-variant*`:

1. `01-force`: scale1.0 with original fixed allocation and guards.110mph125.90m,21.92°yaw,13.58m drift. Rejected.
2. `02-load`: demand proportional to supported load.116.51m,5.48°,3.92m. Still rejected.
3. `03-no-guard-diagnostic`: variant02 guards set to sensors.116.37m, negligible yaw/drift. Diagnostic only; removing obstacle guards is not acceptable.
4. `04-no-ccd-diagnostic`: variant02 CCD disabled. Same failure; rejected.
5. `05-faceted-guard`: variant02 cylinder changed to24-sided convex hull with same radius(.68×wheel radius) and axle width.116.29m,5.58°,4.24m. Rejected.
6. `06-ground-filter`: original cylinder and CCD enabled, only continuous planar floor excluded from guards.116.37m, negligible yaw/drift. Selected.

In failed high-speed stops a front load reaches zero and guard/floor manifolds appear. Reported manifold impulse fields remain zero. This establishes a reproducible dependency on guard/floor interaction, **not** a proven internal Rapier solver defect or inferred nonzero impulse. Switching to a same-envelope hull and disabling CCD did not cure it. All failures are preserved, not presented as passing physics.

## Exact changes

- V2 pedal demand is `brake × 850kg × 9.81m/s² × brakeScale`, with scale1.0 instead of.70.
- It distributes that total through the same three tire channels as `wheelLoad / totalSupportedLoad`. Zero-load wheels receive zero pedal demand. Existing rolling/coast drag, combined-slip circle and low-speed stop limiter remain authoritative.
- Full-brake steering relief is15% versus35%; velocity-dependent cap/rate and nonbraking steering are unchanged. This change follows variant06 and is used in final turn data; straight diagnostics are unaffected.
- Floor membership1/filterall (`0x0001ffff`); passive guard membership2/filterall-except1 (`0x0002fffe`). Chassis, walls, obstacles, ramps and vehicle collision settings remain unchanged. Guards still hit obstacles and vehicles. The chassis still catches bottoming/overturn. Tire rays query the floor normally.
- Guard shapes, radius, width and placement remain unchanged. Surface geometry and asphalt/grass/gravel classification remain unchanged. No fourth tire-force channel, hidden yaw/position correction, mass/grip/power increase or lowered speed exists.

## Validation and critique

`driving-matched` stores legacy/v1/v2 low/medium/high turns both directions, straight60/110mph and partial/full brake-turns at20 and35m/s both directions. Unbraked turning matches v1. V2 brake-turn paths at20m/s are34.07m partial/19.98m full; at35m/s102.64m partial/59.75m full. Both directions match, all three tires stay supported, max roll is below3°. A sustained partial-brake turn can exceed90° before stopping; this is deliberate held steering, not an ideal racing line or unexpected spin.

Street estimate and removed suspension are exact stock telemetry. Modified DDM setup remains functional and meets straight targets (36.02/116.08m); no universal improvement/manufacturer claim is made. `driving-imperfect` captures noisy analog and keyboard pulses both sides. `driving-compatibility-final` repeats launch, grass, bump and wall/reverse after v2 received the existing Sport direction mapping.

`driving-rough` repeats existing pad fixtures including wall, single-wheel bump, curb, drop, incline and high-speed curb. Finite state and wall collision remain. **The deliberate full-speed curb stress flips both v1 and v2.** It is a real crash needing the separately implemented respawn, not an all-scenarios-upright pass. The v2 floor catches the inverted chassis; no geometry fudge hides the failure.

36 focused tests pass, including14 new tests. Explicit direction, analog magnitude, release/repress, pause/focus/disconnect, three-force limits, support and collision are covered. The baseline-equivalence script extracts the reviewed51f34a3 Simulation module into a temporary local module, compares7,200 complete telemetry ticks for legacy/v1, then deletes the exact temporary file. Every tick matches. Provenance and reusable digests are in `baseline-equivalence.json` and `tests/fixtures/p09a-baseline-digests.json`.

CPU simulation/input proof is separate from final browser performance, normal-camera movie and human feedback. Hardware-controller breadth and human fun/listening remain unapproved.

## Reproduce

From the repository with pinned dependencies:

```powershell
npx tsx --test tests/p09a-driving.test.ts tests/p08b-driving.test.ts tests/driving.test.ts
npx tsx scripts/p09a-baseline-equivalence.ts
npx tsx scripts/p09a-driving-diagnosis.ts
npx tsx scripts/p09a-driving-maneuvers.ts
npx tsx scripts/p09a-driving-compatibility.ts
npx tsx scripts/p09a-driving-perturbations.ts
npx tsx scripts/p09a-driving-rough.ts
python scripts/analyze-p09a-driving.py
```

Use a new `EVIDENCE_DIR` for each run. `PROFILES` accepts comma-separated profile IDs for diagnosis/maneuvers/compatibility. `BUILD` accepts stock/street/modified/removed for maneuvers/compatibility. `NO_GUARDS=1` and `NO_CCD=1` are diagnosis-only switches, never runtime options; clear them before ordinary tests. Current source alone does not reproduce historical failure variants; their exact transformations and full recorded data are listed above.

`driving-data-index.json` hashes every original trace; full bytes stay in Git. A lean packet may deduplicate identical stock/street/removed traces and reference unchanged remote legacy fixtures by immutable commit/path/hash. Preserve contact-layout JSON in the dependency inventory. The final commit and remote recovery receipt are maintained by the integrator.
