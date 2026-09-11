# P03A shadow-band diagnosis

The original Astra movie shows broad moving dark rectangles on the open pad. This was investigated separately from vehicle art, using the unchanged P01 GLB and unchanged pad geometry.

Controlled caster/receiver modes were added: legacy (all meshes cast and receive), vehicle-only casters, receivers-only diagnostic, and repaired (vehicle plus real obstacles cast; ground and surface/paint overlays receive only). Static settled-pose and recorded-pose replays did not reproduce the transient bands; these negative probes are retained and are not presented as proof of a repair.

Continuous actual keyboard motion DID reproduce the bands under the legacy caster policy: see keyboard-legacy-SILENT.webm around9-10 and13-14 seconds and its sampled sheet. The same start/left/brake/right/camera/accelerate/brake sequence under the repaired policy did not show those bands; vehicle body and wheel contact shadows remain visible. Exact input stages are identical, but wall-clock capture/software-renderer speed differs, so the clips are a policy comparison of the same maneuver, not synchronized pixel-identical trajectories.

The caster isolation identifies the open pad's large ground/surface/marking meshes being treated as occluding geometry as the actionable cause. The source floor is a110x220m,2mm-thick slab; it and raised paint were previously included in a moving24m directional shadow region. These horizontal receiver surfaces have no legitimate above-ground occlusion role. Their shadow participation was removed; vehicle, curb, barrier, bump, ramp and seam-block shadow casting remains. No floor darkening, shadow-intensity zeroing, vehicle-shadow removal, collision edit or physics retune is used. The precise transient GPU depth/frustum precision mechanism has not been independently isolated and is not claimed proved.

The large stationary dark wet-surface rectangle visible toward the pad's left is authored low-grip wet asphalt, not the moving band defect; it is retained.

Testing: isolated headless Chromium153 with SwiftShader, silent movies, no physical GPU frame-rate claim. Later candidate pad footage checks the same repaired policy with the P03A asset. Legacy/isolation modes are explicit diagnostic query options, not the normal route.
