# P10A internal critique and repair

## Scope and preserved behavior
Smoky Ridge is an original fictional closed course, not a surveyed Smoky Mountains road. The road has real elevation and physical support; visible road and collision consume the same sampled mesh. Lap stations remain planar metres, with measured 3D length reported separately. Old flat routes use their original code branch. Sport v3 force, braking, steering response and engine curves were not changed.

Two specialists handled route/art and destination/career integration. The lead integrated height, simulation, grids, AI, gates, recovery and camera; each specialist reviewed the integration independently. This is internal review, not director, hardware or final-fidelity approval.

## Repairs and retained adverse evidence
- Initial road winding made the rendered surface back-facing. Reversed actual winding and tested upward normals; no double-sided masking. Explicit centerline edges removed a 3.5mm render/support interpolation discrepancy.
- Initial bank extrapolation produced wedges and a scenic seam. Exact outer bank vertices now join the distant triangulated land; far land is explicitly visual only.
- Guardrail slabs became pitched beams; posts are visual. Road paint now follows grade instead of intersecting slopes.
- The first four-car proof with the inherited fast pace lost the player at a descending bend. Only the elevated-route AI speed/curvature plan was reduced; shared forces, product handling and old-route AI remain unchanged. Full actual four-car laps subsequently pass.
- A sustained forced outward throttle shove can wedge a vehicle against the rail. The failed final-grade trace remains under grade-maneuvers-final. The ordinary brush protocol ends the forced approach immediately at the first positive contact impulse, then gives control to the unmodified production controller. Each rival recovers in that defined scenario; this is not a universal crash-recovery guarantee. Severe blocked AI can retire after the existing bounded recovery attempts; the player can explicitly recover/restart.
- New additive blank chapter state initially broke an old equality test. The historical fixture was kept intact; the test now checks the added blank state separately and still requires exact equality of every prior field.
- Browser pause/retry evidence initially omitted the neutral input rearming required by the existing input system. The harness was repaired; production arming was retained.
- The real destination thumbnail initially overflowed its short card. The image is now bounded within the card; four viewport checks verify actual decoded image bounds.
- Independent review found partial-load decoded resource ownership and unused coastal warm downloads. The lead changed the new loader to wait for all settlements and dispose successful partial decodes on failure, and removed unused coastal sky/kit downloads only from Ridge preparation. Successful transition counts remain stable.

## Art judgment and limits
Final art-proof-06 shows all four districts in afternoon and blue hour, with actual racing-camera and cockpit crest views. Road, rivals and downhill brake boards remain readable. The environment is a stylized authored forest: angular rock forms, simplified distant hill layers and cell-based foliage LOD remain visible. It is not photorealistic or species/survey accurate. Distant land beyond the supported 60m banks has no collision; decorative off-road rocks/trees are not camera colliders. Minor off-road decorative clipping is possible. No new world, vehicle or audio generation service was used beyond this bounded destination.

## Evidence boundaries
Career correctness uses controlled simulation time with ordinary control inputs and real race gates. Native performance uses wall-clock RAF separately, without recording or tracing. The film uses actual game audio and automated pedals/steering, with a continuous full lap and disclosed loading cuts. Resource counters are logical counts, not GPU memory measurements. Same-host fresh remote clone recovery does not certify another computer. No owner subjective fun/listening or physical-controller approval is implied.

Final performance, host and remote results are recorded in P10A-VALIDATION.json and PERFORMANCE.md when complete; no unfinished gate is inferred from this critique.

## Final remote delivery review

A fresh Git clone exposed byte mismatches in two Ridge JSON assets and the presentation source from inherited line-ending normalization. The exact authored bytes were committed with explicit no-normalization attributes; the remote clone received the repair by git pull, then passed all143 required assets,31 focused inputs,263 tests and two complete rendered day/night laps. Every307 previously pushed original evidence file matched the clone. No project assets were copied into it.

The first hosted script used an obsolete direct test-drive button selector while still in the workshop. It was repaired to open Destinations first; production UI was unchanged. The retained hosted-final-01 failure is a harness failure. hosted-final-02 completes actual native keyboard movement, full Ridge race, results/retry and same-build return. All103 actual public HTTPS asset bodies match committed hashes. The existing curated Vercel build reports only its vercel.json checkout change and zero runtime changes.
