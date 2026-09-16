# 01 — Smoky Ridge: a different place to drive

## Creative target

A fictional invitational road circuit inspired by wooded southern Appalachian ridges—not a surveyed park road or a claim of NPS sponsorship. The car leaves bright pit frontage, runs beneath a convincing tree canopy, climbs through a rock cut, opens onto a long view of layered mountains, then descends through broad bends to the paddock. Contrast with the present coastal scene should be obvious in an ordinary chase camera within the first ten seconds.

Use the NPS references in SOURCE-INDEX as visual research. Do not copy unrelated tourist branding, imply sanctioned racing on a real public road, or use reference photographs as runtime textures without separately verified rights. Current SlingMods assets are the only required sponsor identity.

## Route design targets — authored game choices, not surveyed data

- One closed circuit, approximately **2.8–3.6 km**, with a genuine **70–110 m road elevation range**. Keep enough length for grades normally at or below 7%, brief sections at most 9%. Smooth vertical transitions; no sudden gradient changes that launch the car during ordinary driving.
- Around **10–14 purposeful corners**, dominated by linked medium/fast sweepers. Include one slower well-signposted braking complex, not a succession of hairpins. A 500–650 m acceleration opportunity plus a broad descent should let customers enjoy the car. Do not alter gearing or fake the speedometer to meet that goal.
- About **11–13 m paved width**, passing room at useful corners, sensible shoulders and readable runoff. Width and curvature can vary coherently. Never funnel four cars into an unexplained single-width choke point.
- Use Sport v3's measured turning and braking behavior as the constraint. Design typical bends for steady throttle/partial lift at relevant speed rather than universal emergency braking. Mark the genuinely hard stop. Validate stopping before a downhill braking zone with actual motion; do not reuse a flat-stop distance as an uphill/downhill guarantee.
- No overlapping road elevations, overpasses, intersections or moving obstacles in this assignment. That avoids projection ambiguity while the height-aware route system is introduced.

The lead may refine numbers to produce a coherent playable layout. Record final measured length, elevation extrema, gradients, curvature and intended braking zones. Do not silently flatten the road or relabel a scenery-only hill as real elevation.

## Four connected visual districts

1. **Workshop paddock:** modest warm timber/metal structures, organized pit objects, a recognizable SlingMods start/finish gantry, route board and simple seating/parking composition. This is not another showroom replacement.
2. **Wooded climb:** banked soil/leaf litter, trunks near and behind the verge, believable foliage masses and occasional filtered sky. Vary tree silhouette, age and spacing. Avoid low-poly cones, giant spheres, repeated identical trees, or a wall of crossed cards parallel to the road.
3. **Rock-cut and overlook:** grounded retaining/rock faces, guardrail posts, coherent shoulders, a broad ridge reveal and a small free-drive turnout outside the racing line. Layer nearer wooded slopes with simplified distant ridges rather than a flat image pasted immediately behind the track.
4. **Open descent and return:** extended views, long readable corners, warm rim/fill on the vehicle, then forest/paddock reconnection. Keep the horizon composed from cockpit as well as chase.

Author editable Blender sources and exports for the reusable district kit, terrain/road surfaces and any new fixture. A deterministic generator is acceptable if its parameters, coordinate basis and output remain editable/reproducible. Use actual surface texture detail at sane physical scale. Reuse verified material families where suitable; obtain a small curated set of appropriate free assets if needed and record source/license/hash.

## Light and visual hierarchy

Two deliberate presets: **late afternoon** and **blue hour**. The daytime picture must carry the art; darkness is not a finishing tool. Let the car read against scenery. Blue hour must preserve road, rivals, braking markers and rock/guardrail silhouettes with the existing light budget. No wall of bright red sponsor signs or excessive bloom. Retain usable performance on the project's measured profiles.

Use tested terrain/foliage LOD and spatial chunks, bounded shadows and sparse distant details. Repeated meshes can use instancing where they share geometry/materials, but per-object LOD is not automatically supplied by one giant InstancedMesh. Implement explicit chunk/LOD batching as needed. Verify alpha/shadow artifacts in the actual runtime. See official Three.js references; do not bolt on a library migration just for the scenery.

## Internal art acceptance

Inspect the actual renderer at normal chase/cockpit height, with UI visible, in both light presets. At least one matched view from each district. A beautiful aerial still and an object-count statistic are not enough. Repair obvious floating props, transparent terrain, repeated-road motifs, foliage shimmer and empty route frontage before the full return. Preserve intentional breathing room and distant views; density alone is not quality.
