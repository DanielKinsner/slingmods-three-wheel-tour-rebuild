# P10B studio / Tour Wall editable source

The existing inferred room is unchanged. `tour-wall-details.blend` contains the correctly placed packed flat landscape, independent extruded exact lettering, shallow surround, trim and warm diffuser strips. `scripts/build-p10b-wall-details.py` reconstructs it and exports only frame/letter details; runtime independently loads the PNG onto a matte plane. The original room source and curtain never receive edits.

## Artwork origin

`tour-wall-generated-master.png` is the selected original built-in imagegen output, generated for this game on 2026-09-16. Actual native resolution is **2172 × 724**, 3:1. The runtime PNG is byte-identical; it was not enlarged to claim 6K detail. It depicts an imagined coast-to-ridge journey, not any actual geographic road. No stock photograph, concept-room screenshot, real logo or text is embedded. The user-supplied W01 was a visual direction reference only. No external paid API, credit purchase or new service was used.

The independent `tour-wall-lettering.svg` source and font meshes use **Barlow Condensed ExtraBold**, supplied with its SIL OFL license under `assets/fonts/barlow-condensed`. Exact headline: **BUILT TO BE YOURS.** Exact secondary line: **Coast to ridge. Build to drive.** `route-motif.svg` is an editable accent study following the conceptual image road; runtime uses the thin line in the image itself and does not double it.

`tour-wall-landscape.blend`, `tour-wall-master.png`, `route-source.json` and `scripts/build-p10b-mural.py` retain the rejected original procedural landscape approach. Its output has stylized conifer/terrain shapes and did not meet W01's photographic ambition. It is not the selected runtime print. The procedural script writes only its own source attempt and cannot overwrite the selected runtime PNG.

## Rebuild / verify

From repository root, use existing Blender 4.5.2 in background:

```powershell
./scripts/blender.ps1 -Script scripts/build-p10b-wall-details.py
python scripts/manifest-p10b-studio.py
npx tsx --test tests/p10b-studio.test.ts
```

The generated selected raster is a retained source, not a deterministically regenerable simulation output. Copy `tour-wall-generated-master.png` to `public/assets/p10b/tour-wall-plate.png` to recover the exact original bytes. Do not need image-generator credentials to build or run the game.

The room survey and placement receipt live at `director-kit/production/evidence/P10B/studio`. All dimensions are measured **game-asset dimensions**, not a survey of the real YouTube set.

## Runtime cost and scope

One 2172×724 plate texture with mipmaps, one frame/text GLB, one unshadowed warm wall wash. Reflection light cards are baked into PMREM once, never recaptured each frame or per finish. Cabinet/lift contact cues are one static transparent draw; only selected room cabinet/wood material groups cast static shadows. Paint clearcoat applies only when `SignatureFinishPresenter(...,{studio:true})`; historical/default race material behavior stays unchanged. No new postprocessing, route assets, vehicle geometry or physics.

Residual limitations: generated imagery is an illustrative print; exact source pixels are below the optional 3072×1024 tier. Close-up print can expose raster resolution. The showroom is still the established stylized game geometry; this pass does not claim OEM model fidelity or photoreal physical lighting.
