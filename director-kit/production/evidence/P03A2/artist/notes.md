# P03A2 isolated front-shell proof

Baseline P03A1 source and GLB remain byte-identical. The left/negative-X brow alone is replaced in diagnostic proof01; there is no mirror or normal-runtime promotion. Other panels, maps, wheel contacts, cockpit, rear and bay are frozen.

Reopened fae0_l.jpg and d2cd_l.jpg before construction. The leading boundary climbs toward the outer lamp and varies in depth by115mm. Four independent chord-length Hermite boundaries define a Coons patch. Its connected top and underside use explicit quad loops; four perimeter strips form the radiused leading lip/outer return. There are308 control vertices,306 quads and no n-gons, fans or disconnected covers. Local level2 subdivision interpolates only this new boundary-supported master. The original broad planar terminal cap helper is not used.

Source reproduction: `.tools/blender-4.5.2-windows-x64/blender.exe -b --python scripts/vehicle_p03a2_proof01.py`. This saves `slingshot-p03a2-master01.blend` in isolation before loading P03A1 and saving the unilateral `slingshot-p03a2-proof01.blend`/GLB. `vehicle_p03a2_wire.py` renders the actual control edges without saving over the master. The topology image is source evidence, not runtime appearance proof.

Proof01 actual GLB:202,135 triangles,60 primitives,9,645,320 bytes; same whole bounds and protected world transforms as P03A1. Source/artifact hashes are in proof01.json. Texture files are untouched. The local proof material is neutral nonmetallic `P03A2_Radar_Blue_LocalProof` and supports the integrator's existing diagnostic override. The inherited opposite brow provides a contextual comparison.

Ready for first runtime evaluation using the lead's locked front/threequarter/side cameras and broad highlight sweep. No fidelity PASS is claimed. Maximum two evaluated local candidates; no unseen iteration and no mirrored integration before local review permits it. Front/tire final-fidelity HOLD and G3 pending remain in force.

## Local decision and mirrored integration

Independent reviewer accepted proof01 for the named broad-cap/segmented-return repair after front, threequarter, sweep and negative-X outer-edge close inspection. The long edge still has a rounded highlight and the upper ridge is subdued; those remain approximation limits, not a whole-front/vehicle PASS. Only one local candidate was evaluated. The lead then authorized bounded mirror/adaptation and unchanged-map reuse.

`vehicle_p03a2_integrate.py` opens P03A1 read-only, appends the accepted isolated master, mirrors its mesh with recalculated outward normals, assigns the existing paint material and physical PaintUV projection, and replaces only the two old brow objects. It writes `slingshot-p03a2.blend` and `slingshot-p03a2.glb`. No map or other component is changed. `vehicle_p03a2_verify.py -- --integrated` confirms all717 remaining source objects match exact mesh position/face-index data, material slots, parents and local matrices (the unilateral proof retained718 because it replaced only one brow).

Integrated GLB:211,431 triangles,59 primitives,9,940,912 bytes, SHA256 `a22c36fe04b541c6121f5c6f78fd2b8cfe1e0b8dcec71b98bf7e44b276df23af`. Editable source:8,184,531 bytes, SHA256 `6c0dd156527401cd0f916ef97b8d25bc7e885d41faf600f4669f9f8ab11552a9`. Both source .blend and original proof remain separately preserved. Whole bounds and protected contact/steer/spin/caliper/mount world transforms match P03A1. All16 embedded image dimensions and encoded lengths match P03A1, and all16 original PNG hashes remain unchanged. Thus source RGBA8 cost remains57,671,680 bytes, full-mip estimate76,895,573 bytes; runtime allocations are a separate measurement. Still above a racing LOD target, below the250k showroom ceiling, with no hardware-performance inference.

Full-car integration is ready for lead/reviewer runtime inspection before any default selection change. Tire groove/machining accuracy, rounded edge/subdued ridge and broader final-vehicle fidelity remain documented limitations. G3 stays pending.
