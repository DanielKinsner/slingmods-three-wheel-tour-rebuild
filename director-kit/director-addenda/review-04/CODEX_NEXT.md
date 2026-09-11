# Codex next — P03B2: First Drive

## 0. Authority, continuity and scope

Astra accepts the **named P03A2 local repair for provisional development** and the **P03B1 low-speed input/practice foundation**, subject to the discrete look-back usability change below. The whole-vehicle visual HOLD and G3 pending remain. Do not perform another hood, tire, cockpit-remodeling or showroom-beautification pass.

Continue the existing repository:

```text
C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild
```

Inspect the current working tree and reconcile it with runtime `982d12d3d0a83b8dd78ed5ce9c2fda4f0475c264` and packaging checkpoint `30520ca2bef6f059d82ccad79ec73ce3abd6a075`. Preserve newer/untracked owner work. No resets, force checkouts, cleaning, scaffolding, new repositories or modifications to `slingmods game`, old games, storefronts or deployments. This packet changes development sequencing, not release authority.

Append this decision and P03B2 to the existing ledger. Do not rewrite the historical HOLDs/PASSes or pass G3 to satisfy a prerequisite script. The explicit authorization here permits driver/audio/cockpit work while final whole-car fidelity remains held.

Keep the existing installed toolchain and versions. Make routine creative/engineering decisions without asking Dan to choose. Use background Blender, isolated browser contexts and application-level test input only; do not move his mouse, focus his desktop windows or ask him to run a playtest. At most one integrator, one asset artist and one genuinely separate read-only reviewer. Disclose if separate review is unavailable.

## 1. The playable deliverable

From the existing bay, Drive opens the **same current Slingshot with a seated driver**, working keyboard/standard-controller input, near/far/cockpit cameras, a fast held rearward glance and coherent sound. The engine rises/falls with real RPM, changes load on lift-off, responds to actual gear changes and yields to wind/tire sound appropriately. There must be usable mute/volume/pause behavior.

On the retained pad, demonstrate ordinary-path acceleration, one genuine forward upshift, steering, cockpit selection, rearward glance/release and braking. Keep free practice and its reset. Do not add a race timer or claim a race exists yet.

This single experience is the scope. No new track, city, campaign, AI, products, economy, live commerce, nighttime environment, additional vehicle, character customizer, cutscene or replay system. No cinematic trailer replacing a playable run. No full-game refactor.

## 2. Protect and compose

Keep the current vehicle GLB/source, its material maps, bay and pad source/exports byte-identical. The driver is a separate Blender-authored asset with a runtime attachment configuration. Do not remodel the vehicle to make a poorly fitted person fit. Do not change contact layout, mass, torque/gearing, tire model, suspension, braking coefficients or repaired shadow policy for the demo.

Preserve the existing InputResolver/KeyboardBuffer safety and the five RPM regressions. Any genuinely necessary localized integration change must have a reason and focused test; do not retune vehicle dynamics to make an audio clip or camera trace easier. Do not remove or weaken historical assertions simply to obtain green tests.

Use small modules for driver presentation and audio; the integrator owns runtime hookup and camera-mode state. Avoid further concentrating all new logic in `workbench.ts`. This is permission for bounded extraction, not replacing the app framework.

## 3. Separate driver asset

Follow `FIRST_DRIVE_SPEC.md`. Choose one adult-sized, helmeted test driver in fitted charcoal protective clothing, restrained SlingMods-red detail, gloves and shoes. No likeness, licensed character or face work. Match seat, steering wheel and pedal anchors in meters; fit from the actual scene transforms.

Deliver connected, believable clothed surfaces and proper PBR treatment, not cylinders with a helmet attached. Author/edit/rig in Blender and preserve the `.blend` and authoring script. Target no more than 35k rendered triangles for this person and a compact texture set; these are production limits, not realism claims.

Hands and feet must connect convincingly to controls. Drive the hands from the actual displayed steering wheel, with bounded arm solving and a regrip treatment where steering travel demands it. No independently oscillating arms or constant floating hands. This AutoDrive vehicle does not need a fake clutch/gear-stick animation. Keep motion subtle and seated; do not invent bike-style leaning.

Fit-review checkpoint: straight, both steering extremes, side fit and cockpit. Inspect those internally before polishing fabric. At most two fit/presentation correction passes in this packet; retain achieved work and disclose any remaining blocker rather than remaking the body endlessly.

## 4. Driving cameras and quick look-back

Extend C/top-face cycling to **near → far → cockpit → near**. Preserve the existing near/far settings when migrating saved camera preference. Held B/LB temporarily selects rearward view; release restores the selected driving mode. Camera cycling while look-back is held must deterministically update the mode restored on release without disrupting the rearward view.

Use a driver-eye cockpit position with road visibility, restrained chassis-motion damping and an uncluttered horizon. Hide only the local driver's head/helmet when necessary to avoid interior clipping; keep hands/body visible. No floating camera above the roll hoops labelled 'cockpit', fake wide-angle distortion or excessive head-bob.

**Look-back is a deliberate view switch, not an orbit around the car.** Choose a direct cut or a <=120 ms transition that reveals the rearward road promptly. For a 200 ms held press, the rearward view must actually appear before release. This deliberately overrides the old no-snap constraint for this particular intentional view switch; it does not allow snapping during ordinary follow or near/far damping.

Use a separate look-back placement/target if needed to avoid filling the bottom of the frame with the nose. Return promptly to the prior mode. Do not interpolate a camera through the chassis. Check close obstacles with the existing obstruction policy and check 16:9 and 21:9 framing. This is not physical-phone certification.

## 5. One authoritative audio system

Follow `FIRST_DRIVE_SPEC.md` and primary technical references in `SOURCES.md`. Implement a shared, small Web Audio graph driven by the actual telemetry and lifecycle state. RPM, selected gear, shift event, engine load, speed, wheel contact/surface and slip must not be invented by a second audio drivetrain.

Create/use a compact original or properly authorized asset bank, with a genuinely useful engine bed and restrained mechanical, tire and wind layers. Do not stretch one buzz across the entire RPM range and call it an authentic engine recording. Generated/synthesized sound is a provisional approximation, not a sourced OEM recording or a claimed product exhaust sound.

First check the existing authorized development-time audio tooling/configuration **without printing values or scanning unrelated private folders**. A configured key alone is not new spending authorization. Only use previously authorized generation within a verifiable existing budget/quota; no purchases, subscriptions, increased limits or paid models on implied consent. Maximum two small asset candidates for this packet, not an unbounded batch. If usable rights/budget/configuration cannot be established, implement an original locally generated bank and clearly hold aural fidelity, while finishing the runtime system. Do not stop all driver/camera work or make Dan locate a key.

All resulting playable clips must be local build assets with a provenance manifest. No credentials, live generation requests or private keys in the client. No ripping another game's or manufacturer's recordings. No music, voice clones, narration or background song masking the result.

Use a shared graph/control mapper for runtime and any offline review render. Keep RPM/gear HUD and sound aligned. Handle real audio-unlock gestures after entering Drive, pause/blur, mute, volume persistence, reset and context failure. Polling a controller is not assumed to satisfy browser audio activation. Provide an unobtrusive Enable sound control when needed without blocking silent play.

## 6. Faster ordinary-path evidence

The accepted Review04 movie peaked at 13.407 mph with first/reverse only. Keep that low-speed regression trace, but it cannot be the sole new proof.

Plan a safe straight maneuver on the existing 110 m × 220 m asphalt region that avoids the wet/gravel patches and obstacles. Aim for **40–60 mph and at least one actual forward upshift**, then lift and brake with runoff available. These are test-design targets, not manufacturer performance claims. Select the start and braking point through the real simulation. Do not alter pad physics or fabricate a gear transition to satisfy the target.

If the current dynamics/usable distance do not permit the target safely, report actual speed, distance, shift state and the limiting cause; that specific high-speed check remains held. Do not fall back to another 13 mph film labelled racing-speed validated. The other implemented pieces can still be returned honestly.

Use the ordinary reader → input → fixed-step simulation → interpolated pose → driver/camera/audio route. No direct transform steering, snapped-camera shortcut, canned engine soundtrack or externally animated car. All changes to throttle must go through the same path as player input. The evidence can use a disclosed virtual device and controlled clock; it is not a physical controller playtest.

## 7. Completion, tests and handoff

Run focused existing input/RPM checks, then the full suite and production build after integration. Add only focused tests for camera cycling/restoration/short glance, driver anchor behavior, audio parameter mapping/lifecycle/shift deduplication and any save defaults. Do not build another QA framework.

Test audio unlock in an isolated browser with ordinary policy, not only with an autoplay-disabling flag. A successful offline audio render does not prove browser activation or physical output. Inspect/listen where the tooling genuinely permits it; report absent auditory capability rather than claiming a waveform was auditioned.

Include the artifacts and evidence specified in `EVIDENCE_REQUEST.md`. One final ordinary-path film with aligned game audio is more useful than another 180-file gallery. Record exact evidence method, source snapshot and what remains unverified. Retain failed local attempts without packaging all of them.

Return `Astra-Review-05.zip` in the same rebuild root, exact path and size, then stop. Never overwrite an existing review archive; number it if needed. Do not commit secrets or promote deployment. Routine safe local commits are acceptable if consistent with the existing workflow and do not include owner/unrelated changes.

**Definition of success: the existing vehicle becomes occupied, audible and usable from the cockpit, with a genuinely quick rearward glance and evidence beyond parking-lot speed. Not a new car model, and not a claim that the whole racing game is finished.**
