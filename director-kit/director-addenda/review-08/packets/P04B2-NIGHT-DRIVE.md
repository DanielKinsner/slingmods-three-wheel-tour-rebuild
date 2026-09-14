# P04B2 — Night Drive

## Outcome and ownership of decisions

A rewarding first night drive in the current Slingshot: the already-owned kit creates a clear, localized colored ground effect, and the ordinary real-time renderer survives its first encounter with the whole course. This is one stabilization/presentation packet, not a new design phase. Codex owns routine decisions and testing.

Keep the car, rear rig, driver, current course/colliders, engine/tire/drivetrain logic, race rules, audio bank/mapper, rewards (800 first / 100 replay), kit price (600), receipt IDs and current save stores. No Spyder/Ryker, opponent, extra track, new performance product or campaign expansion. The supported SM-133 base configuration stays the same.

## A. Isolate the hitch before broad optimization

The current 12-second profiles have a single 2.70/4.67-second interval at the same sample index. Treat it as a reproducible observation in the capture setup, not proof that underglow is intrinsically expensive.

Use the current renderer first; inspect the installed Three.js 0.186.0 implementation rather than upgrading or relying on current-dev source without checking compatibility. Compare:

- Cold first run in a fresh isolated browser context, normal production render settings, native RAF timestamps, recording OFF and minimal telemetry. Use the same virtual input adapter if no physical device is available. It must still feed the real controller/simulation; no pose replay/teleport as a performance shortcut.
- One matched diagnostic run with program/light-state event counters and a short trace around the suspect first light-count transition. This trace is not the scored benchmark.
- A repeat lap in the same renderer/context, and a separate recorded short run, so first-use work, steady driving and recorder overhead are distinguishable.

Do not call the entire `__HARBOR.inspect()` every frame. Provide an explicitly lightweight telemetry getter for the test driver. Cache immutable asset statistics and graphics identity outside the hot loop. Collect raw intervals in a bounded profiler buffer, not the existing history that stops at 1,800 entries. Avoid synchronous readbacks/storage/asset census in the scored loop. Report collection overhead and source timings; do not claim GPU timing from a CPU timer.

`test=1` currently enables `preserveDrawingBuffer`. Separate permission for test input from any screenshot-only buffer preservation; the no-recording performance run must use production-equivalent buffer settings. Do not replace production behavior with a special fast test scene.

### First hypothesis to test

The practical pool changes `light.visible`, varying Three's active spotlight count. Product power/equip similarly adds/removes area lights. Check program-count/cache growth and frame cost across those events. The supplied controlled trajectory confirms 3↔4 active practical changes, but does not prove they caused the recorded stall.

Prefer a fixed resident light-slot configuration with zero intensity for unused slots, stable shadow-map count and continuous placement/intensity updates. Prepare the final material/light/environment combinations before enabling countdown and after genuinely necessary scene transitions. Evaluate the installed renderer's `compileAsync` and first-use texture/target initialization; a compile promise alone does not prove there are no later uploads or unseen variants. Demonstrate the first previously unseen corner/camera state.

If evidence falsifies compilation, retain that finding and investigate the actual measured cause (recording, synchronization, first-use resource upload or other traced work). Do not decimate assets or alter physics without evidence and further authorization.

Resident slots and emitting lights are different metrics. An unowned/unequipped/off kit must have no visible hardware in play and no emitted contribution, even if two zero-intensity slots remain reserved to stabilize programs. Update diagnostic/lifecycle assertions accordingly; do not falsely call reserved slots a visible preview leak.

Loading/preparation may be visible and measured. During it the course timer and throttle stay inactive. It ends only when the actual playable configuration is ready. Do not hide it in active gameplay or omit its duration.

## B. Calibrate the kit, not the whole world

Keep the existing Blender-authored strip asset and attachment geometry. This assignment is renderer/light calibration, not a third accessory-remodel pass.

Current default emitters total only about 2.4 nominal renderer lumens under Three's area-power relation. Use correct units/area rather than repeatedly tweaking an unexplained multiplier. Document chosen luminance, dimensions, brightness mapping and their artistic status. No new OEM photometric claim.

A bounded diagnostic starting point is to compare **300 / 900 / 1,800 nits per emitter at a fixed default UI brightness**, under otherwise identical scene conditions, then choose a sensible value in that neighborhood or a justified alternative. These are test candidates, not a requested real-product rating or mandatory final settings. A single controlled sweep counts as one evaluation, not permission for many production branches. Test red and cyan, not only white.

Desired image: a soft, elongated colored pool genuinely anchored below and just outside the chassis edges; identifiable from normal near chase, still readable but subordinate from far chase; restrained under streetlights, more visible between them. It should remain local and plausible while turning/braking. Color changes should be apparent without reading the UI label. The opaque car should continue to hide directly occluded hardware.

Freeze harbor exposure, ambient/sun/headlight/practical brightness and scene materials for the A/B. Keeping practical slots resident at zero intensity should preserve the intended visual falloff. Do not globally darken the route, add excessive bloom, raise camera exposure or add a glowing billboard to win the comparison. No new per-vehicle shadow maps. Area-light fine-occlusion limitations remain explicitly disclosed; prevent obvious leaked light through the deck or distant walls. Front-strip pavement contribution remains a disclosed simplified base-kit approximation, not scope for more add-ons.

Retain six colors, existing on/off, 15–85% UI brightness, saved ownership/equipment and stock comparison. Returning from preview must restore the durable build exactly. A warmup operation must never grant ownership or spend credits. Keep day appearance subordinate; no racing stat changes.

## C. Evidence that closes the hold

### Performance

On the already-used RTX 4080 host when available, target a 60-fps-class 1,920×1,080 standard run and retain 1,280×720 as a comparison. Report actual physical drawing-buffer size/DPR, not merely CSS dimensions. If that host is unavailable, report the actual host and keep hardware approval held; do not ask Dan to test it.

Run stock and equipped as separate configurations. Each needs a cold first playable full-course lap and immediate retry in the same context (about 170–180 seconds total for the current route); at least one equipped 1080p trial should be repeated. The purpose is first-encounter and repeatability evidence, not a huge benchmark grid. Loading/compile preparation is separately timed, with honest cold/warm browser and driver-cache limitations.

Working target on that known host after preparation: p95 frame interval ≤20 ms, p99 ≤33.4 ms, and no application-attributed interval over 100 ms while racing. Report median, p95, p99, maximum, total elapsed/ticks/dropped catch-up time, intervals >33.4/50/100 ms and their contexts. These are planned acceptance targets, not claims about the current build. Preserve every outlier; unsupported hardware/OS attribution is not an exemption. If OS/capture scheduling is suspected, repeat under a controlled setup rather than deleting samples. No forced 30-fps cap or lower graphics preset to manufacture a pass.

Show bounded resident resources and no repeated shader compilation due solely to crossing streetlight-radius boundaries or changing an already-prepared kit's power/color. Emit semantic markers for load ready, countdown, race start, lighting-slot state changes, any new program count, camera transition, finish and retry. Keep final statistics separate from raw traces and version everything.

### Visual and functional

At one under-lit stretch and one streetlit corner, capture matched stock/default-red/cyan views at identical position, near-chase camera, exposure, materials and practical state. Normal opaque runtime only. A separate diagnostic pose is acceptable when labeled, not as replacement for motion. Add one far-chase frame and one compact bay installed view; no more than eight images.

Provide a 20–30-second real-time excerpt through the actual input/camera path with the installed kit visible while accelerating, turning and passing a streetlight. No controlled-clock video offered as smoothness proof. State whether it includes live captured game audio, offline aligned audio or is silent. No auditory approval claim.

Verify old credits/ownership/color/PBs persist, stock comparison and on/off add no receipts or charges, preview cannot escape into race, and once-only rewards remain once-only. Retain source tests and full local build. Compare physics on/off using matched inputs; visual preparation must not consume race time.

## Finish

One lead and two bounded evaluated fix cycles maximum. Keep the best demonstrated state, explain any residual blocker and return Review09. The next larger racing-content decision belongs to Astra's next review; do not quietly append rivals or a second vehicle after this packet.
