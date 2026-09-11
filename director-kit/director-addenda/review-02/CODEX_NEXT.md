# Next assignment — P03A1: fidelity lock

## Directive

You are continuing Astra's directed SlingMods rebuild. Review 02 contains worthwhile work. Keep it. The focused RPM fix, material/export pipeline, same-asset pad route and shadow repair are accepted within the evidence limits in `AUDIT.md`. Astra does **not** accept the blanket visual PASS. Finish the named fidelity gaps before the driver/controller/audio packet.

**Working root, for every command:**

```text
C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild
```

Do not start another folder/repository. Do not read an old kickoff as permission to scaffold again. Do not change the old `slingmods game` workspace or deployments. Inspect current Git status, preserve any newer owner/agent work, and reconcile with recorded runtime checkpoint `fbe89bf31cd81af7b77ec60358c0bcd65056e53a` and packaging checkpoint `b9fb6227a2383093b671cd67148e7039b7a78e80`; do not force-checkout either. If newer changes exist, record the reconciliation.

This is a bounded implementation assignment, not another planning deliverable. Make routine decisions without asking Dan to choose references, lighting, geometry, topology, camera settings or tests. Use isolated automation, not his desktop input.

## 1. Preserve what has been earned

Retain the signed-wheel RPM correction and its tests without weakening assertions. Leave the broader vehicle dynamics and accepted pad/contact geometry alone in this art packet. Keep the repaired caster policy and ordinary Inspect/Drive/Bay flow. Keep P01 and Review 02 assets/evidence as historical baselines.

Create versioned candidate authoring/exports, such as `slingshot-p03a1.blend` and `slingshot-p03a1.glb`, without requiring a new runtime architecture. Keep editable Blender sources, original authored maps and reproducible export scripts. Append P03A1 and this director decision to the working production ledger. Historical local PASS records remain history; **G3 remains pending**.

## 2. Three jobs, with explicit priorities

### Job A — reference-locked model corrections

Use the already downloaded exact-year reference set in `director-kit/references/slingshot-2024/`; see `VISUAL_NOTES.md` for the mapping. Do not substitute AI concept art, a later-model fascia, or a generic three-wheeler. Recover public reference pages only when the existing reference files are absent; public images are research, not redistributable textures.

Before reshaping, create comparable front and front-three-quarter reference cameras. Match visible front/rear wheel centers, rim ellipses and perspective as closely as practical. Keep a short list of chosen landmarks and uncertainty; do not claim millimeter accuracy from photographs. Use side/rear views to prevent fixing one angle at the expense of another.

Correct in this order:

1. **Front fascia/wing/hood relationships.** Reconstruct the problematic brow, central light surround, cheek/splitter returns and cavity structure as coherent manufactured surfaces. The current material-detail shot shows the problem: surface sheets and block assemblies remain too apparent. Preserve real sharp feature lines but give adjacent regions proper curved sections, controlled normals, material boundaries and believable wall thickness. A recess should have appropriate backing/interior structure, not just a dark plane that floats nearby. Keep genuine air openings.
2. **One detailed wheel-and-tire master, adapted to the documented front/rear sizes.** Build the swept spoke cross-sections and machined face boundaries from `3f60_l.jpg`; resolve hub/lug recesses, barrel/rim depth and tire shoulder/sidewall/tread readability. Reuse the authored construction intelligently across the three wheels. Keep stationary calipers out of spinning transforms. Do not introduce unverified manufacturer logos or copy photographs as textures. Restrained tread geometry where needed plus a correct normal bake is preferable to a uniformly smooth ring or millions of tread polygons.
3. **Cockpit's dominant shapes.** Rework the flat-bottom steering rim/hub/spokes, instrument hood, screen/switch surround and the most visible seat bolsters/panel boundaries against `95c0_l.jpg`, `deda_l.jpg` and the whole-vehicle reference. Preserve the current actual AutoDrive variant. Do not invent working instruments, screens or buttons to make a screenshot busier. Static/off displays are acceptable here. Do not add a driver yet.

Preserve the coordinate convention, wheel centers/radii and steering/spin hierarchy, and keep accessory bindings functional. P01's exact visual bounding box and photo-estimated nonphysical mounts are not OEM ground truth. Correcting a body panel, cockpit camera/hand target or other estimated visual mount is allowed when documented and kept inside the shared scale/fitment intent. Do not scale the body independently from contacts or silently alter physics. A needed mechanical-contact change must be isolated and returned as a finding, not hidden in this art pass.

**Change the failing local construction approach.** The current dense sampled lofts and inherited wheel/cockpit pieces are not mandatory. Use a deliberately controlled subdivision cage, connected sectional surfaces or another reference-driven construction where it helps. This is not permission for global subdivision or a complete asset reset. Do not simply increase sample counts or tiny details and call the same silhouette improved.

### Job B — materials and graphics that survive inspection

Keep working UV/PBR/clearcoat/export behavior. Address the jagged orange/black graphic boundaries seen in the cockpit capture with antialiased artwork generation, coverage-aware supersampling/downsampling, or appropriately isolated decal UVs. Preserve crisp edges; do not blur the whole image. Increase only the resolution/density that needs it, not every texture in the vehicle.

Separate upholstered panels, molded plastic, rubber, machined faces, coated metal and paint at normal garage viewing distances. Use actual authored/baked detail at believable scale. The exact color of uncalibrated photographs is not a paint measurement; judge shape/material response under the controlled rig rather than pretending to extract an OEM color standard.

First review the changed panels with a neutral material and moving broad reflection. Do this locally with the artist/reviewer, without interrupting Dan. Then finish materials. No baked directional highlights, photographic body wraps, arbitrary dirt, stronger bloom or noise as a substitute for surface quality.

### Job C — a useful small inspection presentation

Keep the existing compact bay; do not build the finished workshop. Author a deliberate overhead/key/fill arrangement with restrained SlingMods red and a mid-value neutral floor/background that lets the vehicle read. Use Blender-authored visible fixture geometry only where needed. Choose one consistent rig; do not ask for aesthetic options.

Use a coherent environment/reflection setup for that rig rather than relying on unrelated broad RoomEnvironment shapes as the entire presentation. An authored HDR environment/probe or a simple deliberate IBL scene is acceptable. Keep the existing Three.js renderer and color pipeline; no engine migration or new shader framework. A small amount of grounded contact/occlusion work is allowed where it directly improves the vehicle/bay, but do not make expensive postprocessing the substitute for correct geometry or lighting.

Keep a genuinely neutral/daylight inspection mode distinct from the bay. Preserve legible paint in several angles; some specular whites are normal, but the front should not become a largely white featureless cap. Do not darken the environment to conceal flaws or remove the vehicle shadow.

Fix the review orbit framing using actual bounds, camera FOV/aspect and a safe margin. All wheels, splitter and hoops must remain in frame for the full orbit. Resolve the rear-wall constraint through camera/fixture placement or a small wall adjustment, not a sudden close zoom. Manual inspection may still zoom in; the evidence orbit is the mode that must stay fully framed.

## 3. Scope and practical budgets

No Spyder/Ryker finishing, story, race systems, AI rivals, product installation, store/cart integration, multiplayer, weather, audio, driver or gamepad work in this packet. Those remain planned, not canceled.

Do not reimplement the simulation or spend the run retesting historical unrelated scenarios. Run the existing suite, the focused RPM check and the relevant asset/browser regression checks; report actual outcomes. Preserve the existing draw-submission/batching improvement and attachment visibility. The current 176,218-triangle mesh is already substantial: spend topology on observable form, not a number target. Stay within the existing justified showroom ceiling; do not quietly double mesh or texture cost. A full racing LOD system remains later work and is not claimed passed by this packet.

One artist owns the Blender/model/maps. One integrator may own the small rig/capture/framing changes. A separate read-only reviewer checks output if one is genuinely available. Do not spin up a large agent swarm or create extensive new reporting infrastructure. Evidence is a few decisive views and the relevant checks, not a new archive of hundreds of files.

## 4. Acceptance: fixed targets, not a moving wish list

P03A1 earns local candidate acceptance only when:

- Matched front and front-three-quarter reference comparisons show convincing fascia massing, panel thickness/returns, lamp openings and grille/splitter relationships. Side/rear control views have no new proportion/intersection regression.
- The wheel no longer reads as simple bars inside a smooth ring; the source-matched spoke, rim, hub and tread/shoulder forms are readable at an ordinary inspection distance.
- The cockpit's dominant shapes match the chosen variant rather than a generic steering wheel and boxes. Off/static instruments remain explicitly disclosed.
- Graphic edges are clean in the same close-up; paint/plastic/rubber/upholstery/metal read differently under the same rig. Surface improvement exists before the attractive lighting is applied.
- The unchanged dynamic foundation drives the new export, wheel/steering/caliper bindings remain coherent, shadows are retained without the old moving bands, and the normal entry makes the candidate easy to inspect and drive.
- The complete review orbit keeps the vehicle in frame. The ordinary bay view is visibly more deliberate without hiding the model.
- Tests/statistics and their environment are reported honestly. No software-renderer result is labeled physical-device FPS or subjective handling approval.

Do not approve by triangle count, number of maps, file hashes or checklist wording. Put the actual references next to current runtime output and inspect them. If the same named issue survives two corrective attempts, stop that local method and make a targeted construction change. Do not keep emitting cosmetically different but geometrically equivalent candidates. If it still cannot be resolved in this bounded run, return the best candidate with that specific blocker rather than self-awarding a PASS or expanding scope.

## 5. Deliver one easy handoff, then stop

Create **`Astra-Review-03.zip`** in the current rebuild root (number it instead of overwriting an existing file). Include:

- `REVIEW-ME-FIRST.md`: exact root/commit; commands and normal-entry URL; concise changes; remaining specific blockers; tests/environment; current pending gate status.
- Relevant source, scripts, source Blender files, GLBs and authored textures, plus the current production ledger and focused review. Exclude tools, dependencies, caches, dist, credentials, .env files and redundant old archives.
- A compact current runtime image set: front, front-three-quarter, side, rear-three-quarter, wheel/material detail, cockpit, and normal bay. Provide the before/after comparisons for changed regions; reused old captures must retain their old provenance. Make the full-vehicle shots large enough to inspect without cropping the silhouette.
- One approximately 12–15-second fully framed runtime orbit/light sweep and one approximately 15–25-second pad maneuver showing the new asset, braking, steering and retained shadows. Keep recordings silent because audio is not in this assignment, and label them SILENT. Distinguish software capture timing from real-time performance. Use isolated tooling, never desktop takeover.
- One concise asset-statistics/test summary and a minimal manifest identifying the runtime inputs used for the evidence. Do not repackage every intermediate attempt or generate elaborate new gate tooling.

Verify no secrets/unrelated work before a local review checkpoint commit. No deployment or storefront changes. Finish with the ZIP's exact path and size and stop. Dan only needs to attach it to this chat; no manual playtest or aesthetic decisions are required.

**Do not mark G3 passed or begin P03B/P03C/P04. This packet fixes the named visual blockers while protecting the useful foundation.**
