# P06B environment source

Editable Blender authoring sources are `quality-foundation.blend` and `quality-kit.blend`. Every used texture is packed. `sources/` contains the selected official CC0 original material files and API responses; these are asset downloads, not site previews. Runtime never reaches those hosts.

Rebuild from the repository root:

```powershell
python scripts/p06b_acquire_materials.py
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python scripts/p06b_quality_build.py -- --stage full
```

Acquisition requires Python requests/Pillow/numpy and only the bounded free official files recorded in `public/assets/showcase-quality/source-manifest.json`. It reuses already downloaded originals with verified provider MD5; all original and derived SHA256 values are recorded. Blender 4.5.2 includes authoring numpy.

This is a presentation replacement. The accepted harbor source, vehicle, driver, physics, centerline/checkpoints/colliders, rules and saves are untouched. The editable foundation retains road/barrier vertices and topology while remapping meter-scale UVs and materials. Kit modules retain runtime `kit_MODULE__MATERIAL` names, origins in meters with +Y up after glTF export, and layout preserves protected physical warehouse bounds.

Palms are original meshes: curved tapered trunk, rachis and individually folded narrow leaflets with negative space. Mid/far meshes reduce leaflet/rachis detail while retaining crown/root position. They are actual geometry LODs, not lower-quality screenshot-only variants. Foliage uses geometric normals and solid material response, not alpha-cutout cards.

Material sources, map channels/color spaces, scale and derivations are in the runtime manifest. Asphalt uses an intact source crop with reflected extension; tangent normal components flip with reflection. The source is 3 m across; the coordinated 512 px crop plus reflected extension makes a 1.5 m / 1024 px repeat. Source photo grain scale is retained. Paver concrete belongs to horizontal sidewalks; clean pale source-derived mineral finish belongs to barriers/curbs; weathered cast wall concrete is restricted to quays. Clean plaster and sparse grass are bounded CC0 alternates for maintained walls/ground; selected leafy grass is limited to planting pockets. No noise-atlas substitute.

Unchanged source photo maps are shared per material family. glTF material extras bind the source channel SHA256 values; AO uses the Blender glTF Material Output Occlusion input, OpenGL tangent normals use Non-Color, and albedo uses sRGB. Three's runtime importer must retain these conventions.

The original decorative Harbor_land shell is removed from the foundation export and replaced in the kit. The new landscape begins with the accepted exact Blender road/runoff cut. A collection Boolean subtracts the whole paved union, so there is no grass mesh under service lanes/aprons/asphalt. Concrete lanes and aprons are one coplanar polygon union; asphalt hardstanding has corresponding holes. This fixes true overlapping floor geometry rather than lifting surfaces away from the physical ground. Source validation casts 3,080 rays across the authoritative road/runoff; zero strike the landscape. The physical ground collider itself stays unchanged in route.json.

The five former overlapping far-shore plates are replaced by one continuous low bank with a sloped water edge. Paved service circulation connects the verified warehouse footprints, with boat maintenance cradles, loading markings and planted islands. Grouped palmettos/grasses and three-tier arching palm crowns replace isolated broad leaves. The accepted vehicle is untouched. Outdoor depth/sky/water rendering is a separate integration lane; source-file checks do not approve its runtime visual result.

The compact bay retains the accepted car origin. The rear wall has actual vertical depth, the service opening has reveals and an exterior context, and a clean source-derived epoxy response uses one slab with proper control joints. No tiled-paver floor or invisible room substitute is intended.

The distant mainland now forms a nonoverlapping north/south/east ring around the finite local terrain. It covers x greater than -28 outside the old ground's z -410/+310 ends as well as the inland x 380 edge, preventing the empty-world sky wedge seen in the intermediate overview. Boundary joins share zero grade. Distant water/land cover the 8 km diagnostic frustum; all remain decorative. An additional 87 source BVH rays verify that distant ring, including 7 km sample points. Runtime overview review remains separate from that geometry check.

Final bounded near-prop repair: the photographed leaf/soil map is calibrated to dark mulch (original retained; exact RGB transform in the acquisition record), and smooth thin metal edging physically contains each pocket. Skiff hulls use a 25-station curved planing sweep with a raised bow, curved chine and continuous gunwale rather than the earlier five-station faceted shell. Mooring and workstand positions stay unchanged. These remain decorative environment props.
