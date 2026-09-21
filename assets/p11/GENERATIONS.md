# P11 generation record

Built-in imagegen was used (no API fallback or paid external image service).
The complete owner prompt set is preserved unchanged in REQUEST.md.
Each call generated one source asset; model/shader/animation outputs were
authored separately with the retained scripts in scripts/p11/.

| Source | Prompt specialization | Actual generated dimensions |
|---|---|---|
| race-asphalt/dry-baseColor-source.png | Asset 01 dry coastal asphalt only, 4m domain, fine 5–15mm aggregate, seamless top-down unlit albedo | 1254×1254 |
| road-decals/baseColor-source.png | Asset 02, 6×6 transparent cell layout, lane markings, six tar snakes, four seams, six skids, racing strip, four repairs, oil, curb/checker/grid marks | 1254×1254 |
| ridge-trees/oak-leaves-source.png | Asset 04 coast live oak, 4×3 transparent branch clusters, green and dry variants, flat diffuse light | 1254×1254 |
| ridge-trees/sycamore-leaves-source.png | Asset 04 California sycamore, 4×3 clusters, green plus autumn/dry variants, flat diffuse light | 1254×1254 |
| ridge-trees/eucalyptus-leaves-source.png | Asset 04 eucalyptus, 4×3 drooping lanceolate-leaf clusters, sage green and dry variants | 1254×1254 |
| ground-cover/cards-baseColor-source.png | Asset 05, 4×3 fern/three grass heights/poppy/lupine/shrubs/branches/seedheads card layout | 1254×1254 |
| harbor-water/foam-source.png | Asset 03, grayscale/alpha lacy foam, seamless top-down texture | 1254×1254 |
| vfx/tire-smoke-source.png | Asset 09 expanding/dissipating tire-smoke sheet, requested 8×8/64 frames; retained as reference, not the runtime flipbook | 1254×1254 |

The image tool did not honor requested 2K/4K pixel dimensions. The owner approved
native CC0 scans where available and generated artwork alongside them after
discussing upscaling. Runtime foliage and decal atlases are explicitly labelled
Lanczos resamples from these sources; resampling does not add captured detail.
Runtime VFX use deterministic authored simulation with exact frame counts and
dimensions. Per-material/HDR provenance records include licenses and source hashes.
