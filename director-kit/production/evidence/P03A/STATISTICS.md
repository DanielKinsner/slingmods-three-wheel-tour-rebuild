# P03A before/after statistics

Same 1440 x 1000 viewport, 38 degree camera presets, neutral pad lighting, repaired shadow policy. Baseline and candidate are loaded through explicit asset selection; no altered physics or dimensions. Final verification records these counters again against the frozen build.

| Neutral view | P01 hero color calls | P03A hero color calls | P01 full scene + shadows | P03A full scene + shadows |
|---|---:|---:|---:|---:|
| threequarter | 214 | 55 | 443 | 122 |
| side | 214 | 55 | 437 | 116 |
| rearquarter | 214 | 55 | 441 | 120 |
| cockpit | 160 | 49 | 381 | 108 |

| Asset measure | P01 | P03A |
|---|---:|---:|
| Exported primitives | 214 | 52 |
| Triangles | 34,688 | 176,218 |
| UV0 primitives | 58 | 52 (all) |
| Materials | 9 | 20 |
| Embedded authored images | 0 | 16 |
| Candidate GLB bytes | — | 7,726,756 |

The 52 primitives produce 55 full-view hero color calls because transparent surfaces can require extra passes. Renderer counts use a full scene/shadow render, then the same camera with environment geometry hidden and the shadow pass disabled, then restore the scene. Frustum culling reduces cockpit counts. These are actual submitted render calls, not estimated from node names, and not hardware FPS.

Five material families have basecolor, packed metallic/roughness and tangent normal images. Sizes: paint, tire and upholstery 1024²; molded polymer and machined alloy 512²; passive instrument scale 512². Packed map red channels are reserved at one; no baked directional shadows or reflections. All maps are newly authored; no dealer/manufacturer photograph is a runtime texture. The bay adds three authored 512² microcement maps.

Authored hero-image RGBA8 estimate: 45,088,768 bytes base / 60,118,357 with a full mip chain (57.33 MiB). Runtime census: 22 distinct Three.Texture objects, 76,895,588 bytes (73.33 MiB) if each allocates RGBA8 plus mipmaps independently. Shared-image GPU allocation may be reused; this is an estimate, not measured residency, and excludes environment maps, render targets and geometry buffers. PNG/GLB compression reduces transfer, not decoded allocation.

The denser surfaces, wheels and optical details trade more triangles for substantially fewer submissions. 176,218 triangles stay below the provisional 250k showroom ceiling but exceed the 140k racing-LOD ceiling. Using the same detailed asset on the pad is an explicit P03A inspection exception. No LODs, compressed GPU textures, rival-car scaling or physical target-hardware performance have passed.

The complete GLB world extent is 1.996 x 1.312732 x 3.799 m. Every protected wheel, camera, accessory and rider mount transform matches the unchanged P01 source. No body-only scale adjustment was used.
