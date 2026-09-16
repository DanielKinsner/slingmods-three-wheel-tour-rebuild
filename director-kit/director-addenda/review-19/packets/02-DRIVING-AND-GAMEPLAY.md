# 02 — Height-aware driving and a usable destination

## Start from the actual source, not an assumed terrain engine

Review19's `src/course/environment.ts` describes centerline points in **[x,z]**, projects and measures the route in that plane, and creates a flat ground surface plus boxes/ramps. `src/express/route.ts` is likewise flat. You need an additive elevation path; simply moving visual road vertices will leave the car on the old floor.

Design one authoritative new-route representation that generates or validates road rendering, collider vertices, shoulder/rail placement, start grids, checkpoints, AI samples, minimap and recovery poses. Keep old flat route data/IDs/length conventions unchanged. New 3D-distance versus station-distance conventions must be explicit and used consistently, especially for lap gates and best-time keys.

## Minimal terrain integration

- Represent physical road/terrain using supported fixed Rapier triangle meshes or a heightfield plus a matching road surface; consult the installed pinned API, not guessed current docs. Avoid two coincident colliders competing as the wheel support surface. Resolve shared seams and bad sliver triangles.
- The old support plane must not remain available beneath/through the new road. Course bounds and recovery should handle falling off, not an invisible flat floor that catches cars mid-mountain.
- Keep the existing three tire contact/force channels. Preserve legitimate obstacle/guard/chassis contacts. The Sport v2/v3 passive guards intentionally omit the old support-floor group: apply any corresponding rule to the new drivable support surfaces deliberately and verify it. Do not erase barrier collision or reintroduce artificial locked-wheel grip.
- Add elevation-aware starts/resets and tangent/normal alignment where required. A stopped car on the climb/crest/descent must respawn upright and supported on its local road, not at y=0. No body-following spline, teleport-based cornering, artificial gravity cancellation or velocity snapping during ordinary driving.
- Keep road-following helpers as route information for AI and cameras. Physics determines car motion. AI must account for slope/curvature/braking, use ordinary controls and share player force limits. Route-specific approach speeds are allowed; hidden super-grip and scripted winner order are not.
- Camera terrain occlusion, look-ahead and pitch must work on both sides of crests. Keep cockpit attached to the current driver and the dashboard using real telemetry. Minimap/progress direction must remain correct when the road changes altitude.

First prove one climb, one crest and one descending bend with real contacts before spreading full art over the whole circuit. Include a downhill hard stop, stop/reverse on a grade and off-road recovery. This validation stays inside the local run. If a true physics defect is uncovered, isolate it and preserve the flat-route baseline; do not silently redesign all driving.

## Entry and configurator

Add a clear, compact **destination selector** using the existing visual language: Harbor / Harbor Express / Smoky Ridge. Reuse the route/test-race choices already implemented. A nice real-capture thumbnail, brief route description, length and light selection are enough; do not build a sprawling new menu framework.

Smoky Ridge must be immediately available to **free test drives and Quick Race**. The selected finish/products/suspension/profile are captured once, shown correctly in-car, and restored on return to the same showroom draft. Changing destination is not a purchase, unlock or profile reset. Keep old saved recipes and in-progress Cups frozen as already implemented.

The showroom departure can remain the familiar bay cinematic, followed by an explicit travel/loading transition. Do not pretend the mountain is directly beyond the Harbor garage door. Audio skips/pause/reduced motion and the equipped Thermal departure must stay correct. Loading must remain responsive with cancel/retry; do not preload the full mountain to open the garage or Harbor.

## Chapter03 — Ridge Run

Reuse existing rivals, identities and brief skippable voice/text conventions. Add three earned events on this one circuit:

1. **Find the Ridge** — one-lap solo shakedown in late afternoon.
2. **Nico's Ridge Duel** — one lap against the existing Nico rival in late afternoon.
3. **Summit Invitational** — two laps against three existing rivals at blue hour.

These are event roles and production names; preserve established character behavior rather than inventing prior story history. Career unlock follows an actual completed Coastline Cup; migrated careers receive it only if their existing records support that completion. Free preview and Quick Race do not share this gate.

Use existing credits. Proposed first-valid-finish awards: 400 / 600 / 900; repeat awards: 75 / 125 / 175. Record the chosen economy and keep all old payouts untouched. A valid finish advances to the next event; a first-place finish is a tracked achievement rather than mandatory grind. No reward for an abandoned/invalid/duplicated result. No real-money claims, new currency, new product or forced purchase. New medals/chapter completion remain additive, not edits to old receipts.

The default opposition should be approachable with the stock car, with real passing opportunities. Tune route-specific target pace and line choice rather than handicapping the player or fabricating results. Prove every rival can complete the circuit and recover from ordinary contact. The test driver finishing a lap is not proof of enjoyable difficulty.

## Scope boundary

This assignment adds one environment family, one destination selection seam and three events. It does not add Spyder/Ryker, a new garage, another 20 products, traffic, online networking, a full photo-mode UI or a rewrite of the campaign system. Keep those as future expansions.
