# P10A independent source and art review

Reviewer: mountain art specialist, separate pass over the lead's height integration. September 16, 2026. This pass was read-only except this report. It is source inspection and inspection of actual runtime captures, not an independent native-performance run or director approval.

## Findings

### P2: partial destination load failure has incomplete resource ownership

At `src/ridge/presentation.ts:23`, the kit, logo, land and textures are loaded by one `Promise.all`. Ownership through `SceneLifetime.load` in `src/express.ts` is registered only when the whole presentation resolves. If the land request or a texture fails after another asset has decoded, the completed intermediate GLTF/texture objects are not in the presentation cleanup result. The failed page can retain these objects until page disposal/garbage collection. Normal successful transitions have a complete disposal path; this finding is specifically the partial loading failure path, not a measured successful-scene leak. A bounded repair is to register each completed dependency in a temporary resource transaction, drain it on failure, and transfer ownership to the presentation only after construction succeeds. Include a fault-injected late asset failure in lifecycle validation if repaired.

### P3: mountain preparation warms unused coastal assets

`src/signature/drive-preparation.ts:5` includes the daylight HDR and old Harbor kit in every destination's shared downloads. Ridge uses its original procedural atmosphere and new district kit, so these two downloads are unnecessary for a cold Ridge entry. This does not load an extra rendered world, but it increases preparation bytes. Keep the old destinations' list unchanged and omit these two entries only for Ridge if adjusting it.

No release-blocking arithmetic, gate-height or respawn defect was found in the inspected integration. The two findings above should remain distinguishable from passed normal-path tests.

## Height and flat-route preservation

- `src/course/environment.ts` adds an optional aligned elevation array. Legacy route sampling and projection retain the old planar return values when the array is absent. Event distance remains planar; the new elevation channel does not renormalize old course stations or best-time keys.
- `src/simulation/index.ts:196` places elevated triangle support in an alternative branch to the old flat surface. It does not leave an invisible ground plane beneath the mountain. The old support-group rule is applied to Sport v2/v3 mountain support; obstacle boxes keep their ordinary collision groups.
- The tire contact channels, spring/damper force law, combined tire forces, Sport v3 steering response, drivetrain and braking allocator are unchanged in this diff. Slope affects actual geometry, local contact normals, gravity and body orientation. The new AI braking approach is an elevated-route-only speed-plan adjustment, not additional grip or a hidden force.
- The pitch reset quaternion is the expected yaw-Y then pitch-X composition. The body center-of-mass offset rotates consistently with that pose, and telemetry subtracts the same rotated offset. Initialization extracts pitch only for environments with mesh support. Flat pose initialization retains its old branch.
- `src/competition/road.ts` mirrors the authoritative elevation interpolation while retaining the existing station cache and planar local projection. No overlapping road elevations or intersections are authored.
- `src/race/attempt.ts:8` checks finite interpolated Y only for gates with a Y value, within 3 m of road height. That prevents a below-road crossing from counting while retaining the old behavior for flat gates. Both solo and multi-car race crossing calls pass full telemetry positions. Ordered gates and real distance checks still determine results.
- `src/driving/recovery.ts:11` chooses a supported centerline location 6 m behind the nearest station, adds the existing 0.025 m origin offset and includes local pitch. A scored recovery still restarts the attempt rather than teleporting forward into a reward. The below-road trigger compares against local elevation; ordinary flat routes retain the old -3 m rule.

## Camera and lifecycle inspection

The new camera obstruction query in `src/express.ts:73` uses actual fixed collider geometry and excludes dynamic vehicle bodies/sensors. It is passed only for Ridge. The chase and rearward views shorten their camera ray when blocked; cockpit remains attached to the current driver eye. This does not move the car. Visual-only distant ridges and decorative rock/tree meshes are not camera colliders; they lie beyond the intended racing corridor. Off-road decorative-mesh clipping is therefore a limitation, not a claim of universal terrain/prop occlusion.

Successful presentation cleanup owns its instance geometry, shared material sets, texture dependencies and original kit graph. Route entry still creates one destination scene. The existing `SceneLifetime` page disposal path remains in use. Resource counts in browser evidence are counts, not estimates of actual GPU memory. Failure ownership is the separate finding above.

## Art inspection and repairs

Inspected actual integrated day/night captures in `director-kit/production/evidence/P10A/art-proof-02`, `art-proof-03`, `art-proof-04` and `art-proof-05`, including normal chase views and the paddock grid. The initial road was back-facing, making the car appear unsupported visually; that was repaired by reversing winding, not by making the road double-sided. Physical tests use an explicit centerline edge shared by both road halves. Guardrail slabs became beams with posts. The outer bank seam now uses exact boundary vertices in an offline triangulated scenic landscape. Unbounded bank extrapolation that formed angular wedges became a smooth distant valley. Asphalt material scale and ambient fill were corrected.

The last bounded art refinement, after art-proof-05, adds small sapling clumps and varied young-tree scale, changes distant hills to a wooded palette with small canopy silhouette detail, and makes painted dashes follow slope instead of intersecting it. The lead's final proof must capture this final state and refresh the real runtime thumbnail. The earlier frames must not be represented as final screenshots.

Known art limits: foliage is an authored stylized broadleaf approximation, not a species survey; foliage LOD changes by 100 m spatial cell and has no crossfade; distant slopes are simplified scenic geometry with no collision beyond the physical 60 m banks; minor visual-only prop intersection off the racing corridor is possible. The late-afternoon and blue-hour pictures are deliberate game lighting presets, not measured real-world illumination. Existing CC0 texture derivatives are reused, with all eight relevant derivative hashes independently matched to the established source manifests in `assets/blender/ridge/texture-provenance.json`.

## Review boundary

This review does not certify the not-yet-completed native matrix, hosted deployment, chapter loop or remote recovery. Those require the lead's final evidence. No G3/G4, hardware, final-fidelity or release approval is implied.

## Lead resolution after independent review

Both loader findings are repaired in the frozen runtime: allSettled drains successful partial decodes on request failure, and Ridge preparation omits unused coastal sky/kit. `P10A/partial-load-final-02` deliberately fails the land request and observes43geometry/6material/9texture disposals with zero scene children. Final `art-proof-06` captures all later art refinements and current thumbnail. Normal lifecycle, the22race native matrix and actual-camera epochs pass separately. Severe sustained rail wedging remains the documented limit, not hidden by the ordinary-brush test.
