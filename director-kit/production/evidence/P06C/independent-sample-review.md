# Independent P06C sample and source review

## Decision and scope

The revised construction method is suitable for full-course integration and validation. This is not final environmental approval or G3/G4 approval. No remaining source integration blocker was found in this bounded review; final export, preservation, complete-race testing and measured performance remain lead responsibilities.

Reviewer: independent `preservation_review` agent. Compared source changes against starting commit `9780d62`; latest observed review checkout was `c26ae556d6908bc5c186f39cea7567dc9cea5838`, with the full export running. Read current scripts/tests and the presentation diff. Did not inspect changing runtime exports or Blender files mid-export and did not execute writers or tests against those changing outputs. This report is the reviewer's only written file.

## Findings repaired during the sample loop

- Road tone originally exported as inactive COLOR_1 beside white COLOR_0. Current source removes previous color attributes, exports active RoadTone, and tests require varying COLOR_0 with no COLOR_1.
- Foundation export initially lost batching. Current builder restores material/spatial grouping while retaining separate editable source meshes for exact geometry comparison.
- Initial yards were disconnected islands. Current source authors route-shaped connecting aprons and cuts their footprints out of retained ground sheets.
- Six proposed full-stage hall-body intersections were identified before rollout. Removing stations 425, 544, 783 and 859 produces the current 15-ensemble plan without pairwise body, roof, canopy or planter intersections in independent plan checks.
- Baseline layout dependency moved from ignored local tools into editable source; reproduction no longer relies on that ignored layout copy.
- Roof normals/thickness and gable closure, workshop end doors/vents, marine paint, smoother varied shrubs, and removal of planting intersecting new aprons were added.
- The mirrored road motif and then repeated full-source hero cracks were removed. Latest inspected runtime shows restrained aggregate without those dominant patterns.
- Broad opaque banana-like fronds were replaced with original authored pinnae coverage on folded meshes, using alpha masking rather than blending.

## Source preservation and integration

The runtime source diff is confined to showcase identity, new hall shadow-caster inclusion, material alpha diagnostics, LOD-cell bounds and source provenance. No physics, vehicle, input, rival, race, reward, save, product functionality or route changes were present in the reviewed runtime diff.

The new tests meaningfully check the actual road diffuse image bytes and active varying vertex color, glTF MASK/cutoff/double-sided flags, packed PNG presence, module availability and shared palm material across LODs. Existing broad tests remain intact. New source/integrity validators write P06C outputs, preserving historical reports. They are checks of files and geometry, not aesthetic approval.

Independent plan calculations for the corrected list found no new solid-body overlap with retained nonbarrier collider structures. A conservative whole-ensemble boundary reaches a minimum 12.826 m from all route segments, at opposite-side station 620. Connecting apron boundaries reach 12.626 m on side +1 and 12.654 m on side -1. These exceed the retained 8.5 m road/runoff half-width, but do not constitute exhaustive vehicle reachability or camera-volume proof. Actual final exported geometry and retained barriers still need the planned verification.

## Visual evidence reviewed

Reviewed representative service day/night, cockpit and detail frames from `sample-visual-01`, followed by repaired service/apex/road/palm frames in `sample-visual-03`. Workshops frame the bend and give the player useful near/midground structure; exits and braking boards remain legible. No gross road/building penetration was visible in these selected frames.

Reviewed 14 representative images in `sample-foliage-02`, spanning 720p/1080p, day/night, 15/40/80 m and both 45/100 m LOD boundaries. Independently recomputed all 16 transition records from their actual union sphere and diagnostic eye: nearest-bound distances are 44/46/99/101 m; recorded visible levels change 0 to 1 and 1 to 2 as intended. The report records no browser errors. No obvious rectangular cards, halos, sorting defects or sudden crown-volume loss were seen in inspected stills. Near fronds read as palm pinnae; far detail resolves into broader lobes while retaining crown mass.

The earlier `sample-foliage` 45 m pair used a bark primitive bound. It is not actual transition evidence and was superseded by `sample-foliage-02`.

Reviewed `sample-motion-day/contact.jpg` and `sample-motion-night/contact.jpg` as sampled frames only. They show the ordinary interface, near/far/cockpit perspectives, readable bends and retained underglow, with no gross missing environment mesh in those samples. Contact sheets do not establish video continuity, temporal shimmer, frame pacing, lap validity, synchronization or audio quality. The lead disclosed the earlier sample capture assertion mismatch between dirty build references; this review does not promote that attempt to a completed validation report.

## Remaining reservations and final evidence corrections

- Night workshop faces and unlit foliage remain subdued; the environment target remains held. Mid/far palms retain stylized broad forms, and workshop modules still repeat recognizable frontage rhythms.
- Continuous motion must still be inspected for masked-foliage shimmer, LOD/shadow changes and surface stability. Stationary pairs and contact sheets cannot certify these.
- More hall shadow casters, masked overdraw and full-course geometry require the same-machine whole-race timing matrix and resource/disposal checks. This reviewer did not run performance measurements.
- Final evidence corrections were requested and then verified in source: `capture-review13-day.mjs` now labels LIVE GAME AUDIO / VIRTUAL PLAYER INPUT, and `summarize-review13.py` refers to the actual renderer recorded per run instead of hardcoding RTX4080. Old sample labels remain historical provenance.
- The material test verifies exact road diffuse bytes; final source binding/provenance review should also retain the new frond bake hash and all aligned road data-channel receipts. Packed images and channel-presence assertions alone do not prove every texture binding is the intended one.

Proceed with the corrected full export, freeze a consistent build, and complete the requested validation and Review13 package. Do not mark G3/G4 passed from this report.

## Full rollout follow-up: remaining composition repair

After the initial full export, `full-visual-01/matched.json` and `asset-provenance.json` completed with no recorded browser errors and stable asset hashes. Inspected the return-845 m, arrival-350 m and promenade day anchors. The return-845 m view remains dominated by broad lawn and distant standalone facade blocks. Arrival-350 m also retains an open opposing lawn. Therefore the successful sample method does not by itself establish completed M3 composition across the full lap.

Independently preflighted the lead's bounded candidate stations against all route segments, the existing 15 halls and all retained nonbarrier collider boxes. Recommended additions, subject to runtime reinspection:

| Candidate | Runtime center X/Z | Yaw radians | Offset m | Conservative route clearance m | Purpose |
| --- | --- | --- | --- | --- | --- |
| 875, side -1 | 272.56 / 154.82 | -2.4148 | 28 | 15.200 | Low storehouse ahead of the criticized 845 m view |
| 915, side +1 | 216.63 / 117.00 | 0 | 28 | 14.007 | Optional low inside-edge mass toward the outgoing transition |
| 400, side -1 | 169.81 / -287.09 | -0.1461 | 28 | 15.200 | One opposing arrival mass entering the forward 350 m view |

These three candidates do not intersect each other, the existing hall bodies/roofs/canopies/planters, or the checked old solid collider boxes. Use a low module and preserve intervening open views. Rejected 875 side +1 due to body overlap with hall 821, and 895 side +1 due to roof overlap with hall 821. Opposite-side 875/895 and 895/915 pairs also overlap each other and must not all be used. Candidate 350 side -1 is geometrically safe but largely beside/behind the criticized 350 m camera, so 400 side -1 is the more useful bounded choice.

These are checked plan proposals, not evidence that the additions have been exported or visually accepted. Full performance and final ordinary gameplay review remain outstanding.

Revision02 plan follow-up: the lead selected all three candidates as low waterfrontHall2 modules while retaining the first 15 variants. Independently checked apron strips 384-418/side -1 and 859-893/side -1, plus the extended 305-933/side +1 strip. Minimum distances from their complete boundaries to all route segments are respectively 12.658 m, 12.639 m and 12.626 m. None intersects a retained nonbarrier collider box. Final exported-yard rays remain required. The source test was also extended to compare actual embedded frond PNG bytes with the authored image hash, addressing the earlier binding-test reservation.
