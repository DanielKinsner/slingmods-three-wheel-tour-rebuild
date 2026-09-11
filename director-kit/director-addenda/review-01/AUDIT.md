# Astra production review 01

**Project:** SlingMods: Three-Wheel Tour — standalone rebuild  
**Reviewed package:** `Astra-Review.zip`  
**Reported commit:** `b073e1e2d4fab9e5eaf3ef4ed9aefacbd34c2cc5`  
**Review date:** September 10, 2026

## Director decision

**Keep the foundation. Do not restart. Do not execute the original P03 as one large assignment.**

The package contains an early clay-vehicle and driving-pad prototype, consistent with the scope claimed in its readme. It is not a finished racing game, and the package does not pretend it is. There is no reason here to discard the standalone rebuild. There is also no basis for accepting final vehicle fidelity, driving enjoyment, or racing-game quality yet.

The next effort should visibly improve the machine itself: one properly surfaced, textured Slingshot in a small inspection bay, retaining its existing driving behavior. A confirmed signed-wheel-speed defect gets a small independent correction. The full garage, extra vehicles, track production, rivals, story, shopping and other expansive work stay behind that checkpoint.

The original P03 bundled final car art, a driver rig, material work, a premium garage, two lighting scenarios, a road sample, audio, multiple cameras and performance profiling. That was too broad for the next quality decision. This addendum divides the work without reducing the eventual game scope or changing the required G3 acceptance criteria.

## What this review actually did

### Independently verified here

- Extracted the uploaded archive and checked all **98** entries of its internal manifest by byte length and SHA-256: **98 matched, zero mismatches**. This establishes internal package consistency, not independent access to the Windows repository or its history.
- Inspected all supplied vehicle stills, the pad image, and a sequence of **40 frames sampled at two frames per second** across the supplied 20.16-second movie. This is image/video evidence review, not hands-on driving.
- Parsed the actual GLB data and counted meshes/primitives, triangles, materials, images, textures and UV attributes. These are exported-asset measurements, not estimates from a screenshot.
- Read the drivetrain, simulation, runtime presentation/input/clock code, save handling, driving tests/scenarios, Blender vehicle/pad authoring scripts, relevant kit instructions, manifests and G1/G2 review notes.
- Imported the original dependency-free `AutoDrive` TypeScript module into Node 22.16.0 with native type stripping and ran a new targeted four-test regression. **Three fixture checks passed; the wheel-lock regression failed.** An isolated copy with one expression corrected passed the same four tests. The original game sources were not patched.

### Available only as supplied evidence

The prior Windows build/test logs report **16 integrated tests passed** and a successful TypeScript/Vite build. The capture logs report renderer calls and software-rendered driving traces. Those are useful, but I did not independently reproduce the full game here.

An attempted dependency installation could not reach the npm registry because this review container could not resolve its hostname. The installation was stopped. Consequently, **the complete Rapier test suite, Vite build and fresh browser execution were not rerun in this environment**. The independent drivetrain test did not need those dependencies.

Blender source files are included and their hashes match the archive manifest; I did not open them in a running Blender session here. I inspected the exported geometry and authoring scripts. Physical controller feel, hardware frame times, exact OEM dynamics, the unseen historical videos and final asset permissions remain unverified. The provided movie has a VP8 video stream and **no audio stream**; the implementation also reports no game audio.

## Current state: what exists versus what does not

The source and captures substantiate a Slingshot clay mesh, a separate reference-scale fleet export, a neutral test pad, keyboard throttle/braking/steering/reverse, near/far chase cameras, diagnostic inspection views, isolated camera-setting persistence, and a custom three-contact vehicle layer built on a dynamic Rapier rigid body.

The other two vehicle blockouts are not selectable finished machines. There is no functioning showroom garage, race course/AI/lap system, story/rewards, installed product system, night scenario, driver character, gamepad implementation, engine sound, or completed driving cockpit camera in this snapshot. These absences are consistent with the stated P00–P02 stage; they are not accusations that the agent falsely claimed completion.

Sources: `REVIEW-ME-FIRST.md`, `README.md`, `src/workbench.ts`, `src/simulation/index.ts`, `src/save.ts`, `director-kit/production/state.json`.

## Finding 1 — Useful recognition, unfinished surface quality

**Assessment:** The car reads as a Slingshot rather than a generic four-wheel sports car. The proportions, open two-seat cockpit, twin hoops, wide front assembly and central rear wheel make it recognizable. That is enough to retain a clay-recognition checkpoint. It is not enough for the user's near-real visual target.

In the supplied side and three-quarter views, the hood/fender transitions read as broad flat patches; the side shell and rear shoulders look like thick angular sheets; cockpit and seat construction remain conspicuously simplified; the windshield is opaque; tires and wheel finishes lack material detail. Some faceting/intersection-like visual issues need a neutral/glossy surface check before texture production. These are visual judgments from the actual exported model, not a claim of millimeter-accurate comparison to OEM CAD.

The GLB contains **34,688 triangles, 214 mesh primitives, nine materials, zero images and zero textures**. Only **58 of 214 primitives** carry `TEXCOORD_0`. This is consistent with intentional P01 clay; it shows that the actual texture/UV/material finishing job still lies ahead.

Geometry effort is unevenly distributed. The three spring meshes account for **5,760 triangles**. The two central hood meshes and two sculpted front fender meshes together account for **344**. This comparison is not a prescription for equal triangle counts: springs are geometrically different. It does explain why adding object count or tiny mechanical parts will not solve the visible broad-surface problem.

**Direction:** Keep dimensions and pivots. Reconstruct the weak large surfaces where needed; do not throw out the app. Run a glossy, broad-light reflection inspection before committing to detailed bakes. Finish reference-appropriate paint, plastics, glass, upholstery, rubber, lenses and metal under the same neutral lighting. Do not sell a material recolor as a finished body.

Sources: `runtime-evidence/vehicle-threequarter.png`, `vehicle-side.png`, `vehicle-rearquarter.png`; `public/assets/vehicles/slingshot.glb`; `scripts/vehicle_build.py`; derived `evidence/asset-census.json`.

## Finding 2 — Confirmed signed-wheel-speed/RPM defect

**Severity:** Targeted correctness repair before audio and final handling approval. Not a reason to replace Rapier or the entire drivetrain.

At `src/simulation/drivetrain.ts:15`, the input to wheel RPM is:

```ts
Math.abs(speed) / radius + Math.abs(rearOverspeed)
```

At `src/simulation/index.ts:135`, wheel animation phase uses signed addition:

```ts
long / wheel.radius + this.overspeed[i]
```

On a straight flat fixture at `speed = 10 m/s`, `radius = 0.3455 m`, an overspeed of `-speed/radius` cancels physical/visual wheel rotation. Positive `+speed/radius` doubles it. Taking each term's magnitude before summing makes those opposite conditions identical to the engine calculation.

Independent direct-module result after 24 ticks (0.4 seconds), starting at idle with zero throttle and full brake:

| Fixture | Resulting engine RPM |
| --- | ---: |
| Normal rolling, overspeed 0 | 3,711.37 |
| Modeled wheel locked, overspeed −28.94356 rad/s | 4,950.00 |
| Wheel spinning faster, overspeed +28.94356 rad/s | 4,950.00 |

Thus the locked wheel can drive the engine RPM higher than the rolling wheel in this controlled input test. This was reproduced directly from the provided code; it is **not** a claim that a full in-game lock event was independently reproduced here.

A local diagnostic copy that combined the signed components before taking magnitude passed the four isolated regression tests. That copy was outside the original project; it is not a game patch or proof of integrated behavior. The local engineer should repair signed rear-wheel input, retain intentional clutch/idle behavior, add the regression to the normal suite, and verify wet braking, reverse and shift behavior using the full installed simulation.

Sources: `src/simulation/drivetrain.ts:8–20`; `src/simulation/index.ts:116–135`; included `repro/drivetrain-wheel-speed.test.mjs` and both native regression logs.

## Finding 3 — Render cost and shadow artifacts need attention before expansion

The captured vehicle-inspection frames report **446–452 rendering calls**, and driving stages report **459–467** through `renderer.info.render.calls`. These are whole-scene counters, not 450 vehicle parts or a measured GPU-time result; multipass/shadow work can contribute. I parsed these numbers from the supplied capture report rather than rerunning that browser.

The exported hero alone has 214 primitives. Static detail should be consolidated by material/transform/replaceable-part boundaries during export, while preserving logical editable Blender objects and wheel/steering/mount hierarchies. Blindly multiplying the current export structure across four more-detailed cars would be a poor starting point for the intended visual budget.

The supplied movie also shows large hard-edged dark rectangles sweeping across the pad. A representative frame is retained in this review's evidence folder. The source assigns `castShadow = true` and `receiveShadow = true` to all meshes (`src/workbench.ts:20`) and moves the sun/shadow target with the vehicle (`:36`). These are **diagnostic leads**, not a proven root cause. The next worker should isolate casters/receivers and examine shadow bounds, bias and receiver geometry before changing global visual style. Retain credible vehicle contact shadows; do not fix the screenshot by removing every shadow.

Three.js documents `renderer.info` as renderer/memory statistics and describes the consequences of multiple render passes. Its physical-material and glTF-loader documentation also supports using clearcoat and selected physical material features without changing engines. Those capabilities do not prove this current asset's quality. [Technical sources 1–3 below.]

Sources: `runtime-evidence/capture-report.json` images/stages; supplied video around 9–10 s and 14–16 s; `src/workbench.ts:14–20,33–43`; GLB census; `evidence/shadow-band-at-15.5s.png`.

## Finding 4 — The driving architecture is useful; racing enjoyment is not yet established

The actual simulation uses a dynamic chassis with three custom force channels, rear-only drive and front steering. Each wheel selects one support from five sample rays; it does not sum 15 independent wheel loads. Tire requests are limited by available friction, and suspension/contact forces enter the rigid body. This is materially different from an object being pulled down a spline.

That is a useful simcade foundation, not a validated OEM model. The code uses provisional mass, inertia, suspension, tire/slip and drivetrain approximations. Tire slip ratio is partly an authored demand/overspeed proxy rather than a complete measured tire model. The report's roughly 3.48 m high-speed curb flight remains a known approximation; ordinary race curbs must not routinely reproduce that behavior. Neither this review nor the supplied low-speed sample establishes enjoyable controller driving.

The current packaged keyboard recording demonstrates an accelerate/brake/left/right/camera-change sequence on the pad. Its logged stage samples peak around **25.38 mph** and remain in first gear. That does **not** establish a maximum speed for the game: the separate supplied historical test report records faster scenarios and shifts. It only limits what this particular recording can prove. Software-rendered timing is also slower than real time; it cannot serve as a hardware performance verdict.

Two implementation risks should remain on the follow-up list, without ballooning P03A:

- The tested `FixedClock` helper is not the live application's clock. `workbench.ts:61` and the debug adapter at `:60` implement separate accumulator paths; unifying the real path and the tested adapter will make future timing tests stronger. Do not claim this static finding proves an observed timing failure.
- Save ID `slingshot-r-2024` differs from the contact-layout ID `slingshot_r_2024_autodrive`. Establish one canonical mapping before catalog/progression integration; it is not a currently demonstrated save-corruption bug. Storage access itself also lacks a failure fallback for exceptions.

Sources: `src/simulation/index.ts:24–147,150–159`; `src/simulation/drivetrain.ts`; `src/workbench.ts:24–62`; `src/save.ts:1–10`; `runtime-evidence/capture-report.json`; G2 dynamics/reviewer notes.

## Updated production order

**P03A — now:** targeted RPM correction; finished hero surfacing/materials; compact inspection bay; economical export; shadow repair; same-asset pad proof. No campaign or full garage.

**P03B — later:** driver contact, modern gamepad/keyboard behavior, remaining driving cameras and coherent engine/tire sound. Evaluate a useful range of braking/cornering behavior, not just a parking-speed demonstration.

**P03C — later:** actual premium garage interaction, the 150–250 m day/night road sample and representative performance evidence. G3 only passes when its original combined criteria are actually satisfied.

**P04 — still later:** the first complete garage → race → reward → real-part installation → retry slice. Wider fleet/campaign production stays behind that proof.

This is a scoped refinement of direction, not another total restart or an invitation to produce more planning artifacts.

## Technical sources checked for this review

1. Three.js — WebGLRenderer and `renderer.info`: https://threejs.org/docs/pages/WebGLRenderer.html
2. Three.js — MeshPhysicalMaterial: https://threejs.org/docs/pages/MeshPhysicalMaterial.html
3. Three.js — GLTFLoader and supported material/compression extensions: https://threejs.org/docs/pages/GLTFLoader.html
4. Rapier — scene queries and ray-cast filtering: https://rapier.rs/docs/user_guides/javascript/scene_queries/

These primary documents explain relevant facilities. Implementation must still verify the API in the **pinned installed versions**. They are not evidence of vehicle fidelity, a passed test, or achieved frame rate. The exact Blender 4.5 documentation page could not be fetched here; no successful current-version exporter-documentation verification is claimed.
