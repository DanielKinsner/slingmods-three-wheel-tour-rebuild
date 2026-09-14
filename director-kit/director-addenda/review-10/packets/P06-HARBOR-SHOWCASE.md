# P06 — Harbor Showcase

## A. Locked creative direction

The setting is a **fictional, closed-course Florida waterfront invitational**, not a geographic replica or an open-world city. Keep the existing approximately 1.23-km circuit and two-lap chapter. The mood is premium automotive with a working marina around it: warm practical lamps against a cooler night sky, rich but restrained materials, purposeful red SlingMods branding, and a readable road. Daytime is just as important as night.

No cyberpunk neon, excessive bloom, shiny wet pavement on this dry course, anonymous white boxes, blanket rows of identical palms, or opaque fog hiding the unfinished horizon. Do not substitute a concept painting, sky billboard of the entire scene, or an offline Blender beauty render for a playable environment. New geometry is authored in Blender, with editable sources and reproducible export. Make a small authored kit and use it intelligently rather than generating thousands of unique objects.

The visual target is chosen here; do not ask Dan for three design options. The first section is reviewed locally against these requirements.

## B. Four distinct stretches on the EXISTING route

Read `public/assets/harbor/route.json` and map these districts onto actual curvature and the existing racing corridor. Their boundaries are flexible authoring decisions, not changes to the layout. Record route distances once in a scene-layout manifest.

**1. Terminal / start-finish.** Make the grid feel like a hosted event: a compact marina terminal with a projecting canopy, glass set into a real frame, recessed doors/windows, stepped roof/parapet, a coherent entrance apron and a properly mounted SlingMods event sign. Add a start gantry with restrained practical lighting and trackside paddock bays beyond the safety barrier. Avoid floating letters and a building made of one un-beveled white cube. Preserve start-line visibility, countdown and all grid clearances.

**2. Marina sweep.** The broad turn should reveal a layered waterfront: physical quay edge, varied dock segments/piles, bollards/cleats, a few convincing moored hull forms, railings where appropriate, and a far-shore mass with clear depth. Keep docks and water outside the racing corridor. Water needs scale-consistent moving normals and restrained reflections, not a flat cyan slab or expensive full-scene reflection rendered several times per frame. Boats here are background scenery, not new playable vehicles or a feature system.

**3. Service yard / technical corners.** Use a compact warehouse family with loading-door depth, roof trim, framed windows, a small number of cranes/lifting structures or service equipment, fencing and limited crates/pallets. Place larger silhouettes to tell the driver where the road bends; keep small visual noise away from braking targets. Use useful braking boards and corner chevrons at actual decision points rather than a continuous wall of arrows. No unseen collidable prop in the runoff or racing line.

**4. Palm promenade / closing straight.** Replace the current wispy crowns with credible volume and tapered fronds that still read at normal chase distance. Author roughly three reusable palm variants with irregular rotations, crown shapes and placement; put lower planting/planter or curb detail at deliberate groups, not a uniform lawn everywhere. A promenade pavilion and layered distant buildings can give a closing-straight landmark. Maintain the same barriers/collisions where the course is already bounded.

Work at three distance scales: foreground curbs/drains/barrier joints and believable road material; middle-distance buildings/trees/docks that define the route; a lightweight distant shore/sky silhouette. Every district needs all three. Concentrate small detail where cameras can actually see it. All of this is one environment improvement, not four new tracks.

## C. Materials that survive runtime export

Use actual UVs, properly scaled base color, roughness and normal detail on asphalt, concrete, coated metal, building panels, timber and foliage. Bake Blender procedural appearances into supported runtime maps where necessary; a procedural node tree visible only in Blender is not a delivered texture. Keep sRGB color maps separate from linear data maps; verify the installed loader's material behavior.

Break obvious repetition with a restrained secondary variation/decal layer: patched asphalt, joints, drains and small staining away from racing cues. The dry road must not become a mirror. Road paint is a separate slightly lifted/decal treatment with no z-fighting or shadow-casting stripes. Curb/barrier details must not introduce physical bumps or invisible walls that alter the accepted simulation. Glass should have modest reflections and depth, not fully opaque black or an expensive transparent pane on every distant window.

Author sensible texture tiers: near unique surfaces can justify 2K; repeated structures should share atlases/trim sheets, and distant details should not carry unique 4K textures. These are production defaults, not excuses to ship blurry near-camera work. Check normal-map direction, tangent seams, material count and final GLB/texture sizes in the actual browser. Keep material names and provenance clear.

## D. Lighting: fix the rival wash, preserve the night reward

Use matched tests before changing many variables: player behind each rival at 3/8/20 meters on the actual pavement, at the grid and at an underlit corner; day, night stock, night cyan/red kit. Test normal near/cockpit views at fixed exposure. The current grid shows loss of paint identity under the player's headlights. Calibrate beam direction, falloff/intensity and material response against that actual problem; retain ordinary interaction between light and cars.

Keep road edges and the braking horizon readable while silver/teal, dark-red and graphite/yellow rivals remain distinguishable. Bright reflections are fine; a rival becoming an almost solid white shape is not. Do not solve this with black paint, self-lit rival paint, exclusion from all headlights, disabling illumination or a scene-wide darkness/exposure trick. Verify with a neutral material swatch to distinguish excessive light from a bad material.

Preserve the stable fixed practical-light pool and prewarm strategy. Do not return to light-count changes as the player drives. Decorative lit windows can be emissive/baked; they do not each need a dynamic light or shadow. The accepted underglow must remain a visible, restrained ground spill at ordinary driving distances. No extra add-on strips or performance effect.

A beam texture/cookie is optional, not mandated. Verify exact installed Three.js support and cost first: current documentation warns a SpotLight map is disabled when castShadow is false. Do not unknowingly turn on multiple full-resolution shadow maps to obtain a cheap-looking cutoff. Use the simplest correct method that meets the visuals and measured budget.

One deliberate daylight preset and one night preset are sufficient. No weather, continuous clock, ray-tracing rewrite or giant postprocessing stack.

## E. Compact garage with a purpose

Transform the existing bay into a small automotive presentation/workshop space, not a hangar packed with props. The car remains central with a clear orbit. Choose a charcoal/neutral architectural envelope, a matte/semi-satin epoxy floor with subtle aggregate, broad ceiling strips that create controlled paint reflections, one organized service wall, a workbench and closed cabinetry, plus a glazed/service opening giving environmental context. A correctly proportioned SlingMods sign and restrained red accents carry the brand; use existing authorized brand assets.

Previewing the lighting can dim the bay's main fixtures without hiding the car's shape. Compare stock/installed at the same camera and lighting. The fitted driver and repaired rear can still be inspected. No wheel pedestal that moves the car from its established rig origin. Neutral inspection mode stays available in developer tools; the ordinary player view is not labeled P03/P04 candidate, G3 pending, material inspection, build hash, or diagnostics.

## F. Player-facing presentation and racecraft readability

The ordinary root has a clear primary Continue / Race again action for the current chapter, plus Time trial and Build. Do not add pretend menu cards for unavailable vehicles/tracks. Keep the story brief, the optional accessory truly optional, and the first-podium objective comprehensible. The result screen should immediately show placement, race time, legitimate rewards, chapter status and retry/garage actions; preserve pending-save/failure behavior.

At 1280x720 and 1920x1080, all required product controls and the deliberate external-product link must be reachable without falling behind a permanent footer. Consolidate controls rather than stacking more developer panels. Keep controller focus and release-to-rearm behavior. A compact rank/lap/time HUD and speed/gear readout should not obstruct the next corner; show help when needed, not a paragraph of controls during every race. Keep mute/volume/pause easy to reach. Retain an accessible settings/debug route, but no development labels in normal screenshots.

Make rivals recognizable under normal light and in the HUD, with stable colors and names. Add a minimal side/rear proximity cue only when a vehicle is genuinely close and outside the useful camera view. Keep quick held look-back quick, and preserve cockpit/near/far control semantics. Do not add a large minimap, replay director, photo mode or cinematic camera cut during braking.

Exercise a production-controller encounter with a slower car, safe pass opportunity and a blocked corner. Improve headway/lane transitions or decision hysteresis if those tests show a defect. Do not script the player's final place, add catch-up torque, teleport a rival, or manufacture a pass for the video. Count completed overtakes from valid race progress, not from the existing maneuver-attempt counter. A continuous enjoyable-looking lap matters more than a high count of fake “passes.” Human enjoyment remains an unverified dimension unless actually playtested.

## G. Real sound, real recording

Retain the coherent engine/drivetrain mapper and bounded spatial opponent mix. Test approach/pass/recede, acceleration/upshift/braking, cockpit/chase transitions, pause, mute and volume. Avoid four engines mixed at full output everywhere. Existing synthesized audio is a placeholder for sound identity, not an authentic recorded Slingshot exhaust; do not claim otherwise or synthesize a second gearbox to make it exciting.

Implement an isolated evidence tap from the **actual realtime master audio graph** into a MediaStream audio destination. No microphone, system loopback, user-desktop capture or credentials are required for that graph tap. Record a full chapter with game audio if the isolated workflow supports synchronized capture, or provide continuous synchronized audio/video files with documented anchors and an honestly explained capture limitation. Do not replay invented sound offline and call it recorded game audio.

Canvas capture alone omits DOM menus/HUD. Preserve the real interface in the main recording using the isolated browser capture, and align actual audio using clock markers at start and later events. Confirm track presence/duration and visible shift or countdown alignment at the beginning/middle/end. Do not simply attach a .wav of approximately the same length. Numerical signal evidence and a SILENT movie do not establish the mix's quality; audition locally where possible and state limits if not.

## H. Keep headroom while adding detail

Establish culling, shared materials, instancing and distance detail before extending scene density. Partition static scenery into spatial chunks; a single instance group encompassing the whole harbor can defeat useful culling. Recompute group bounds after generation. Reuse actual Blender modules. LOD transitions need hysteresis/visual review, not disappearing buildings at a corner.

The old four-car scene already submits substantial geometry. Do not multiply that workload with individual screws, shadow-casting fronds and unique texture sets. Use a few shadow-casting architectural/vehicle silhouettes and cheap distant representation. Optional derived vehicle LODs must preserve silhouette, wheels, driver and rear behavior at transitions; do not replace the hero asset or simplify physics.

Measure scene draws, triangles, program variants, textures and stable memory/resource lifetimes at the same route/camera points before/after, and measure actual clean wall-clock race intervals separately. Those counters are not GPU milliseconds or memory bytes. Do not claim 1080p when rendering a smaller buffer, or use a prerecorded camera movie as a performance benchmark. The final scene must be improved at the measured shipping configuration, not only at an uncapped screenshot setting.
