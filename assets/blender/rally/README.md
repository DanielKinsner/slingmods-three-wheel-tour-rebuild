# Redstone Rally scenery

Original procedural scenery authored for this game in Blender 4.5.2, September 2026.
`redstone-scenery.blend` is the editable, packed source. No purchased vehicle or rider source is included.

Rebuild from the repository root:

```powershell
& .tools/blender-4.5.2-windows-x64/blender.exe --background --factory-startup --disable-autoexec --python scripts/build-rally-scenery.py
```

The generator writes nine reusable GLBs to `public/assets/rally/`: three layered sandstone forms,
two ponderosa variants, deadwood, a timber stack, a marshal hut, and a quarry gantry. The pine needle
atlas is generated from original strokes and packed into the source and tree GLBs. The largest model
has 1,232 triangles. `scenery.json` records each export.

`src/rally/presentation.ts` arranges the kit deterministically around the physical course. Original
models use 22 shared near/far instanced batches; near instances cast shadows. Existing licensed P11
broadleaf trees, understory, and ground materials supplement this kit. Their existing source and
license records remain authoritative. The route and its matching support meshes are authored in
`src/rally/route.ts`; the broad terrain mesh and scenery collision boxes are built at scene load.

`public/assets/rally/thumbnail.jpg` is an actual in-game capture of the stage.
