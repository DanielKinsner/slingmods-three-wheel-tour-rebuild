# SPYDER01 physics and presentation provenance

The purchased custom model has no verified model year. The factual reference is the **US 2023 base Spyder F3 SE6**, not the F3-T/L. The complete bike uses `can-am-spyder-f3`, definition and handling revision `spyder-f3-v1`, recipe version 3, and an explicit automatic-shift game assist. Slingshot and Ryker steering/input profiles are preserved.

Reference facts: 1330 cc inline-three, six forward speeds/reverse, belt final drive, 115 hp / 85.8 kW at 7,250 RPM, 130.1 Nm at 5,000 RPM, 408 kg dry mass and 1,709 mm wheelbase. Source: [BRP 2023 F3](https://can-am.brp.com/on-road/us/en/models/previous-models/2023/spyder-f3.html), as recorded in the supplied kit's `data/source_ledger.json`.

Everything below is a game estimate, not BRP calibration or a claim to reproduce VSS/ABS/traction control:

- Loaded mass 508 kg: 408 dry + 80 rider + 15 fuel + 5 fluids. CoM height .51 m; inertia [178, 202, 88].
- Own torque curve, gears [3.05, 2.12, 1.59, 1.28, 1.08, .94], reverse 2.8, final reduction 5.15, efficiency .90, idle 1,000, limiter 8,100 RPM, shift .22 s. Reverse selects only near rest; a moving reverse request brakes first. Reverse speed is limited to 5 m/s.
- Steering lock .60 rad, speed falloff .018, rate 2.9 rad/s, lateral acceleration target 7.8 m/s², grip factor 1.06, corner stiffness 8.5. Shared bounded game assists keep ordinary curbs recoverable; this is not a motorcycle engineering simulator.
- Front/rear spring rates 27,000 / 47,000 N/m, damping 2,050 / 3,500 N·s/m, rest lengths .115 / .125 m, travel .065 m. Three independent ray-envelope tire channels; no fourth wheel.
- Elka controls act only on the equipped axle: manual preload adds 0–12 mm perch offset; normalized rebound/compression multiply that axle's directional damping by .8–1.2. Midpoint damping and zero preload preserve stock force calibration. They do not add grip or engine power.
- Front anti-roll transfer uses 3,600 N/m stock or 5,000 N/m with ULTRA, bounded by available support. One front gains exactly what the other loses. Rear support is unchanged at the same state.
- Pedal Commander maps input with exponents Eco 1.6, City 1, Sport .78, Sport+ .60. Zero/full-throttle endpoints are invariant. Lighting never enters force calculations.

The donor's measured custom contacts govern visuals and tires: front centers ±.685819 m, y .323550 m, z −.854551 m; rear center [0, .323550, .854500]. All radii .323550 m; front widths .204195, rear .273139. These custom tires differ from nominal OEM reference sizes; the model was uniformly scaled to wheelbase, not stretched to force every OEM dimension.

`public/assets/spyder/manifest.json` records the exact source-to-runtime transform. Runtime is Y-up, −Z forward, meters. Steering/fender/caliper carriers are independent of rotating rims/rotors. Stationary light rings follow front steering/travel. Stock links, springs, shock bodies, rear swingarm and belt receive bounded presentation articulation; this is an approximation rather than a constrained CAD mechanism.

Rider: separate derivative of the existing Tour rider, 3,058 sleeve vertices reweighted for the tall grips. Bone lengths and glove geometry are unchanged. Hands/feet use measured targets; only this rider's helmet and fittings hide in cockpit. Slingshot rivals retain their original rider. Own close/far chase framing, seated cockpit, corrected rear-facing native mirror glass, measured headlamp beams, live SIM needle faces and LCD use actual telemetry. Purchased static dial artwork remains underneath additive overlays.

Sound is original inline-three synthesis (firing fundamental RPM/40) driven by actual RPM/load and shift torque interruption. It is not an authentic Rotax recording. Music/interface/world mix and mute use existing shared controls.

Evidence: `tests/spyder-physics.test.ts`, `spyder-suspension.test.ts`, `spyder-rig.test.ts`, `spyder-state.test.ts`, and `assets/spyder/evidence/`. Controlled-clock runs prove gameplay, not frame timing. Native RAF performance measurements and the existing performance HOLD remain separate.
