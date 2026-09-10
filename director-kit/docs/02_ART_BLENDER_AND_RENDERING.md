# 02 · Blender, materials, rendering, and asset acceptance

## Principle: runtime truth beats a flattering still

The asset's source of truth is an editable `.blend` with clear collections, materials, part names, source references, and export settings. Runtime deliverables are real meshes/materials/animations, not billboards or pre-rendered turns. Blender renders are useful for diagnosis; only captures from the actual game qualify as runtime visual evidence.

Blender is the authoring workshop, not the rendering engine of the browser game. Test the installed glTF exporter and the renderer's supported material features. Bake unsupported procedural node networks into transportable maps or implement a deliberate runtime shader. Do not assume a complex Cycles scene survives export unchanged. Verify against current exporter/GLTFLoader documentation [T2, T4 in SOURCES].

## Reference and geometry before decoration

Start all three vehicles with a dimension card and front/side/rear/three-quarter/cockpit reference board. Use exact year, trim, market equipment, and transmission. Public reference images are research material, not automatically licensed game textures. Record provenance and rights separately.

Build a neutral clay Slingshot with correct wheelbase, track, wheel diameters, ride height, body/cabin proportions, open cockpit, fenders, rear wheel, suspension and lighting signature. Build only cheap scale/silhouette blockouts for the two Can-Ams at this stage. Their purpose is to uncover dimensional errors and shared pipeline problems—not to claim three finished cars.

Compare wheel centers, hood outline, cockpit opening, roll hoops, lamp positions and silhouette against matched camera references. Use orthographic source images when available; photographs require perspective matching rather than pretending an arbitrary photo is orthographic. Known dimensions should match within a proposed 1% tolerance; ambiguous details must be listed, not fabricated as measured.

The Ryker source has a conflicting overall-length conversion (92.6 inches versus 2,532 mm). Treat overall length as unresolved in the reference seed. Use wheelbase and consistent widths for initial blockout. Resolve before its final dimension gate using another authoritative source, existing authorized photography, or a documented provisional estimate. Do not make Dan solve it. A provisional estimate is permitted for blockout, not a verified dimension label.

Do not model unseen bolts while the nose is the wrong shape. Do not create huge subdivision counts to hide primitive proportions. Hard-surface workflow: primary forms → silhouette review → panel segmentation/support geometry → secondary details → high/low bake → UVs → materials → LOD → rig → export → actual-game review.

## Spatial and asset contracts

Authoring units: meters, positive scale, identity root transform before export. Blender basis: +X right, +Y forward, +Z up. Runtime basis: +X right, +Y up, -Z forward. The intended conversion is `(x, y, z) → (x, z, -y)`; verify exporter output with a three-axis fixture rather than adding an untested second rotation.

Vehicle-root origin: ground projection midway between front-axle center and rear-axle center. The physical center of mass is a separate vector relative to this root; it is not automatically the Blender origin. Store both wheel-center coordinates and suspension hardpoints in the asset manifest. Render and physics consume the same authored contact layout.

Required node families (instantiate and document actual names, don't depend on ambiguous index order):

```text
vehicle_root
  body_static
  cockpit / seat / dashboard / mirrors
  steering_control
  front_left_steer -> front_left_spin -> wheel/tire
  front_right_steer -> front_right_spin -> wheel/tire
  rear_spin -> rear_wheel/tire
  suspension_front_left / front_right / rear
  lights_head / brake / signals / accessory
  mount_exhaust / mount_suspension_* / mount_underglow_*
  camera_cockpit / camera_nose / rider_seat
  rider_hand_left / rider_hand_right / rider_foot_left / rider_foot_right
```

Stock parts and optional products have declared slots. Installing a replacement hides/removes the correct stock part, does not duplicate wheels/shocks, and supports complete reversal. Accessories use stable IDs, not substring matching all meshes named "metal". Headlamps, brake lamps and emissive lenses are independently addressable.

Separate render mesh, collision mesh, LODs, and optional workshop cutaway. Static road collision should be smooth and authored separately from decorative road mesh. Three-wheel contact seams, curbs and barrier collision need review; bevels and visual cracks should not launch the vehicle.

Export bundles must include `.blend`, deterministic build/export script where practical, GLB, source/baked texture set, collision asset, mount manifest, LOD metadata, reference notes and a rights manifest. Keep all generated changes reproducible and inspectable. Never overwrite the only accepted asset with an unreviewed regeneration.

## Surface language

Paint: clear-coat response, believable panel curvature, restrained orange-peel/micro-normal at physical scale, no uniformly glowing edges. Rubber: rough, nonmetallic, believable molded sidewalls and tread; tread pattern should not be exaggerated merely to be visible in a screenshot. Plastics: painted and textured trim need different roughness. Aluminum, steel and carbon-like surfaces must remain distinguishable under moving light. Upholstery uses scale-correct grain/stitching. Glass has thickness/opacity appropriate to performance budgets; no giant expensive transparent volumes by default.

Maps: base color and emissive in their appropriate color spaces; normals/roughness/metalness/AO treated as data. Avoid baking directional shadows or reflections into paint base color. Pack channels deliberately, document tangent-space normal conventions, and verify no double AO or inverted green-channel artifacts. Exporter and loader settings must be tested using calibration materials.

Road: layered asphalt with macrovariation, patched regions, subtle aggregate, painted markings with distinct roughness, believable curb material. Detail scale matters more than random noise density. Dust and marks should tell a story without making every object dirty. Wet-looking showroom floors cannot compensate for missing contact shadows.

## Lighting and rendering choice

Use a fresh Three.js application with an explicitly configured WebGL2 rendering path and lightweight DOM/CSS interface; there is no inherited Vue UI. Build rendering behind a small scene/quality adapter so it can change without rewriting dynamics or catalog logic. WebGPURenderer offers a WebGL2 fallback, but it is a future evaluated alternative, not a mandatory migration or a guarantee of shader parity [T1]. Author new Blender sources and runtime assets; no old-game meshes or material bundles are inputs.

First prove TWO authored lighting scenarios: daytime and nighttime. Keep geometry fixed and compare identical viewpoints. Use image-based ambient/specular lighting, sensible tone mapping, localized shadow budgets, and controlled exposure. Do not use camera tricks or crushed blacks to hide body errors.

Day: one motivated sun, sky/environment reflections, readable contact shadow, soft ambient fill, textured rather than flat road. Night: readable headlight illumination, limited practicals, sparse pooled light, useful silhouettes, emissive sources that illuminate nearby surfaces via deliberate lights or convincing bounded approximations. An emissive mesh alone is not evidence of a headlight lighting the road.

Garage: baked static illumination/reflection capture plus a few important dynamic fixtures. Optimize car/body reflections before expensive full-scene postprocessing. Track reflections use local/zone probes where helpful; mirror and reflective-floor effects are quality-tiered. No arbitrary 8192 shadow atlas, ray tracing checkbox, or dozens of dynamic shadow-casting accessory lights without a measured need.

Full continuous time-of-day, volumetric weather, moving clouds and wet-surface physics are later work. The first night scene must be beautiful *without* them.

## World construction

Model every visible asset family in Blender: road modules, barriers, buildings, overpass kit, garage, signs, lamps, rocks, vegetation variants and paddock details. Reuse authored assets with instancing, trim sheets, decals and LOD; "model everything" does not mean uniquely sculpting each repeated bolt or tree. No map-sized single mesh. Keep track-critical surfaces and visual dressing separable so a handling change does not require rebuilding the city.

Start with a 150–250 m hero stretch, not an entire destination. Include a turn, a braking zone, road edge, barrier, two distinct surfaces and both open/covered light. A successful sample becomes the kit for the rest of the track. Avoid repeated high-contrast texture patterns, uniformly spaced trees, and impossible architectural scales.

## Provisional budgets — targets, not accomplishments

| Asset/system | Initial budget | Evidence required |
| --- | --- | --- |
| Hero car, showroom LOD | roughly 180k–250k triangles | silhouette/material improvement relative to cost |
| Hero car, racing LOD | roughly 80k–140k triangles | chase/cockpit view without obvious loss |
| Rivals | roughly 25k–60k near, lower with distance | no objectionable popping; accurate wheel/light silhouette |
| Textures | mainly 2K; selective 4K for showroom hero | compression, texel density and memory review |
| Initial selected car + slice | aim for <= 60 MB compressed transfer | measured manifest, not source-folder size |
| Desktop high preset | nominal 60 FPS at 1080p | physical GPU/browser recorded, timings over representative race |

These are ceilings to test, not geometry quotas. Do not add triangles just to meet a number. Optional effects degrade before geometry/readability. Do not bake art fidelity around software-renderer timing; report it separately. Mobile gets a reduced LOD/texture/shadow/rival preset only after desktop proof and must be tested on actual target hardware before a performance claim.

## Visual review rubric

For each hero, score reference fidelity, materials, lighting, contact/animation, and camera readability from 0–5 with written reasons and evidence. A proposed pass requires at least 4 in each category; the score alone proves nothing. Any incorrect wheel count/placement, wrong model-year fascia, empty driver position, floating tires, severe clipping, grossly wrong proportions, or black-crushed detail is an automatic blocker. Every specialist must supply the unflattering views too.

Required comparisons: neutral front/side/rear, front and rear three-quarter, cockpit/rider, a moving light sweep, day lap, night lap, brake/suspension action, and all currently supported part swaps. Screenshots include build ID, quality preset and provenance. Review the actual assets and frame captures, not only a written artist report.
