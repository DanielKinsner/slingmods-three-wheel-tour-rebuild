# Phase 2D — harbor water

Master prompt: two scrolling normal maps at different scales, Fresnel reflectance of the sky, depth colour (shallow turquoise -> deep blue-green), shoreline foam, sun glitter, gentle vertex swell, bobbing boats, lamps reflected as long vertical streaks at night. All done, all in `src/presentation/harbor-water.ts`; nothing else in the picture changed.

## How it works
- Still the standard material, patched (`onBeforeCompile`), so the water takes every look's sun, sky probe, fog, bloom and grade for free. No render target, no extra pass, no extra light. Draw calls are unchanged (the water was and is one instanced mesh).
- **Normals:** P11 `swell-normal` (16 m tile) once and `chop-normal` (2 m tile) twice, rotated, running against each other. KTX2 rows cannot flip, so the green axis is negated. Until the maps arrive (or if they never do: they are optional downloads) the authored ripple map is used, as before.
- **Depth colour:** an art proxy of the basin (`HARBOR_BASIN`): beach on the west bank (x -95.5, 0.45 m per metre), 3 m at the quay wall (x -28), capped at 12 m. Three stops from the P11 depth LUT, shallow end dimmed because at full strength it read as a neon stripe along the bank. The body colour fades with Fresnel so at grazing angles the sky wins.
- **Foam:** within ~2 m of either shore, P11 `foam` at two scales, "lapping" (bright-and-recede about every 8 s, out of phase along the shore). Foam is matte: roughness up, specular down, normals flattened.
- **Sun glitter:** a 380-power lobe on the chop normal only, added after lighting, so it sparkles instead of smearing.
- **Night streaks:** when the look has lamps on, up to 12 point lights are reflected with a stretched normal (tilt along the light's bearing counts x3, across it x0.16), which is what makes the reflection a long vertical streak. Sources: the route's road lamps (sodium) and one warm point per lit shore building across the basin (`showcase.ts` builds them from the layout). Half the slots are reserved for lights beyond the bank so the far windows are never crowded out by the row of road lamps beside the camera.
- **Swell:** the authored water was one 4-vertex quad. `harborWaterGeometry` replaces it with a 2 m grid over the visible basin (32k triangles) plus one flat sheet beyond. Two crossing sines, 3.5 cm, fading to zero at both shores so the water never lifts through the beach or the quay coping.
- **Boats:** skiffs afloat (instance y < 0.5; cradled ones sit at 1 m) heave 3 cm, roll 0.9 deg, pitch 0.6 deg on unrelated periods, written into their instance matrices (`createBoatBob`).

## Toggles
- `GRAPHICS_PRESETS[q].waterSwell`: Low = no grid, no vertex swell, no bob (shader look is identical). Medium and up = on.
- Reduced motion (`motionReduced()`): swell and bob off. Ripple scrolling stays (slow, 2 cm/s).
- Lamps streak only when `look.lampsOn`.

## Verified
- `scripts/perf/water-look.mjs [tag] [looks]`: four fixed world viewpoints per look (`.tools/water/`). Checked day, dusk, night, after-rain by eye. Before/after in the session report.
- Low / reduced motion: 2-triangle quad, swell 0, 0 bobbing parts; High: 31.8k-triangle grid, swell .035, 20 bobbing parts (5 skiffs x 4 pieces).
- Four-car race smoke drive, Express/Harbor/Ridge, 0 errors. 346/346 tests (`tests/harbor-water.test.ts` has 7: grid bounds and spacing, basin depth proxy, lamp selection and colours, swell/bob off-switches, boat bob amplitude, shader stages and cache key, dispose restore). Production build; hosted package builds with the three water maps allowlisted and both routes load.
- Frame time: one-car harbor dusk High 8.1–9.4 ms (was 7–11 before the water). Race benchmarks on this machine were too noisy tonight to resolve the water's cost (base runs ranged 13–21 ms); draw calls are identical with and without it (~1,390). The cost is fill only: five texture samples on water pixels, plus the 12-light loop at night.

## Known limits / not done
- Depth is a proxy along x only; the docks' piles and the skiff hulls get no foam collar. A baked shore-distance map would add both and is the next step if it is wanted.
- The trackside sodium lamps placed by the P11 dressing (not in `route.lamps`) do not streak; only the route lamps and the shore windows do.
- The wet road's planar pass does not include the water (it is not on the reflection layer), so puddles do not mirror the basin; nothing to see there from the road anyway.
- Caustics map from the pack is unused (no sea floor to project it on).
