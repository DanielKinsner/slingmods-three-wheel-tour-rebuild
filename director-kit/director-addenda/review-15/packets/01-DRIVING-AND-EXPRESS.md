# 01 — Driving that feels worth taking out of the garage

## Diagnose first, then change the default deliberately

Current source is a useful starting point, not a target to defend. In Review15,
keyboard X requests direction; W/up is throttle and S/down is brake. The drivetrain
only changes direction near a stop. Steering uses
`min(0.53/(1+abs(v)*0.037), atan(5.4*wheelbase/max(v*v,1)))`, followed by a rate limit;
braking and cornering share a tire-force budget. These are observed source facts,
not a complete diagnosis of Dan's current served build.

At 40 MPH and the recorded 2.667 m wheelbase, the second term allows about 2.58°
commanded steering; the simple bicycle interpretation is about a 59 m radius. That
is not a measured handling result, but it identifies a meaningful limit to test.
Do not just turn up brake force and expect tighter cornering under combined slip.

Begin with the actual ordinary input path, real supported key/controller values,
a known served build ID and a separate straight/slalom/braking fixture. Log input,
requested/actual steering, torque/RPM/gears, signed speed, stopping distance, yaw,
slip and contact state. Distinguish a capped controller, weak torque delivery,
traction intervention, brake saturation, camera impression and a short straight.
Change these in measured groups, not all arbitrarily at once.

## New default: SlingMods Sport, a game profile

Keep the old tuning as `legacy-p08a` for reference tests; define an explicit new
version such as `slingmods-sport-v1` for customer play. Keep a sane closed-course
racing feel: quicker launch and corner exit, immediate but progressive low/medium
speed steering, controllable braking and dependable fast sweeping bends. Evaluate
modest controllable oversteer only after basic grip driving works; no mandatory
drift mechanic, instantaneous yaw teleport, spline pinning, fake nitrous, or changing
the speedometer to manufacture excitement.

**Initial design targets, not manufacturer specifications or measured promises:**
use roughly 4–6 seconds to 60 MPH as a starting acceleration feel, and make a genuine
100–115 MPH opportunity plausible on the new main straight while leaving space to
brake. These are tuning targets, not acceptance by fiat. Record actual stock and
modified outcomes. Choose final values that remain coherent, stable and fun; disclose
any target missed instead of distorting telemetry. Do not make every bend flat out.

Measure at least low-speed maneuvering, a medium-speed 90° turn, a higher-speed
sweeper, braking while turning, a stopped wall recovery, grass re-entry, bumps,
full-power shifts and repeated races. Use both sides; correct reverse steering must
follow vehicle orientation. Freeze the eventual chosen tuning ID into saved results
and any ghost/replay keys. Do not compare newly faster physics against old records
as though they came from an unchanged ruleset, or erase earned career progression.

Rivals use the same active physical model. Retune path speed/braking/lookahead where
necessary; they should challenge and finish, not continue following old limits or
secretly teleport. Existing competitive receipts and ordered checkpoint rules stay.

## Reverse is obvious and deliberate

Implement a clear R/forward indication and accessible controls in both keyboard and
controller help. Preserve explicit direction selection as an option. The default
should allow an intuitive brake-to-reverse interaction without a surprise launch:
brake to a stop, require neutral/release, then a fresh reverse/brake press requests
reverse at a bounded low speed. A held brake through the stop should hold the car,
not begin accelerating backward. Debounce direction actions and keep the near-stop
interlock. A fresh forward press similarly requests forward, never flips torque at
road speed. Decide exact button behavior coherently and display it accurately.

Prove stopped, rolling, held-input, interrupted-input, pause/resume, menu return,
controller disconnect/reconnect and focus-loss cases. A button labeled Reverse
without negative displacement through the production simulation is not completion.
Dan should not need to read an internal instruction sheet to recover from a wall.

## Keep upgrades compatible with the new base profile

Existing DDMWorks click/setup controls remain. If baseline damper parameters change,
make the product's explicitly estimated mapping relative to the active profile, not
silently anchored to unrelated old constants. Preserve a legacy calculation path
for historical tests. Verify that uninstallation restores the **active profile's**
stock settings. Saving a setup is not permission to rewrite manufacturer facts.
Use real motion and numeric comparisons, not an unexplained universal handling bar.

## Harbor Express — one useful expansion now

Author a separate compact coastal course using current environment materials and
modular art. Target about 2.0–2.6 km, with one roughly 700–900 m acceleration section,
a conspicuous braking zone, two or three flowing sweepers, and a limited number of
purposeful tighter turns. Final dimensions are design choices and must be measured
from the authored route. Reserve enough distance for the demonstrated speed and
stopping behavior, not just the proposed number above.

This is a new playable layout, not the existing course played at 2× speed or a bare
infinite test strip. Compose docks/warehouse frontage, gantry, waterside views and
landmarks along the primary views with the current kit. Keep the world continuous,
colliders aligned, restart positions safe and the route readable from chase view.
Do not grow a generic open world or restart existing Harbor art.

Give Express its own route/collision/checkpoint/result identity. Preserve old Harbor
geometry and events. It must be available as an unscored **Test This Build** drive
and a **Quick Race** with the existing rival system. Unowned preview parts cannot
earn career rewards through either route. Return to exactly the originating build.

A free-drive test route proves reachability/feel, not that the entire camera or
controls are fun to a human. Use non-perfect digital-input corner entries and
perturbed analog inputs, not only the smooth evidence autopilot. Keep the latter for
repeatable performance tests, clearly labeled.

## Sound/camera accompany physics

Use a useful chase distance and controlled speed-dependent FOV/lag. Do not shrink
the car into a speck or hide motion behind constant shaking, smeared blur, bloom or
exaggerated speed lines. Keep wheels/steering/suspension and audio driven from actual
telemetry. Audio starts only after a user gesture and respects mute, volume, pause
and scene disposal. New exhaust sound is a labeled game sound treatment unless an
authorized real recording is supplied. No copyrighted music or new paid voice/audio
service is required for this pass.
