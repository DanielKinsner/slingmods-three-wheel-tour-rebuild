# Purchased Can-Am Ryker 900 game asset

The purchased markos3d model is converted, rigged and integrated as an optional player appearance. The 2026 Slingshot remains the default and the rival fleet remains Slingshots. This is local work on `codex/ryker-game-asset`; nothing was pushed, published or deployed.

## Play

From this checkout run `powershell -ExecutionPolicy Bypass -File scripts/ryker/preview.ps1`, then open <http://127.0.0.1:5198/?visual=ryker>. The persistent YOUR RIDE header switches between the Ryker and Slingshot on Home, Build, Destinations and Shop. Each keeps a separate preview build. The selection follows navigation in this tab. Career IDs, ownership, saved builds and handling versions are preserved.

The existing free drives, races and career transitions use the selected appearance. Slingshot catalog geometry is suppressed on the Ryker. Adrenaline Red panels and a black seat are its default finish; the paint panels remain adjustable. The purchased instrument housing now carries an original SIM readout using actual game speed, RPM and gear. It goes dark with ignition; no OEM artwork or unsupported sensor readings are claimed.

Ryker-specific TricLED, Elka Stage 3, Treal Street and Panther Customs previews are now available. See [MODS.md](MODS.md) for researched fitment, approximation limits and validation. The Ryker has Body Kit in place of Aero and no Storage category.

## Files and reproducibility

- `public/assets/ryker/ryker-900.glb`: self-contained gameplay model, **719,254 triangles, 13,469,980 bytes**, 20 PBR materials, no image dependencies or compression decoder.
- `assets/ryker/Ryker-Game-Master.blend`: editable semantic game master. Reduction and transferred source normals are baked into editable meshes. The untouched dense master is preserved separately, not overwritten.
- `public/assets/ryker/manifest.json`: component provenance, reduction ratios, hierarchy, material roles, wheel centers, scale and physics mismatch.
- `public/assets/ryker/driver-attachment.json`: existing rider rig fitted with straddle legs, fixed handlebar grips and a modest torso lean.
- `scripts/ryker/`: conversion, rendering, native reimport, format validation, motion tests, browser captures and launch commands.
- `assets/ryker/evidence/`: machine-readable inspection, input hashes, command log, validator reports and browser results. Matching full-resolution renders/captures are also in the delivery ZIP.

Conversion from the original purchase archive:

```powershell
./scripts/ryker/run.ps1 -Archive 'path/to/canam-ryker-900.zip' -Workspace 'path/to/private/ryker-work' -BlenderExe 'path/to/blender.exe'
```

The launcher reuses native Windows Blender/UnRAR, extracts only the Blender RAR, refuses a mismatched existing source, makes the source master read-only, disables embedded script execution, logs arguments/hashes, and reimports the GLB into a clean scene. `-SkipRenders` reruns conversion/validation without rendering again. Blender 4.5.3 LTS was used here; no global settings or game dependencies were changed. The standalone Khronos validator was installed only in the private work folder, pinned to `2.0.0-dev.3.10`.

The ZIP includes the untouched extracted `.blend` and its hash. With an extracted source, the equivalent stages are `inspect_source.py`, `baseline.py`, `components.py`, `convert.py`, and `validate.py`; their exact commands are in `evidence/workflow.json`. `attachments.py` reads the existing game's `public/assets/model02/driver-attachment.json`. Keep the original purchase archive as the licensing/provenance source.

The requested Adrenaline Red / black default replaces the purchased sage/tan colors only. The red is a visual approximation from [Can-Am’s official Ryker image](https://can-am.brp.com/content/dam/emea/en/can-am-on-road/my21/vehicle-line-up/ryker/ryker/ONRD-SPY-MY20-S-STD-M-3-Adrenaline-Red-3-4-front-Europe.png), supported by the [Adrenaline Red panel listing](https://can-am-shop.brp.com/on-road/us/en/classic-panels-adrenaline-red-can-am-ryker-219400804.html), not a measured OEM paint formula. Target sRGB: panels `#ef2e1b`, seat `#181a1b`. Geometry, rig, other materials and the untouched source master are unchanged; `evidence/default-finish.json` records the byte-level comparison. Historical source renders retain their original colors.

## Source, scale and parts

Native Blender confirmed 18 meshes, 1,436,594 faces and 2,873,168 triangles, 19 used materials, no editable subdivision modifiers and no referenced images. **1,178,736 triangle UVs have effectively zero area**; these UVs were not used for baking. The alternate FBX was unnecessary and was not extracted or claimed as validated.

Uniform scale is derived from the actual tire centers and BRP's [1,709 mm wheelbase specification](https://can-am.brp.com/content/dam/global/en/can-am-on-road/my21/documents/spec-sheets/ONRD-RYK-MY21-SPEC-Ryker-ENNA-LR.pdf). The source's declared metric units do not match its geometry. `transform.json` records the exact matrix: rotate 180 degrees around source Z, translate axle midpoint/ground, scale uniformly, then let Blender's glTF exporter perform its one Z-up to Y-up conversion. Runtime basis is +X right, +Y up, -Z forward, metres.

Final bounds are approximately **1.198 m wide × 1.087 m tall × 2.362 m long**. The purchased source is narrower than the official 1.509 m MY21 overall width, even when its wheelbase/length agree. Its asymmetry and shape were preserved rather than stretched to match a specification.

Front tires were identified by measured position, not source suffix assumptions. Tires, rims and concentric rotor/hub islands spin on their axle centers. Calipers/pads remain on the steering carriers. The two fender assemblies follow their knuckle/carrier geometry and never spin. The instrument housing/support is separated from the handlebar/control/mirror assembly and stays on the body. Rear mechanical geometry remains rigid; rear wheel vertical travel is cosmetic. No dense mesh is used for collision.

Per-component reductions preserve wheel silhouettes, tread, panel seams, seat and control detail. Expensive mechanical, grille and tire groups receive different ratios; normals are transferred from the artist's dense surfaces after reduction. Matching clay/PBR views were reviewed at front quarter, both sides, rear, cockpit, panel and wheel. Total reduction is **75.0%** (rounded). No unused LOD files or unmeasured LOD benefits are claimed.

## Validation and limits

Native reimport passes finite transforms/geometry, bounds/ground, unique required names, wheel centers, caliper/rotor/fender parenting, fixed instrument, triangle count and absence of staging objects or external images. Khronos validation reports **0 errors, 0 warnings**, and 10 informational empty attachment nodes and one expected unused-UV notice (the instrument UV is consumed by the runtime canvas).

Actual browser checks pass showroom switching, showroom departure, Chapter 01 career-to-driving, forward and reverse motion, both steering directions, rider reach, day/night lamps and absence of page/console errors. Slingshot rivals are verified by their loaded asset paths. Node tests exercise the exported asset's real transforms, proving calipers/fenders do not spin, rotors do spin, the display housing stays fixed and reverse reverses wheel rotation. A final static-build smoke verifies the curated asset allowlist.

The rider repair reduced measured grip gaps from about 16 cm to below 0.001 mm in the captured driven pose. This proves bone contact targets, not human ergonomic certification. The Ryker cockpit eye and showroom interior framing show both mirrors, hands and instrument. Live reflections use the same resolution, visibility gates and disposal path as the Slingshot, with the Ryker glass following its handlebars. The native mirror housings and face vertices are preserved; an optical tilt aims their reflected view behind the seated rider.

**Physics limitation:** existing Sport v5 Slingshot collision and ray contacts remain intact (2.667 m wheelbase, 1.755 m track). The source Ryker has 1.709 m wheelbase and approximately 1.059 m front track. Tire motion, contact shadows, skids and wheel effects use the Ryker visual centers, but collision/contact sampling still covers the larger Slingshot footprint. Curb/edge alignment is therefore approximate. This is an explicitly labeled visual selection, not authentic Ryker handling or collision certification. Changing the physics was outside this assignment's preservation constraint.

Initial conversion baseline, before the cockpit fidelity pass: matched 1440×1000 showroom sampling on NVIDIA RTX 4080 / ANGLE D3D11, headless Chromium, 180 RAF intervals per model, same camera and scene: both median 16.7 ms / p95 16.8 ms. Slingshot: 529 submitted draws, 406,877 submitted triangles; Ryker: 216 draws, 1,519,324 submitted triangles per full frame, including shadows/post passes. These are short refresh-limited samples, not sustained 60 FPS proof, a GPU timer benchmark or an improvement claim. The same browser context was used sequentially, so shared cache warmth differs. Loading/resource details are retained in the JSON. Existing project performance HOLD remains unchanged.

No paid textures, generated preview imagery, personal browser data, global tool installs, remote publication or source-archive uploads were used. Full race completion/reward certification, all destination/weather combinations, mobile hardware, and long sustained performance are not claimed by this asset pass.

## Fidelity comparison against the Slingshot

The same 1440×1000 renderer, studio lighting and field of view were used for front, side and rear comparisons, with camera distance adjusted for the vehicles' different lengths. Both retain their own source design. The reviewed Ryker keeps continuous panel seams, modeled tire tread, drilled rotors, machined rims, branding, fasteners and controls; its simpler body and matte surfaces are intentional source features. This is visual review of the supplied models, not certification of OEM dimensional accuracy.

This pass closes the cockpit presentation gaps: live moving mirrors, accurate SIM instrumentation, readable screen orientation, ignition off, complete cockpit framing, and a matching finish swatch. The screen alone has newly generated planar UVs; the source's collapsed UVs remain unused. Static exported screen art stays blank; the game renders its live values. The mirror/screen optical surfaces retain full geometry, adding only 620 triangles over the first gameplay export. No handling, steering input or collision changes were made.

`evidence/fidelity-comparison.json` and the ZIP's `fidelity/` images record actual Slingshot/Ryker views, driving, reverse and night. Tests exercise the real exported mirrors through both steering directions and verify that the live faces follow their housings while the instrument stays fixed. The full suite has 398 tests. The earlier runtime/performance JSON remains historical baseline evidence; the fidelity report and final static smoke cover the updated presentation. Sustained performance HOLD remains unchanged.

## Merge

Claude's main changes through `de5e5ac82797ae36788555b287d19b37ff422742` are included in this branch. The one overlap in `src/demo/profile.ts` was resolved by retaining Claude's full allowlist and adding `ryker`. Its transform/transparent-material/rear-inspection performance changes remain intact. Main's checkout and unrelated files were not edited.

Merge this branch normally after the active main work is ready; do not replace main files wholesale. The delivery includes a patch against that main commit, plus separate runtime/editable assets, but the local branch is the preferred merge source. Future concurrent edits may require another merge check.
