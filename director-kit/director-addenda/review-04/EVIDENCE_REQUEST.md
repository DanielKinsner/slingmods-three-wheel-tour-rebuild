# Return package — Astra-Review-05.zip

Keep one compact handoff. Do not make Dan search folders or manually test the game.

## Required contents

1. `REVIEW-ME-FIRST.md`: full root/current commit, build/run commands, visible changes, controls, source methods, independent-versus-self review, passed/held components and precise limits. Include a short feature inventory distinguishing implemented from planned. Keep G3 pending.
2. Reviewable source/config/test/lockfiles; new Blender driver source/authoring scripts; current runtime car, driver, pad and audio assets needed to build and review. Include audio provenance and attachment configuration. Do not include .git, node_modules, tools, dist, caches, .env, secrets, machine-wide logs or historical copies of every car.
3. Current ledger excerpt and one concise final review. Keep historical data untouched in the repository rather than copying all of it into this ZIP.
4. A small evidence set and its source/input hashes. A content hash verifies a snapshot, not human approval. Do not invent evidence.

## Visual evidence — no more than six selected PNGs

- Occupied vehicle from rear three-quarter on the pad (hands/body fit legible).
- Driver side fit.
- Cockpit view with road visible.
- One steering-extreme fit view; capture the other if it exposes a problem, within the six-view budget.
- Quick held rearward view with elapsed hold time recorded.
- One faster-run frame showing actual speed/gear.

These must be runtime images. Blender inspection can support topology/fitting locally but does not replace exported runtime proof. No new car-body galleries.

## Main film — one ordinary-path run with game sound

Target 30–45 seconds, 720p or better. Prefer 24 fps when isolated software capture is practical; lower encoded rate is acceptable only when clearly labelled, never claimed as hardware FPS. The sequence should demonstrate driver movement, acceleration through an actual automatic shift, throttle lift/coast, cockpit/near selection, quick look-back/release and braking. Start/reset/setup edits must be disclosed; do not present separately cut fragments as a continuous successful run.

Use the same virtual-input/normalFrame method as Review04 or real isolated browser input. Keep normal interpolation/cameras. No direct transform motion, speed/gear fabrication, snapped follow-camera shortcut, or dubbed unrelated engine clip. No continuous desktop control. Report the actual speed and gear envelope; the target faster run is 40–60 mph with one forward upshift where safely feasible on the existing pad.

Record the full logical control/presentation/event timeline, not only raster-sampled state. Include all shift, pause, audio-unlock/mute and reset events even when they occur between saved image frames. Tie each encoded frame and corresponding sound interval to that timeline.

### Audio/video synchronization under slow capture

A software-rendered 40-second logical run may take much longer than 40 seconds wall time. Do not attach wall-time audio to logical-time video and call it synchronized.

Preferred: render review audio offline using the **same graph factory, source buffers and control mapper** as the game, scheduled from the full logical timeline. Mux without time-stretching the engine or discarding pauses. This is legitimate **offline runtime-graph evidence**, not a live hardware recording; label it accordingly. Include one short real browser lifecycle check proving the in-game graph activates and responds to mute/pause under ordinary autoplay policy.

Alternatively, use genuinely synchronized isolated realtime capture when available and state the method. If integrated sound capture fails, provide the plain silent movie plus a separately aligned WAV and explicit failure reason; do not manufacture a live-audio claim. The presentation component remains reviewable, but sound/video integration is not silently passed.

## Audio-focused sample and checks

Provide one 15–20-second level-controlled WAV exercising idle, load, lift, an actual shift transition and fade/mute using the shared graph. Record whether anyone/tool with auditory capability actually auditioned it; numerical checks alone are not listening. Include peaks, duration, no-NaN/clipping/loop sanity, active context/lifecycle results and the bank's provenance.

Include the focused input/RPM log, full-suite/build result, camera quick-glance timing/restoration checks, driver fitting assertions/observations and audio mapping/lifecycle checks. No need to repeat every historical stress capture.

## Honest boundaries

Controlled-clock evidence is not physical-device performance. Synthetic controller input is not a physical gamepad. Offline rendering is not proof of browser audio activation. An empty successful console is not aesthetic approval. Leave unavailable tests explicitly unverified.

Save the finished archive in the rebuild root; give Dan the exact path and size, then stop. Use a new numbered filename if that archive already exists. No deployment or storefront change.
