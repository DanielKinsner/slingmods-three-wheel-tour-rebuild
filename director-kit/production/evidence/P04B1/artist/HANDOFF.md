# P04B1 accessory handoff — TricLED SM-133 base RGB

Geometry revision **1 of at most 2**. Original Blender-authored accessory only; current car source, exported car and rear descriptor were read-only and hash-identical before/after. No vehicle or scenery was remodeled. No paid tools, copied site textures, optional kit components or remote-control simulation were added.

## References inspected at authoring time

Verified September 11, 2026: [SlingMods SM-133 product page](https://www.slingmods.com/polaris-slingshot-underglow-kit). It lists TricLED, Kit #1 RGB with remote, 2024 Slingshot R fitment, and separate upper spoiler/grille, interior, swingarm and 2015–2019 halo options. Those options are excluded. No live price, availability, loyalty points or purchasing endpoints are shipped.

The page links [SlingMods' standard-kit installation video](https://www.youtube.com/watch?v=uuyfunQvgwc). Read in a hidden browser tab with audio muted; installation frames and the public auto-generated transcript were inspected. At 0:52–1:03 the presenter distinguishes the base installation from later add-on videos. On-screen labels at 1:38 and 2:15 identify two long 102-inch strips and two 36-inch front strips. At 4:38, the front strips adhere beneath the **lower** front plastic return. At 5:17–5:45, extensions route above the subframe and strips follow its outer edge. This lower-front base placement is different from the optional upper spoiler/grille kit.

The linked video shows an earlier-generation Slingshot, approximately 2015-era, not a measured 2024 R installation. The current page establishes fitment; the old video establishes base-kit mounting regions. It does not establish every 2024 mounting coordinate.

## Explicit approximation

Four visible mounting regions are represented: two lower cabin floor/frame-edge runs and two lower splitter-following runs. The accepted game car does not contain the earlier vehicle's complete exposed chassis route. The visible long runs are 1.2m each; they are not represented as the full 102-inch physical cut lengths. Hidden continuation, receiver, full wire harness and invisible connectors are omitted. Front runs follow the current molded blade, rather than enforcing the old car's exact path. These are photo-informed game fitting decisions, not manufacturer CAD, an installation tutorial or photometry. Material width, thickness and molded caps are original plausible approximations.

Housing is opaque neutral polymer. The separate continuous diffuser is physically based, opaque and emissive; the runtime presenter sets its solid color and strength. No transparency map, licensed texture, bloom or per-LED mesh swarm is required. All four strips share the same two material batches. There are no interior LEDs, wheel rings, halos, swingarm LEDs or grille LEDs.

## Deliverables and integration

- `scripts/product_sm133_build.py`: reproducible background Blender authoring and actual-export geometry checks.
- `assets/blender/products/tricled-sm133-base.blend`: authored accessory with a hidden read-only relative link to the accepted car's 774-object collection. Toggle `READ_ONLY_CAR_FIT_REFERENCE` for local fitting. Export uses only selected accessory objects.
- `public/assets/products/tricled-sm133-base.glb`: identity attachment under the existing chassis/vehicle root.
- `public/assets/products/tricled-sm133-base.attachment.json`: versioned paths, materials, light origins, source and approximation notes.

Runtime basis: metres, +X right, +Y up, -Z forward. Geometry is already in accepted car rest coordinates. Do not place under the spinning wheel or moving rear assembly. Material names are `SM133_Housing` and `SM133_Diffuser`. Suggested `lightOrigins`: `[-.61,.122,-.04]` and `[.61,.122,-.04]`; use at most two non-shadow lights. Their implementation is an artistic approximation and must still be checked in runtime against the road, barriers and body. In particular these two origins prioritize sill spill; they do not imply that the longer front strip is accurately photometrically reproduced.

Authoring command, from the existing rebuild root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/blender.ps1 -Script scripts/product_sm133_build.py
```

Uses the existing Blender 4.5.2 LTS and the existing `vehicle_p04a1_validate.py` GLB reader. No installation or network connection required to build the art.

## Exact export checks

`geometry01-report.json` records 2,368 rendered triangles, **2 mesh primitives / material draws**, 0 embedded images and 89,992 GLB bytes. SHA-256: `da206aaf6530a83479cb870e013c4efe7372a3ff9ffff038dccda9df19213d93`.

The fitting algorithm samples the actual exported fixed underside across each strip's complete width at 144 centers (432 rays). The housing top is 1.5mm below the lowest support ray, representing adhesive/fit tolerance; strips remain external to the shell. End caps are also included in the exported checks. Exact exported accessory/car BVH triangle overlap reports zero intersections. Rest plane Y=0 clearance is 118.234mm.

Rear separation is checked conservatively per region in the X/Z plane, ignoring Y entirely. The accepted rear linkage transforms operate in Y/Z and preserve X. The side strips remain outboard of moving rear parts and the front strips remain far forward. The accepted rear tire center/rig has not moved. The per-mesh gaps in the report include 16mm accessory-path padding. This is geometric separation, not a new suspension model.

`ground-pose-check.json` applies all actual exported accessory vertices to all **10,200 historical Review07 day-lap chassis poses**. Minimum distance above the flat road plane is **30.518mm**. This is a historical geometric pose check, not new runtime evidence or a promise of clearance after curb impacts/crashes. The new presenter and final driving demonstration must still be reviewed separately.

Actual GPU calls, default/off asset cost, teardown, scene parity, brightness, pavement spill and physics equivalence belong to the parent runtime evidence. No final G3/G4 or visual acceptance is claimed here.
