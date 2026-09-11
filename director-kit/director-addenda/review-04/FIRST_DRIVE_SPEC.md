# P03B2 — presentation specification

These are chosen game-development parameters and quality targets, not measurements of an OEM vehicle or driver.

## A. Driver: fit first, materials second

**Appearance:** one helmeted adult test driver, fitted charcoal textile jacket/trousers, restrained deep-red piping, dark gloves, believable footwear and a nontransparent visor. No face sculpt, character selector or branding-heavy suit. The clothes need real volume, seams where visible and differentiated roughness, not a smooth plastic mannequin.

**Asset separation:** new GLB and editable Blender source outside the frozen vehicle file. Parent to the same interpolated chassis presentation transform. Store seat/eye/wheel/pedal anchors in a small documented attachment configuration derived from the current scene. Preserve the physical contact layout and every existing car panel/material.

**Budget:** target <=35k triangles, a maximum of four driver material groups, one 2K base/normal/packed-control set where practical. These are a starting ceiling; measure actual GLB/primitives/textures and describe any justified deviation. No new 4K atlases simply to hide crude surfaces.

**Pose:** hips supported by seat, back following the backrest, head within realistic seating/roll-hoop height, knees and elbows clear of visible panels. No remote-control empty seat in normal chase view. The driver can remain absent from the unoccupied inspection bay.

**Arms:** solve toward actual wheel grip points and use the existing displayed steering transform. Two hands glued permanently to rotating points can become anatomically impossible at large steering travel; provide an appropriate regrip/pose transition rather than stretching wrists through the wheel. Test straight, both low-speed lock extremes and the moderate steering used in the faster trace. At rest/in stable grip, use a nominal <=2 cm contact-gap target. During a regrip the temporarily released hand must move visibly and deliberately, not teleport. Do not reduce physical steering to make the animation pass.

**Feet/body:** feet located at the real pedal/footwell region; modest pedal response is enough. No fake manual-clutch animation for AutoDrive. Seat-relative head/torso movement should be small and driven by measured presentation acceleration with clamps; no exaggerated leaning or camera shake. Explicit scene/reset discontinuities must reset motion filters rather than fling the rider.

**Cockpit:** render from the configured eye point with enough forward road and steering/dash context. Hide the head/helmet in the cockpit view only, and preserve exterior visibility on exit. Avoid duplicating driver arms between a cockpit rig and third-person rig. Maintain the existing actual speed/RPM display; no new dashboard redesign is required.

## B. Audio: source quality and control quality are different

### Small asset bank

Prefer several coherent engine RPM/load beds with modest pitch ranges and crossfades, plus restrained tire/road/wind content. It is better to ship one explicitly provisional but controllable original bank than to label unrelated stock noises as an authentic Slingshot. Record source method, creation parameters, license/permission basis, sample rate, channels, loop region, reference RPM if known/estimated, and SHA256. Unknown reference RPM is not a verified measurement.

Use existing authorized tooling only within established spending authority; see CODEX_NEXT. A new source requiring payment is a deferred option, not a purchase task. Local synthesis must be original and clearly labelled. Do not reuse arbitrary research video audio as a redistributable asset.

Create at most two compact candidates, level-match their review outputs, choose deliberately and preserve source provenance. Waveform/spectral checks can find clipping, silence, tonal problems or loop discontinuities; they cannot by themselves certify convincing engine timbre. Explicitly label aural review availability.

### Shared mapper and graph

Build a pure mapper from authoritative presentation telemetry to desired audio parameters, then apply those parameters to one reusable Web Audio graph. Runtime and offline evidence use the same mapping and source buffers.

| Layer | Actual source signal | Required behavior |
|---|---|---|
| Engine tonal/exhaust bed | RPM plus applied throttle/load proxy | Smooth pitch; loaded and lifted states audibly differ; idle does not become road-speed driven. |
| Shift/transmission detail | Actual gear/shift-state transition | At most one transient per actual event; do not invent extra shifts or use a second gearbox. |
| Tire/road | Contact, surface, longitudinal speed and slip | No screech simply because steering is nonzero; contact loss silences contact-dependent layers. |
| Wind | Vehicle speed relative to the intended reference | Quiet at rest; restrained speed response; do not overpower all mechanical detail. |
| User/lifecycle | Mute, volume, pause/focus, reset and audio context | Predictable fades/recovery; no stuck full-throttle sound after pause. |

Use continuous gain/pitch ramps and a bounded number of persistent nodes. Do not create/discard looping sources every animation frame, step gains abruptly, or use visual frame counts as the audio clock. Keep source phase/loop boundaries clean. Explicitly handle nonfinite telemetry and loading failure without breaking driving.

If using positional audio, keep the player's own engine stable and do not create exaggerated self-Doppler because the chase camera moves. A restrained cockpit/exterior mix change is enough; elaborate acoustic ray tracing is out of scope.

### Lifecycle and mix

A Drive navigation currently loads a new page; do not assume the previous page's click automatically unlocks the new page's audio context. Create/resume in an allowed gesture in the driving document; show Enable sound only when necessary. Keep silent driving functional. A controller exposure gesture is not automatically an audio-unlock guarantee.

Store mute and volume without corrupting the current camera preference. Handle pause/hidden tab/disconnect by fading appropriately and preserving safe input rearm. On explicit reset, clear queued one-shot events and snap audio mapping to the new state without a loud discontinuity. On destruction, close/disconnect owned resources. A failed asset may yield a disclosed audio fallback, not an uncaught fatal error.

Target comfortable initial volume and retained dynamic contrast. For the review mix, report sample peak and, if measured, oversampled true peak separately. Aim for <=-1 dBTP with no clipping. Do not call a sample-peak check a true-peak measurement or overcompress until engine/wind all sound equally loud. No background music in evidence.

## C. Camera change

Keep normal chase damping. Use a distinct quick rearward-view mode with immediate cut or <=120 ms transition. The design target is a useful 200 ms glance, not a slow cinematic orbit. Releasing B/LB restores the selected near/far/cockpit view promptly. Camera cycling during look-back changes the mode to restore, not the temporary rearward view.

Test a 100/200/500 ms hold at 30/60/120/144 presentation schedules and both start modes plus cockpit. Normal following must not teleport; intentional look-back switching is allowed to cut. Check that the rearward road stays readable and the nose does not occupy most of the viewport. Do not interpolate through vehicle geometry.

At speed, inspect steering reversal, throttle lift and braking from near and cockpit. The vehicle's actual roll/pitch should remain physically present while camera horizon/head motion remain restrained. A reset is a declared discontinuity: reset camera/driver histories rather than slowly chase the old location.

## D. Acceptance boundary

A convincing body silhouette, branded photorealistic showroom, full racing LOD, final exhaust authenticity, physical controller certification and hardware FPS are separate unresolved work. Do not claim them from these assets/tests. Do not reopen the body to solve them here.

This packet passes only when the new occupied/audible cockpit experience is implemented and its stated checks are supported. A single audio or fit limitation does not erase accepted input/physics work. Return the exact component HOLD, not another project restart.
