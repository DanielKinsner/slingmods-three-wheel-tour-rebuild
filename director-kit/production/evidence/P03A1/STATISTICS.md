# P03A1 statistics and checks

Runtime/capture commit: `404dff91255eb0dadcaadeb81075f86508f36607`. Asset SHA256: `f2a417f75028b534a334168670baac3a411d1a0731bd927d0e82a43c8006b1b9`.

| Asset | Unique triangles | Color primitives | Runtime texture-object estimate, bytes | Hero color submissions: calls / triangles | Same neutral scene with shadows: calls / triangles |
|---|---:|---:|---:|---:|---:|
| p03a | 176,218 | 52 | 76,895,588 | 55 / 182,918 | 111 / 359,184 |
| p03a1 | 192,839 | 59 | 93,672,804 | 62 / 199,539 | 125 / 392,426 |

Counters come from the same 1440x1000 three-quarter camera through the final browser verifier. Transparent double-sided passes can submit a primitive more than once; submitted triangles differ from unique triangles. The full scene includes ground and shadow submissions. These are renderer counters, not hardware frame time or GPU memory measurements. Texture estimates assume RGBA8 and full mip chains per distinct Three.Texture object; shared image allocations may be reused, and geometry/IBL/render targets are excluded.

The candidate adds 16,621 unique triangles (9.43%) to P03A. It remains below the justified 250k showroom ceiling, but above the 140k racing-LOD aim. The same showroom mesh is deliberately used on the pad; no LOD or physical-device performance approval is claimed. Bounds remain 1.999529m wide, 3.825305m long, 1.312732m tall; protected contacts and steering/spin hierarchy match the accepted baseline.

The GLB is 9,433,140 bytes. Its 16 authored PNG dependencies total 2,607,184 bytes. Only paint basecolor increases from 1024 to 2048; its analytic edge coverage is blended in linear light. The three tire maps change content at the existing 1024 size; the other 12 maps remain byte-identical to P03A. Source-image RGBA8 estimate is 57,671,680 bytes (55 MiB), or 76,895,573 bytes with mips (73.33 MiB); +16 MiB with mips over P03A. Paint-only runtime anisotropy is capped at8 and hardware capability. See artist/texture-manifest.json for every map's actual dimensions/hashes and allocation caveats.

- `npm test`: 30/30 pass (`tests-checkpoint.log`), including complete-orbit math across 4 aspect ratios and 3 FOVs. This math test does not claim automatic refitting on a normal window resize.
- `node --experimental-strip-types --test tests/drivetrain-wheel-speed.test.ts`: 5/5 pass (`rpm-test.log`); accepted signed-RPM code/tests unchanged.
- `node scripts/build-review03.mjs`: TypeScript/Vite production build passes; existing large-chunk warning remains (`final-build.log`).
- `python scripts/vehicle_p03a1_verify.py`: export UVs, protected transforms and baseline-blob preservation pass (`artist/export-validation.json`). `artist/frozen-geometry-validation.json` confirms the final material change did not alter triangles or corner normals.
- `VERIFY_BUILD=1` final browser verification: ordinary Bay/Inspect/Rear/Drive/return/calibration routes, same-asset identity, suspension position, wheel spin, front and cockpit steering, and stationary rear caliper pass. Served HTML/JS/CSS/GLBs plus all 71 build inputs are checked.
- Final stills include 8 candidate and 5 recaptured baseline images with matching cameras and current rig. Manifests include image and served-byte hashes; baseline images are explicitly labeled as old asset in the current rig.

Windows 11 Pro 10.0.26200; Node 24.15.0, npm 11.6.2, Python 3.13.5, Blender 4.5.2 LTS, Three.js 0.186, Rapier 0.20, Playwright 1.63, Chromium 153.0.8010.12 / SwiftShader. All browser testing is isolated/headless; no desktop input, physical GPU/FPS, controller or human handling approval.

Visual status remains **HOLD** for the broad outer-brow end caps / segmented leading-edge transition; tire groove fidelity remains approximate. AA, seat/control and presentation gains do not award a blanket fidelity pass. G3 remains pending.

Movies: both fully decode with no audio stream at 1440x960 / 12 fps. The 13-second orbit uses 156 frames and took 235.696 seconds including capture/encode; all projected vehicle bounds stay within ±0.780001 NDC. The 20-second pad sequence uses 240 frames and took 134.391 seconds including capture/encode. Peak simulated speed is 19.16285m/s; final speed is effectively zero. It crosses onto the existing grass surface during the far-camera exit; this is a scripted pad/edge maneuver, not a course or race. All 396 source frames, both movies and 71 build inputs were rehashed. See media-verification.json and motion/recordings.json.
