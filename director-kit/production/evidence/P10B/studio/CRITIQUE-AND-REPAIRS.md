# Studio internal critique and repairs

These are implementation iterations, not final visual certification. The lead's later immutable integrated captures and performance runs establish the delivered candidate.

## Read and surveyed

Read CODEX_NEXT, reference map, studio/wall, integration and validation packets. Opened actual C01/W01/S04 pixels. Background Blender inspected the packed current `signature-showroom-refined.blend`, with its exact source SHA retained in `room-survey.json`. The apparent source z=4.05 cabinet wall had been translated: the actual cabinet wall is z=6.96..7.14. The uninterrupted existing blank side wall is `studio_left_wall`, x=-6.09..-5.91, y=0..4.2, z=-4..7. Opposite-side piers share the door and lift; they cannot fit the panorama without obstruction. Full selected placement is in `WALL-PLACEMENT.json`.

## Artwork repair loop

1. Original Blender landscape attempt had excessive fog and miniature cone-tree shapes; compared against W01, neither tonal depth nor photographic detail was adequate. `mural-attempt-01.png` retained.
2. Lower camera, stronger ridges and reduced fog improved composition but still looked like a foam terrain model, not a premium print. `mural-attempt-02.png` and original editable scene retained. Did not call it a pass.
3. Built-in generation produced a native 2172×724 flat plate with detailed rock, sea, conifer and mist layers. It has no text, car or room. The master and runtime are byte-identical, not a synthetic 6K enlargement. The generated image is a print asset, not implementation evidence.

## Actual integrated repair loop

`integrated-01` exposed enormous clipped lettering. Blender's dimension lookup had measured text height after rotation rather than local horizontal bounds. Fixed scaling from source local-X bounds; main now spans 5.0m and the single subline 2.7m, at 12mm/3mm extrusion. Actual `runtime-03` showed correct width but the high title collided with the header composition. Lowered title to y2.30 and subline2.06, against the darker middle landscape. Actual `runtime-04` confirms readable controlled lettering within the panel; named Tour Wall framing is owned by lead and still needed to fit the whole car.

Inspected the actual current GLB materials: Radar Blue ORM green averages approximately63.74/255≈.25. The old factor multiplied it to an effectively near-mirror response. Studio paint now retains the map at factor1; satin graphite explicitly uses.48 roughness, restoring the map for other finishes. Clearcoat.7 with.16 roughness is a bounded showroom-only layer; satin uses.12/.42. Paint remains dielectric. Replacement studio atlas textures now retain original UV channel1. Default/race presenter code paths remain unchanged. Focused tests cover opt-in isolation, map channel, finish restoration, material ownership and optional mural failure.

Actual `runtime-05` black/red shows a readable glossy hood with controlled gradients, while blue/orange remains brighter and more stylized than C01. Original accepted faceting, glass and seat geometry still limit photoreal appearance; no broad vehicle replacement was made. Default set identity, vented checker floor, red border, cabinet/worktop/logo and grid displays remain visible. Full generated landscape is absent from the cabinet wall and door.

## Capture limitations / retained harness failures

First two studio capture commands used a root `test` query without `scene=signature` and entered the legacy development bay. Their readiness wait failed; this is a harness entry error, not a game failure. Corrected explicit isolated signature query in `p10b-studio-capture.mjs`. `runtime-03` and `runtime-04` captured1920/1280 without page errors. `runtime-05` spans a live HMR edit: one1280blue TourWall image is a reload frame, and later TourWall framing cuts the car bottom. This set is retained as critique evidence and MUST NOT be promoted to final acceptance. The lead is repairing framing and capturing immutable snapshots.

## Remaining honest differences

C01/W01 use photoreal generated vehicle and alternate architecture; the implemented room/car remain the recognizable original set and accepted stylized vehicle. There is no wet mirror floor, realtime ray tracing, new car mesh or race-wide rendering increase. The mural is photographic illustration, not measured local geography. The native raster is smaller than the optional suggested tier. Static contact planes are an authored cue, not measured ambient occlusion. Final camera/all-finish/audio/performance/full-loop certification belongs to the lead's frozen candidate, not this report.
