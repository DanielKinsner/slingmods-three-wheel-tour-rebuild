# Integration map — observed in submitted Review20
These are source-inspection anchors, not claims that the current working tree is identical. Discover the active checkout, read its current handoff and preserve newer changes.

| Existing seam | Why it matters in this assignment |
|---|---|
| `src/main.ts` | Root entry loads the signature scene; named legacy routes still exist. Do not make the new public link default to `?scene=bay&play=demo`. |
| `src/signature/scene.ts` | Owns the showroom renderer, camera, state, UI action hooks, build apply/reapply, preparation and departure. Keep validation/persistence out of purely visual components. |
| `src/signature/ui.ts` | `SignatureUI` renders entry/build/events/shop; seven categories and existing actions are here. Preserve real product options and handlers while replacing presentation. |
| `src/signature/tokens.css` and `ui.css` | Existing system has repeated root definitions and late overrides. Consolidate rather than adding another opaque override layer. |
| `src/presentation/signature-art.ts` | Loads current room and controls finish/material isolation plus separate accessories. Do not mutate shared materials or lose finish masks. |
| `src/presentation/hero.ts` / `vehicle-asset.ts` | Shared actual hero/driver asset and binding pipeline. Keep current front/hoop/rear improvements; no concept-image car replacement. |
| `src/signature/route-data.ts` | Existing route paths/lengths for destination UI; use real data, not routes drawn from generated images. |
| `src/harbor-ui.ts`, `src/crew-ui.ts`, `src/harbor.css`, `src/crew.css`, `src/express.ts` | Inspect all race variants for HUD, timer, result, waiting and control state; do not reskin only one mode. |
| `src/career-experience/hub.ts`, `hub.css` and `src/career/*-ui.ts` | Career and owned-parts screens must share the new presentation without changing progression/reward storage. |
| `src/audio/actions.ts`, `interface.ts`, `game-audio.ts` | Existing successful-action cues, independent mix preferences and UI sound host. Preserve semantics and focus/lifecycle behavior. |
| `src/presentation/powered-display.ts`, `src/signature/departure.ts`, `src/audio/thermal-departure.ts` | Physical screen, live camera/reflection interactions, animated room exit and synchronized owner audio. Keep all intact. |
| `demo-assets.json`, `scripts/build-demo.mjs`, `scripts/build-vercel.mjs`, `scripts/stage-publish.mjs`, `vercel.json` | Curated runtime/export pipeline. Newly referenced artwork/fonts must be included; editorial images, sources, reviews and secrets must not be served. |

## Renderer/material traps already visible in source
`scene.ts` currently creates a WebGL renderer with ACES tone mapping, an inspection environment and directional/hemisphere lighting. `apply()` rewrites exposure, environment intensity and key/fill/rim values every time configuration is reapplied. A one-time visual tweak that this function later resets is not a completed lighting change. Centralize the named showroom look data.

`view()`/`resize()` currently fit based on camera vectors and apply fixed view offsets. Use current UI safe regions and actual equipped bounds so changing viewport/inspector doesn't crop the car or clip the wall. Keep product inspection and departure control of the camera explicit; do not let UI hover start fighting OrbitControls.

`SignatureFinishPresenter.set()` owns cloned paint/accent material slots and resets roughness/maps for each finish. Any upgraded material model must preserve those slots, shader state, material disposal and masked rubber/glass/seat behavior. Prove all four switches and stock comparison, not just one beautiful boot-time screenshot.

`loadSignatureShowroom()` references `/assets/p08b/showroom-refinement/signature-showroom-refined.glb`; the stated editable source is `assets/blender/p08b/showroom-refinement/signature-showroom-refined.blend`. It currently sets every room mesh's `castShadow=false`. Analyze which static occlusion/shadow approach the new lighting actually needs; don't turn on shadow casting for every tiny grid and light fixture indiscriminately.

The room is a roughly inferred 12×4.2×13 m game asset in source metadata, not a surveyed room. Specific blank-wall coordinates cannot be recovered reliably from a front screenshot alone. Inspect actual meshes and document placement before adding the panel. Leave the moving `bay_door_curtain` and the departure motion unchanged.

The current `SignatureUI` state/action interface already separates the free preview from career storage. Preserve that. When redesigning navigation, keep destination lighting, recipe snapshots, profile versions and old saves out of accidental visual state resets.

## Suggested implementation structure
Reuse the existing stack. A small common UI vocabulary—navigation, category row, option swatch, action, metric, standings row, contextual inspector—is enough. It may be extracted into reusable TypeScript render helpers and CSS scopes. A framework migration is not required.

Do not create a second game renderer for every UI preview. Use existing live state, captured in-game stills, route SVG and carefully managed views. UI-only route changes should not cause geometry downloads or simulation initialization until the user requests a drive.

Protect historical source and proof paths. Add the director packet under a new review-20 addendum folder without replacing earlier `AGENTS.md` or handoff history. Update the current-authority header clearly rather than leaving contradictory active instructions throughout the file.
