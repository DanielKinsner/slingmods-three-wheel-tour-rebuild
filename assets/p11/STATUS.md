# P11 asset delivery

All eleven prompts now have an authored asset kit under `public/assets/p11/`.
This is a local asset delivery, **not a completed game integration or visual signoff**.
Open `review.html` for the preview gallery and `public/assets/p11/manifest.json`
for individual files, sizes, hashes, dimensions, and KTX2 companions.

| Prompt | Folder | Delivered |
|---|---|---|
| 01 | race-asphalt | Native scanned dry PBR, physically scaled 4m/4K dry and wet sets, 2K detail normal and height-driven puddle mask |
| 02 | road-decals | 4K RGBA atlas, normal/roughness/ORM, 36 UV rectangles and metre dimensions |
| 03 | harbor-water | Two 2K normal maps, 1K foam, 512 caustics, 256×1 depth LUT, GLSL shaders and Three.js material factory |
| 04 | ridge-trees | Oak/sycamore/eucalyptus bark sets, leaf atlases and companion maps, 12k/3k/600 LODs, wind/backlight helper, eight-view color/normal/depth imposters |
| 05 | ground-cover | Five 4K ground PBR sets, ground-cover atlas, six rocks × three LODs, 2K shared rock PBR, shoulder blend weights and density suggestions |
| 06 | trackside-props | 22 prop variants × three LODs, 4K shared PBR trim, chain-link alpha material, metre-based route placement helper |
| 07 | wooden-sign | Painted and routed/paint-filled signs × two LODs, five planks, preserved official logo, grain/flaking finish, 3mm routed relief and logo-bounds regression test |
| 08 | ui-hud | 45 SVG components, 2× PNGs, component/nine-slice metadata, all 19 icons, Barlow Condensed ExtraBold and OFL license |
| 09 | vfx | 14 timed flipbooks, useful normal companions, soft/streak particles, lens dirt/streak/raindrop textures, periodic 64³ noise volume |
| 10 | skies | Five 8K HDR backgrounds, five 1K lighting inputs, five genuine prefiltered CubeUV EXRs, source provenance and lighting metadata |
| 11 | points-token | Four coin/gear pickups, idle/orbit animation, runtime scale/flash/shatter helper, 604/732 triangle budgets |

## Resolution and provenance

The owner approved a hybrid of CC0 scanned materials and generated artwork after
the built-in image tool returned 1254×1254 rather than requested 2K/4K output.
Native-resolution scans are used for asphalt, bark, wood, rock and ground.
The 4K foliage/card/decal atlases are disclosed resamples of preserved 1254px
sources; they do **not** contain native generated 4K detail. Leaf-card normals
are flat card normals, and roughness/translucency are authored values rather
than scanned per-leaf surface measurements.

`GENERATIONS.md` records the built-in imagegen usage and source mapping;
`REQUEST.md` preserves the complete requested prompt set. Per-material and sky
JSON records contain original source URLs, authors, licenses and hashes.
All Poly Haven material and sky inputs are CC0. The official SlingMods source
artwork remains unchanged; the paint finish is a separate derived texture.

## Verification

- Six targeted checks: exported sign padding/aspect; pickup triangle budgets and
  idle clips; tree LOD triangle counts and wind channels; route-placement math;
  shared GLB texture references; HDR/EXR structure and lighting directions.
- Browser-rendered model previews and UI exports.
- Water day/night and tree-wind shaders compile and render. Wind time changes
  rendered pixels. This is a shader harness, not live-route gameplay proof.
- Texture checks: PNG/KTX2 dimensions and hashes; non-flat height fields; actual
  puddle coverage; wet-color multiplier and puddle roughness; normal lengths and
  periodic edge statistics; flipbook frame dimensions/variation; imposter views.
- Blender independently reads all five prefiltered EXRs and checks finite,
  nonzero radiance. Exposure normalization prevents half-float overflow, with
  the restoration multiplier recorded in each rig.

Exact results are in `validation.log`, `texture-validation.json`,
`shader-validation.json`, and `exr-validation.json` alongside this file.

## Remaining integration and art acceptance

1. **Existing scenery is not replaced/re-exported by this task.** Another task
   was actively editing the existing ridge sign/scenery and game files. P11
   signs and their tests are ready separately; combine with that work deliberately.
2. The authored models and foliage need review in the actual routes. They are
   not asserted to meet the brief's final driving-simulator screenshot quality.
   Pickup readability at 80m/100mph, effect scales, LOD transition distances,
   foliage density and performance have not been validated in gameplay.
3. Road atlas longitudinal strip seams need visual acceptance. The eight-view
   tree imposters use octahedral direction coordinates with discrete azimuth
   samples; they are not a densely sampled full-sphere octahedral atlas.
4. The source skies are photographic sky-only substitutes. The golden-hour
   sun elevation is measured from the source, not exactly 8 degrees. Kelvin is
   estimated and directional intensities are starting values; scene exposure,
   fog and night reflections need integration calibration.
5. P11 has its own asset manifest. It is not added wholesale to the game's
   production download allowlist; consumers should register only selected
   runtime assets and shared dependencies when they integrate each kit.

No deployment or publication was performed. Existing unrelated changes in the
checkout belong to other work and were not altered by this task.

## Rebuilding

Use the retained sources and scripts in `scripts/p11/`. Requirements are Blender
4.5.2, Node/project dependencies, Python with numpy/Pillow/requests, and Basis
Universal 1.16.4 at `.tools/p11/basisu.exe` (npm package `basis_universal@1.16.4-1`).
That tool installation is local and is not an asset. Generated source PNGs are
delivered, so rebuilding does not require rerunning image generation.

Order: acquire-materials/acquire-skies; build-water-data; prepare-material-data;
prepare-sign-paint; build-atlases; build-ui; build-effects; Blender build-models
and build-trees; share-glb-textures; render-assets; check-shaders; compress;
validate-assets.test/validate-textures/Blender validate-exr; finalize-metadata;
build-review. Keep `public/assets/p11`, `assets/p11`, and `scripts/p11` together,
plus the existing official brand/font inputs referenced by the scripts.

GLBs intentionally reference `../shared-textures/` to avoid embedding gigabytes
of repeated PNGs. Copy the complete pack or retain those relative dependencies.
