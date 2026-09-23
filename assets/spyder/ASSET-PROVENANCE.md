# Purchased source and derived assets

Input: owner's `Spyder_Road_Codex_Kit.zip` and optional original `can-am-spyder-three-wheeled-motorcycle.zip`. The kit's useful OBJ/MTL/textures were used; the larger original archive was preserved without modification and was not needed for conversion. All 14 purchased source hashes match the supplied receipt before and after processing. No generative vehicle model or stock replacement was used.

Private working source and import baseline live in `.tools/spyder-kit/Spyder_Road_Codex_Kit/`. Native Blender 4.5.2 LTS executed with `--background --factory-startup --disable-autoexec --python-exit-code 1`. The exact tire MTL dependency repair was applied to a staged copy only. The raw imported scene contained 36 objects, 2,521,282 vertices and 4,923,405 triangle equivalents. Only the two-triangle source floor `Plane02` was removed from the derived vehicle.

Conversion uniformly calibrates the source wheelbase to 1.709 m, preserves measured custom proportions/contacts, partitions connected source islands into real motion channels, retains diffuse UV artwork, repairs legacy material interpretation, and selectively simplifies dense geometry. No unused LOD or runtime compression decoder is claimed. Final counts and hashes are in the runtime manifest, full-validator receipt and complete handoff manifest. Actual road triangle/pass totals are higher because riders, scenery, shadows and mirrors also render.

Editable, packed Blender masters are delivered privately:

- `Spyder-Calibrated-Master.blend`: full-resolution calibrated donor, with original geometry/material context.
- `Spyder-Game-Master.blend`: final runtime topology, semantic materials, measured pivots, rear-facing mirror correction and additive SIM instrument faces.
- `Spyder-Products.blend`: six scoped mounted upgrades.
- `Spyder-Rider.blend`: separate sleeve-weight derivative for the tall grips.

The three runtime GLBs plus rig/driver/product manifests are under `public/assets/spyder/`. The original source, archives, OBJ/MTL and editable masters are excluded from the served demo. The game package contains derived runtime assets only; the complete handoff ZIP is private and must not be uploaded as a public site.

Source/final clay and PBR evidence includes hero, left, right, rear, cockpit, seat/panel and wheel views with the same cameras. The live game adds dynamic instrument canvases and reflections that neutral Blender renders do not reproduce. Actual cockpit, equipped, driving, career and three-vehicle screenshots are separate evidence.

Reproduction order: kit `verify_bundle.py`, `check_seeds.py`, `preflight.py --repo ... --blender ... --run-native-audit --save-baseline`; then Blender `scripts/spyder/audit.py`, `build.py`, `finalize.py`, `products.py`, `rider.py`, `reimport.py`, `render.py -- source`, `render.py -- final`. Every Blender invocation needs the safe flags above. Scripts infer the repository root from their location. `rider.py` uses the preserved `assets/blender/drivers/tour-rider.blend`. Run the kit basic GLB inspector, `scripts/spyder/validate-assets.mjs`, tests and packaged browser checks afterwards.

The one-time `integrate-*.py` files document the initial code migration and are not idempotent rebuild commands. Do not rerun them on the completed checkout. The full Khronos validator is isolated under `.tools/gltf-audit`; it is an audit helper, not a shipped game dependency.

Known validator warnings: the rider retains generated-tangent/skinned-non-root warnings inherited from this export structure. Actual Blender reimport, Three.js rendering, glove/hand/foot checks and mixed-instance disposal are separate evidence. Zero validator errors does not imply physical fit certification or a closed performance gate.
