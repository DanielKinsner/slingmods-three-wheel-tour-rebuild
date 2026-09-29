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
| 1 | **Scenery is ungrounded.** No ambient occlusion anywhere; sun shadows exist only in a 48 m square around the car, so trees, rocks and buildings beyond ~25 m cast nothing. | [ridge-day](graphics-audit-evidence/ridge-day.jpg), [rally-quarry](graphics-audit-evidence/rally-quarry.jpg) | `src/presentation/chase-shadow.ts:4` single chase map, no cascades; `src/presentation/surface-materials.ts:27` sets `aoMap` null on swapped scenery materials; `driving-contact.ts` contact blobs cover tyres only. |
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
| Materials | 2 | 2 | Paint, P11 asphalt decals and wet shader good; scenery loses AO maps. |
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
3. Grounding: soft contact darkening under trees, rocks, barriers and building bases; keep scenery AO maps where the
   source has them; a load-time static sun shadow for scenery beyond the car's shadow range (riskiest item, measure).
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

## Reproducing the live checks

Dev server (`.claude/launch.json` → `tour-dev`, port 5186), `localStorage['slingmods-race-films']='off'`, URL
`/?scene=express&route=<express|ridge>&visual=2026&mode=race&look=dusk-rain|lighting=night&quality=high&test=1&profile=1&clock=controlled`
(Rally: `scene=rally&route=rally&visual=ryker&look=day`). Drive with `scripts/story-parity-driver.ts`
(`EvidenceDriver`, `toDevice`) through `__EXPRESS.setDeviceSample` / `normalFrame`, exactly as Codex's `audit.mjs`.
The race scene is reachable by patching three's `Object3D.prototype.onBeforeRender` for one frame and collecting the
`scene` argument. Pixel A/B: draw the WebGL canvas into a 2D canvas in the same task as `normalFrame`.
