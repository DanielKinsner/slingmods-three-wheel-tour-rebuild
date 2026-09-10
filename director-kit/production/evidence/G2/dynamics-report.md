# P02 driving dynamics evidence — implementation ready for independent motion review

This is actual isolated Node/Rapier WASM evidence, not a G2 approval or a claim of controller feel. Production source is frozen for the lead's runtime captures. No legacy implementation was imported, no desktop input was used, and no vehicle transform or speed is assigned during driving. Only deliberate reset assigns pose/velocity.

## Implementation and source of truth

- `src/simulation/index.ts`: one dynamic rigid chassis; exactly three suspension/tire channels from the same `public/assets/slingshot-contact-layout.json` used by the Blender asset. +X right, +Y up, -Z forward. Positive steering means left. Both fronts steer with Ackermann geometry; only rear receives engine torque.
- Each tire uses five fore/aft circular-envelope rays to select ONE support contact and ONE spring/damper load. Multiple samples never multiply forces. This catches curbs before the hub passes the vertical edge. Passive reduced-radius cylindrical wheel guards and chassis CCD handle collision. Guards have zero friction with Min combine; they supply impact-normal response without a second tire-friction law. The finite road top uses explicit upward-facing triangles matching the Blender pad dimensions.
- Suspension forces act at contacts. Front anti-roll transfers support with equal/opposite changes bounded by available front load; it creates no net extra support or tensile load. Rigid-body response supplies load transfer. No second load-transfer multiplier, built-in controller, spline pinning, upright torque, or artificial speed assignment is added.
- Combined lateral/longitudinal force stays inside the surface friction circle (the equal-axis ellipse case). Explicit low-speed regularization and bounded brake impulses avoid numerical reversal. Asphalt, wet, gravel and grass differ. Traction help limits rear drive demand relative to load/grip. Tire overspeed is recorded and changes engine RPM; it never adds grip beyond the force limit.
- `src/simulation/drivetrain.ts` owns the five-ratio AutoDrive, RPM, reverse interlock and 0.24s torque interruption. Reverse requests brake first and engage below0.5m/s. Reverse drive tapers near6m/s. This is an authored approximation, not an OEM safety/control model.
- Root telemetry is the Blender ground-reference origin: physical COM minus the rotated(0,0.46,0) offset. Wheel localCenter includes suspension movement; wheel spin is positive forward phase, rendered about-X. Renderer/camera receive copies; they do not own simulation state. Contact forces are evaluated at each tick's start; body pose/velocity are the integrated tick end.
- `FixedClock` accepts render elapsed time and executes fixed1/60s ticks, caps catch-up to0.1s, records discarded elapsed time, and clears partial time on pause. The authoritative simulation rejects other time steps.

## Actual verification

Commands in the new root:

```text
npx tsx --test tests/driving.test.ts
npx tsx scripts/test-driving-evidence.ts
npx tsx scripts/test-driving-controller-evaluation.ts
npx tsc --noEmit
```

Final regression: **13 tests passed, 0 failed**. This tests every simulation tick over21 scenarios, including finite transforms/telemetry, nonnegative normal load, force-circle bound, rear-only drive/front-only steering, three loaded rest contacts, acceleration/coast/brake, mirrored steady asphalt circles, slalom, controlled reverse, wet traction loss/recovery, gravel, one-wheel bump, curb, split seam, barrier, drop landing, incline launch, high-speed curb and high-speed full-lock steering. A new strict straight-ramp test requires heading within3degrees and lateral displacement within0.5m for centered and symmetrically offset approaches at9m/s. Tests keep their original acceptance bounds after repairs.

Selected observed results (simulation estimates, not real-vehicle performance claims):

- Rest: three loaded contacts totaling the850kg loaded-mass weight; root settles within a micrometre of nominal in this run. The regression allows1cm horizontal rest drift and3% support error.
- Straight:30.43m/s after9s of0.75 throttle following2s settling; forward travel150.17m. Integrated ground trace includes a real1→2 shift; the high-speed-lock trace includes1→2→3.
- Braking: stops from approximately22.44m/s in about26m; final signed speed is effectively zero. Coast retains19.25m/s at the same13s final time.
- Left/right25s dry-asphalt circles retain all contacts, mirror within2cm at every tested tick, settle near7.57m/s and maintain a steady yaw rate. High-speed full-lock dry samples above20m/s retain all contacts and upright-vector Y>0.98.
- Wet assisted acceleration reaches18.61m/s at8s versus26.88m/s dry. Unassisted wet trace reaches rear slip ratio3.63, then lift/brake restores near-zero slip and speed. These coefficients/values are provisional.
- The barrier stops a17.04m/s approach before the barrier plane. A5mm split between raised seam slabs retains three contacts. The ordinary curb scenario targets7m/s and peaks at0.467m root height, with upright-vector Y>=0.971 before settling; the one-wheel bump targets6m/s, peaks at0.121m and remains above0.975 upright. These ordinary-speed cases are distinct from the high-speed strike below.
-30/60/120/144 simulated render schedules each execute exactly720 ticks over12s and yield identical final position/speed in this Node/WASM build. Browser frame-cap captures remain a separate lead-owned evidence lane; this is not a cross-browser determinism promise.
- An isolated sweep of the actual AutoDrive module exercises1→2→3→4→5 with zero drive force during each transition and recorded torque/power in SI. Prescribed speed in that sweep is explicitly not a chassis acceleration result.
- The installed Rapier0.20 built-in controller was actually exercised in a separate world with3 wheels and no custom forces. Production chooses the explicit custom force model for auditable suspension units, combined-slip/surface behavior and drive telemetry; the built-in probe is not presented as a certified three-wheel model.

## Repairs and limits

The initial brake regression caught about5cm/s of pitch rebound while stopping. Reducing low-speed brake impulse alone was insufficient; increased estimated suspension damping repaired the rebound while preserving the existing bound. See `dynamics-initial-regression-failure.log` and final `dynamics-regression.log`.

The initial point-ray high-speed curb stress case caused excessive pitch. Its failure is preserved in `dynamics-highspeed-curb-failure.log`. Sampling each tire's circular fore/aft envelope repaired the tested overturn bound without adding forces or relaxing tests.

The rejected revision01 incline trace developed24.63m lateral deviation and51.82degrees yaw with zero steering. A bounded follow-up localized this to a spurious front-right guard/flat-road collision normal and4005.86Ns impulse at5.8667s. The same ramp now runs over a finite triangulated road top with identical authored dimensions, and rigid guard proxies have zero tangential friction so tire traction stays in the custom tire law. No yaw reset, rail or stabilizing torque was added. Three symmetric final lanes stay within0.01844m lateral error and0.02958degrees yaw over11s. Details, controlled geometry/contact probes, the failing-before strict test and final instrumented runs are in `revision02/dynamics-ramp-cause.md`. Original sources and evidence remain preserved in `revision01/` (implementation checkpoint4e079c2).

The high-speed curb stress trace still needs independent motion judgment: a21.66m/s impact into the18cm vertical curb peaks at3.48m root height before landing/recovery. Its broad stability checks pass; those do not establish convincing destructive-impact behavior. This differs from the ordinary7m/s curb case above. No claim of physical realism or damage modeling is made for this stress response. The previously unresolved straight-incline heading defect has been repaired and is now covered by a tighter regression.

All loaded mass(850kg), COM, inertia, spring/damper rates, ratios/final drive, torque curve, engine response, tire coefficients, braking allocation and assists are declared simulation estimates. No dyno, measured acceleration, OEM control reproduction or accessory horsepower claim is made. Wheel overspeed uses a lumped rear rotational response; free front spin follows rolling velocity rather than independent unsprung rigid bodies. Slip ratio is an authored longitudinal-demand/overspeed proxy. Engine response uses a rate-limited crank/clutch approximation. Suspension has no explicit wishbone kinematics or unsprung mass, no tire deformation, and only a sampled fore/aft contact envelope. No physical gamepad/mobile-device testing or human driving approval is claimed.

Evidence files: `telemetry-*.json` contain all fixed-tick inputs and every6th telemetry frame; `dynamics-summary.json` has scenario extrema; `dynamics-frame-caps.json` has final clock comparisons; `dynamics-five-speed.json` is the isolated drivetrain sweep; `dynamics-controller-evaluation.json` records the built-in probe. `dynamics-source-snapshot.json` hashes the exact frozen sources/shared contact file used for this evidence. Independent G2 review and runtime motion/camera/presenter evidence are owned by the lead/reviewer.
