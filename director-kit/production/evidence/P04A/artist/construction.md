# Harbor route01 — undressed construction checkpoint

Original fictional closed harbor venue, authored in Blender 4.5.2 from `scripts/harbor_build.py`. No existing game/world assets or outside geospatial data were imported. The frozen route contract is honored by `public/assets/harbor/route.json`.

The exact circular-fillet/straight layout measures 1,230.867 m, sampled at approximately 1.998 m. Usable roadway is 11 m with 3 m gravel runoff per side. The first 200 m follow the waterfront straight from finish [0,0] toward -Z. Start is [0,5] facing -Z, five metres before the line. Sixteen directed gates average76.93 m apart; checkpoint0 is finish. Rounded corners include60–65 m broad sweeper radii, one40 m direction-changing bend and a46 m slower corner. These are design parameters, not verified real-road geometry.

The Blender source retains separately editable road, runoff, paint, curb, barrier and ground meshes; export joins static surfaces by material. All660 curb/barrier collider boxes come from the same exact JSON records used to construct their visible cuboids. Curbs are60 mm tall, 350 mm wide and centred5.7 m off centerline; their inner edge is5.525 m, outside usable asphalt. Barriers are centred10 m off centerline beyond the runoff. Visible paint is non-colliding. Ground top is0 m; asphalt render surface is2 mm above it.

`route01-geometry-check.json` records finite positions, no centerline intersections, consistent closing-seam distance, spawn and gate directions. `route01-blender-overhead.png` is an actual diagnostic Blender render, explicitly not runtime evidence. Render mesh census is14,116 triangles/5 primitives. SHA256/files are in `route01-export.json`.

Reproduction from repository root:

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python 'scripts/harbor_build.py'
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python 'scripts/harbor_validate.py'
```

No dressing or authored material maps are present at this checkpoint. The lead must complete a real-physics lap and basic validity checks before authorizing scenery. This geometric check is not route playability, final visual approval, hardware performance, or G3/G4 acceptance. All car, driver, bay and pad assets are unchanged.

## Dressed01 after local route-playability clearance

The real-physics control trace completed a valid78.7192038846-second lap through all15 non-finish gates, with51.597 mph maximum speed and0.6156 m maximum centerline offset. No reset or teleport occurred after spawn. That is the gameplay worker's automated ordinary-controls evidence (`P04A/harbor-route-probe.json`), not human enjoyment or physical-controller certification. Lead authorization then released this bounded scenery stage.

The route core and original660 collider records remain exact deep-equality matches to undressed route01. Ninety setback prop boxes were appended, plus39 lamp position/target pairs. The closest tested new box corner/centre is11.9606 m from centerline, outside8.5 m asphalt-plus-runoff. `dressed01-validation.json` records this check. The immutable route01 source/GLB/JSON/script are preserved under `artist/route01`.

The original Blender kit contains three warehouse construction families across six buildings (plinth, framed wall bays, clerestory, pitched/sloped roof panels, roller doors, loading canopy/apron), ribbed freight containers, two service-fence runs, locally varied tapered palms with folded open fronds, streetlight mast/outreach/hood/diffuser modules, direction arrows and compact gate markers. The200 m start waterfront adds a paved quay, coping/rail modules, four timber piers with piles/bollards and four deliberately simple authored marina skiffs. It is a compact industrial harbor rather than a detailed yacht fleet or full city. The flat invisible safety ground continues beneath the water behind the outside road barrier; the driver cannot fall into an unbounded void.

All visible geometry is authored in Blender. The editable master retains module objects; the GLB batches static geometry by material. Dressed01 census:113,472 triangles,7 primitives/materials,18,945,008-byte GLB. The full loop receives the same road/barrier/lamp/palm vocabulary; industrial structures and fences continue on the back straight. Only distant trim density is reduced. Day/night illumination and stock vehicle lamp response are lead-owned runtime work. The39 light records support a small moving pool, not39 shadow lights. Current fixture material is `Harbor_Luminaire`; the lead controls day/night emission. No other visible runtime geometry is needed.

Three original deterministic1K PBR families (asphalt, concrete, compact eight-tile harbor atlas) provide nine basecolor/normal/ORM PNGs, packed in the source and embedded in the GLB. Actual file hashes and provenance are in `texture-manifest.json`. No stock or downloaded images/models were used. Unique RGBA8 image storage is37,748,736 bytes without mips or50,331,648 bytes with mips; runtime texture allocations and renderer performance remain separately measured. These are dry materials; day/night does not change route grip. Scale-aware road/concrete tiling and subdivided modular wall/roof bays avoid applying one tiny wall texture across the whole venue.

Rebuild the dressed candidate from repository root:

```powershell
$env:HARBOR_DRESS='1'
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python 'scripts/harbor_build.py'
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python 'scripts/harbor_inspect.py'
```

Dependencies are the existing local Blender4.5.2 runtime and its bundled numpy. `harbor_build.py` imports `harbor_dress.py` and `harbor_materials.py` for dressing. `harbor_validate.py` is the original undressed geometry diagnostic. The inspect script validates route preservation and renders separately labelled Blender diagnostics. Final runtime day/night images, source freeze, performance and independent visual decision are required before calling this packet complete. Car/driver/bay/pad source and maps were not edited.

## Dressed02 bounded runtime correction

Lead runtime inspection found strong concentric road/runoff shadow artifacts and reversed venue-board lettering. Dressed01 is preserved under `artist/dressed01`. The corrective export separates large receiving surfaces into `Harbor_Land` and `Harbor_Water` material/mesh groups so the runtime can exclude them from shadow casting while retaining building/palm shadows. They reuse the exact same existing atlas images; no texture size or pixel change occurred. The whole route JSON, including all750 colliders and39 lamps, is unchanged. The start identity panel's text now faces toward the roadway and lies against its panel. Warehouse front text orientation was already correct.

Dressed02 is113,472 triangles/9 primitives. Source SHA256 `d9c02cfddd72aed62ca7669b0bede4d928e1f1182712bed921d351e4a66a0486`. GLB18,945,536 bytes, SHA256 `a74b75b9c7460aefad2caacb94e27d6ad1f563bcad3eb8b8ae50102c6c132d1d`. Route SHA256 remains `c6ea6764b11f8aa2110ee1f3c9fe41393908665e64f53d34de25cc55ce1a4e19`. `dressed02-validation.json` compares all nine embedded image hashes with dressed01 and proves they are exact matches. Runtime shadow diagnosis and visual acceptance remain lead-owned; the asset separation itself must not be called the demonstrated final fix before the new actual screenshots are reviewed.

## Dressed03 — remove overlapping land beneath the course

The same-pose runtime diagnostic proved that hiding only `Harbor_Land` restores the foreground road; disabling shadows does not. The correction therefore changes the land construction itself. `harbor_dress.py` now calls `harbor_land_cut.py` immediately after creating the land box. A closed quad ring follows the shared 616-point asphalt-plus-runoff boundary at ±8.5 m and extends vertically through the land box. One exact Blender Boolean difference removes that complete footprint. The resulting applied mesh remains editable and manifold. The road/runoff height and every physical surface/collider remain unchanged. No terrain lowering, polygon-offset dependency or shadow adjustment is part of this source repair.

Dressed02 source/GLB/route/scripts and both current manifests were preserved under `artist/dressed02` before mutation. Its named export evidence is unchanged. The new export record is `dressed03-export.json`; the updated current file list is `artist-final-manifest.json`. The new helper and its independent exported-geometry verifier are required handoff files: `scripts/harbor_land_cut.py` and `scripts/harbor_land_verify.py`.

Actual GLB verification (`dressed03-export-validation.json`) casts 18,480 downward rays across authoritative and half-segment cross-sections, including road and runoff out to ±8.49 m: zero land hits. Another 1,232 rays at ±9 m hit outside grass at Y=0. Land runtime bounds remain [-28, -0.25, -410] to [440, 0, 310]; its 4,940 triangles replace the former twelve-triangle box. The full scene is 118,400 triangles and 9 primitives. All eight other material groups retain exact expanded triangle position/normal/UV attributes. All nine embedded images and the entire route JSON are byte-identical to dressed02. Source mesh has zero non-manifold edges. No margin beyond the shared ±8.5 m corridor was needed by these checks.

Current GLB: 19,211,796 bytes, SHA256 `67bdc8e0fea6b5fdb9b0ab692803c9806cee0cc74d6b0cd650b4537e4a9ae40f`. Editable source SHA256 `44bc615ef937ca5d6c2275194ff847b326520930778a479f1209dac09a69d7e1`. Rebuild with the existing `HARBOR_DRESS=1` command above, then independently verify the actual export:

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python 'scripts/harbor_land_verify.py'
& '.tools/blender-4.5.2-windows-x64/4.5/python/bin/python.exe' 'scripts/harbor_census.py'
```

Car, driver, their maps, bay and pad show no tracked source/asset changes from this correction. Matched runtime day/night visual approval remains a separate final check; the structural proof alone does not assert final cinematic or hardware performance quality.
