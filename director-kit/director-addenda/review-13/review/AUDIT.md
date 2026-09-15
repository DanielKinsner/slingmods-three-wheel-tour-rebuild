# Astra — Review13: retain the waterfront; prepare a focused demo

**Reviewed:** `Astra-Review-13-Upload.zip`,493,151,765bytes.

**Decision:** retain P06C's connected waterfront construction, road treatment and fuller palm representation for continued development. The repeated-race performance HOLD remains. Final environment quality, G3/G4, physical-controller approval, sound character and release approval are not granted. Authorize **P07A — Shareable Showcase**, a bounded local demo-readiness assignment with a lean review return. No repository, runtime or deployment has been modified by this audit.

## 1. Source identity and integrity

The frozen P06C runtime is `b4eef3c7dab3eb77b131a5100c3be0fd1110b095`; original packaging is `ed0e9f592fce14d1209acea5aad874f512761f7f`; upload packaging is `6e3349f8a22a21f27da5cebd1952a948118ceccf`. These are submitted identities, not instructions to reset current HEAD. The submission says no remote writes occurred. Availability of these later commits on GitHub has not been established here.

The ZIP contains 895 file entries, of which 894 are covered by its manifest. Every one of those 894 passed an independent byte-size and SHA-256 comparison. This establishes archive consistency, not that every claim within it is true.

Of 58 protected paths in the supplied baseline record, 46 are present and match that record exactly. Twelve historical `.blend` paths are omitted, so they were not independently compared. This is a comparison with the packaged baseline reference, not a fresh comparison with the complete actual Review12 archive or remote source. The upload-edition notes explicitly explain three additional baseline source omissions from the original Review13 selection; those three and the twelve missing protected paths are different, overlapping accounting scopes.

The frozen build's 390 input records are present. Two packaging/report tools differ afterward: `scripts/package-astra-review13.py` and `scripts/summarize-review13.py`. Their amendments are disclosed in `post-build-tool-amendments.json`. No other listed frozen input differed in the comparison. The current runtime is not silently treated as identical to every later packaging helper.

## 2. The art improved, but the broader visual target is still held

The supplied matched views and decoded samples show a more convincing service frontage: buildings sit nearer the route, yards and frontage connect, and the long service bend has stronger near/midground structure. The package records 18 workshop/storehouse ensembles and a final addition of three low buildings addressing entry/return views. Those additions are retained, not replaced with another world restart.

The former conspicuous mirrored asphalt motif no longer dominates the ordinary road views. The new treatment combines finer photographic grain with broader surface variation. Palms now have coherent frond/crown mass rather than the old thin, wiry silhouette. Inspection of the active kit GLB confirms an actual double-sided alpha-masked frond material with a 0.35 cutoff. That confirms the runtime material binding, not universal transparency quality or optimal GPU cost.

The same eight district camera anchors match in recorded position, target and FOV. This supports the before/after comparisons. It is not a human playtest. The environment still reads as constructed procedural scenery in places: repeated facades, simple open lawns/water and a sparse promenade remain. Night loses some architectural definition. A development demo can disclose those limitations; final environmental realism is not approved.

Independent GLB parsing measured:

| Asset | Bytes | Primitives | Materials / embedded images | Source triangles |
|---|---:|---:|---:|---:|
| Foundation |16,862,860|89|8 /19|18,696|
| Kit |28,974,372|147|19 /26|76,163|

These are source-asset measurements, not complete rendered-frame triangles, physical VRAM or measured download traffic. See `evidence/independent-inspection.json` and the matched contact sheets.

## 3. The second-race slowdown is a real unresolved result

I recalculated nearest-rank statistics from the complete raw racing-phase samples, separated by attempt. The working thresholds remain p95<=20ms, p99<=33.4ms and no active interval>100ms. Only a tiny floating-point tolerance was used; no samples were trimmed.

| Supplied run | Attempt | Samples | p95 ms | p99 ms | Max ms | Result |
|---|---:|---:|---:|---:|---:|---|
| Equipped1080 |1|9,940|16.8|16.8|33.4|Pass|
| Equipped1080 repeat |1|9,955|16.7|16.8|16.8|Pass|
| Equipped1080 repeat |2|9,174|**33.3**|33.4|50.0|**Hold**|
| Equipped720 |1|9,955|16.7|16.8|16.8|Pass|
| Stock1080 |1|9,955|16.7|16.8|16.8|Pass|
| Stock720 |1|9,917|16.8|16.8|33.5|Pass|
| Heavy1080 follow-up |1|9,897|16.8|16.8|33.4|Pass|
| Heavy1080 follow-up |2|9,243|**33.3**|33.4|50.1|**Hold**|
| Day equipped1080 |1|4,705|16.7|16.8|16.8|Pass|

No listed race has an active interval above 100 ms. Nevertheless both second-race results fail p95. Pooling the first and second races is not acceptable: it can hide the failed attempt. The local scorer was corrected and the unsuccessful observations retained.

These are submitted Windows/i9-13900K/RTX4080/Chromium153/ANGLE-D3D11 recordings of timing, not a benchmark run by me. They also are not a controlled same-host comparison with the earlier work-machine i9-12900K. Global CPU activity and unrelated work make host contention plausible, but the supplied observations do not prove it caused the slowdown. A separate process snapshot is not time-aligned causation. Stable logical geometry/texture counts are not a GPU-memory measurement or proof that every lifecycle issue is absent.

The next run must investigate under observed naturally quiet conditions, keep per-attempt scoring and preserve all old failures. Do not terminate unrelated work, hide the problem by lowering the visual target, or label the cause established without evidence. Startup/ready gaps and shader transitions remain separate observations.

## 4. What was independently tested, and what was not

**63 focused tests passed, zero failed**, across 14 dependency-free test files covering input, drivetrain, audio pitch, race/save/career, chapter/competition stability, menus/proximity/rearm, environment binding and new waterfront assets. The source was loaded read-only using the included TypeScript loader; no game logic was changed to obtain these passes. Full output and the runner are included.

The local submission reports a successful full build and 121 tests,4,200-row exact physics parity, 58 protected files, 296 physical meshes and 3,080 road/runoff rays. Those remain local-agent evidence. Package installation in this environment could not complete because npm registry DNS resolution was unavailable. I did not independently execute the full build/suite, browser, Rapier parity/clearance, Blender export, physical controller or home-host performance run.

The supplied night and day upload films are 1280x720 at 25 fps with AAC 48k audio; durations are 200.84 s and 115.24 s. Their upload-edition compression is disclosed. I inspected decoded samples, not every moment or an independent continuous human playthrough, and did not audition/approve the sound's character. Recorded video load delays are not clean standalone loading benchmarks.

## 5. Why the upload is too big

This review-only upload is 493.15 MB compressed and 810.92 MB uncompressed. Its compressed payload divides approximately as follows; small ZIP headers account for the difference from total size:

| Payload category | Compressed MB |
|---|---:|
| Evidence stills |166.48|
| Runtime models |120.88|
| Texture maps/HDR sources |99.93|
| Movies and source audio |46.02|
| Editable Blender sources |31.18|
| JSON profiles/manifests |25.85|
| Code, logs and other |2.64|

The `src/scripts/tests` trees together occupy only about 0.58 MB compressed. The complete relevant timing folders occupy about 7.13 MB compressed. Therefore deleting useful source or timing is the wrong economy. Most savings should come from selecting focused stills and not resending bulk historical/source assets or duplicated texture representations.

The next upload has a 60 MB target and 100 MB cap, explicitly labeled review-only. It contains the complete small source, focused final media, raw timing/failures, reports and precise recovery indexes for omitted heavy assets. The complete editable/reproducible project and originals remain retained separately. Nothing is deleted from source history to satisfy the review budget.

## 6. Next direction: P07A — Shareable Showcase

Do not repeat P06C or expand the whole campaign. Retain its useful art and address the concrete performance uncertainty, then make an ordinary visitor's first few minutes work: a clearly labeled demo entry, direct access to the existing three-rival race, meaningful results/retry/garage flow, genuine SlingMods artwork and the existing SM-133 product/site connection. Demo presets must be isolated from career saves and earned progression.

Static source inspection also identifies an inexpensive loading investigation: the garage loads the entire 28.97 MB harbor kit before retaining only its bay module. An exact garage-only export and a tested minimal demo asset closure may make the first visit lighter without reducing visual quality. These are proposed changes, not completed optimizations. Do not blindly remove hidden legacy geometry that still supplies physical support.

Prepare and test a local deployable candidate, document the actual output and hosting requirements, and return one lean Review14 after internal review/repair. Hosting itself is not performed or authorized by this packet. If the performance issue cannot be resolved or characterized sufficiently, return the completed safe local work as NOT SHARE-READY with a precise next experiment—not a false pass or another indefinite art-polish cycle.
