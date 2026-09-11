# Astra — independent director review 04

Date: September 11, 2026. Input: `Astra-Review-04.zip`.

Runtime checkpoint: `982d12d3d0a83b8dd78ed5ce9c2fda4f0475c264`.
Packaging checkpoint: `30520ca2bef6f059d82ccad79ec73ce3abd6a075`.
Existing project: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.

## 1. Decision

**Accept P03A2's named local shell repair and retain its integrated asset for development. Accept the bounded P03B1 input/practice foundation, with a look-back usability change assigned next. Move forward, not into another general bodywork revision.**

This is not a whole-vehicle realism PASS, a physical-controller playtest, a claim of enjoyable racing-speed handling, or G3 completion. The original high-fidelity goal remains. Its unresolved detail work is recorded, not repeatedly expanded into the immediate critical path.

Authorize P03B2: an occupied vehicle, cockpit driving camera, telemetry-driven sound, a quick rearward glance, and a faster ordinary-path driving demonstration. Retain the existing pad and physical model. Do not build the story, showroom expansion, other vehicles, products or race logic in this packet.

## 2. Front-shell repair: accepted locally

I opened the current complete-bay, proof-front and proof-outeredge PNGs and inspected the 4-second reflection film at 2 Hz. The latter is explicitly a **unilateral neutral-gloss diagnostic**, not the complete mapped vehicle. The rounded connected leading return reads more continuously than the preceding broad terminal-face construction. `proof-outeredge.png` makes that local change particularly legible.

The source now constructs the part from four boundary curves and connected top/underside/perimeter quad surfaces, instead of closing the visible return with the old broad planar cap. `scripts/vehicle_p03a2_proof01.py` and `vehicle_p03a2_integrate.py` implement the method and bounded replacement. I inspected those scripts and their export data; I did not execute Blender or independently reconstruct the editable control cage.

The full mapped bay view confirms the new integrated model is selected. It does not prove exact OEM proportions or complete presentation quality. The subdued ridge, rounded edge, approximate tires and simplified surrounding components remain recorded fidelity limits. They are not new requests for this next packet.

The supplied local reviewer reports that 717 non-brow source objects were preserved. Treat that detailed Blender comparison as **reported**, not independently rerun here. My own byte comparison independently confirms preservation of 52 selected prior files, including the P03A1 source/export, texture files, bay, simulation and shadow policy.

## 3. Independent code tests and preservation

I independently ran **16 tests: all 11 submitted input tests and all 5 signed-wheel-speed drivetrain regressions. All passed.** The actual submitted modules were used. A temporary copy changed extensionless imports in the input test to explicit `.ts` imports so Node 22's built-in type stripping could execute them without installing tsx. Runtime logic was not edited. The runner and output are included.

The input checks cover signed fractional steering, analog triggers, finite-value sanitation, deadzone behavior, meaningful device ownership, slow analog ramp acquisition, held/new controller rearming, pause/blur/disconnect, short keyboard tap buffering and continuous reset-hold timing. Passing these does not establish physical hardware latency or subjective feel.

The signed-RPM repair remains protected. All 52 selected protected files compared with `Astra-Review-03.zip` are byte-identical. Details are in `evidence/protected-paths.json`.

The supplied package reports **43/43 full-suite tests**, 5/5 focused RPM tests and a successful TypeScript/Vite build. I did not independently rerun the complete suite/build/browser checks. The dependencies are absent here and a connectivity probe could not resolve `registry.npmjs.org`. I did not substitute alternate Three.js or Rapier versions. The independent 16-test count is a subset, not 16 additional assertions on top of the 43.

## 4. What the driving film actually establishes

I independently probed and completely decoded both MP4s without errors. The main film is 360 frames, 30 seconds, 12 fps, H.264 and **has no audio stream**. The reflection film is 48 frames, 4 seconds and also silent. I visually inspected the practice film at 1 Hz across its length and the supplied held-lookback still. Contact sheets document this sampling; I did not claim continuous hands-on playback.

The ordinary-path evidence is a real improvement. `scripts/capture-review04.mjs` supplies virtual device samples through `readDevices`/`InputResolver`/`DrivingSession` and `normalFrame`, keeping the unsnapped `ChaseCamera` update. All scheduled 60 Hz presentation updates run while only selected frames rasterize. It does not use the former `advance` shortcut to create the primary movie. The test-only clock/provider are disclosed. This is not a human gamepad recording or a real-time performance measurement.

Visible and source-supported actions include acceleration, left/right steering, near/far selection, held look-back/release, braking, pause/resume, reverse and reset. Shadows remain attached in the inspected samples; the earlier sweeping dark bands are not visible there.

**The speed envelope is narrow.** Parsing the actual recorded frame telemetry gives a maximum of **5.99355 m/s, or 13.4072 mph**. Maximum commanded throttle is 0.32; the only observed gears are first and reverse. This supports low-speed input/camera behavior, not high-speed stability, shift presentation, braking visibility or a sense of racing speed. It is not evidence that the game cannot go faster.

The package records a 163.272-second software-render capture for the 30-second logical movie. That figure is reported capture cost, not measured play FPS. It cannot support a hardware performance claim.

The raster-sampled JSON does not retain every one-frame event flag: its sampled `reset` field never becomes true even though the final relocation is visible and the capture script advances intervening ticks. This is not proof of a missing reset. For the next audio/camera evidence, record the full logical presentation/event timeline so shift, mute and reset timing cannot vanish between saved frames.

## 5. Look-back: usable endpoint, wrong response for a quick glance

The held view eventually points behind the vehicle, but it is implemented as a long orbital sweep. The same `orbit` variable travels from 0 to pi with damping rate 5 and maximum angular speed 3 radians/second.

I replayed **that scalar equation**, initially settled with stationary heading; this was not execution of the THREE camera module. At 60 Hz:

| Hold duration | Orbit displacement |
|---|---:|
| 100 ms | 17.19 degrees |
| 200 ms | 34.38 degrees |
| 300 ms | 51.57 degrees |
| 500 ms | 85.94 degrees |

The equation first reaches 170 degrees at about 1.1 seconds. The supplied samples also show the intermediate side-sweep. `evidence/lookback-source-equation.json` records the method and 30/60/120/144 Hz values.

**Design judgment:** a held racing glance should reveal the rearward road immediately or nearly immediately, not spend a brief press circling the side of the vehicle. This is not a criticism of frame-independent damping itself. Use separate, fast intentional view switching for look-back and preserve normal chase damping. The declared lower-nose cropping is a related framing refinement, not a reason to rebuild the car.

The next packet explicitly authorizes an intentional cut/very short blend for look-back, overriding the previous blanket no-teleport wording for this discrete view change only. Ordinary follow and near/far transitions must remain coherent.

## 6. Export and package checks

Direct parsing of the default GLB gives:

- 211,431 triangles across unique mesh definitions;
- 59 primitives, 58 mesh definitions and 87 nodes;
- 20 materials and 16 embedded images;
- 9,940,912 bytes;
- SHA256 `a22c36fe04b541c6121f5c6f78fd2b8cfe1e0b8dcec71b98bf7e44b276df23af`.

These are asset census values, not draw calls, a quality score, GPU memory use or frame rate. The prior racing-LOD aim is still unmet; one provisional hero on the pad does not justify copying this asset budget to a six-vehicle race. A race LOD remains a later prerequisite to fleet expansion, not a new bodywork task here.

All **187 package-manifest file entries** match the uploaded bytes. All **86 build-input hash records** match the package. This verifies snapshot consistency; it does not independently attest to the local execution history. Dist/served bytes are not present for an independent browser-serving comparison here.

## 7. Next milestone and stopping rule

The next visible change should be **a driver sitting in the car, a useful cockpit view and engine/road sound tied to the actual motion**, not another nearly identical parked-car capture. A faster ordinary-path maneuver should also expose camera and sound behavior across an actual automatic shift.

Freeze the current vehicle, bay and pad assets. Author a separate seated driver. Build one shared audio graph; no second sound-only gearbox. Make look-back a quick deliberate view switch. Keep a reproducible regression check against the accepted low-speed practice input path.

One integrator and one Blender artist are sufficient. Inspect early driver-fit and audio outputs internally, then integrate. No new director framework, giant environment, agent swarm, mandatory user QA or desktop takeover. Stop at `Astra-Review-05.zip` with the exact implemented/held boundaries. G3 remains pending; this packet is not final acceptance of the whole presentation stage.
