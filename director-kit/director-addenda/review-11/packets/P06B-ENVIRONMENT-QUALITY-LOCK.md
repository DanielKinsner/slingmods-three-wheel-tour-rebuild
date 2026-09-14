# P06B — Environment Quality Lock

## Visual direction and measurable outcome

A believable, maintained Florida harbor circuit: sunlit mineral/stucco architecture, dark fine asphalt, pale cast concrete with joints and weathering, silver/aluminum details, weathered dock timber, palms with airy segmented fronds, blue-green waterfront and landscaped service edges. SlingMods red is a restrained accent, not every surface. Night retains the same material identities with useful practical lighting and a clearly visible installed underglow.

This is not an abandoned industrial wasteland, neon cyberpunk city, toy raceway or wet-road mirror demonstration. No additional gameplay is needed. The outcome is a visibly better **ordinary complete race**, not just an offline beauty render.

Prioritize what occupies the driving frame: road, ground transitions, skyline/sky, near architecture and vegetation. A high-detail bollard cannot rescue an untextured lawn covering half the view.

## Internal stage 1 — establish a material/lighting/geometry benchmark

Choose the first approximately 200–250 m connecting the start terminal with the marina approach. This is a **local integration benchmark, not a request for another user review**. Preserve the race start and trajectory. Take matching current/final views at the actual near chase height and FOV in daylight and at night. Do not move the camera, dim the old scene or omit the old props to improve the apparent comparison.

Before multiplying modules, integrate all of these in the same view: convincing road and sidewalk, a grounded terminal frontage with depth, one properly built palm/planting group, an intelligible quay/water edge and coherent outdoor illumination. Inspect source references next to runtime images; do not use a model/texture preview as the runtime result.

Make an explicit local accept/repair judgment about forms, scale, material identity, contact shadows, repetition and scene depth. If it still reads as the current color-block kit, change the construction/material approach and continue locally. Do not expand an unsuccessful palette throughout the course.

## Internal stage 2 — replace weak materials and the outdoor test lighting

### Materials

Use a small coherent library of high-quality CC0 photo-based PBR material sets. Selected pages and rights are in MATERIAL-SOURCES.md. These references are **not files already installed by Astra**: retrieve authorized downloads, record source/license/hash/resolution, derive game-sized maps and use them in Blender. Do not bulk scrape sites or hotlink runtime textures.

Start with 1K/2K game textures for reused surfaces and enough source resolution for clean bakes. Raise a particular map only when normal-camera inspection demonstrates the need. Do not download 8K/16K for everything. Use correctly padded trim sheets/atlases where helpful, but do not force road, wood, plaster and foliage into tiny flat color cells. Preserve proper mipmaps; previous atlas bleed must not return.

Record physical tile dimensions and intended texel density. Avoid stretching a whole tile separately across every differently sized polygon, as the current per-face normalization does. Basecolor/emissive use color interpretation; normal/roughness/metallic/AO use data interpretation. Verify the installed Three/Blender export conventions, GL tangent normals and actual glTF material bindings. A map existing in a folder is not proof it is active.

Combine fine surface response with larger nonperiodic variation, appropriate joints, restrained edge wear and baked contact detail. Do not use oversized scratches, glossy concrete everywhere or gravel-scale asphalt grains. Static diffuse shadow/color must not be baked into a reusable albedo map and then applied with contradictory dynamic light. Use separate AO/lighting channels where appropriate.

### Road, barriers and immediate surroundings

Keep the actual drivable/collision surface and all checkpoints unchanged. Replace render-only UVs and materials; add controlled decals and narrow geometry accents without creating bumps/obstacles. Show fine asphalt aggregate, restrained repairs, drainage and construction joints; maintain clear race markings. Race road stays dry.

Model credible curb/barrier cross-sections, seam spacing, cap/end construction and pavement interfaces. Keep visible barriers aligned with the existing collision envelope. No disguised gaps in a wall the car cannot pass, no decorative wall where the car can pass through at speed.

Replace uniform flat lawn/runoff appearance with believable verge widths, planted soil/mulch pockets, paved service aprons, retaining edges and modest terrain contours **outside the drivable and reachable corridor**. No floating vegetation or square grass cutouts. Keep the physical road/colliders immutable; do not casually add unreachable-looking structures inside the car's accessible space.

### Lighting and sky

Remove the outdoor dependency on RoomEnvironment in both harbor and crew. Use a properly prefiltered outdoor HDR environment with a matching visible sky and aligned directional illumination. The selected pure-sky daylight source avoids importing an unrelated landscape. Separate display background and light probe resolution as needed; calibrate intensity and exposure using the road, a neutral object and the existing car together. Avoid double-counting the HDR sun and a bright direct light. Maintain the existing headlights/underglow effect without turning the car chrome or blowing out opponents.

Night needs a coherent low sky level, visible silhouette depth and sensible pools at real fixtures, not a flat dark paint bucket or thick fog hiding scenery. The same geometry must remain convincing during daylight. Do not reuse an indoor-room reflection for the sea or globally darken the scene solely to flatter the underglow.

Use appropriate static AO/contact shading and selected nearby dynamic shadows to ground palms, barriers, canopies and dock furniture. Preserve stable light counts/preparation. Do not enable full dynamic shadows on every object or add a real light to every visible lamp. Baked lighting for static structures is allowed when day/night are handled consistently and dynamic cars receive coherent live light.

## Internal stage 3 — roll out a coherent place on the existing circuit

Keep all four destinations within this one route; no new track layout.

**Terminal/start:** intentionally compose the canopy, glazed bays, columns, doors, counters/service areas and planted forecourt. Show material thickness, reveals and believable dimensions. Clear signage is integrated with the building, not floating. Improve the start-line frame without a visual tunnel that hides the rest of the circuit.

**Marina:** connected quay/walkway/dock construction, varied but coherent moored hulls and supports, believable waterline, visible shallow/deep or shore-related variation and correctly placed railings. Water needs coherent reflections and normal detail, not a flat colored slab. Start with affordable outdoor/reflection-probe techniques; a full real-time planar reflection is not mandatory. Do not mirror the whole world at full resolution without measured justification.

**Service/technical stretch:** paved yards, loading openings, recessed frames/doors, warehouse construction, utility details and a connected fence/planting boundary. Buildings should belong to the harbor's circulation, not be randomly scattered boxes. Retain the verified physical warehouse bounds; replace only their render shell within that contract.

**Promenade/closing straight:** legible pavilion and planted verges, realistic palms with varied growth/lean/frond ages, spaced breathing room and coherent distant shoreline architecture. Produce a good near palm in Blender, then variants and LODs. Fronds need a spine, thin leaflets/negative space and appropriate color/normal/roughness; high-detail fronds can bake to padded alpha-tested cards with solid close trunks. A low-poly entire triangular leaf painted green is not enough. Test foliage silhouette and mip/alpha/shadow behavior at racing distance, not only a close-up. CC0 source geometry may be adapted in Blender when truly useful and proven redistributable; record it.

Do not build every distant window as expensive geometry. Use complete near buildings, cheaper mid/far representations and spatial culling. Distant art must frame the horizon without visible pop-in or fake floating skyline cards at road level. Avoid busy roadside objects that obscure the next braking point.

## Internal stage 4 — finish the compact showroom, without restarting the interface

Keep the working build controls, chapter entry, product preview and saved inventory. Improve the room: coherent slab/joints/epoxy variation, visible wall/baseboard/ceiling depth, physically placed light fixtures, cabinet/workbench proportions, restrained branding and a service opening that looks like a real doorway/bay rather than a black void.

Reuse the improved material library. Keep the car fully framed and unmodified. Show stock and installed lighting at day/night settings. Do not return to a 1,200-triangle tiled floor if two good triangles and proper maps are sufficient. Give large simple surfaces convincing material response instead of filling the whole room with clutter. No full dealership, new garage mechanics, robotic lifts or extra inventory screens.

## Integration and budgets

Keep authoring sources editable, exported assets reproducible, and runtime loading independent of external networks. Make shared textures/materials truly shared. Retain spatial instance grouping; add genuine near/mid/far detail representations where needed rather than making every near object look like a distant one. Prune unused material/images and test disposal across garage/race/retry. Texture compression is welcome if supported by the installed pipeline and measured; do not migrate the engine or renderer to obtain it.

There is no sacred low triangle count from P06. Increase detail where it appears in the view and reduce unnecessary overdraw/shadow/material passes. Use measured native-RAF budgets with all four vehicles, headlights and underglow. Preserve the established 720p/1080p quality targets on the same local reference machine; document the exact preset, device and resolution. No universal frame-rate claims. A higher visual target and stable gameplay must be evaluated together, not with a hidden low-quality racing mode behind high-quality screenshots.

Delegate independent lanes when available: asset/material authoring, outdoor runtime/lighting and integration/review, with clear file ownership. Resolve ordinary issues locally. Preserve recoverable commits for baseline, benchmark, rollout and final verification. Do not return a ZIP after any of those internal stages.
