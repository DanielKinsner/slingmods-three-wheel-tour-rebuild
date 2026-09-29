# Graphics audit and plan to premium 2.3 (2026-09-29)

Audited commit: `cb087dec84f0a068f862a37ce566803eb4f7a17f`. Skill: `threejs-aaa-graphics-builder` (visual scorecard,
technical-art budgets, calibration anchors). Status: **audit only, no runtime change.** The plan below is not started;
each pass needs the owner's go. Shareable page (private until shared): https://claude.ai/artifact/7Zf4Ymk48r7UndpYESccSx

This complements Codex's broader QA audit of the same commit (`handoff/threejs-audit-20260929/`, local and untracked):
phone HUD clipping, touch handbrake, storage-denied Rally crash, canyon-dirt texture size, favicon 404. Those findings
stand and are not repeated here. This audit goes deeper on graphics and verifies causes live.

## Bottom line

Desktop race play scores **1.85 / 3** against the skill scale (premium = every category ≥ 2 **and** average ≥ 2.3).
Vehicles, HUD and the showroom are strong. The race scenes are held back mainly by **light and atmosphere**: nothing
in the scenery is grounded, one route loses its fog, night is lit like dusk, and the wet-weather effects read wrong.
The showroom already meets the bar because it fakes contact shadows; the race scenery does not.

## Verified findings

| # | Finding | Evidence | Cause |
|---|---|---|---|
| 1 | **Scenery is ungrounded.** No ambient occlusion anywhere; sun shadows exist only in a 48 m square around the car, so trees, rocks and buildings beyond ~25 m cast nothing. | [ridge-day](graphics-audit-evidence/ridge-day.jpg), [rally-quarry](graphics-audit-evidence/rally-quarry.jpg) | `src/presentation/chase-shadow.ts:4` single chase map, no cascades; no baked scene AO exists (the kit's glTF AO maps are tiling-texture detail such as `concrete_pavement_02_AO`, correctly dropped when `surface-materials.ts:27` swaps the texture set); `driving-contact.ts` contact blobs cover tyres only. |
| 2 | **Rally fog is overwritten (bug, confirmed live).** Rally's warm canyon haze is replaced by Harbor's cool fog that starts at 400 m; Rally vegetation ends at ~420 m, so the stage has almost no depth haze and the mesas read as flat grey cut-outs. | Live scene read: `Fog #b9cbd6 400–1400` instead of `FogExp2 #c3bbac .00165` ([measurements](graphics-audit-evidence/measurements.json)) | `src/rally/presentation.ts:24` sets fog at load; `src/presentation/harbor-lighting.ts:10` (called at `src/express.ts:186`) always replaces `scene.fog`. |
| 3 | **Ridge night is day-for-night.** Headlights brighten the road ahead by only ~9% (mean luminance 38.2 → 41.7 of 255); moon and sky fill already light the road. | [ridge-night](graphics-audit-evidence/ridge-night.jpg), [live](graphics-audit-evidence/live-ridge-night.jpg), [measurements](graphics-audit-evidence/measurements.json) | Moon 0.85 + hemisphere 0.95 + exposure 1.15 (`src/ridge/presentation.ts:66,77`) vs 180 cd headlight spots with decay 2. The repo's `clear-night` HDR is unused. |
| 4 | **Wet spray looks like glowing hover-thrusters.** | [crop-wet-spray](graphics-audit-evidence/crop-wet-spray.jpg), [live bend](graphics-audit-evidence/live-express-bend.jpg) | `src/presentation/vehicle-effects.ts:18-20` replaces the authored rooster-tail atlas with a round procedural mist tinted light blue (`#b5d4e5`); all particles are round point sprites, so spray cannot streak. No falling rain exists in rain looks. |
| 5 | **Lamp reflections look like small fires on the road.** Pixel A/B with the sodium lamps' emissive set to 0 removes the orange road patches (613 → 550 px; the rest are the car's tail lights). | [crop-lamp-reflections](graphics-audit-evidence/crop-lamp-reflections.jpg), [measurements](graphics-audit-evidence/measurements.json) | Crisp planar mirror reflection cut by a blotchy puddle mask (`src/presentation/race-asphalt.ts`). Real wet asphalt stretches lights into vertical streaks. |
| 6 | **World authoring weak spots.** Rally sandstone reads as stacked barrels; Ridge asphalt meets dirt with no shoulder and trees are evenly spaced; Original Harbor has a flat untextured green plane and 28-triangle box barriers. | [crop-rally-rocks](graphics-audit-evidence/crop-rally-rocks.jpg), [ridge-day](graphics-audit-evidence/ridge-day.jpg), [harbor-day](graphics-audit-evidence/harbor-day.jpg) | Three near-identical generated buttes (`scripts/build-rally-scenery.py:49`). Unused existing assets could fix much of this: `dry-grass` set, P11 rocks 2–5 (Ridge uses 0–1), `shoulder-blend-weights.ktx2` + `placement.json`. |
| 7 | **Dark player silhouette in chase view.** Black rider and the black Rally Ryker merge into one shape. | [rally-pine-bowl](graphics-audit-evidence/rally-pine-bowl.jpg) | No rim or back light separating the player from the background. |
| 8 | Minor: boost/launch exhaust flames do not move with the car; Ridge road uses legacy JPG asphalt without P11 decals or wet support; Low has no anti-aliasing. | code | `vehicle-effects.ts:120` flame velocity ignores car velocity (rivals have `exhaust:false`, `express.ts:176`, so this only affects player boosts); `ridge/presentation.ts:85`. |

Correction during the audit: the orange road blobs were first suspected to be exhaust flames. The lamp A/B proved they
are lamp reflections (finding 5). The flame velocity issue is real but minor.

## Scorecard (desktop active play, High)

| Category (racing equivalent) | Codex audit | This audit | Evidence |
|---|---:|---:|---|
| Art direction | 2 | 2 | Strong brand and HUD, distinct locations; race scenery below the showroom's finish. |
| Hero: vehicles and rider | 2 | 2 | Detailed models, clear-coat paint; rider and dark bodies go black in chase view. |
| Track edges and rivals | 2 | 2 | Real rival models, tags, distance boards; Harbor barriers are boxes. |
| Drift and position feedback | 2 | 2 | Drift zones, score pop-ups, shift light. |
| World | 2 | **1.5** | Barrel rocks, flat backdrops, even tree spacing, flat Harbor grass. |
| Materials | 2 | 2 | Paint, P11 asphalt decals and wet shader good; no baked contact shading on scenery. |
| Lighting | 2 | **1.5** | No AO, near-only shadows, Rally fog lost, day-for-night Ridge. |
| VFX | 2 | **1.5** | Good pooled system; the most visible effect (spray) reads wrong; no rain. |
| UI / HUD | 2 (phone 1) | 2 (phone 1) | Phone portrait clipping is an automatic premium fail (Codex finding 1). |
| Performance evidence | 2 (phone 1) | 2 (phone 1) | Census and sustained runs exist; 2.4–3.5 M triangles vs 750 k starting budget. |
| **Average** | **2.0** | **1.85** | Premium needs every category ≥ 2 and average ≥ 2.3. |

Renderer counts are Codex's census of the same commit (not re-measured here): draw calls 144–401, triangles
0.97–3.47 M, textures 61–144 per route on desktop High.

## Plan to 2.3

Three passes, cheapest visual lift first. Each pass: fixed before/after capture set at the same route positions
(desktop 1600×900 High; Harbor, Express dusk-rain, Ridge day and night, Rally), re-score, renderer census, and the
existing sustained performance gates re-run (Harbor dusk-rain High/Ultra, Ridge High). Physics, routes, colliders,
saves, products and handling stay untouched.

### Pass 1 — Depth and light (target: Lighting 2.5, World 2, Hero 2.5)

1. Rally fog: route-owned fog survives the shared lighting rig; tune the canyon haze so mesas soften into distance.
2. Ridge night relight: cut moon and sky fill, give headlights a shaped beam (light texture) and longer throw, make
   rival lights read, evaluate the unused `clear-night` sky. Check Harbor/Express night looks with the same rule.
3. Grounding: soft contact darkening under trees, rocks, barriers and building bases, and a load-time static sun shadow
   for scenery beyond the car's shadow range (riskiest item, measure).
   Prefer baked/static solutions over a screen-space AO pass: Harbor High's worst-1% margin is modest (~15 of 16.6 ms).
4. Player separation: subtle rim light on the player's rider and vehicle only.

### Pass 2 — Wet weather and effects (target: VFX 2.5, Materials 2.5)

1. Spray: streaks stretched along travel using the authored rooster-tail sheet, lit by the scene instead of light blue.
2. Wet road: lamp and sky reflections stretched into vertical streaks; puddle mask follows wheel tracks and low spots.
3. Falling rain in rain looks (camera-attached instanced streaks) and puddle splash rings.
4. Boost flames inherit car velocity; check Rally dust plume at speed.

### Pass 3 — World and HUD finish (target: World 2.5, UI 2.5, Art direction 2.5)

1. Ridge: gravel shoulder strip blending into forest floor (existing shoulder weights/placement data), tree clusters
   and clearings, rocks 2–5.
2. Rally: varied sandstone boulders (existing P11 rock kit tinted, scale variety) replacing the barrel shapes; hazier mesas.
3. Original Harbor: `dry-grass` set on the flat green, detailed jersey barriers (bevels, scuffs, stencils), broken-up warehouse block.
4. HUD coaching priorities: centre-screen hints never stack on the driving line.

### Projected scores (targets, re-scored after each pass)

| Category | Now | After 1 | After 2 | After 3 |
|---|---:|---:|---:|---:|
| Art direction | 2 | 2 | 2 | 2.5 |
| Hero | 2 | 2.5 | 2.5 | 2.5 |
| Track edges and rivals | 2 | 2 | 2 | 2 |
| Drift and position feedback | 2 | 2 | 2 | 2 |
| World | 1.5 | 2 | 2 | 2.5 |
| Materials | 2 | 2 | 2.5 | 2.5 |
| Lighting | 1.5 | 2.5 | 2.5 | 2.5 |
| VFX | 1.5 | 1.5 | 2.5 | 2.5 |
| UI / HUD | 2 | 2 | 2 | 2.5 |
| Performance evidence | 2 | 2 | 2 | 2 |
| **Average** | **1.85** | **2.05** | **2.2** | **2.35** |

Phone is a separate target: it reaches "every category ≥ 2" only with Codex's phone HUD fix (proposal checkpoint B)
and real-device performance evidence on reference phones.

## Pass 1 results — depth and light (2026-09-29, owner go; desktop first)

Before/after pairs are in `graphics-pass1-evidence/`: same controlled-clock frames, game canvas only, High, 1600×900,
RTX 4080. Tool: `node scripts/graphics/capture-looks.mjs <label> [slot,...]` against the dev server (output in the
ignored `.tools/graphics/<label>/`, with canvas metrics and the renderer census per frame).

What changed:

1. **Redstone keeps its canyon haze.** The race re-applies the rally's fog after the shared rig (`express.ts`); tuned
   to `#a88a70`, density .00135 so mesas stay sandstone-red in the distance instead of washing out
   ([tuning grid](graphics-pass1-evidence/rally-haze-tuning.jpg)).
2. **Ground light** (`src/presentation/ground-light.ts`), ground and road materials only, zero draw calls:
   - *Baked scenery shade*: one top-down texture baked at load (Ridge: 2,953 trees in ~206 ms; 2048² on High/Ultra,
     1024² on Low/Medium). Tree/rock sun shadows fade in beyond the chase shadow map, so shade no longer pops in
     ~25 m ahead of the car; contact darkening grounds trunks, rocks, huts everywhere.
   - *Headlight pools* for every car, only in sunless looks (Ridge blue hour, Harbor/Express Night and Night-rain).
     Tried at dusk too and rejected: a matte pool greys out wet asphalt while the sky still lights the road.
3. **Smoky Ridge late sun with shape**: sun 3.3 over sky fill 0.6 (was 3.0/1.1), world-only reflections trimmed
   (cars keep theirs), exposure 1.08. The old balance let the sky outweigh the sun, so no shade could read.
4. **Smoky Ridge blue hour** that looks like blue hour: moon 0.25 / fill 0.32 (was 0.85/0.95), world reflections
   0.4, far tree cards dimmed to match (`NIGHT_IMPOSTOR`). The sky glows, the ground drops, tail lights and pools read.
5. **Rider rim** (`raceRiderRim`, races only): a Fresnel edge tinted by the route haze keeps the black-clad rider's
   shape against dark bodywork ([crops](graphics-pass1-evidence/rider-rim-and-lights-crops.jpg)).

Renderer census: main-scene draw calls identical before/after on every route (Express 498/355, Harbor 337/474, Ridge
317/302, Rally 142–145). Added cost is one texture fetch plus a short loop in ground/road shaders, and the bake texture
(~21 MB GPU with mipmaps on High, ~5 MB on Low/Medium). Tests: `tests/graphics-pass1.test.ts` (7), full suite green.

**Performance: NOT yet qualified.** The sustained gates (`scripts/perf/sustained.mjs high uncapped`, packaged build,
2560×1440) ran while the owner's PC was busy (Premiere Pro, Photoshop, Creative Cloud open; 12.6 of 16 GB GPU memory
in use), and every route was far slower than its recent quiet-machine record, including Harbor, which pass 1 barely
touches (no ground-light patch; rider rim only):

| Route (High) | This busy run | Recent quiet record | Gate (worst 1%) |
|---|---|---|---|
| Harbor dusk-rain | avg 9.40 ms, worst 1% 25.9, scale 0.6 | avg 6.10, worst 1% 9.67, scale 1.0 (race premium) | fail |
| Express dusk-rain | avg 6.75, worst 1% 18.5 | avg 4.44, worst 1% 13.42 (race premium) | fail |
| Ridge day | avg 6.77, worst 1% 88.8, 63 frames >100 ms, max 1.47 s | avg 6.23, worst 1% 13.21 (Codex audit, this morning) | fail |

Ridge blue hour and Redstone were stopped (owner chose to re-run on a quiet PC). Next step, owner closes Premiere and
Photoshop: build the unchanged commit and pass 1, run Harbor and Ridge back to back (~20 min). Push only if they match.

Re-score after pass 1 (desktop, High): Art direction 2, Hero **2.5** (rider holds its shape; night lights read),
Track/rivals 2, Feedback 2, World **2** (Ridge and Redstone read as shaded, layered places; authoring weak spots
remain for pass 3), Materials 2, Lighting **2.5** (Ridge day shade, blue hour, canyon haze, night pools, rim; Harbor
and Express dusk unchanged), VFX 1.5, UI 2, Performance evidence 2. **Average 2.05.** Not premium yet: VFX is still
below 2, which is pass 2's job.

Still open from pass 1, carried into later passes rather than dropped: grounding for Harbor/Express scenery
(buildings, barriers, palms; pass 3), evaluating the unused `clear-night` HDR for the night looks (pass 2), and
phone-width checks of the new looks (phone target is separate).

## Pass 2 results — wet weather and effects (2026-09-29, local, not pushed)

Evidence in `graphics-pass2-evidence/` (before = the pre-pass-1 frames; after = pass 1 + 2).

1. **Tyre spray** (`src/presentation/wet-spray.ts`): the round light-blue point sprites are replaced by streak quads
   along each particle's velocity (longer with speed, wider with age), broken up by noise, lit by the route's haze
   colour, and faded within ~3 m of the chase camera (the spray trails back towards it). Same 160-particle pool, one
   draw. The authored `water-rooster-tail` atlas is not used: it is a small radial starburst per frame.
2. **Wet-road reflections** (`race-asphalt.ts`): a five-tap vertical smear of the planar reflection, long on damp
   asphalt and near-mirror in standing water, and damp asphalt reflects more (0.3, was 0.07). Sodium lamps now lay the
   classic long orange streaks down a wet night road instead of flame-shaped blobs ([night-rain](graphics-pass2-evidence/express-night-rain-after.jpg)).
3. **Headlight pools are dry-road only** (`headlightPoolStrength`): on wet asphalt a matte pool read as a grey floodlit
   patch; the streaked reflections carry the lights there.
4. **Boost and launch flames** inherit 90% of the car's velocity, so they trail the exhaust instead of hanging in the air.

Correction to the audit: the rain looks are authored as *after rain* ("Dusk, after rain", "Night, after rain"), so
falling rain and splash rings were not added; that would change the art direction. The unused `clear-night` HDR was
evaluated and not adopted: it exists only at 1K (too soft for a visible sky) and 8K (75.6 MB), and the analytic night
sky is a deliberate original; adopting it needs a 2K build and an art-direction decision.

Draw calls unchanged (Express 498/355, Harbor 337/474). Cost to measure in the quiet A/B: five reflection taps per wet
road pixel on High/Ultra (the planar pass is already skipped on Medium/Low). Tests: `tests/graphics-pass2.test.ts`,
full suite 562/562.

Re-score after pass 2 (desktop, High): Materials **2.5** (wet asphalt now reads as wet asphalt at dusk and night),
VFX **2** (spray, flames and sparks read as intended; drift sparks are still small), the rest as after pass 1.
**Average 2.15, and every category is now at 2 or above.** Premium still needs 2.3: pass 3 (world and HUD finish).

## Pass 3 results — world and feedback finish (2026-09-29, local, not pushed)

Evidence in `graphics-pass3-evidence/`.

1. **Smoky Ridge groves and clearings**: the two roadside tree rows are thinned by a position-based noise along the road
   (the far row stays denser), so the even avenue opens into clearings with views across the valley
   ([groves](graphics-pass3-evidence/ridge-groves-900.jpg)). The shared random sequence is untouched; Ridge trees are
   not colliders.
2. **Redstone rock variety**: each sandstone butte gets its own proportions (width ±20%, height -25/+35%) and a slight
   lean, deterministic per placement; colliders keep their original scale/stretch
   ([rocks](graphics-pass3-evidence/rally-rocks-2520.jpg)).
3. **Race surfaces** (`surface-materials.ts`, race-only `RaceSurface` option; showroom and workbench unchanged): turf
   gets large lush/dry patches and less grazing-angle sky sheen (the sheen had washed the Harbor field to one tone); on
   the flat routes (Harbor, Express) walls, barriers and posts get a soft grime line in their lower 45 cm
   ([field and barriers](graphics-pass3-evidence/harbor-field-and-barrier-grime.jpg)). Improvement on the Harbor field is
   modest: from road height, patches compress into bands. Real ground cover (grass tufts) is the next step there.
4. **Drift sparks** are additive streaks along their velocity instead of 5.5 cm points, so the tier colour reads at
   chase distance ([tier 2](graphics-pass3-evidence/drift-sparks-tier2.jpg)).
5. **One coaching line at a time**: the one-time drift hint waits for the first-drive coach hint to clear instead of
   stacking over the car.

Draw calls: one fewer than before on every route (idle sparks no longer submit a draw). Tests:
`tests/graphics-pass3.test.ts` (3), full suite 565/565.

## Scorecard after passes 1–3 (desktop, High; owner's quiet A/B still pending)

| Category | Audit | Now | Evidence |
|---|---:|---:|---|
| Art direction | 2 | 2.5 | Each route has its own light: canyon haze, late sun and blue hour, wet dusk and night streaks, overcast after rain. |
| Hero: vehicles and rider | 2 | 2.5 | Rider rim; tail lights and pools read at night. |
| Track edges and rivals | 2 | 2 | Barrier grime; rival lights and pools at night; barriers are still simple shapes. |
| Drift and position feedback | 2 | 2 | Tier sparks and hint queue help; no new systems. |
| World | 1.5 | 2.5 | Shade and haze, Ridge groves and vistas, rock variety, turf patches. Weakest: Harbor/Express block buildings, the flat Harbor field. |
| Materials | 2 | 2.5 | Wet asphalt reads as wet asphalt; contact darkening. |
| Lighting | 1.5 | 2.5 | Sun/sky balance, baked shade, blue hour, night pools, rim. |
| VFX | 1.5 | 2.5 | Streak spray, streaked reflections, trailing flames, visible tier sparks; all event-driven and pooled. |
| UI / HUD | 2 | 2 | Unchanged apart from the hint queue; phone portrait remains 1 (separate target). |
| Performance evidence | 2 | 2 | Census every pass; sustained gates still owe a quiet-PC A/B. |
| **Average** | **1.85** | **2.30** | Premium: every category ≥ 2 and average ≥ 2.3. On the line, by this scorecard. |

What would move it clearly past 2.3: the quiet A/B with baseline and post numbers (performance evidence 2.5), Harbor
ground cover and building detail (world 3), and a HUD polish pass.

## Reproducing the live checks

Dev server (`.claude/launch.json` → `tour-dev`, port 5186), `localStorage['slingmods-race-films']='off'`, URL
`/?scene=express&route=<express|ridge>&visual=2026&mode=race&look=dusk-rain|lighting=night&quality=high&test=1&profile=1&clock=controlled`
(Rally: `scene=rally&route=rally&visual=ryker&look=day`). Drive with `scripts/story-parity-driver.ts`
(`EvidenceDriver`, `toDevice`) through `__EXPRESS.setDeviceSample` / `normalFrame`, exactly as Codex's `audit.mjs`.
The race scene is reachable by patching three's `Object3D.prototype.onBeforeRender` for one frame and collecting the
`scene` argument. Pixel A/B: draw the WebGL canvas into a 2D canvas in the same task as `normalFrame`.
