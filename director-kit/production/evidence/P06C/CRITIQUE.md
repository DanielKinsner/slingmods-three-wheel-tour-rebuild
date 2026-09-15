# Construction review and repair history

## Source review before sample evaluation

Independent reviewer examined actual code and the first partial export, not the lead's summary. It found: RoadTone exported into COLOR_1 while COLOR_0 stayed white; missing foundation batching; disconnected yard islands around the S bend; ignored local baseline-layout dependency; thin open roof faces; a0.3m footprint metadata mismatch.

The first background build was stopped as a known incomplete technical attempt, retaining setup/sample-build.log. No art approval or performance result came from it. Repairs: sole active road color attribute; retained material/spatial foundation batching; tracked immutable baseline layout; route-shaped service apron joining the loading yards and cut from existing ground; roof thickness/gable closure; matching footprint metadata. Second export log is separate. Source review is not runtime approval. Script changes made during the second export are incorporated by the subsequent final sample export, not retroactively claimed for that build.

## Runtime review

Independent reviewer opened10 representative sample-visual-01 images (day/night/near/cockpit). Workshops frame the bend, braking boards/exits remain readable; no visible penetration. Concrete visual failures: full asphalt source repeats hero cracks; opaque full blades resemble banana leaves; shrubs look like repeated faceted balls; exposed end walls lack scale; night doors lose definition. The calibration gray swatch remains explicitly diagnostic, never ordinary motion proof.

Repairs: aligned intact aggregate crop, no reflected copies, smooth periodic boundary correction; deep pinnae cuts with continuous midrib; smoothly shaded varied shrub mass; side service doors/vents/panel joints; restrained lighter matte marine paint on recessed loading doors. No global exposure change, new shadow lights, physics or camera changes. Road COLOR_0 was separately tested against decoded actual export; all58 protected source paths unchanged,33 original material records verified, physical foundation mesh positions/topology/transforms exact, and actual ground/footprint clearance checks pass on sample03. Sample04 carries the pinnae/aggregate method repair; final builder also contains the end-wall/planting/paint refinements.

Whole-course preflight rejected six intersecting hall pairs in the first proposed rollout. Corrected15-hall subset independently checked with no body/roof/canopy/planter or retained nonbarrier collider intersection. Minimum conservative footprint distance12.826m; connecting apron minimum12.626m from all route segments. Old planting on apron is retired in final builder. These are plan checks, not human collision or artistic certification.


## Method pivot after sample02

The intact aggregate repair removes the visible crack repetition in matched service/road views. Opaque blade revision2 still looks like coarse sawteeth at close distance, so that representation is rejected. The next method uses original authored64 lanceolate pinnae, a512x1024 anti-aliased RGBA coverage bake and folded three-dimensional parent fronds. Editable pinna polygons are retained in the Blender bake-source collection plus p06c-frond-layout.json and the bake script. Explicit glTF MASK cutoff0.35, double-sided lighting, same map through all three geometric LODs; actual mask and distance/motion inspection required. This is a method change, not a claim that another polygon-count increase met the art target.


## Sample method review and rollout decision
Sample-visual-03 and sample-foliage-02 independently reviewed. Fourteen representative foliage images span720/1080, day/night,15/40/80m. All16 transitions independently verified at union-sphere44/46/99/101m, matching levels0/1/2. Coherent crown and pinnae; no obvious cards/halos/sorting in inspected stills. Provisional rollout suitability, not final environmental art approval.
Day/night sample native recordings completed with near/far/cockpit switches and live audio. Final metadata assertion failed on the honest -working build suffix; earlier recordings are retained as motion trials, not complete functional validation. Lead inspected sampled motion frames through the service bend: road is no longer mirrored/crack-tiled, corner exits stay readable, no obvious building/camera intersection. Night remains subdued and broader lawns elsewhere need the full rollout. Temporal shimmer cannot be excluded by sampled frames.

## Full rollout01 review
Full15-hall candidate passes121 tests, exact4200-row simulation parity, all58 protected paths and296 foundation meshes, packed-image verification and3080 road/runoff rays. Full matched views37images are asset-stable and errors[]. Arrival and technical court now have depth/frontage, coherent crowns and restrained fine road. However station845 return still shows dominant old lawn and isolated blocks. This is a composition failure requiring a bounded second full revision, not final M3 acceptance. Add checked lower frontage to frame the return while retaining the promenade opening; assess the opposite arrival setback too. Full-visual-01 remains the rejected pre-repair comparison.

Full revision02 adds exactly three low storehouses:400/opposite,875/opposite and915/inside. Independent oriented footprint/roof checks rejected875/inside and895/inside because they intersect821; chosen alternatives pass all original nonbarrier collider checks and leave road sightlines clear. Arrival400 enters the350 forward view,875 frames the845 view,915 establishes the yard edge before the retained promenade. Aprons connect each property and remove conflicting sprigs; no new colliders. Final runtime view must confirm the repair.

## Final diagnostic setup correction
The first runtime sampler check used a fresh context without the required earned career fixture; the crew entry guard prevented its ready token, so it timed out. The repaired check copies the existing earned fixture and passes actual GL filter/mipmap assertions. Original timeout log is retained. No game or entry guard was changed.

## Performance hold
The first pooled interpretation of the two-race context was corrected: every complete attempt must pass separately. Both original and diagnostic second races fail p95. Host contention is plausible from CPU telemetry and independent static review, not proven. Both failures remain; no unrelated CPU jobs or rendering quality were changed. See PERFORMANCE-REVIEW.md.
