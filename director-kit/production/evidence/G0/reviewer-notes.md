# Independent G0 review

Reviewer: /root/gate_review (independent subagent). Implementer: /root.
Reviewed build: d8c5f9226e968f2c551225cf3ab2b79a5343da00, whose runtime/source/assets are unchanged from 80b487fafa0404c7995708c500c252170d9a86b3.
Decision: PASS for the fresh workbench only. No blocking G0 defects.

Direct inspection:
- Read root and kit contracts, P00, G0 criteria, runtime/export/capture/save code, lockfile inventory, all G0 logs and source manifests.
- Opened both original 1440x900 PNGs. Neutral calibration visibly contains red clear-coated metre cube, rough dark rubber patch, pale emissive patch, axis markers and tire with visibly changed spoke pose. They establish renderer calibration, not a recognizable vehicle.
- Opened assets/blender/calibration.blend in background Blender without saving. Blender 4.5.2 LTS reported METRIC, scale 1.0, metre_cube dimensions [1,1,1], 16 scene objects, calibration_tire parent wheel_spin and actual wheel animation data.
- Parsed actual public/assets/calibration.glb: glTF 2.0, Blender I/O v4.5.47 generator, 16 matching named nodes, one animation, KHR_materials_clearcoat and KHR_materials_emissive_strength. Independently verified every size/hash in source-export-hashes.json (blend, GLB, authoring script, lockfile).
- Ran npm test: 3 passed, 0 failed (save round-trip, invalid schema fallback, actual Rapier gravity/collider settling). Ran python -m unittest discover -s director-kit/tests -v: 16 passed. Existing evidence was not regenerated or overwritten.
- Launched independent headless Chromium context against 127.0.0.1:5186. Runtime inspection matched the stored bounds/axes/material/animation report; page errors []. Unmasked renderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver).
- Confirmed standalone Git root, initial fresh checkpoint and no Git remote. Inspected supplied-kit-integrity.json (24 matching source/copy entries), restricted save access, synthetic storage isolation tests, local-only Vite configuration, and preview command guarded by validator. pending-preview-gate.log demonstrates refusal before a review existed.

Limits and non-blocking observations:
- Software-rendered isolated browser evidence is correctness evidence only. Physical GPU performance, controller/mobile behavior, hands-on play, driving quality and vehicle recognition have not been established.
- Existing build has a 651 kB minified JS chunk warning; G0 contains no performance acceptance requirement.
- Calibration capture clock continues advancing around setTime, so screenshots are distinct observed poses rather than exact deterministic animation samples. This does not invalidate G0 moving-pivot proof; P02 frame-cap evidence needs explicit fixed-time control.
- The preserved first browser failure is a float32 roughness equality mismatch. The 1e-6 serialization tolerance is appropriate and does not weaken a visual or dynamics threshold.
- No pre-session hash baseline of unrelated old application files exists in this review. The preservation conclusion rests on the fresh separate root, inspected implementation/build inputs, unchanged supplied kit comparison, isolated browser context and explicit operation boundary; it is not a forensic audit of the old project.

Only P01/P02 are next eligible. No downstream art, driving, performance, fleet, campaign or release gate is approved by this review.
