# Original P06 showcase source

`showcase-kit.blend` retains individually named, editable construction pieces before export grouping: terminal canopy, glazing/jambs/recesses, mounted event lettering, gantry, paddock, service warehouse, dock/piles/cleats, background skiff hull/cockpit, pavilion, planters, drainage, lifting equipment, three palm crowns, distant shore, water and compact garage. All geometry and texture images are original local authoring; no downloaded model, image, paid generator or geographic map was used.

`preserved-foundation.blend` is a new file containing an exact semantic subset from the accepted `assets/blender/harbor/harbor.blend`. The original file is untouched. The export retains road/runoff/land, physical curbs and barriers, paint, quay coping, lamp masts/bases/diffusers and freight container collision-visible boxes. Warehouse replacements scale to the original six blocker dimensions. No physics data is derived from the new decorative kit, and `public/assets/harbor/route.json` remains authoritative and byte-identical.

The sole retained-road material change is `Showcase_Dry_Asphalt`: a new copied basecolor map with linear RGB multipliers 0.62/0.76/0.90 to cool the previous brown cast. Its original 2-metre UVs, roughness map, +Y normal, geometry and physics coefficients remain unchanged. `foundation-preservation.json` binds the geometry/UV hashes and map color spaces. Six small irregular edge patches are visual planes only, below the road-paint cues; no physical surface change. New gantry supports stay outside the barriers, with 4.14-metre clear underside and placement 22 metres ahead of the unchanged timing line.

Reproduce from the repository root using installed Blender 4.5.2:

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/p06_showcase_build.py -- --stage full
```

This command writes only new P06 showcase sources/exports/evidence, never accepted vehicle/driver/product/harbor sources or route data. `--stage sample` labels the internal terminal proof; runtime `loadShowcaseHarbor(..., 'sample')` limits placements to the terminal and adjacent first 165 metres of waterfront, physical foundation, water and distant shore. It is inspection-only. Ordinary integrated play uses `full` after local runtime review.

The 2048×2048 original sixteen-tile atlas has sRGB base color and separate linear ORM and +Y tangent normal images. Materials distinguish concrete render, coated metal, timber, leaf, stone, restrained red, inset glass, cladding, hull, rubber, service yellow and epoxy. Garage floor faces repeat the atlas at approximately 0.6 metres. Water has its own 512-pixel periodic tangent normal at a 12-metre UV repeat, animated by texture offset; it uses the existing environment reflection, with no extra scene reflection pass.

All images are saved as PNG and packed in editable Blender sources. Runtime source modules are shared in 70-metre spatial instance cells with explicitly recomputed bounds; only terminal/warehouse/pavilion/gantry silhouettes cast additional shadows. Palms, drains, docks, skiffs and distant shore do not. No abrupt distance LOD is used; the authored modules are deliberately modest geometry. Dynamic practical light count remains lead-owned and unchanged by this module.

Garage geometry preserves the vehicle `(0,0,0)` origin, floor top at zero, existing inspection orbit and rear wall at runtime Z=6.8. Broad ceiling fixtures sit at X=-2.5/+2.8, Y=3.845. No pedestal or vehicle transform adjustment is introduced. Neutral inspection remains a separate retained route.

Exact source-object fingerprints, route hash, GLB primitive/triangle/material/UV counts and source/map provenance are in `director-kit/production/evidence/P06/artist/`. These are authoring checks; actual runtime visual and performance acceptance are separate lead-owned evidence.

Run the read-only source/export contract check with `python -X utf8 scripts/p06_showcase_validate.py`. It validates 297 exact retained source objects, the unchanged source/route hashes, all six replacement warehouse collider matches, every exported primitive's UV and normal map, water-facing direction and spatial placement limits. Full course dressing is 250 placements from 22 reusable modules; it adds no physics world or collider. The initial sample and repaired sample were inspected at normal runtime cameras before full dressing was enabled; these local art decisions do not advance G3/G4.
