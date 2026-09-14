# Astra Review11 — Environment quality decision

**Project:** SlingMods: Three-Wheel Tour, existing rebuild. **Review date:** 2026-09-14.

**Submitted runtime:** `8d3931f40bf472666c7f2595cfa2650bb2b81980`.
**Packaging commit:** `cad9be48553dbeb33aea51f2fdf7f54f42b95f1f`.

## Director decision

Keep the working chapter and the useful P06 integration, UI, lighting calibration and resource-management work. **Do not accept the environment as having reached the requested realistic/high-end visual target.** The creator's own local art review calls it economical and stylized. That description is honest, but it does not replace Dan's target.

Dan is correct to raise the environment now. This is not a late scope addition. Blender files and texture-map presence are production evidence, not sufficient artistic acceptance criteria. The vehicle itself retains earlier provisional limitations; this decision does not declare the vehicle finished either.

Authorize one longer **P06B — Environment Quality Lock** run. Change the visual construction and material methods, not the game project. Retain the physical course, race/chapter logic, vehicle and saves. Internal benchmark, rollout, integration, verification and repair happen locally; return one Review12 package, not an intermediate scenery ZIP.

## Direct answer: have we built and textured anything besides the vehicle?

**Yes.** There are genuine editable Blender sources, exported meshes, UVs, PBR maps and active runtime integration outside the car.

| Item independently inspected | What is actually present |
|---|---|
| `assets/blender/showcase/showcase-kit.blend` | 18,243,907-byte Blender source, valid BLENDER header and recorded hash. The source was not opened in Blender during this review. |
| `assets/blender/showcase/preserved-foundation.blend` | 15,416,210-byte Blender source, valid header and recorded hash. |
| `public/assets/showcase/kit.glb` | 22,565 triangles, 36 mesh primitives, five materials, seven embedded images. Every primitive has UV0 and a referenced normal map. |
| `public/assets/showcase/foundation.glb` | 23,636 triangles, 86 primitives, seven materials, ten embedded images. 59 primitives reference normal maps. |
| Placement/layout | 266 placements using 24 placed outdoor module names. The exported library also has a bay module, for 25 module names overall. |
| Runtime | `src/presentation/showcase.ts` actually installs the exported foundation and spatially grouped kit; these are not unused files. |

The kit includes terminal/canopy parts, dock and quay parts, moored hulls, service buildings, planters, palms, promenade structures, a far shore, water and the compact garage. The new material atlas is used across these objects. Counts above describe source assets, not visible draw calls, perceived quality or GPU memory.

See `evidence/independent-inspection.json` for original file paths, hashes, material references and image dimensions. Source-side authoring is in `scripts/p06_showcase_build.py`; runtime-side installation is in `src/presentation/showcase.ts`.

## Why it still looks much less convincing

### 1. Much of the new texturing is a color palette with small procedural perturbations

The main basecolor, ORM and normal images are 2048 square, divided into sixteen 512-square tiles. The builder starts with flat RGB colors and applies very low-amplitude Gaussian grain, simple periodic wood/leaf bands and cladding lines. It derives shallow normals from that grain. The ORM occlusion channel is uniformly one, and the exported materials do not bind an occlusion texture.

These are real maps, not absent maps. But their existence does not demonstrate convincing asphalt aggregate, concrete variation, weathered wood grain, bark, foliage translucency or joint/contact detail. See `evidence/actual-environment-atlas.jpg`, an unaltered-content thumbnail montage of the actual maps.

The retained road's material pass only copied/tinted its basecolor. Its original two-metre UVs, roughness and normal were deliberately preserved (`p06_showcase_build.py`, road material proof). Preserving this visual construction was an unnecessary constraint. Preserve the road's physical surface and route; allow new UVs, materials and presentation geometry.

### 2. The largest areas of the driving view still look like blockout geometry

Matched captures show a continuous plain road strip, pale uniform barriers/runoff, a large flat green inland plane, simple isolated buildings and angular palm leaves. More objects are present, but they do not form a convincing continuous place at normal chase-camera distance. Missing environmental detail is not mainly a shortage of tiny props. It is weak ground/road transitions, architectural scale and depth, landscape composition and foliage silhouettes.

The new garage has useful cabinetry, product controls and a readable brand sign. Its broad plain surfaces and black service-side opening still read as an inspection room, not a finished showroom. Preserve the improved interface; improve the space around it.

See `current-terminal-day.png`, `current-marina-day.png`, `current-service-day.png`, `current-garage.png`, `district-comparison.jpg` and `current-race-samples.jpg`.

### 3. Outdoor lighting still contains test-scene shortcuts

Both `src/harbor.ts` and `src/crew.ts` initialize `scene.environment` from Three's **RoomEnvironment**, while `harbor-lighting.ts` uses a flat background color and fog outdoors. In the new kit, dynamic shadow casting is enabled only for terminal, warehouse, pavilion and gantry. The foundation never casts; the palm modules never cast. Water uses an animated normal on a standard material with the same environment rather than local scene reflections.

These source facts support replacing the outdoor-lighting setup and improving contact grounding. They do **not** prove that one HDR image or enabling every shadow caster will solve all visual problems. Neither indiscriminate dynamic shadows nor expensive reflection passes are the prescribed solution. Use a coherent outdoor sky/IBL/direct-light setup and budgeted dynamic shadows plus appropriate static contact/AO treatment.

## Engineering preserved and independent checks

- Verified all **629** manifest entries against packaged file sizes and SHA-256 hashes; no mismatches.
- Compared **29 selected protected files** with Review10: all identical. These include vehicle exports, rear/driver presentation, selected simulation/competition/input/race/save/career code, the physical route and product asset/attachment files. This is a selected comparison, not a claim that the entire repository is unchanged.
- Ran **59 focused tests** against a temporary TypeScript-to-CommonJS copy of the submitted implementation: 56 input/drivetrain/race/save/career/chapter/competition/menu/proximity tests plus three audio-pitch tests. All passed. No product source was patched. The first local test-harness invocation lacked a JSON fixture; it was copied and the complete selected set rerun successfully. That harness setup issue is not a product defect.
- Recalculated the supplied scored native-RAF rows with `phaseCode=2` (the source's running phase): **seven completed races across five configurations**, p95 approximately 16.7 ms, p99 approximately 16.8 ms, worst racing interval 50.0 ms, zero intervals above 100 ms. These are submitted RTX 4080/ANGLE traces at 720p/1080p DPR1, **not a new independent hardware benchmark**. Program counts increase from 20 to 21; the preparation reservation remains. Incomplete/interrupted runs are not silently scored as successful.
- Independently inspected final video stream metadata: 192.24 seconds, 1280x720 H.264 video and stereo 48 kHz AAC audio. Sampled frames at 12, 30, 52, 75, 100, 124, 148 and 169 seconds. This verifies an audio stream exists, not subjective sound quality or independently proven synchronization.

See `independent-tests.log`, `independent-profile-summary.json` and `independent-inspection.json`.

## Verification boundaries

The submission reports **111 passing full-suite tests and a successful build**. Dependency retrieval in this review container failed with npm registry DNS resolution (`EAI_AGAIN`), so the complete browser/physics/build suite was not independently rerun. The native Blender sources were verified as files and traced through their authoring script/GLB outputs, not opened and re-exported here. Captures are supplied runtime evidence, not a fresh personal playtest. Physical controller feel, human enjoyment, subjective audio quality and broad hardware support remain unverified. G3/G4 remain pending; there is no release approval.

## Next decision

The functional milestone is retained. The **visual method must change**. The next packet expressly permits CC0 material/HDR acquisition, rebuilding presentation-only scenery in Blender, replacing placeholder road/ground materials and UVs, and changing outdoor illumination. It does not permit a new engine, a new course layout, another vehicle, a gameplay rewrite, paid purchases or deployment.

The first integrated road/terminal/marina sample is an internal art decision inside the same run. Once credible, carry its standards through all four existing districts and the compact garage, then validate a full chapter. Do not repeat the previous pattern of hundreds of technically valid placements being treated as proof of a realistic environment.
