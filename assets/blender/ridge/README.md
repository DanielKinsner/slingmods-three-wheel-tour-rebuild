# Smoky Ridge editable authoring

Original fictional closed-course mountain circuit. It is not a survey, public-road racing route, or NPS-sponsored destination.

## Authoritative geometry

`src/ridge/route.ts` owns the cubic plan, sampled elevation, road and bank mesh vertices, rail boxes, stations and checkpoints. The runtime road renderer and Rapier support colliders consume the same arrays. Planar station metres define event progress; elevation is additive. The 3.2 km circuit rises 84 m; eased grades peak at 6.72%. The pit and summit have level sections. The approximately 653 m initial acceleration corridor slightly exceeds the packet's suggested 650 m upper target; no gearing or speedometer changes were used.

The 12 m road, 3 m shoulders and bank terrain to 60 m each side provide physical support. There is no flat support plane. Distant scenery outside the bank is explicitly visual only; falls are handled by the integrated recovery system. `ridge-land.json` is a triangulated scenic landscape sharing exact physical bank boundary vertices; it does not introduce coincident support colliders.

## Rebuild (repository root, Windows PowerShell)

```powershell
npm ci
python -m pip install -r scripts/p10a-art-requirements.txt
npx tsx scripts/export-p10a-terrain.ts
python scripts/author-p10a-land.py
python scripts/build-brand-logo-wide.py
python scripts/build-ridge-gantry-sign.py
./scripts/blender.ps1 -Script scripts/author-p10a-ridge.py
./scripts/blender.ps1 -Script scripts/author-p10a-terrain.py
```

Validated authoring tools: Python 3.13.5, NumPy 2.2.6, SciPy 1.17.1, Blender 4.5.2 LTS. Existing project Blender wrapper locates the configured executable or optional portable installation. Blender works in the background.

`scripts/build-ridge-gantry-sign.py` (Pillow + NumPy) writes the start-gantry sign face to `assets/source/ridge/`: the owner-supplied high-resolution wordmark (`public/assets/brand/slingmods-logo-wide.png`) multiplied into cream-painted planks, exact aspect, centred, 12% clear margin, with its own roughness map. The kit script reads the board size from `gantry-sign.json`, so run it first. The ridge runtime no longer places a separate logo plane.

`ridge-district-kit.blend` contains individually editable tree trunks, branched crowns, two LODs for four broadleaf variants, pavilion, gantry, tables, crates and rocks. `ridge-kit.glb` is the runtime export. Foliage uses opaque non-planar lobed leaf fans and vertex color; it uses no alpha cards, giant spherical crowns or cones. The runtime groups trees into 100 m cells, switches detailed meshes at 180 m and simpler meshes through 520 m, and bounds shadow casting to the near mesh set. This is explicit spatial LOD, not a claim that instancing supplies LOD automatically.

`ridge-road-terrain.blend` and its GLB are editable inspection/export artifacts. The game consumes authoritative TypeScript arrays plus `public/assets/ridge/ridge-land.json`, not this second GLB. The export JSON contains exact coordinate data. Source coordinates are metres, Y up; Blender uses `[x,-z,y]`. Runtime scene placement, lighting, textures, sign canvas content and instance transforms are editable in `src/ridge/presentation.ts`. Texture references are kept as shared dependencies rather than duplicating old assets.

## Research and rights

Consulted September 16, 2026:

- [NPS Great Smoky Mountains](https://www.nps.gov/grsm/index.htm): layered wooded ridges and atmospheric separation.
- [NPS Cove Hardwood Trail](https://www.nps.gov/thingstodo/hike-cove-hardwood-trail.htm): understory, mature hardwood trunks, canopy and forest-floor visual cues. This is hiking research, not road geometry.
- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) and [LOD](https://threejs.org/docs/pages/LOD.html): shared geometry and explicit distance groups. Runtime remains on the pinned project version.

No NPS photo, park logo, tourist branding or downloaded model is used in the runtime. All new model geometry, original sky gradients, signs and layout were authored for this project. Existing SlingMods sign identity is reused unchanged.

Existing CC0 Poly Haven texture derivatives are reused unchanged: asphalt, leafy grass, weathered brown planks, bark and concrete wall. Exact download sources, original and derived hashes and licenses are preserved in `public/assets/showcase-quality/source-manifest.json` and `p06c-road-provenance.json`. Runtime dependency URLs are enumerated in `src/ridge/assets.ts`. The existing palm bark bitmap supplies generic bark color variation, not a claim of regionally identified tree species. Rock blocks use the existing concrete mineral surface family; no manufacturer or ecological accuracy claim is made.

## Internal critique and repair

Initial runtime art proof exposed downward road winding, slab-like rails, coarse asphalt detail, distant-bank seam gaps and steep extrapolated terrain wedges. Repairs reverse the surface winding without DoubleSide masking, retain the explicit centerline support edge, reduce guardrails to a beam with posts, reduce asphalt tile scale, triangulate land from exact bank edges and blend distant terrain toward smooth valley heights. Daytime warm directional light plus fill and a readable blue-hour preset share the existing one-shadow-map/two-headlight budget. Full integrated driving, camera-height art captures and performance results are in the P10A evidence folder; authoring counts are not frame-rate proof.
