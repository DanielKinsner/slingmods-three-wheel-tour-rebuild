# P03A construction checkpoints

P01 sources, exports, contact layout and historical gate evidence remain unchanged. `export-validation.json` checks current Git blobs for the baseline as well as actual exported candidate transform equality. The candidate is never a replacement for the accepted default merely because it exports.

## Checkpoint 01: cubic sectional surfaces — rejected

Replaced P01 primary sheets with longitudinal/cross-sectional Hermite quad patches, thick returned surfaces and closed sill/shoulder shells. Rebuilt dashboard/console and cupped seat construction. The 42-primitive export reduced the prior 214 primitive submissions, but lead/runtime inspection rejected remaining lamp gaps, overly rounded/bathtub-like side construction, insufficiently recessed controls and seat/cowl fit issues. Preserved candidate source/export in `revision01/`.

## Checkpoint 02: local continuity repair — rejected

Joined central lamp cheeks; corrected seat front normals and forward bolsters; exposed a complete gauge binnacle and screen; enclosed inner wheelhouse; deepened shoulder shell; connected the inlet housing; tucked the structural rail. Lead runtime review confirmed the instrument and aperture improvements, but still rejected inflated/rounded primary surfaces, the wheelhouse's square hanging outline, cowl/glass gaps, simplified console and ragged headrest intersections. Preserved candidate source/export in `revision02/`.

## Checkpoint 03: construction-method change — partial surface release

The hood and wing transverse sections now use **ruled faces** between deliberate section creases, with sharp-edge normals at crease lines and shallow longitudinal curvature. The central crown is flatter. The sill uses **linear longitudinal shell segments** and flatter outside section lines instead of a globally curved bowl. A planar recessed forward triangle and lower rocker return restore the reference's distinct intake/boarding shapes. Rear shoulder longitudinal construction similarly retains defined planar changes rather than smoothing all stations.

The front inner wheelhouse now tapers upward toward its forward endpoint rather than ending as a hanging rectangle. The windshield foot follows the transverse cowl profile, with a shaped bottom seal. Seat piping is a smooth manufactured edge; its upper cap is moved in front of the upholstery so it no longer crosses the headrest surface. Console contains a recessed switch island, inset three-button pod, round control ring and dark storage pocket. The tail's center fin is a tapered molded solid with a substantial base and real cross section.

This was an actual topology/construction change, not a paint or postprocessing treatment. Checkpoint 03 remained unmapped. Lead and independent review accepted the hood/wing/wheelhouse/fin direction, while requiring a recessed screen, real console pocket, explicit planar shoulder wedge and physical cowl cleanup. Blender diagnostic images in this folder are separate from the lead's actual browser captures. Statistical checks do not approve the visual result.

## Checkpoints 04 and 05: exported failure, diagnosis and surface release

Revision 04 introduced an extreme evaluated Solidify miter on `windshield_cowl_bridge`: the cross section doubled back and even-thickness compensation extended geometry approximately 79 metres. Pivot-only checks missed this. The failed source, GLB and source diagnosis remain in `revision04-failed/`; see `revision04-failure-diagnosis.md`. The Boolean storage pocket was not the cause. The repaired builder disables even-thickness compensation, checks every evaluated source object's bounds before export, and the verifier checks actual per-vertex GLB world bounds against P01 within 1%. Export batching now bakes transforms into each binding's local space with identity batch transforms.

The remaining bright cockpit triangles were identified by source raycasts as the console's upper return piercing the dash, and removed by lowering that hidden station. Checkpoint 05 runtime review by the lead and independent reviewer confirmed the explosion and bright triangles gone, a real pocket cavity and improved planar shoulder wedges, and authorized materials. The stable unmapped checkpoint is preserved in `revision05/` (GLB SHA256 `055ce03cda34b625eee168dc9ce56a681c9356cec463ccde84c105da4c9a0242`).

Before mapped export, the redundant intersecting dash/cowl patch was replaced by one continuous dash surface, with the windshield foot sampled by raycast against its evaluated geometry. Shoulder wedge faces were explicitly triangulated and given a smaller 3mm edge radius. These are bounded seam repairs; the accepted hood and wing construction was preserved.

## Mapped candidate and reproducibility

From repository root, PowerShell:

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' -b --python scripts/vehicle_p03a_build.py -- --finish
python scripts/vehicle_p03a_verify.py
& '.tools/blender-4.5.2-windows-x64/blender.exe' -b --python scripts/vehicle_p03a_inspect.py
```

The builder opens the protected P01 source read-only and writes `assets/blender/vehicles/slingshot-p03a.blend` and `public/assets/vehicles/slingshot-p03a.glb`. Source components stay separate and editable. Evaluated export copies are batched by material and semantic/dynamic parent, so front calipers steer but do not spin, and wheel spin nodes remain untouched. Image paths are relative in the editable source. `--maps-only` instead writes `slingshot-p03a-material-lab.blend` without exporting the candidate; omit flags for an unmapped diagnostic rebuild.

All 16 PNG maps in `public/assets/textures/p03a/` are authored technical constructions in `scripts/vehicle_p03a_materials.py`, with no downloaded photos or baked directional lighting. Five material families have actual basecolor, packed metallic/roughness and OpenGL tangent-space normal images: clearcoat Radar Blue paint, directional tire rubber, molded polymer, stitched upholstery and machined alloy. A separate passive instrument-scale image adds dial ticks. Paint graphics are reference-guided approximations, not OEM artwork. Glass, optical lenses, black wheel barrels, machined faces and stationary red brake calipers retain distinct material behavior. The instrument display is inactive; dynamic gauge/readout operation is not claimed.

Current export: **52 color primitives, 176,218 triangles, 16 embedded images, 7,726,756 bytes**. `export-validation.json` records exact source/export hashes, unchanged baseline blobs, protected transforms, dimensions, UV channel references and actual mapped material channels. The complete GLB world extent is **1.996 × 1.312732 × 3.799m** (width × height × length), matching the P01 asset.

The 16 maps total **45,088,768 bytes (43 MiB)** at uncompressed RGBA8 base level; **60,118,357 bytes (57.33 MiB)** estimated with mipmaps. These are texture allocation estimates, not measured GPU residency, and exclude geometry buffers, renderer targets and environment maps. PNG transfer compression does not reduce decoded texture allocation. The GLB embeds the maps, while the external PNGs remain editable source dependencies.

This is a showroom-detail candidate below the provisional 250k showroom ceiling, above the 140k provisional racing ceiling. The inspection pad deliberately uses the same high-detail asset for comparison. **No LODs or racing optimization are delivered here**, and the same-asset pad is an explicit provisional exception, not a racing-budget PASS. No hardware performance claim follows from triangle/primitive census. Runtime inspection, light sweep, same-view A/B stats and the independent reviewer remain the visual/performance evidence. G3, rider, other vehicles and broader environment remain outside this packet.

## Material review 01: reference correction

Actual browser screenshots in `../material-color-01/` showed violet/cobalt paint, inadequate simple line graphics, R/N/D text floating above a blue console, opaque marker blocks, flat lamp inserts and faint tire tread. Source image byte inspection found the blue map center pixel was RGB `(3,17,112)`; its green channel was too low. The exported material correctly used sRGB basecolor with no unintended color factor multiplication. The revised map raises green toward the exact-year blue/cyan reference family and uses authored polygon masks for broad dark/orange tapered hood graphics and filled slanted rear shoulder wedges.

R/N/D source boxes had absolute mesh coordinates followed by an object rotation, which moved them away from their intended labels. The revised buttons apply slope to vertices relative to their centers, sit on a real black pod, and carry their own registered labels. The center stack has three rocker switches, a round starter and a filled round lower control. Marker lamps have dark recesses, multiple reflector cells and a clear amber cover. Main upper/center lamps add dished metallic reflector cells and projector centers beneath transparent covers; optical parts keep separate light bindings. Tire groove contrast, width and tangent-space depth were increased after real runtime inspection. Headrest trim is subdued upholstery gray.

The first mapped source/GLB/scripts remain in `material01/`. The revised finish still requires the lead's actual browser closeups and independent review; source file presence alone does not establish optical, tread or material credibility. Runtime texture objects may duplicate shared images across UV roles, so the 57.33 MiB authored-image estimate must be reported separately from the lead's measured unique runtime texture estimate (which was higher in the first mapped capture).

Material-color-02 actual browser front/cockpit/side images confirmed the paint and button improvements, but one mirrored upper lamp and center cells were hidden by original Solidify back walls. Material03 removes those inconsistent winding-dependent back walls, places the black backplates 18mm behind the cells, and keeps the clear covers forward of opaque reflector cells. Material02 source/GLB remain in `material02/`. The lead's close-wheel/lamp capture remains necessary to approve that repair.

Material03 browser front and close-material images then exposed a second independent occluder: filled duplicate bezel sheets. Actual source rays showed left-bank bezel Y2.03644 ahead of reflector Y2.03184, and center bezel Y1.957 ahead of projector Y1.953. Material04 removes the filled duplicate interiors and builds **open perimeter rims**, retaining dark backplates behind the cells. `source-optical-visibility.json` records three evaluated source rays whose first opaque hits are now the left reflector, right reflector and center projector. The builder asserts that visibility before it saves or exports a mapped candidate. Material03 source/GLB and failure rays remain in `material03/`. Final runtime optical visibility must still be reviewed, independently of these source checks.

## Frozen artist handoff: material04

GLB SHA256: `5ca79ccf1608491a4c82079d570d0928c85c3581f5ebcf7d557404864250cee2`.

The artist inspected the actual browser `../material-color-04/front.png`, `material.png`, `sweep-1.png` and `sweep-3.png`: all three optical banks are now visible; close wheel view shows the directional tread, red caliper and different barrel/face finish; marker cells sit inside a dark housing; paint and polymer respond differently as the light moves. The source Blender front render independently agrees on optical visibility. The asset is frozen for the lead's independent acceptance decision. This observation does not promote G3 or imply OEM-CAD accuracy, animated displays, LOD coverage, hardware FPS, or final photographic fidelity.
