# Race premium pass (2026-09-28)

Owner request after the premium audit (https://claude.ai/artifact/2ayDbcCQg6wXoerfLpcnWM): run through every
finding, and keep processing speed OK. Physics, handling, saves, records, routes and colliders are unchanged.

## What changed

1. **Car shadows restored (bug since 2026-09-23).** three.js tests shadow casters against the MAIN camera's layers
   (WebGLShadowMap `renderObject`), not the shadow camera's. The performance work moved every car's sun shadow onto
   stand-in meshes on layer 6 and enabled that layer on the shadow camera, which does nothing, so no car had a real sun
   shadow (only a few wheel parts, which read as a dark ring under the car). `standInShadowSwitch`
   (`src/presentation/vehicle-proxy.ts`) brackets the scene's shadow traversal with two empty markers that switch
   layer 6 on for the main camera during the shadow pass only. The main view is projected before shadows, so the
   stand-ins still never draw there. The stand-in material is also double-sided so thin body shells cast fully.
2. **Wet roads (Harbor and Express defaults).** New continuous puddle field (`scripts/p11/build-puddle-mask.py`,
   encoded with the project's basisu 1.16.4 pipeline) in place of the near-binary mask that tiled inside itself; the
   shader grades damp asphalt into standing water, darkens wet and pooled asphalt, and lowers the sky sheen on damp
   areas (`src/presentation/race-asphalt.ts`). Wet tyre spray now streams with the car instead of leaving a grid of
   soft orbs on the road (`vehicle-effects.ts`, same fixed sprite pool).
3. **Daylight with shape (Harbor/Express/Rally Day, Golden hour, After rain).** `Look.scenery` lowers the flat sky
   fill on the world only (`sceneryAmbient`, `outdoor-environment.ts`); vehicles keep their full reflections. Day gets
   a stronger sun and a light grade; After rain a slightly stronger sun and contrast. Night is untouched.
4. **Feathered cut-outs.** Scenery alpha-test materials (palm fronds, leaves, chain link) use alpha-to-coverage from the
   MSAA the pipeline already renders (`smoothCutouts`; nothing on Low, never on vehicles).
5. **Tar snakes.** Road decals authored at roughness 0.13 mirrored the sky as pale blue squiggles on dry roads; dry
   decals now floor at satin roughness (`road-decals.ts`). Wet roads keep their gloss.
6. **Smoky Ridge night.** Near leaves and ground cover take the same day-to-night ratio as the distant impostors, so
   the blue-hour forest no longer glows daylight green (`ridge/forest.ts`).
7. **Redstone rocks.** New layered sandstone buttes (overhanging cap-rock, recessed soft beds, fluting, desert-varnish
   streaks, vertex-colour strata) from `scripts/build-rally-scenery.py`; same footprint, colliders and placements, and
   the rest of the kit keeps its exact random sequence (hut/gantry geometry verified identical). The rally loader keeps
   authored vertex colour. About 2.7k vertices per rock (was 0.8k), 66 KB per GLB.
8. **Small slips.** Pre-race Time/Graphics pickers drawn in the game's control style (still native selects for
   keyboard, controller and screen readers); Options shows the Sound row as "Waiting" until sound is enabled.
9. **Showroom follow-up.** The earlier hardware `envMapIntensity` tweak was a no-op (three.js overrides it with the
   scene's); removed, the satin roughness/colour change remains.

## Performance (unchanged thresholds, `scripts/perf/sustained.mjs high uncapped`, 2560x1440, RTX 4080, this machine)

| Route | Live main `79c4988` | This pass | Gate |
| --- | --- | --- | --- |
| Harbor dusk-rain, High | avg 6.82 ms, worst 1% 13.56, resolution 0.70-0.88 | **avg 6.10, worst 1% 9.67, resolution 1.00** | PASS |
| Harbor Express dusk-rain, High | not measured before | avg 4.44, worst 1% 13.42 | PASS |
| Smoky Ridge day, High | avg 4.08, worst 1% 22.26 | avg 4.12, worst 1% 23.23 | not qualified (GPU failing, see below) |

Restoring the car shadows costs real shadow draws, yet Harbor is faster and now holds full resolution: most of the
saving is the wet road (fewer mirror-smooth pixels) and the spray.

**Smoky Ridge and Redstone are not qualified.** During this session the GPU failed: `nvidia-smi` reported "GPU is
lost. Reboot the system to recover this GPU", and WebGL context-loss recovery dialogs interrupted the later runs. The
Ridge results above (and the same stalls measured on the 2026-09-23 gate commit `66a3ec2` and on live `79c4988`) were
recorded while the GPU was degrading: 100-180 ms frame intervals with only ~10 ms CPU and ~4 ms render submission,
the signature of a GPU/driver stall rather than game code. The Redstone runs aborted on context loss. The Harbor and
Express results completed two full races each on a working RTX 4080 before the failure.

After a reboot, re-run on a quiet machine before pushing: `sustained.mjs high uncapped ridge`, and
`scripts/rally/measure-performance.mjs` with `CADENCE=native` and `CADENCE=uncapped` (Codex's rally baseline:
uncapped avg 2.19 / 2.11 ms, worst 1% 9.32 / 7.39 ms; native 16.67 ms steady). Avoid chaining hours of uncapped
2560x1440 runs back to back.

## Validation

`npm test`: 551 passed (new `tests/race-premium.test.ts`). `tsc` passes. Real-time captures of every track and look
with zero page errors. Evidence images: `race-premium-evidence/`.
