# Astra — Review12: keep the new materials; hold environmental art approval

**Decision:** accept P06B's material/outdoor-lighting integration for continued development. Do not grant final environmental quality, G3, G4, release or photorealism approval. Authorize P06C — Built Waterfront, one longer autonomous environment-art assignment with its critique/repair loop inside the local run.

Reviewed artifact: `Astra-Review-12.zip`.
Runtime identity: `9348fa90311c5fbdfd74529feb50548582cdca17`.
Packaging identity: `7f5e8c4f16eacd1e466de0fed359087b6156e598`.
This review does not mutate the user's repository. No game code was patched for the next assignment.

## 1. What landed

This is a real change from the previous flat-color/noise atlas. The active exports contain photo-sourced asphalt, concrete, timber, bark and other surface families, metre-based UVs and base-color/normal/packed surface/AO bindings. The source manifest contains **33 channel/HDR records: eight material families with four channels each, plus one HDR**. These are not 33 independent complete materials. All packaged original and derived hashes checked correctly. An independent parse of the foundation/kit GLBs confirms their active image/material references, and the two supplied environment-quality tests ran successfully.

The outdoor renderer now uses an outdoor sky and probe instead of the earlier indoor RoomEnvironment. Source inspection supports the described division between a visible daylight sky, a sun-capped diffuse/specular environment source and the direct sun, plus an authored night environment. Water is still an approximation, not a reflection of nearby boats and buildings. I did not independently run or photometrically calibrate that renderer here.

The terminal, quay, dock and paving are more constructed than Review11. The garage has textured finishes. The submitted local critique also explicitly holds the realistic-art target; it does not claim the world is finished. We retain these improvements rather than resetting the scene or replacing the engine.

## 2. Why the environment still reads as a prototype

These are judgments from the supplied matched runtime images and sampled films, not results of a numerical beauty test.

### A. The dominant view is still open, weakly composed land

Broad flat lawns, low isolated props and repeated distant buildings occupy much of the route. The runtime layout has **779 placements**, including many barrier seams and vegetation placements. A shortage of total objects is therefore not the diagnosis. Their spatial relationships, silhouettes and distance from the player's view are the issue.

The authored district intervals put the service section at stations 300–935 m: **635 m, or 51.6% of the 1,230.867 m lap**. Concentrating another pass on the 65 m terminal area would leave more than half the ordinary lap largely unresolved. P06C must start in the weak service views and build connected dock/service-yard/warehouse ensembles, preserving some intentional open water views. It must not solve this by enclosing the entire route with an opaque hedge or repeating walls.

Evidence: `evidence/district-comparison-2.jpg`, `evidence/current-service-day.png`, and layout measurements in `evidence/independent-inspection.json`.

### B. A photograph became an obviously mirrored road tile

`scripts/p06b_acquire_materials.py` takes a 512×512 crop from a 2048-pixel source, reflects it into four quadrants, and repeats the result with a declared 1.5 m tile scale. The resulting active diffuse map has exact top/bottom reflection symmetry and almost exact left/right symmetry (mean absolute 8-bit channel differences 0.0 and 0.280 respectively). Those are measurements of repetition, not a claim that symmetry is always bad.

The paired/quilt-like motif is visible in normal chase views. The normal-channel reflection handling is already explicit; do not misdiagnose this as a missing green-channel flip. The remedy is a better road-material construction: fine-scale asphalt grain separated from restrained, non-periodic road-scale wear/patching, with coherent maps and physical dimensions. Simply increasing resolution or adding more random noise is not enough.

Evidence: `evidence/asphalt-source-versus-runtime.jpg`, `evidence/visual-diagnostic.json`, ordinary day samples in the submitted package.

### C. The palms lose their crown silhouette

The builder creates real narrow leaflet ribbons, rather than loading a missing transparency map. `Quality_Leaflets` is an untextured scalar material. Near foliage uses 29 leaflets per side per frond with 0.034 m half-width; successive levels reduce leaflets and fronds. The current runtime crowns read as wiry, especially at common driving distances.

This needs a different frond representation with coherent canopy mass at near/mid/far distances. Retain useful trunk/bark work, but evaluate folded full-frond geometry and baked, shaped mid/far fronds instead of only multiplying thin ribbon count. Alpha masking, when used, must be verified in the actual renderer, not assumed from Blender. No claim is made that one particular width or alpha setting is guaranteed to solve the image.

Evidence: `evidence/current-palm.png`, `evidence/detail-sheet.jpg`, `evidence/district-comparison-2.jpg` and the source-linked visual diagnostic.

### D. Darkness is not an environmental finish

Night views still lose substantial scene definition, and daytime cyan illumination can dominate the immediate vehicle footprint. These are secondary presentation notes. Preserve the accepted readable night accessory, but balance the existing lights for readable rivals and relevant landmarks. Do not globally darken the scene to exaggerate the kit or add a wall of glowing emissive objects.

## 3. Independent engineering verification

- **706/706 manifest-listed files** passed the local size and SHA-256 check. This verifies archive consistency, not the truth of each recorded claim.
- **36 protected raw paths and the extended 56-path set** were independently compared against the actual Review11 ZIP: all were byte-identical. The counts overlap; do not add them together as 92 unique files.
- All **33 original/derived channel/HDR source records** matched their packaged hashes. License entries were inspected; Poly Haven's published asset license supports the selected CC0 source use. No blanket clearance is implied for unrelated website text/preview imagery or trademarks.
- Foundation GLB: 19,375,532 bytes, 89 primitives, 8 materials, 19 embedded images, 18,696 source triangles. Kit GLB: 31,541,432 bytes, 113 primitives, 17 materials, 25 embedded images, 91,802 source triangles. These are source-asset measurements, not full-frame triangle totals or GPU memory.
- **61 focused tests passed, zero failed**, across 13 self-contained test files: input; drivetrain; audio pitch; race/save/career; chapter/competition stability; crew/proximity/menu; build-menu rearm; and environment asset bindings/LOD. Full output is in `evidence/independent-tests.log`.
- A small read-only TypeScript loader was used because dependencies cannot be installed here. The first harness attempt lacked JSON-import handling and failed for that reason; the corrected harness reran the complete selected set successfully. No submitted game logic was modified to obtain the pass. The initial harness failure is retained separately, not hidden as a production bug.

The local submission reports **119 tests and a successful TypeScript/Vite build**. I did not independently execute that full suite, the browser, Rapier parity/clearance checks, a fresh race or a physical controller. npm registry DNS resolution was unavailable in this environment. The supplied 4,200-row parity, route rays, save-loop and other browser findings remain explicitly local-agent evidence.

## 4. Performance — recalculated, not independently re-benchmarked

I recalculated nearest-rank statistics from the complete racing-phase samples in the five supplied native configurations, covering six races. No samples were removed to improve the statistics.

| Supplied configuration | Complete races | p95 ms | p99 ms | Worst racing interval ms |
|---|---:|---:|---:|---:|
| Equipped 1080 | 1 | 16.7 | 16.8 | 33.4 |
| Equipped 1080 repeat | 2 | 16.7 | 16.8 | 50.0 |
| Equipped 720 | 1 | 16.7 | 16.8 | 16.8 |
| Stock 1080 | 1 | 16.8 | 16.8 | 50.1 |
| Stock 720 | 1 | 16.8 | 33.4 | 66.6 |

There is no active-racing interval above 100 ms in these runs. Stock720 still sits at the p99 boundary and has lower headroom; later clean runs do not explain its difference. Ready/loading intervals and the isolated 116.6 ms ready-screen observation remain in the data. Program count increases 22→23 early; its exact cause is not proven. Resource counts are logical renderer accounting, not measured VRAM.

These are provided Windows/i9-12900K/RTX4080/hardware-Chromium results, not a benchmark I performed or universal 60 FPS certification. Preserve this provenance and these reservations during the next environment work. Measurements were separate from recording; captured movies are not performance tests.

## 5. Evidence interpretation

All eight paired district stills have matching recorded position, target and FOV. That supports before/after comparison, not a human playtest. I inspected these images and sampled the ordinary day and night films. The main film has an audio stream and the package supplies live-capture synchronization diagnostics; I have not auditioned or approved the sound's character. The silent daylight movie stays labeled silent.

The current films cover an existing-owner fixture, not proof of every fresh-user purchase path. The package separately records fresh-save tests. No claim of a new independent end-to-end browser run is made here.

## 6. Director action

P06C is not another texture-shopping pass. It changes the weak scene-construction approach: compose connected near/midground environments around the existing route, prioritize its longest weak segment, rebuild palm frond representation, and remove the dominant mirrored asphalt motif. Current materials, outdoor lighting pipeline, repaired car/rear, shared physics, rivals, race timing, progression and saves stay.

One substantial return: **Astra-Review-13.zip**. Internal proof, critique, construction changes, full rollout, test repair and clean performance runs all belong inside Codex. An honest HOLD should trigger a local iteration while the task has capacity, not automatically become the user's next ZIP. If blocked, stop safely with a precise constraint and resume state rather than silently downgrading the target to stylized.

### External implementation references verified for this review

- Poly Haven asset license: https://polyhaven.com/license — asset CC0 scope, redistribution and distinction from website content.
- Three.js Material documentation: https://threejs.org/docs/pages/Material.html — alphaTest, alphaHash and alphaToCoverage; the latter requires actual MSAA. These document available mechanisms, not the quality or support of an untested implementation.
