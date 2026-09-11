# Surface checkpoint 05 — independent geometry review

Decision: proceed with material/map development on this candidate. This is permission to develop materials within P03A, not final asset acceptance or a G3 decision. Reviewer: /root/gate_review; 2026-09-10T23:47:05.928Z.

Inspected the actual front, side, front/rear three-quarter and cockpit runtime PNGs and all four sweep PNGs against the previously inspected exact-year dossier photographs (fae0, 4f06, bd31, d2cd, 95c0 and 7d1d). The hood/wing fields retain deliberate crease transitions through the changing lights. Shoulder cross-sections now read angular instead of inflated. The console pocket visibly has depth and the bright cowl gaps are closed. These changes support moving into materials without another broad geometry rebuild.

Two local geometry cleanup items remain before final export: thin dark/sliver seams visible across the dash near the screen top/right and at the left dash; small notches/sawtooth breaks on the shoulder lower edge visible in side/rearquarter. Do not conceal these with darker albedo. Screen surround, switch shapes and upholstery remain simplified against the exact-year cockpit photographs; assess their finished readability during the material checkpoint. This review makes no millimeter-accurate OEM-shape claim.

Read the whole-asset census and independently parsed the actual baseline/candidate GLB files. Their hashes match the census. Candidate SHA-256: 055ce03cda34b625eee168dc9ce56a681c9356cec463ccde84c105da4c9a0242; 42 primitives; 169308 triangles; 4968964 bytes. The census reports exact matching overall per-vertex bounds (1.996 × 1.312732 × 3.799 m in runtime XYZ) and all 18 protected transforms matching baseline. This checkpoint independently confirmed GLB identity/counts; it did not rerun the per-vertex transform census implementation.

Historical gates remain unchanged. Final material, optical/glass, tire/wheel, runtime driving and package evidence remain outside this checkpoint. No source or accepted evidence was altered.

Inspected evidence SHA-256:

- surface-check-05/threequarter.png: 65a191f1d6fe3b84a5f5955d391afc0bd958de5b861219e0b34e3ca9229ee5cb
- surface-check-05/front.png: dc54119b0edb6815a42d1af1b382136cd0dd534d3539a3b0d8658ce80bb6633b
- surface-check-05/side.png: 3545c924541797faf149ad3ad204d81a717fcdb0dcd1435c8baa12d27a748f39
- surface-check-05/rearquarter.png: 8ab9d7f04b8d68a5568b01ca924a444143588167affdd6564e2896d202194aa1
- surface-check-05/cockpit.png: ed4127f26f1e4028fa1a5db0a7623a9a89581ea4fd20b04b544883374c88eff1
- surface-check-05/sweep-0.png: a87318a7b60c3fc5cf73a7ff04b6007fb603a82024dd840c4d97eac643514e77
- surface-check-05/sweep-1.png: 30722b8e3e155cd6a30f69d271acad249db687eb1c348a892dc0b0a90ca7e479
- surface-check-05/sweep-2.png: c1a9abc1103c1a346381d0972ed5075f7643c8536e14aaf596c9358eea5395d6
- surface-check-05/sweep-3.png: 43b5bec969fd0791959dd12003dd6677ffa2d2804a906eddb2bbf59501c6764c
- surface-check-05/whole-asset-census.json: 15cc9d2006bedc663ccf99c8a68d3653e52881775a1561411af0636479bbb18a
