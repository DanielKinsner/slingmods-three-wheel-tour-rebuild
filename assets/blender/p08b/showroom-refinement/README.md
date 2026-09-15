# Owner-reference showroom refinement

New source/runtime revision; the earlier P08B showroom, canonical vehicle and Harbor stay intact.

```powershell
& .tools/blender-4.5.2-windows-x64/blender.exe --background --python scripts/build-p08b-showroom-refinement.py
node scripts/capture-p08b-showroom-refinement.mjs
node scripts/verify-p08b-showroom-refinement.mjs
```

The capture command uses isolated Chromium at `BASE_URL` (default `http://127.0.0.1:5196`) and requires the existing Vite development server. No desktop control. Blender may be installed elsewhere; the authoring script derives all project paths from its own location and uses Blender's bundled numpy. It reads the packed historical `assets/blender/p08b/signature-showroom.blend` and shared authoring helpers in `scripts/build-p08b-art.py`. All generated dependencies are packed in the new source. Runtime GLB embeds its image dependencies; the separate generated maps remain editable/recoverable.

Runtime: `/assets/p08b/showroom-refinement/signature-showroom-refined.glb`.

## Door contract

- `bay_door` origin: game `[5.965,0,0.4]`; the surrounding stationary frame is separate.
- `bay_door_curtain`: local closed position `[0,0,0]`, scale `[1,1,1]`.
- For open progress `u` from zero to one: local Y = `3.35*u`, local scale Y = `1-.975*u`. Restore original transforms on cancellation/disposal.
- Opening is in game +X/camera-left side wall: width 3.6 m along Z, height 3.25 m, center `[6,1.625,0.4]`.
- Presentation exit point `[9,0,0.4]`; authored vehicle forward is -Z, so heading through +X is yaw `-PI/2`.
- Curtain's `openOffset` and `openScaleY` are exported extras. 27 individual editable source slats are batched into three runtime material meshes under the curtain. Gathering the slats under the header is a presentation approximation, not a mechanical winding simulation.

## Floor and reference use

Four owner-supplied images dated Sep 15 (10:48:50, 10:48:55, 10:48:58, 10:49:01) established the gray/charcoal checker, red perimeter, ribbed vent tiles, nearby lift, roller bay, pale walls and yellow stripe. Rounded diagonal ribs form four triangular chevron fields per 0.5 m tile, with approximately 13 mm rib pitch. Original generated albedo, tangent normal and roughness maps provide vent/support detail without 624 high-density geometric grates. Images are not pasted photographs. The independently generated image candidate is retained under `assets/source/showroom-refinement` as evaluated source; its broad, coarse ribs lacked the reference density and were not used in runtime. The first procedural proof was also repaired: bright nested-square outlines were replaced by softer diagonal ribs with lower albedo contrast.

The four-post lift now has 1.6 m runway center spacing, crossbeams, safety ladders, anchor plates/bolts, motor/control/hose, ramps and end stops. Nearby utility chest and red compressor remain supporting props. There is no extra vehicle. Room/lift/door measurements are inferred game dimensions, not surveyed or manufacturer specifications. The exterior apron is presentation-only and adds no route or collider.

## Evidence

`director-kit/production/evidence/P08B/showroom-refinement/` contains source build data, asset hashes, actual browser matched baseline/refined room and floor views, closed/open bay and lift details, plus the critique. Final GLB is 18 material batches; the original was 11. No physics, career or existing product behavior is authored here.
