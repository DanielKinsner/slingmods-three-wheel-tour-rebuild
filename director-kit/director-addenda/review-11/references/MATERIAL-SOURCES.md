# Material and lighting source decisions

Selected by Astra on 2026-09-14 from the providers' official public pages. **These are acquisition references, not a claim that the asset binaries are included in this director packet or installed in the game.** Download bounded asset files through the providers' supported public download paths/API terms, record hashes and retain source records. No paid vault, add-on, subscription or new account purchase is required for this selection.

## Rights

- Poly Haven asset license: https://polyhaven.com/license — its asset files are CC0, including commercial redistribution. Website logos, text and some preview/render content have separate rights. Do not turn site screenshots into game maps.
- ambientCG license: https://docs.ambientcg.com/license/ — downloadable assets are CC0; it explicitly allows raw asset inclusion in a video game. Use it as an alternate source when an equivalent material is a better fit or the first provider is inaccessible.

## Selected starting library

| Role | Official source | Usage decision |
|---|---|---|
| Dry asphalt aggregate | https://polyhaven.com/a/asphalt_02 | Use a correctly scaled source/derived set with restraint. Provider says3m-wide coverage. Do not make smooth race pavement look like coarse gravel or blanket it in giant cracks. Derive a cleaner base and use weathered variations sparingly as needed. |
| Concrete/paving | https://polyhaven.com/a/concrete_pavement_02 | Sidewalk/apron surface; use real joint dimensions and do not repeat one obvious stain down the entire track. |
| Weathered concrete | https://polyhaven.com/a/concrete_wall_006 | Quay/service wall only where appropriate. Maintain more orderly terminal/showroom finishes. |
| Dock timber | https://polyhaven.com/a/weathered_brown_planks | Actual grain, edge/joint variation and consistent plank scale, not sinusoidal brown stripes. |
| Palm trunk surface | https://polyhaven.com/a/palm_tree_bark | Source says1.3m-tall coverage. Bark texture is not a complete tree or frond solution. Author suitable shapes and fronds in Blender. |
| Planted ground variation | https://polyhaven.com/a/leafy_grass | Source says2m-wide coverage. Use selectively; do not carpet a Florida maintained lawn with the same fallen-leaf photograph. A cleaner verified CC0 turf/soil alternate is allowed. |
| Daylight sky/light probe | https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky | Bright partly cloudy midday pure-sky HDRI. Use a game-resolution derivative and properly filtered IBL; align the direct sun/sky. Do not ship a75MB4K EXR merely because it is the default page selection. |

These choices establish a material-quality floor, not a prohibition on better verified free equivalents. Do not spend half the run searching a perfect leaf texture. Use the selected sources, then spend effort on correct mapping, composition, geometry and lighting.

The source daylight HDR is a pure sky; it is not a night environment. Author a coherent night sky/lighting setup for this harbor, or choose another verified free suitable source without importing an unrelated terrain/horizon into the scene. Reuse source artifacts only where physically and visually appropriate.

## Technical primary references

- Three texture/color-space properties: https://threejs.org/docs/pages/Texture.html
- PMREM environment prefiltering: https://threejs.org/docs/pages/PMREMGenerator.html
- glTF import: https://threejs.org/docs/pages/GLTFLoader.html

Verify methods against the installed versions. These sources support the pipeline; they do not prove that the game's new materials or lighting look good. The actual full runtime view is the acceptance evidence.

## Required per-asset record

`id`, provider, original asset page, download URL actually used, license page/identifier, acquisition date, original file hash, derived file hash, resolution, physical scale, map channels/color space/normal convention, local Blender/runtime path and transformation/bake notes. Retain attribution voluntarily where practical. Do not log credentials.
