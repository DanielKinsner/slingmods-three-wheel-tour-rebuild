# Depth and far-plane verification

Nine actual isolated Chromium/ANGLE runtime frames: reversed depth at far1600m, reversed depth at far8000m, forced logarithmic depth at far8000m. Each includes the same overview pose/FOV58, ordinary near camera FOV38 and cockpit FOV76. Near clipping remains0.06m in every case. All current quality assets retain identical hashes before/after; no page or console errors. The fixture and source-input hashes are retained.

Both depth methods preserve the formerly disappearing shore land at the original0.06m near plane. The repaired source ground/aprons also no longer show the severe overlapping triangles of benchmark04. The forced logarithmic fallback is visibly functional in this local WebGL2 context. The near and cockpit frames retain accepted framing and show no new obvious clipping or vehicle shadow defect. This is local visual/compile evidence, not proof of equal performance or every driver's support.

Increasing far1600 to8000 moves the upper water clipping boundary farther upward. It does not remove the large angular gap between the end of the finite land and the water plane. That gap remains in both reversed and logarithmic8000 views. Therefore an8000m far-plane change alone is not a complete repair and must not be described as one. Root/artist must address the actual uncovered presentation background/land coverage and its fog/sky transition. No new far range was committed by this verifier.

The overview result's nested config originates from its preceding pose; the explicit diagnostic eye/target/FOV58 describes the overview camera. Normal near/cockpit rows contain their actual pose FOV38/76. No image was edited to repair an artifact.

No G3/G4/art approval; no performance measurements from these captures.
