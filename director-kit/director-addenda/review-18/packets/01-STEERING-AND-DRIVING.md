# 01 — Steering that invites driving

## Diagnosis to verify, not an assumption to conceal

The current actual source has a speed-dependent road-wheel request cap, plus a brake multiplier. In Sport v2 it permits approximately 2.506° center-equivalent road-wheel angle at 50 mph and 1.279° at 70 mph; full brake multiplies either by .85. Sport v1 uses .65 at full brake. This command limit is not an active rollover sensor. Tire saturation and slip are computed afterward.

Read `src/simulation/profile.ts`, `src/simulation/index.ts`, `src/driving/input.ts`, `src/presentation/hero.ts`, and the rival/recovery mappings. Account for all active profiles and entry points. Original Harbor and crew currently hard-code v1; fresh recipes use v2. The hand-wheel mesh is tied to the limited actual telemetry angle, so a visual-only rotation fix is unacceptable.

An angle this small can be appropriate at high speed under ideal kinematics. What matters is whether this tire/body model needs more command to achieve the intended curve, whether a moderate control input now has inadequate authority, and whether brake/cap interactions starve an otherwise feasible turn. Measure rather than calling every failure realistic or assuming all loss of grip is an input defect.

## Desired character

Believable, forgiving game handling. Stock is already fun; fitted suspension changes feel without being a purchase required to fix controls. Quick useful turn-in at 35–70 mph, an understandable approach to front grip limits, stable 90–110 mph straights, decisive braking, controlled recovery. No forced drift initiation, constant oversteer, steering sign reversal or abrupt response band at 50 mph.

Keep the current route geometry. Do not widen/rebuild every corner, lower displayed speed, silently apply an automatic brake, weaken braking again, or simply give the car a bigger top-speed number to hide the complaint.

## Implementation sequence inside this run

### A. Establish matched baseline evidence

Use actual v1/v2 builds and record per-input/physics-tick:

- Entry route/profile, normalized steer demand and device source.
- Command angle before/after speed and brake limiting; actual applied wheel angles; visual hand-wheel angle/ratio.
- Speed, yaw rate/path, roll/pitch, throttle/brake, gear/RPM, tire slip/load and longitudinal/lateral forces.
- Limiter saturation and any intervention/recovery state.

At 0,10,20,30,40,50,60,70,90,110 mph sample both turn directions, control magnitudes 0/.25/.5/.75/1, and braking 0/.25/.5/1. A static command table is necessary but not sufficient: also use actual integrated motion on a wide isolated pad and the current road.

`tools/steering-baseline.mjs` reads the current exported function and prints a table as JSON. It is not a replacement for the telemetry/movie comparisons. Keep baseline evidence frozen; candidate output uses a new evidence directory.

### B. Implement a better versioned request model

Choose the actual tuning locally using the evidence. Start with steering request shaping, rate/damping and limit construction; account for the extra steering a slipping tire model needs, rather than assuming a no-slip turning-angle cap equals the desired measured lateral response.

Make speed changes continuous, input magnitude meaningful and left/right symmetric. Ensure a sign reversal unwinds predictably. Moderate braking should not unexpectedly remove the steering needed for a broad curve at the same instantaneous speed; use a justified, tested strategy instead of carrying the blanket multiplier over by habit. Full braking can still reduce actual lateral capacity through combined tire forces. Do not promise braking and cornering at arbitrary acceleration simultaneously.

Retain appropriate high-speed stability, not unrestricted parking-lot lock at 110 mph. Where a limiter/assist remains, document its purpose and behavior. No direct position/yaw writes, curve-following player autopilot, invisible vehicle rotation, forced lateral velocity, or detection of a test fixture. Do not rotate the cockpit wheel farther to fake more turning. If a bounded physical-parameter adjustment beyond request shaping is truly necessary, prove the cause and isolate it in the new game profile; retain three contact channels, contact geometry, fixed timestep and combined tire-force accounting. No duplicate force controller.

Keep current stock power/gearing/shift behavior, braking improvements and wheelbase/track. Preserve current v1/v2 equations and saved behavior as historical references. New tune is an explicit game estimate, never an OEM or accessory performance claim.

### C. Prove useful road-following and stability

Add actual control-only simulation scenarios, with the same geometry, surface and initial conditions for baseline/candidate. No transforms injected after initial placement, slowed game clocks represented as performance, edited telemetry or hidden aim assistance.

Use flat wide sweeper fixtures as sensible director targets, not OEM measurements:

- 50 mph / 90 m centerline radius, both directions.
- 65 mph / 150 m centerline radius, both directions.
- Maintain speed within approximately 5% during the scored steady portion, with no brake needed just to keep the curve. Over at least six seconds, aim for RMS centerline error <=1.5 m, peak <=3 m, without rollover/collision and without spending the whole curve pinned at the steering limit.

These are deliberately moderate lateral demands. First report whether v1/v2 already achieve them. If they do, that is not an automatic fix: compare steering headroom, input-to-yaw response, varying-radius transitions and real Express/Harbor sweepers to locate the owner's actual issue. Do not invent a failing baseline or tune to the two fixtures only.

Also demonstrate 35–70 mph changing-radius sweeps, increasing and decreasing speed through 50 mph under held/moving steering, lift/coast/partial brake, both turn directions, keyboard taps/holds and graduated analog input. Include a sensible 90–110 mph lane-change/stability maneuver, not an impossible high-speed hairpin. Let physics reveal loss of grip instead of hiding it in an input wall; keep grip loss predictable and recoverable.

Retain v2 straight-line stop tests using the identical entry/near-stop definitions: approximately 60 mph <=40 m and 110 mph <=140 m, final heading change <=2° and lateral displacement <=0.5 m. Keep normal tire support and valid combined force bounds. Extend them to the new profile. Preserve the v2 approximately 4.733-second 0–60 baseline under its exact fixture; report any candidate difference, do not inflate acceleration by changing the measurement start.

Keep and extend hard/partial brake-turn, curb/landing, explicit recovery, reverse/forward release-repress, focus/blur/pause and controller-disconnect tests. A controllable severe-curb failure may retain the disclosed limitation; do not remove colliders to guarantee no rollover. Existing-body geometry is not in scope.

If a target cannot be met without destabilizing other required maneuvers, retain the best safe candidate and document the specific measured conflict and changed approach. Do not silently loosen distances, remove failing samples, or declare the owner's complaint resolved from a percentile table.
