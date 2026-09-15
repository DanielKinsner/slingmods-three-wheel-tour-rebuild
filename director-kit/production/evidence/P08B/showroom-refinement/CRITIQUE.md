# Showroom refinement: reference → prototype → repair

## Reference observations

Viewed all four owner-supplied Downloads images directly. The close-up shows fine vent ribs divided into triangular directions, low support ribs and distinct medium-gray/charcoal tiles. Their projected orientation was initially interpreted as nested squares; the lead's comparison correctly identified the need for softer diagonal chevrons. The three car images establish the red perimeter, pale walls/yellow safety stripe, four-post lift, nearby utility equipment and adjacent ribbed rollup door. No second vehicle was introduced.

The generated drainage candidate was also inspected. Its broad diagonal chevrons were too coarse for the close reference's fine rib density. It remains recoverable as an evaluated candidate. Runtime uses original code-authored maps rather than that candidate or any owner/reference photo.

## Implemented and reviewed

- Preserved cabinet/logo/worktop/display wall composition and original 624 tile positions.
- Corrected tile top UVs and replaced generic parallel grooves with approximately 13 mm rib pitch, vent/support shading, tangent normals and roughness. The first close proof overemphasized bright square outlines, reading like printed circuitry. One bounded material repair reduced baked albedo contrast, lowered the gray tone, changed flat ridge tops to rounded cross-sections, and oriented ribs as diagonal chevrons in four fields. `floor-before-material-repair.png` preserves the rejected close proof; the final `runtime/floor-close.png` uses the identical camera and studio lights.
- Added a real opening in the camera-left side wall, closed ribbed metal curtain, tracks, pale lintel, yellow jamb guards/stripe and threshold. Opening the curtain reveals the presentation apron; no wall remains behind it.
- Added mechanical lift details plus utility chest/compressor. The first actual browser view exposed overly narrow runway centers. They were widened from 1.0 m to 1.6 m; columns and crossbeams were widened consistently. `prototype-lift-narrow.png` preserves the initial critique context.
- Batching initially produced 78 meshes because each curtain slat had separate draw groups. Runtime now batches the 27 editable slats by their shared curtain parent, reducing the room to 18 meshes while preserving the editable source and curtain animation contract.
- Actual browser closed/open bay proof verified the curtain translate-and-gather animation. The lintel conceals its gathered state; the source's stationary wall/frame/lift do not move.

## Verification and limits

`runtime/verification.json` records zero browser errors and actual renderer counters for seven views. The baseline/refined room and floor pairs use identical cameras and main-like studio lighting. Floor/lift detail images explicitly hide the car only to inspect the room material or hardware. Canonical assembled-car shots use the unchanged P08B GLB and show that the room revision does not replace the hero.

The authored source remains packed and builds from repository paths in background Blender. Its script verifies the original showroom source SHA-256 is unchanged. Separate required maps and new runtime/source bytes are indexed in `asset-manifest.json`.

Normal-mapped ventilation is a bounded visual approximation: no physical grate holes, surveyed room dimensions, manufacturer lift load rating, or new collision world is claimed. The floor's close-up remains less physically deep than real open tiles, but now matches their rib direction and checker composition. The rollup gather is a presentation animation rather than a slat winding solver. Final cinematic integration and combined performance remain the integrator's validation responsibility. No G3/G4/final fidelity approval.
