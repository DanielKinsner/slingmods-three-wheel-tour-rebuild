# P06B native performance review

Runtime:9348fa90311c5fbdfd74529feb50548582cdca17. All five configurations/six complete races meet the existing working racing limits on this reference machine: p95<=20ms, p99<=33.4ms, no active interval>100ms. This is not G3/G4, universal performance or artistic approval.

Windows11Pro26200, i9-12900K, RTX4080 driver32.0.16.1692, Chromium153.0.8010.12/ANGLE D3D11, standard quality, DPR1. No MediaRecorder, screenshots/readback or full scene inspections in the scored loop. Native RAF throughout; recorded films are separate. No unrelated application was stopped. Fresh browser/context does not mean cold OS/driver caches.

| Configuration | Complete races | p95 ms | p99 ms | Max ms | Active >100ms |
|---|---:|---:|---:|---:|---:|
| equipped1080 | 1 | 16.7 | 16.8 | 33.4 | 0 |
| equipped1080-repeat | 2 | 16.7 | 16.8 | 50.0 | 0 |
| equipped720 | 1 | 16.7 | 16.8 | 16.8 | 0 |
| stock1080 | 1 | 16.8 | 16.8 | 50.1 | 0 |
| stock720 | 1 | 16.8 | 33.4 | 66.6 | 0 |

The equipped1080 repeat follows three actual audio-active crew/bay/crew transitions in the same isolated context, then two full races with an ordinary retry in one document. All four cars finish every attempt. Raw complete phase rows, bootstrap/loading, field results, preparation stages, renderer and input provenance accompany each case. Racing statistics cover the entire player racing phase, not a selected easy segment; post-finish rows remain in the raw data.

The first stock720 run has reduced headroom, including59 intervals above33.4ms and13 above50ms, despite meeting the p99 boundary. The later equipped720 run is clean at16.8ms p99. Do not claim a proven cause for the first run from that difference. No sample was removed or replaced. Nearest-rank statistics retain original floating-point values; threshold comparisons allow only1e-6ms tolerance so33.400000000001ms is correctly treated as the33.4ms boundary. No meaningful budget was relaxed.

## Rendering cost and lifecycle

Current logical resources stay272 geometries/72 textures throughout each scored race and the separate four-race/three-retry functional test. The three pre-repeat transitions have the same counts. This is per-renderer resource accounting, not global GPU VRAM. Draw submissions span roughly440–1020 and total submitted triangles roughly1.12–2.20million, including shadow passes/instances. P06 comparison files on the same hardware reported roughly363–723 calls,0.92–1.91million submitted triangles,197 geometries and52 textures. Richer materials/geometry consume more resources; the additional local-art quality remains unapproved. The first-run CPU/interval difference is not wholly attributed to these counts without a causal experiment.

Program count rises22→23 once early in each new race document and then stays bounded, including the second repeat. Six spotlight slots and two area-light slots remain resident. The exact late shader variant is not isolated; retain that reservation rather than claim perfect precompilation. No coincident >100ms racing interval occurred.

## Startup/outlier audit

Every >100ms raw interval is retained in performance-summary.json with its phase and neighbors. The first ready-frame interval spans a previous RAF timestamp before synchronous preparation ends, consistent with the loading/preparation first render. The separate stock720 ready interval116.6ms occurs at tick0 immediately after the collector's initial full inspection; it is outside the scored race. Timing correlation alone does not establish its cause.

After all scored runs, inspection-final alternates actual lightweight and full ready-state inspections. Full transfers contain about449–452KB and take106–129ms on the host, versus about6.6KB and3–11ms for lightweight transfers. Browser-side object building is<=0.5ms, and adjacent RAF intervals remain<=33.4ms. Thus the experiment demonstrates expensive diagnostic transfer, but does not reproduce or explain the original116.6ms RAF gap. That single ready-screen cause remains unresolved. No production source was changed on a guess.

Historical P05/P06 failures remain local and in prior packages. Clean current runs do not retroactively diagnose them. CPU submission timing is not GPU execution time; headless results are not physical-controller/foreground-display, other hardware/mobile or human playability approval. See raw performance-summary.json, traffic-review.json and VALIDATION-METHODS.md.
