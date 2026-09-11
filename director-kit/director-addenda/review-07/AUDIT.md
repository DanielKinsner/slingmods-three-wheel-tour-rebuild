# Astra Director Review07
## Rear repair accepted for continued development; first real-product loop authorized

**Input:** `Astra-Review-07.zip`  
**Captured implementation:** `fd59df31f9f03f168b6a93e26d48c296526e1b53`  
**Packaging commit reported by archive:** `b51c846c173f4bdfd9772d265e80e0b472f66dac`  
**Scope:** Review of the submitted snapshot, not direct access to Dan's current checkout. No project files or deployment were changed by this review.

## Decision

1. **Accept P04A1's specific rear structural repair for continued development.** The earlier solid-wall/tire collision is resolved in the inspected export, and the recorded suspension presenter follows the wheel while keeping its attachment endpoints connected. This is not final OEM-fidelity certification.
2. **Retain the P04A2 road/material/light changes as a provisional development baseline.** Do not award final environmental visual approval. In the matched 720p images, the palm crowns have lost useful visual mass and read as thin strands; they are not an accepted finished asset. Do not spend the next packet on another whole-environment iteration.
3. **Authorize P04B1 — Make It Yours.** One real SlingMods lighting product, one short newly authored story beat, valid-lap credits, preview/purchase/equip, persisted ownership and color, and deliberate outbound product linking. Full specifics are in `packets/P04B1-MAKE-IT-YOURS.md`.
4. Existing G3/G4 remain pending. This is an explicit scoped dependency exception, not a claim that the original all-features slice has passed. No restart; no new repository; no bodywork rewrite; no additional track, vehicle, opponent, or performance modification in this packet.

## What was independently checked

### A. Archive provenance and preservation

`tools/inspect_snapshot.py` checked every one of the **353 manifest-listed files** against its SHA-256 and size: zero mismatches. It also checked **211 captured build inputs** against the package's captured-input map: zero mismatches. These checks establish internal snapshot consistency; hashes alone do not prove visual quality.

The **32 protected files** in the submitted baseline list matched both that list and the previous `Astra-Review-06.zip`. This covers the listed simulation/input/audio/race foundations, driver assets and other protected inputs. It is not a claim that all 353 files were unchanged; the authorized rear and environmental changes are real.

Independent GLB census of the current car: **210,899 rendered triangles; 72 rendered primitives; 16 embedded images; 20,520,076 bytes**. The large file includes retained unreferenced buffers used by the local preservation workflow. Resource counts are not performance results.

Evidence: `evidence/independent-inspection.json`.

### B. Tire clearance: independent geometry test

I wrote a separate NumPy/SciPy glTF/GLB world-transform reader and a triangle-versus-box separating-axis test, rather than just trusting the supplied Blender validation report. It tests the exported tire's conservative swept box against all **143,615 fixed-car triangles in 43 rendered primitives** after excluding the explicitly moving wheel/linkage groups by hierarchy.

The tire's actual maximum radial bound is **0.345500043 m**. The prescribed rear hub height range is **0.108640625–0.498640625 m**. The box encloses the entire triangle tire surface throughout that vertical range and arbitrary wheel rotation, with another **10 micrometers of padding**. This is stronger than testing just a stationary pose or a few wheel angles.

Result: **zero fixed triangles overlap that full swept tire box**. The minimum normalized SAT separation supplies an approximately **6.849 mm conservative lower bound** between the box and the fixed triangles. This is not the exact minimum tire-to-body distance, nor an OEM clearance specification. The closest limiting primitive is `rear_body_static__Textured_Polymer`.

No individual fixed mesh's bounds contain the representative rest wheel center, so there is no candidate wholly enclosing fixed mesh missed by the triangle test at that point. An additional vertex sampling check at **81 heights × 12 spins** found no sampled tire vertices inside the three explicitly reserved storage boxes.

**Boundary:** The continuous tire-envelope result does not certify every moving link against every other link, chassis flex, crash deformation, or physical manufacture. The package's moving-link BVH collision reports remain locally reported, not independently rerun here. Its storage reservations are author-defined approximations; access doors do not operate yet.

Evidence: `evidence/independent-inspection.json`; current normal opaque-body views `evidence/rear-threequarter.png` and `evidence/rear-enclosed-low.png`; labeled overlay `evidence/rear-clearance-diagnostic.png`.

### C. Suspension presentation

Source inspection confirms a shared presenter for the repaired rear in the inspection/pad/harbor paths. It moves the axle and non-spinning caliper with the contact center, maps the arm/belt between the fixed pivot and moving hub, anchors the upper shock, and telescopes opposite-ended shock sleeves. The pulley remains on the spinning wheel. This is no longer a chassis-static mechanism next to a moving tire.

I independently reconstructed attachment endpoints from the **supplied transform matrices**, rather than relying only on their precomputed error fields. The check covers **324 diagnostic sweep poses, 432 rear-motion samples, and all 10,200 samples in each day/night lap**. The largest endpoint/visible-center discrepancy in this evidence is about **2.77 × 10^-8 m**, well below the requested 1 mm display tolerance. Repeated same-height poses did not change linkage matrices with wheel spin or history. Minimum computed sleeve overlap over the diagnostic range is approximately **21.985 mm**.

**Important retained approximation:** The physical wheel still follows the accepted vertical raycast path. A rigid real swingarm would imply a different trajectory; the visual arm/belt therefore changes axial length slightly. It changes by up to **1.189 mm (0.182%) in the supplied ordinary lap**, but reaches **32.832 mm (5.020%) at the declared extreme diagnostic position**. I accept the ordinary-use repair for prototype development, not a claim of rigid OEM suspension geometry. Keep this limitation visible in the ledger; do not pretend the arm is perfectly rigid. Do not relocate the wheel or retune the physics to hide it.

The sampled motion images visibly show the mechanism following the tire. Some extreme poses intentionally raise the chassis 0.27 m to keep droop visible above the diagnostic floor. Those are injected visual checks, not evidence of road contact or physically simulated vehicle height.

**Boundary:** I did not execute the Three.js-dependent rear presenter tests here. The checks above reconstruct supplied matrices with independent arithmetic and inspect source/imagery. They do not replace a fresh browser execution.

Evidence: `evidence/independent-recorded-linkage.json`; `tools/check_recorded_linkage.py`; sampled `evidence/rear-motion-sheet.jpg`.

### D. Existing gameplay regression checks

I executed the dependency-free **26-test subset** against the submitted source, using the existing TypeScript-transpilation loader. All 26 passed: 11 input checks, five drivetrain wheel/RPM checks, three audio-pitch checks, five race-rule checks and two save checks. The exact output is supplied.

I also compared every physics-telemetry object in the two current **10,200-row** lap traces to the corresponding previous archive traces: zero differences. Each current trace records the same valid **78,719.2038846 ms** result and reaches approximately **51.6 mph**, with forward gears one and two. This is preservation of a disclosed controlled-input capture; it is not independent re-simulation or a human playtest.

The package reports **67/67 full-suite tests**, a TypeScript/Vite build pass and **6/6 isolated browser regressions**. These larger runs were not rerun here. The installed project dependencies are absent and `registry.npmjs.org` does not resolve in this container; Blender is also not installed. Do not convert the reported 67 into an independently executed claim.

Evidence: `evidence/independent-tests.log`; `evidence/independent-recorded-linkage.json`.

### E. Visual and media review

I inspected the current full-size rear three-quarter, low enclosed view and overlay; the matched old/current waterfront day images; and sampled contact sheets from the 18-second rear diagnostic, 8-second bay orbit, 85-second full day attempt and 25-second night excerpt. I probed all four movie containers. This is sampled visual inspection, not a statement that every frame was watched.

**Rear:** The specific tire/wall intersection is no longer visible. Body opacity is retained. The separate tire passage and suspension are legible. The two storage housings remain boxy, plain, and provisional; actual usable interiors and access doors are not delivered. These are fidelity backlog items, not grounds to redo the accepted entire car before one product can work.

**Road and lighting:** The previous obvious striping/repetition is reduced. The course's boundaries, race state and corner direction remain readable in sampled views. The presentation is still sparse and flat in places, with strong highlights. It is not close to finished high-end automotive presentation yet.

**Palms:** The new crowns use more geometry but their leaf mass breaks up at the recorded viewing distance. Compared with the old blocky palms, curvature is better but silhouette readability is not a finished improvement. Stop adding leaflets to this version. Record the next eventual foliage task as a screen-size/LOD/silhouette problem; it does not block this product loop.

The package's resource report lists harbor geometry rising **118,400 → 192,448 triangles**. Its same-fixture reported render calls rise **138 → 164** across the combined rear/environment change. Its roughly 60 Hz short RTX 4080 offscreen measurements include a **133.3 ms day stall** and are only ten-second runs. They do not establish sustained frame rate, mobile suitability or spare lighting budget. I did not reproduce those hardware measurements.

Audio in the day/night movies is aligned from the submitted game's graph and logical timeline via offline rendering. I have not auditioned the timbre or granted sound-quality approval. The silent rear/orbit clips are correctly disclosed.

## The next step and why

The critical spatial defect Dan spotted is now addressed well enough to build on. Another broad visual iteration would delay the part of this project that distinguishes it from a generic driving prototype: **earn a real compatible accessory, install it on this vehicle, see it change the night drive, and deliberately visit its actual product page**.

The next product is the **TricLED base RGB underglow kit, SlingMods SM-133**, with no optional add-ons. The current product page lists the chosen 2024 Slingshot R in its fitment table. The recorded source, fact boundary and game-only economics are in `references/PRODUCT-SOURCE.md` and `references/product-sm133.json`. Lights have no power, grip or timing advantage. Existing personal-best compatibility stays intact.

The next packet is intentionally one product and a small opening story beat, not three unfinished upgrade systems. It creates the common ownership/fitment/installation/persistence path before performance and handling are allowed to alter the vehicle. Full campaign, rivals, other vehicles and other products remain scheduled later, not abandoned.

## Reproduction and artifact boundary

The audit tools read the provided snapshot and write reports outside it. They do not fix or patch the game. Tool dependencies and exact commands are in `tools/README.md`. `DIRECTOR_DECISION.json` is an addendum, not a replacement for the current project's production ledger. `ACCEPTANCE-CASES.json` describes future tests, not tests already passed.
