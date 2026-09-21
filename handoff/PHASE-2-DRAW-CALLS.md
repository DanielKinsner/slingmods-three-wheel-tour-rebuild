# Phase 2 — draw-call cleanup (before slice 2D)

Owner chose this ahead of 2D because harbor at dusk sat on the 10 ms High budget and every remaining slice adds cost there.

## Measured first
New evidence-only hook `__EXPRESS.drawCensus()` (`src/presentation/draw-census.ts`, lazy chunk, never loaded for players) and `scripts/perf/draw-census.mjs`: draw calls per render pass, and per scene branch/module. Harbor, dusk, High, one car, 1920x1080:

| Where | Before | After |
|---|---|---|
| Mirror pass (one face per frame in chase) | 538 | 104 |
| Main pass incl. sun shadow map | 941 | 733 |
| of which harbor scenery in view | 419 | ~280 |
| of which car shadow casters | 233 | 163 |
| **Frame total** | **~1,480** | **~840** |

Frame time, same machine, uncapped 2560x1440, 3 runs each: **13.2–14.0 ms (p99 ~37) -> 7.0–11.2 ms (p99 16–25)**. The GPU on this PC is shared, so trust the draw-call counts more than the milliseconds.

## The three cuts (none changes a pixel the player can tell)
1. **Harbor scenery cells** (`showcase.ts`, `batchPlacements`). Placements were instanced per 45 m cell, but 723 placements fell into ~400 cells: almost every "batch" held one object. Cells are now 180 m (90 m for palms, whose LOD is picked per cell). 245k triangles total, so the extra triangles are free next to the calls saved.
2. **Mirror pass frustum** (`vehicle-mirrors.ts`, `fit`). The reflection pass rendered the whole rear view at the main camera's width to fill glass covering ~2% of the screen. The reflected camera's projection is now cropped to the face's screen rectangle (+8%); the lookup matrix uses the same cropped projection. Most of the world is culled from the pass, and the 768x512 texture is spent entirely on the glass, so mirrors are visibly sharper. A/B captures: `scripts/perf/mirror-crop-ab.mjs`.
3. **Small shadow casters** (`shadows.ts`, `trimSmallCasters`, called from `express.ts` for the player and rivals). The sun shadow map is ~6 cm per texel; parts under 15 cm (73 of 236 per car) cannot change the shadow. Drive scenes only: the showroom keeps every caster. A/B top-down and side shots differ in 56 of 1.44 M pixels.

Pinned by `tests/draw-calls.test.ts` (3) and a new case in `tests/vehicle-mirrors.test.ts`. 336/336 tests, production build, and a four-car race smoke drive on Express, Harbor and Ridge (cockpit view, 0 console errors).

## The finding that matters next: the cars
The test-drive benchmark has ONE car. A real race has four, and each is 239 meshes / 158 materials, drawn again for shadows:

- Harbor race, main pass: **1,708 calls, ~1,360 of them cars** (713 in view + ~650 shadow casters). Scenery is ~350.
- `slingshot-2026.glb`: 224 primitives, 132 materials, but only **53 distinct material definitions** (24 copies of one black plastic, 10 of one chassis metal, ...). 15 rigid groups (`body_static`, steer, spin, rear arm, shocks...).

Owner chose **A: merge the rivals only** (done, below). B (fix the model at source) and the player car are untouched.

## Rivals are drawn from one merged copy of the car
`src/presentation/merge-rigid.ts` + `cloneRival` in `hero.ts`. On the first rival, the car is cloned once into a private template and `mergeRigidParts` joins every part that (a) hangs off the same rigid body and (b) renders identically. All rivals clone that template, so the merged geometry exists once per race, not once per rival.

- A rigid body is the nearest ancestor something animates: `*_steer`, `*_spin`, the rear-rig groups and points, `drive_pulley_spin`, `steering_control`, any node with `userData.frontLink`. Those nodes, `Mirrors_1` and `stock_exhaust` are never merged themselves.
- Left alone: transparent parts (three sorts glass per object), multi-material, skinned, instanced, morphed, and anything under a hidden ancestor (a stock part hidden by a product must not reappear).
- "Renders identically" = `materialSignature`: every material property except name/uuid; paint and accent ignore colour because a rival repaints them by role; lamp roles keep lamps apart from trim.
- Mirrored parts (negative scale) get their winding flipped when baked.
- Sub-15 cm parts merge separately and carry `userData.subTexelParts`, which `trimSmallCasters` honours.
- Semantic (2026) car only. `?rivalmerge=off` disables it for A/B.

Result per rival: **236 -> 121 parts, 163 -> 75 shadow casters.** Harbor four-car race, dusk, High, interleaved runs: **1,875 -> 1,377 draw calls, 12.0-13.1 ms -> 9.9-10.8 ms.** p99 stays ~34 ms in both: the measured window is the race launch, and those spikes are not call-bound.

Proof it does not show: `scripts/perf/rival-merge-ab.mjs` photographs one rival from five angles with the merge off and on. Express day: 0 differing pixels of 1.44 M on every angle. Harbor night: 3 pixels (bloom noise). A moving mid-race rival was checked by eye (wheels, swing arm, shocks, driver in place). Pinned by `tests/merge-rigid.test.ts` (5): no triangle moves or flips, rigid bodies stay separate, addressed/glass/hidden parts survive, signature rules, sub-texel shadow rule.

What is left in a race (1,377): the player car is now the largest single item (~239 parts + 163 casters). Halving it means option B, at source, with a showroom visual pass.

## Known limits
- The mirror crop leaves the target at 768x512. It is now oversampled in chase view; halving it would save fill cost if needed.
- `dusk-rain` on harbor still measures 9–16 ms on this PC: that look is GPU-bound (wet reflection pass + 1440p), not call-bound.
