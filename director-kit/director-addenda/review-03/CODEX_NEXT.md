# Next assignment — P03A2 + P03B1

## Director authorization and priority

Continue Astra's existing SlingMods rebuild. **Do not start again.** Review03 correctly returned a visual HOLD after bounded attempts; preserve that honesty and the useful work.

This directive deliberately changes one dependency in Review02: **P03B1 input/camera/practice work may proceed independently while P03A2 front fidelity remains held.** It does not pass P03A1, pass G3, authorize all of P03B, or waive final vehicle quality. This exception supersedes the earlier sentence forbidding any P03B work until every P03A1 visual item passed. All other preservation and release boundaries remain.

The output must contain implementation and reviewable evidence, not another proposal. Make routine decisions yourself; Dan should only receive the completed ZIP path. Use isolated processes/browser contexts; never take over his mouse or desktop.

## 0. Start safely in the existing repository

Use this root for every command:

```text
C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild
```

Inspect status and reconcile with submitted runtime `404dff91255eb0dadcaadeb81075f86508f36607` and review-ledger checkpoint `0db7ede7ea5e4f8a1d2edbf947e583ab40e15193`. Do not force-checkout, reset, clean, scaffold, create another repository, move the project, or overwrite newer/untracked owner work. Do not touch the separate `slingmods game` folder, old games, domains, deployments, or storefront.

Append this director decision to the current ledger. Set P03A1 to retained candidate/visual HOLD, add the two authorized work streams, and leave G3 pending. Do not rewrite historical reviews or falsify a gate to satisfy a script. Keep the existing toolchain and installed package versions; this task is not a dependency upgrade.

## 1. Ownership and scope

At most two implementation owners: one artist owns the new local Blender part/candidate; one integrator owns controls/camera/practice presentation. They may work in parallel only on separate files. The integrator alone changes runtime asset selection. Use a separate read-only reviewer if genuinely available; otherwise disclose that independent review was not performed. No agent swarm or new reporting framework.

The controls stream is the main playable deliverable. Its progress does not depend on the artist succeeding. The current P03A1 model is sufficient as an explicitly provisional development asset, not a final hero asset.

Protect the signed RPM fix/tests, three-contact layout, tire/drivetrain model, suspension coefficients, collision geometry and repaired shadow policy. Do not change physics to make a presentation video easier to record. The rig, wheel transforms and actual steering sign remain authoritative.

## 2. P03A2 — isolated front-shell proof, not another whole-car polish

Follow `FRONT_SHELL_SPEC.md`. The specific target is the outer brow's broad terminal bands/segmented leading return and immediate interfaces. Keep all other vehicle parts/maps and the bay frozen. Tire-groove exactness and further cosmetic refinements remain documented final-fidelity work, not a hidden new task in this packet.

Author an independent editable master with boundary-controlled leading/outer/inner curves and a connected quad surface. Explicitly build the return instead of closing the visible end in one planar n-gon. This must change the local surface construction, not just sample counts, normals, paint roughness, or global subdivision. Use the existing multiview reference set in `director-kit/references/slingshot-2024/`; recover only missing sources from the recorded URLs. Research photographs are not runtime textures.

Keep the master separate until neutral runtime front/three-quarter/side and a broad highlight sweep support improvement. Permit at most two evaluated candidates. A successful local proof may be mirrored/integrated and exported to versioned P03A2 paths. Preserve the existing full vehicle and shared mechanical contacts. If held, retain the best isolated attempt and do not change normal asset selection from P03A1.

Do not exceed the existing showroom ceiling or inflate texture costs. There is no triangle-count reward. No new wheel, cockpit, rear, driver, logo, shader framework, major bay work, LOD system or photo-realism claim.

## 3. P03B1 — controls through the real game path

### Shared input layer

Separate device interpretation from `Simulation.step` with a small, testable module. Keep the simulation's fixed 60 Hz tick and +steer=LEFT / forward=-Z contract. Device values are converted to a sanitized normalized VehicleControl; don't duplicate the tire/drivetrain model in the input layer.

Default controls are decided:

| Action | Keyboard | Standard-mapped gamepad |
|---|---|---|
| Steer | A/D or left/right arrows | Left stick X |
| Throttle | W / up | Right trigger |
| Brake | S / down | Left trigger |
| Cycle near/far chase | C, rising edge | Top face button, rising edge |
| Hold look-back | B | Left shoulder button |
| Request forward/reverse | X, rising edge | Right face button, rising edge |
| Reset to practice start | Hold R for one continuous second | Hold bottom face button for one continuous second |
| Pause/resume | Escape | Right center/menu button |

For the browser's `standard` mapping use axes[0], trigger buttons 7/6, camera button 3, look-back 4, direction request 1, reset 0 and pause 9. Negate stick X to preserve the simulation's +LEFT sign. Use analog trigger values, not only their pressed flags. Check local browser/API behavior against the primary Gamepad reference in `SOURCES.md`.

Start with a rescaled 0.08 steering deadzone and a modest 1.25 response exponent, exposed as named tuning values. These are chosen initial game parameters, not measured hardware constants. Keep triggers continuous. The existing simulation already limits steering speed and lock with vehicle speed; do not stack a second heavy smoothing filter over it by default. Keyboard and controller feed the same steering mechanics. Change device-level tuning only with stated evidence; do not silently retune physics.

Use explicit active-device arbitration. A nonzero meaningful input can change the active device; noisy stick drift must not steal focus. Do not sum two devices' steering or retain throttle from a disconnected device. Handle null slots, connection changes and invalid/non-finite values. An unrecognized mapping gets a clear keyboard fallback rather than invented button assignments or a question to Dan.

Clear controls on blur/hidden tab, device disconnect, reset and pause. Require deliberate resume and neutral-input rearming where necessary to avoid launching at held throttle. Preserve the existing forward/reverse interlock; buttons request a direction, they do not bypass it. Use edge-triggered toggles and one monotonic hold timer so held buttons do not cycle cameras, pause repeatedly or repeatedly reset. Keep menu actions pollable while paused so resume works. The inspection bay must not consume a controller press as driving throttle or interfere with its interface.

Do not call synthetic gamepad data a physical-device test. Use an injectable device reader for automated tests, but keep the production path reading real devices.

### Chase-camera behavior

Extract/tighten the existing camera controller only as much as needed to test it. Keep near and far chase, add held look-back, and preserve the ordinary Inspect/Drive return. No cockpit camera or driver construction yet.

Use frame-rate-independent damping, a stable readable horizon, bounded look-ahead and restrained existing speed FOV. Filter presentation, not the chassis motion. Observe position AND look-target behavior through left/right transitions, braking and reverse. Keep obstruction avoidance and prevent one-frame camera teleports during ordinary switching; deliberate reset/scene changes can explicitly reset camera history. Look-back must release back to the previous chase view.

The existing Review03 film used `__TWT.advance`, which ends in `draw(..., true)` and snaps the chase camera. **Do not use that path as the primary new camera proof.** The new evidence must exercise the same input-resolution, fixed-step and unsnapped camera-update path as ordinary play. Any diagnostic hook must be explicitly test-only and must not bypass the thing being validated.

### A short, useful handling route

Use a clear unused area of the existing flat pad. Add only a modest Blender-authored cone/marker kit (roughly 12–20 repeated markers) and one short, readable practice path: launch straight, moderate slalom, broad sweeper, brake/stop box. Choose dimensions and a safe start pose yourself based on the current braking/steering envelopes. Avoid the existing obstacle/ramp and wet test lanes so historic tests remain intact.

Do not alter the shared pad physics/layout or add a new road/city. Markers may be non-colliding visual references for this engineering route; disclose that. Do not constrain the vehicle to a spline or automatically steer it. The route is a practice guide, not a race system: no lap validation, economy, story, AI, rewards or leaderboard.

Keep the entry obvious: Inspect / Drive, with a short controls hint and a reset-to-practice-start action. Hide technical telemetry behind the existing diagnostics control; keep speed/gear readable. A controller not yet exposed by the browser may require a button gesture: show a simple 'Press a controller button to connect' status, not a modal workflow.

## 4. Focused proof and regression checks

Run the existing suite and build once after integration, and the five focused RPM checks. Investigate real failures without relaxing old assertions just to get green output. Do not spend the packet recreating every historical capture.

Add bounded input tests covering signed fractional steering, analog throttle/brake, deadzone/noise arbitration, toggle/hold semantics, disconnect/blur/pause/neutral resume, and direction-request interlock behavior through the ordinary integration. Check both steering signs in actual presented wheels; neither a positive number nor a screenshot alone proves the entire contract.

Add a camera comparison driven by the same maneuver trace at 30/60/120/144 presentation schedules with fixed physics. Record reasonable documented tolerances, finite transforms, return from look-back and no ordinary camera jump. This is numerical presentation consistency, not physical FPS or a human 'fun' verdict. Preserve the inspection-frame regression.

Obtain a 25–35 second isolated runtime recording showing the handling route, fractional steering, braking, near/far switching, held look-back/release, and a pause/resume or reset. The main sequence must use the ordinary device-reader/normal-frame path. A controlled virtual input provider is acceptable if it runs through that path and is labeled. Add one short actual browser-keyboard interaction check for focus/reset behavior. Never automate Dan's desktop.

For slow software rendering, advance a controlled clock through the normal pipeline between captures rather than calling the snapped-camera helper. State simulation duration, encoded duration, capture rate, wall time, backend, and whether device input was virtual. Keep the film SILENT; audio is deliberately outside this packet. Do not insert music/engine sound to disguise unfinished feedback.

Preserve the art lane's local diagnostic images even when held. Main driving evidence can use P03A1 if the new shell fails. A visual HOLD and a successful input subsystem can coexist honestly; neither implies G3 passed.

## 5. Hard boundaries

No new repository or scaffolding. No removal of saved/historical work. No physics-engine migration, drivetrain rewrite, extra wheels, forced-path driving, browser-library upgrades, full P03B, rider, audio, other vehicles, giant workshop, city, weather, races, products, accounts, paid assets, deployment or storefront change.

The final visual target is not being lowered. The body and tire limitations remain on the final-asset ledger. The only sequencing change is that independent input/camera development no longer waits for the local art blocker.

Do not build a new gate system, hundreds of audit files, repeated raw-frame archives, or a long new design document. Spend the work on the local surface and the ordinary driving experience.

## 6. Return one ZIP, then stop

Create `Astra-Review-04.zip` in the existing project root; number it rather than overwriting an existing handoff. Include:

- `REVIEW-ME-FIRST.md`: runtime/packaging checkpoint, normal launch commands, current default asset, clear verdict per lane, known limits, tests and actual environment, G3 pending.
- Reviewable runtime source, scripts, tests, package/lock/config files, necessary GLBs/maps, editable new Blender sources and the source dependencies needed to rebuild them. Include the current production ledger and this addendum; do not copy the entire history.
- At most six decisive current PNGs across the isolated front proof, complete candidate, practice route and normal UI. If art is held, explicitly label its diagnostic variant instead of mixing it into 'accepted' captures.
- The normal-pipeline driving recording, and a short local reflection sweep only if needed for the shell decision. One concise results file can cover unit/build/browser/camera checks and the honest capture method.
- A compact input/file-hash manifest. Preserve evidence provenance, but omit redundant intermediate captures and raw full-frame sequences.

Exclude .git, node_modules, downloaded Blender/tools, caches, dist, .blend backups, .env files, credentials and unrelated owner material. Check for secrets. A normal local review checkpoint commit is allowed after reconciling other work; don't include unrelated changes. No deployment.

Finish with the exact ZIP path/size, a short statement of what is playable and the two lane verdicts. Stop for Astra. Do not ask Dan to decide what looks right or test the work for you, and do not advance G3 or begin the next packet.
