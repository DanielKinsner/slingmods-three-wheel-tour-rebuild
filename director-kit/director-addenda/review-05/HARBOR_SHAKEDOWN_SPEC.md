# Harbor Shakedown — locked design specification

These are design decisions and targets, not measured features of the current build. Make routine implementation choices inside them.

## Identity and scope

A fictional, sanctioned closed-road venue at a Biscayne-inspired marina/industrial harbor. Ocean air, low waterfront structures, palms and working-dock textures. No real road/geospatial authenticity claim. Brand mood: graphite, pale concrete, restrained SlingMods red, believable sky/water and functional lighting. Avoid a neon sci-fi city, giant floating logos, checkerboard floors and repeated generic cubes.

One Slingshot; one event; one lap. A standing start from a grid approximately 5 m behind the finish line starts the timer at GO. The initial crossing of that line does not count as a finish. The lap must visit the complete directed checkpoint sequence and return legitimately to finish.

Entry card copy may be: **“The tour starts with a clean lap. Learn the harbor, find your braking points, and bring it back in one piece.”** No voiceover or campaign machinery.

## Course and physical constraints

Target about 1.2 km, acceptable 1.0–1.4 km once measured from the final centerline; 10–12 m drivable width. Keep this first venue flat, without jumps, ramps, bridges or banked transitions. Its purpose is sustained steering/braking and a completed lap, not discovering every terrain edge case at once.

Driving composition: a 180–250 m start/waterfront straight; a wide constant-radius sweeper; a short left/right combination; one slower, clear braking corner; an industrial back straight; a forgiving final bend leading to the line. Final radii are chosen from the retained vehicle's turning/braking behavior, not only a nice overhead outline. Avoid blind 90-degree box corners and tiny curbs at apexes that upset the chassis.

No route self-crossings. Keep adjacent legs far enough apart for barriers/runoff and unambiguous checkpoint volumes. Provide a visible outer boundary/runoff; do not let a water backdrop conceal an unbounded fall directly beside the racing line. No public traffic or pedestrians.

Use the authoritative exported route and width to derive render/collision alignment, surface tags, checkpoint centers/tangents, spawn and safe reset poses. A centerline is legal for route planning/sampling; it must never set the player's transform, clamp lateral position or grant a lap automatically.

Dry asphalt is dry asphalt in both light presets. Off-road/runoff surfaces must be identified by the new venue, not the old pad's rectangular x/z bounds. Curbs/barriers need matching static collision; visual painted markings should not become speed bumps. Inspect the final seam where the loop closes and test a wheel near each edge. Preserve the accepted pad as a separate regression venue.

## Event rules and timing

State machine: ready → countdown → running → finished, with paused and invalid-attempt state handled explicitly. Countdown holds the car through normal bounded control/braking rules. Advance event elapsed time with authoritative simulation ticks; do not use the capture's wall clock or let render rate create a different best time.

Use direction-sensitive ordered checkpoint planes/volumes spanning the road, sampled on every physics tick with segment-crossing tests. An initial start/finish crossing is not completion. Crossing finish backward, missing a checkpoint, jumping to a later checkpoint, cutting across another leg or respawning near the line cannot create a valid best.

Define a documented track-limits rule using footprint/road width with enough tolerance for ordinary curb use. Suggested default: invalid after more than 0.35 s with at least two tire centers clearly beyond the allowed road/runoff limit. This is an event rule, not a new tire-force law. Include a separate centerline-progress/corridor check where needed to catch interior shortcuts; ordered gates alone do not protect every cut. Once invalid, retain the clock for practice but mark **Invalid lap — retry for a record** and never save it as a best.

The existing deliberate reset input invalidates an active attempt before relocation. Reset to a safe prior course pose with no progress award, or restart the whole attempt; choose **restart the attempt** for this first event. Clear held-input state, audio transient baseline, camera history and timing consistently. No repeated payout or result commitment: there is no currency in this event, and a finish attempt can update its record at most once.

At finish interpolate the crossing fraction within the final physics step for timing. Store a local best only after a valid finish, keyed by venue/route version, vehicle configuration, event rules and lighting preset. Preserve old records rather than silently comparing incompatible route revisions. Show personal best, current result and difference only when a compatible earlier best exists; otherwise show First record. No invented benchmark or impossible gold target.

Retry is one clear action; returning to the bay is another. Both keyboard and the supported controller should operate entry/pause/results without commandeering the desktop. Do not show leaderboard/upgrade buttons that lead nowhere.

## Presentation and UI

Use full-window racing canvas. The current website-style header/footer/navigation and persistent control panels move out of the running view; diagnostic tools are toggled, not permanently displayed. During a lap show a compact elapsed time/checkpoint-or-sector indicator and existing speed/gear/RPM. Keep the road and apex region clear. Controls help is available before start and in pause. Preserve mute/volume and audio-unlock fallback.

Near chase is the default; far/cockpit and quick held rearward remain. Evaluate both left/right corners in cockpit at useful driving speed. Preserve the fitted eye position and scale. Adjust its aim/FOV only as needed to see approaching apexes and the road beyond the hood; avoid using a downward-pointed dash showcase as the only cockpit composition. Recheck 16:9 and wide aspect ratios. No camera look-ahead teleport or hidden steering assist as a substitute for visibility.

Runtime gauges may stay visually passive for this packet because the functional HUD supplies the correct values; do not waste the course assignment remodeling instruments. Mark passive mirrors/instruments as limitations instead of presenting them as working systems.

## Day/night and environment quality

Day: late-afternoon warm directional light with cooler sky fill, physically readable roughness and grounded contact shadows. Concrete, rubber and paint should not share one glossy response. The whole route must remain readable without requiring excessive bloom or exposure.

Night: blue-hour/early-night sky, warm harbor practicals, cooler distant industrial lights, working stock headlight beams and brake-lamp response on the existing lamp geometry. Light must reach the road, not only make lamp meshes glow. Reuse existing model nodes/anchors; small runtime material separation for brake/head lamps is authorized, but no body geometry edit. No RGB underglow product preview yet.

Use a small measured shadow/light budget. Distant repeated fixtures may use emissive meshes plus baked/pooled illumination rather than each getting an expensive shadow-casting light. The first playable night road is dry, not an invented reflective wet mirror. Keep landmark silhouettes, barriers and brake cues clear. Time-of-day switching occurs before an attempt and must not change tire grip/engine behavior.

Blender kit: roadway and curb sections, one barrier/fence family, simple dock edge, two or three warehouse/paddock forms, two or three palm variants, lamp/sign families, low-cost marina/industrial set dressing, water backdrop. Reuse modules with scale-aware UVs, real texture maps and restrained normal/roughness variation. All visible geometry is authored in Blender; use source scripts plus editable .blend files. Shaders/runtime instancing animate or place those assets; don't replace the vehicle/world with billboards or off-screen beauty renders.

Concentrate the finest composition on 150–250 m of waterfront start/finish, but finish the raceable route coherently. No full city, interior, detailed yacht fleet or sculpted mountain range. Include route overview plus matched day/night views as evidence, not another pile of angle variants.

## Save and engineering integration

The current save decoder strips fields outside its known schema. Extending it for records must preserve settings **and** the new best when audio/camera controls subsequently write settings. Test: record a valid best, change volume/mute/camera, reload, and confirm the best remains. Retain `slingmods-twt-rebuild-v1` storage isolation; a schema upgrade/migration applies only to this new rebuild, never old games. Handle unavailable/corrupt storage without crashing the drive.

Minimum architecture: an injected course environment definition for static colliders/surface queries, a course-aware spawn/reset policy, and a race-attempt controller notified every simulation tick. No wholesale engine rewrite or large general-purpose editor. Preserve Rapier integration, the signed RPM fix, InputResolver, wheel animation/driver attachment and audio graph; allow the documented small adapters only.

Measure scene triangle/draw-call counts, load sizes and wall-clock frame distributions on whatever identified renderer is actually available. A controlled capture timeline cannot prove 60 FPS. Keep the 60 FPS desktop ambition, but label measurements by hardware/software renderer, resolution and preset. Provide quality scaling for costly shadows/lights before multiplying scene detail. Never claim physical controller, GPU-memory or speaker-output validation unless it actually occurred.
