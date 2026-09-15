# Art-production contract — P06C

## Outcome

The existing four-car chapter must look like a small, constructed coastal venue from the NORMAL near-chase and cockpit cameras in daylight and at night. This is not a new circuit or a showroom-only exercise. Preserve road coordinates, width, surface response, checkpoints, barriers' physical constraints and vehicle fit. There is no mandate to preserve placeholder-looking scenery beyond those constraints.

The previous pass brought real materials. This pass brings composition and believable silhouettes. All visible additions remain authored/editable in Blender, including environment assemblies, vegetation and any bakes. Use the existing verified material sources where possible. No further broad asset hunt is needed. No ripped meshes, copied game assets, unverified commercial assets or concept-image billboards.

## Internal M0 — protect, map and frame the actual problem

Identify the current commit, dirty/untracked work, active export paths, renderer mode, installed dependency versions and latest evidence. Preserve them. Capture matched current runtime views before changing code; no need to ask Dan for them.

Load the actual route and collision bounds into the environment authoring scene as LOCKED guides. Review every major camera-facing void on the service section. Create a small composition plan in the repo describing which space is road/runoff, built frontage, working yard, planting, water vista and background. It must respect the actual footprint; do not guess a global left/right side on a looping route. Author planned groups as named Blender collections with clear local transforms and footprints rather than flattening new random placements into the old array.

Internal milestones end in local commits/evidence, not user handoffs.

## Internal M1 — prove a connected roadside scene in the weak half of the lap

The current service section spans route stations 300–935 m, about 52% of the lap. Begin with a normal driving view here, not another flattering view of the terminal. Use these presentation bands as direction, not new race sectors:

| Existing route station | Spatial purpose |
|---|---|
| 300–510 m | Working quay/service arrival: connected dock-service frontage, a coherent yard boundary, sheltered repair/storage areas and believable changes between concrete, ground and planting. |
| 510–735 m | Technical-corner warehouse court: substantial adjacent building masses, loading doors with recesses, roof edges/canopies, one or two useful silhouettes and visible exits. Framing helps the player read the route rather than hiding corners. |
| 735–935 m | Yard exit to promenade: taper the frontage into maintained planted edges and palms; use a deliberate opening toward the water instead of another empty rectangle of grass. |

Place ensembles where the real map allows, outside the retained travel/runoff envelope. Choose rooflines, fence returns and vegetation clusters to explain the space. Use a few properly scaled connected structures instead of repeating the same facade at the horizon. Keep distant architecture subordinate; do not add unrelated skyscrapers as a visual shortcut.

Retain intentional open views on the marina side. Do not make a hedge tunnel, continuously opaque advertising wall, or a generic container maze. The target is plausibility, not maximum occlusion. Any new structure reachable by the vehicle must respect the existing physical blockers; do not let cars drive through a newly convincing building. Prefer placing solid new mass behind existing blockers rather than changing physical colliders. Keep original collidable structures visually consistent with their envelopes.

Make a compact 120–180 m sample INCLUDING a corner or change in direction, authored road-edge transitions, coherent frontage and the new foliage treatment. Inspect it in the full runtime at ordinary resolution in day and night, in motion as well as stationary. Require concrete written criticism and repair before rolling it out. Asset count, triangles and passing export tests do not approve the image.

## Internal M2 — fix road repetition and foliage representation

### Road

The current source builder reflects a 512×512 crop into four quarters, tiled at 1.5 m. Retire that four-way repeated diffuse motif. Retain or replace useful fine asphalt grain; separate it from broad color/wear variation so detailed aggregate does not become enormous mottled patches.

Build a coherent material from the actual source channels, with restrained original road-scale mask/detail work as necessary. Use existing centreline-aware UVs or stable world/route mapping. Road-scale repairs/edge wear must be a small authored set tied to plausible traffic/curb locations, not random marks at equal spacings. Avoid repeating identical hero cracks at every tile, large mirrored butterfly shapes, floating decal layers or depth-fighting repair patches.

Keep the dry physical road and its silhouette unchanged. Keep base color, normal, roughness/AO alignment and color-space handling correct. A stochastic shader is permitted only if compatible with installed Three and its shadows/lighting, inexpensive in measurements, and supported by an actual comparison. An authored variation mask plus a stable fine material is the preferred simple route. Do not buy 8K resolution as a substitute for the wrong pattern.

Inspect a ground detail AND a long chase-camera straight; a tile that looks attractive enlarged can still fail in motion. Day and headlights must read as the same material, not a wet track at night.

### Palms and planting

Keep the useful curved trunks and sourced bark. Replace the silhouette of the crowns, not simply their polygon count. Author a convincing parent frond in Blender with midrib, bend, taper, leaflet grouping and coherent visible mass. A folded full-frond/baked representation is allowed. Near views can combine shaped geometry and baked elements; mid/far levels should retain the crown's perceived volume without costly translucent layering.

Create the bake sources and editable bake/export script. Use original authored leaf detail; do not substitute unlicensed palm PNGs. For alpha-masked fronds, verify glTF material flags, cutoff, filtering/mips, lit front/back appearance, shadows and sorting in THIS runtime. Alpha-to-coverage only helps where actual MSAA exists; enabling a flag is not proof. Do not make every leaf a fully blended transparent surface. Do not flatten the whole tree to a billboard in normal near/mid race views.

Review near/mid/far crowns from approximately 15, 40 and 80 m, plus the actual LOD transitions, at ordinary 720p/1080p capture scale. Those are inspection distances, not a requirement to overwrite current distance policy blindly. Coherent silhouette and controllable shading matter more than exact leaflet count. Check pale-sky and dark-building backgrounds, day/night, and motion. Avoid shimmer, black unlit cards, sudden canopy thinning or sorting halos.

Ground planting should give beds coherent low mass, with visible paving/soil borders and plausible density. Do not cover the world with isolated tiny sprigs or conceal every flaw in tall grass.

## Internal M3 — roll the accepted method across the whole lap

Apply the accepted sample method across all three service bands, then connect the existing marina, promenade and terminal transitions. Retain good docks/water/terminal work; no complete rebuild simply to change file names. Retire the uniform lawn/setback treatment where it remains the dominant normal view. Geometry should have real junctions and depth; continuous surfaces must not overlap or expose holes.

Keep the new outdoor sky/probe pipeline. Lighting should distinguish road, rival vehicles, architecture and vegetation without flattening the scene. Adjust practical pools and local facade/contact shading as needed; avoid wholesale extra shadow-casting lights and preserve resident light-slot preparation. Keep braking boards, apex/exit sightlines, HUD and opponent colors legible. Existing underglow must still be a clear night reward; moderate excessive daylight dominance without making it disappear at night or changing its ownership/power state.

Garage is out of major scope: keep the current room, interface and materials. Small exposure/contact-light consistency fixes are permitted if the shared material/lighting changes affect it. Do not spend this run building more tools, menus or a larger garage.

## Internal M4 — integrate, inspect, measure and repair

Run the entire chapter, not just a fly-through. Recheck materials after export in the active scene; keep the tests that detect unused or wrongly bound maps. Use consistent shadow/LOD/culling settings and do not move budget failures outside the measured race phase.

Maintain material sharing, spatial batching/instances, sensible texture sizes, atlas/gutter/mipmap treatment where relevant and disposal when switching scenes. Avoid allocating one unique material per leaf or per repeated prop. Track increased submitted draw calls, overdraw and texture cost as well as triangles. Preserve previous slow runs and record causal changes; do not claim every clean result explains an earlier failure.

The full validation and return format is in VALIDATION-AND-DELIVERY.md. A local critique finding the same dominant issue unresolved must trigger a method/revision loop while work capacity remains. The expected return is the integrated revised chapter, not only a polished benchmark sample. A real blocker/resume report is acceptable; a silent redefinition to 'economical stylized' is not.
