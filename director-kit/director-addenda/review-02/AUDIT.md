# SlingMods — Astra Director Review 02

**Decision: retain the implementation; accept the focused engineering improvements; request a bounded art correction before P03B. G3 stays pending.**

Reviewed September 11, 2026. Input: `Astra-Review-02.zip`. Recorded runtime checkpoint: `fbe89bf31cd81af7b77ec60358c0bcd65056e53a`. Package-ledger checkpoint: `b9fb6227a2383093b671cd67148e7039b7a78e80`.

## 1. What I actually verified

I inspected all seven supplied final runtime stills at their delivered resolution, the relevant Blender-generation/material scripts, exported GLB structure, renderer/shadow implementation, drivetrain code and focused tests. I decoded and inspected 43 approximately one-second samples spanning the 42.8-second pad recording, and 24 half-second samples spanning the 12.08-second orbit recording. This is sampled visual inspection, not hands-on driving or every-frame video certification.

I checked all **180** entries in `PACKAGE-MANIFEST.json`: no file-size or SHA256 mismatch. All **49** declared capture build-input hashes match the packaged files. This establishes consistency with the supplied manifests, not a forensic certification of a remote computer or proof that a hash judges art quality.

I independently ran `node --experimental-strip-types --test tests/drivetrain-wheel-speed.test.ts` on the extracted source: **5 tests passed, 0 failed**. The exact same direct-module rolling/locked/spinning fixture now returns approximately **3,711 / 950 / 4,950 RPM**, respectively, at 10 m/s and zero throttle after 24 fixed ticks. The lost-sign defect is repaired.

The package reports **29/29** full-suite tests plus a successful production build. I did **not** independently rerun that complete dependency-based suite or launch the full application here: this container could not resolve the npm registry. My independent execution result is the five drivetrain checks, not 29 tests. I did not run Blender or claim target-hardware FPS.

Independent evidence: `evidence/independent-inspection.json`, `independent-wheel-rpm-test.log`, `independent-rpm-values.json`, and the sampled recording sheets. Original runtime stills are copied unchanged into `evidence/`.

## 2. What earns acceptance

### Engineering correction: accepted within its stated scope

`src/simulation/drivetrain.ts` now combines signed longitudinal wheel rotation and signed overspeed before taking magnitude for engine RPM. The shared `wheelAngularSpeed` helper is also used for wheel phase. This resolves the reproduced defect without equating wheel lock with wheelspin.

The remaining tick-start body-speed versus end-of-tick contact-speed approximation is explicitly documented in the G2 addendum. I am not reopening that broader model in this assignment. Passing the direct fixture is not proof of a complete wheel-rotational-inertia simulation or an authentic production AutoDrive calibration.

### Asset pipeline: real progress

Independent parsing gives:

| GLB measure | Previous P01 | Current P03A |
|---|---:|---:|
| Triangle primitives | 214 | 52 |
| Triangles | 34,688 | 176,218 |
| Materials | 9 | 20 |
| Embedded images | 0 | 16 |
| Primitives with texture coordinates | 58 | 52, all |

The new GLB is 7,726,756 bytes and contains `KHR_materials_clearcoat`. These are actual exported maps/materials, not just a claim in a report. The package's renderer captures report approximately 214 → 55 full-view hero color calls; that is reported captured runtime evidence, not an independently rerun measurement here. Fewer primitives/submissions do not by themselves prove lower total GPU cost: geometry and texture work increased.

The P01 GLB, shared contact-layout JSON, pad GLB and original `tests/driving.test.ts` are byte-identical to Review 01. The newer drivetrain and simulation source changes are expected, disclosed changes.

### Shadow correction: supported by the available evidence

`src/presentation/shadows.ts` differentiates receiver surfaces from actual occluders. The pad's ground/paint no longer cast, while the vehicle and genuine obstacles can still cast. The supplied controlled diagnosis supports this change. I do not see the old sweeping dark bands in the sampled final pad footage; visible vehicle shadows remain. The authored stationary wet-surface rectangle is not the old defect.

This is acceptance of the bounded repair based on source and supplied visual evidence, not a statement that every possible shadow defect on every GPU is eliminated.

### Entry and scope control: appropriate

The normal entry is now the small inspection bay. Inspect/Drive/Bay actions are present, and the Drive path selects the same candidate GLB. The package clearly leaves rider, audio, controller support, full garage, night racing, rivals, upgrades and campaign unfinished. These were outside P03A and are not being penalized as missing deliverables.

## 3. Where I disagree with the local visual PASS

This is a recognizable, more complete Slingshot. It is not yet the convincing automotive asset requested in the original brief. I accept the plumbing and improvement, not the blanket visual approval. The specific blockers below are the next assignment's locked scope; they are not permission to redesign everything.

### A. Front bodywork still reads as assembled thin surfaces

Look at `neutral-front.png` and `material-detail.png`. The front brow/wing, central light opening, cheek pieces and splitter need a more coherent manufactured cross-section and believable recessed structure. The details exist, but some read as separate plates and blocks rather than a continuous designed fascia. Strong white reflections also obscure the form in the supplied front view.

I compared these against the exact-year dealer photographs already named in the project's reference dossier: `fae0_l.jpg` and `d2cd_l.jpg`. The reference has pronounced shaped eyebrows, tapered light apertures and substantial sculpted cheek/splitter transitions. These are perspective photographs, not measurement-grade orthographic drawings. Camera matching must precede any precise proportion argument.

The correction is not indiscriminate smoothing: preserve the real sharp feature lines while giving the surfaces between them proper curvature and thickness. Do not fill genuine cooling openings merely to make every region solid.

### B. Wheels and cockpit still inherit conspicuously simplified forms

The close material view shows nearly bar-like spokes and a tire that reads too much like a smooth dark ring at normal viewing distance. The wheel reference `3f60_l.jpg` gives a much clearer target for the swept machined spoke faces, hub/lug recesses, rim channel and directional tread. The current generator retains P01 wheel/tire geometry while adding maps and rim lips; the increased whole-vehicle triangle count does not automatically fix those forms.

The cockpit's rim/hub, instrument hood, switch area and seat construction are also too generic. Compare the actual flat-bottom steering-wheel form and button/hub massing in `95c0_l.jpg` and `deda_l.jpg` to the thin round rim and basic spoke arrangement in the current cockpit capture. Seat trim should read as upholstered paneling/bolstering rather than rounded rail-like outlines. Instruments can remain off/static for this pass; adding electronics behavior is not the solution to weak shapes.

The close cockpit view also exposes stair-stepped graphic edges. `vehicle_p03a_materials.py` authors hard binary masks directly into a 1024-pixel vehicle-wide paint map. Use controlled antialiased artwork/coverage and suitable UV density rather than simply increasing every texture or blurring the whole paint layer.

### C. Presentation does not yet support the material work

The bay's bright floor, broad white reflections and largely uniform surrounding values still make the vehicle look like an asset viewer rather than an automotive presentation. `workbench.ts:18–19` uses a generic `RoomEnvironment` PMREM plus the same strong hemisphere/directional setup for bay and pad, with only limited changes between them. That is a valid initial lighting technique, not an API bug. It needs authored art direction for this vehicle and bay.

Develop one controlled neutral inspection setup and one compact bay light rig. Keep paint readable, let rubber/plastic/metal separate, and ground the vehicle with credible local contact/occlusion cues. Do not hide the geometry in darkness, boost bloom or bake fake highlights into textures. Broad white highlights can be physically valid; the goal is legibility across the review angles, not banning reflections.

The orbit also crops parts of the vehicle at several angles, as the package discloses. The corrected review orbit must frame the whole silhouette with a safe margin throughout. Manual zoom-in inspection may remain available.

## 4. Why not expand now?

The next milestone was explicitly about a convincing Slingshot. Advancing because textures exist and a local checklist says PASS would move the quality goalposts. Equally, discarding the working simulation or commissioning an entirely new game would be wasteful.

Therefore the next packet is **P03A1 — fidelity lock**, consisting only of three connected jobs: reference-locked front/wheel/cockpit corrections, material/readability cleanup, and a controlled presentation/framing pass. No new gameplay systems. No full garage. No other vehicles. No P03B/G3 advancement yet.

The source-construction method must change on the areas that keep failing, not merely receive denser samples of the same approximate surface. Keep the useful pipeline and replace local control topology where necessary. Exact P01 render bounds are not sacred OEM data; the actual dimensional/contact contract is what must stay coherent.

These are the named visual blockers. Do not invent a new wish list during implementation. Once they are resolved, the planned driver/input/camera/audio packet becomes the next meaningful step.

## 5. Execution boundaries

Continue exclusively in `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`. No new repository, reset, checkout over unrelated work, or replay of the initial kickoff. Preserve Review 02 and historical gate evidence. Append the director's current decision instead of silently rewriting a local review.

No storefront changes, deployment, paid purchase, credential exposure, desktop mouse takeover, or repeated owner QA. The local artist/integration lead should make routine decisions and a separate reviewer should inspect outcomes when genuinely available. Do not fabricate independent review.

Full instructions and stop conditions are in `CODEX_NEXT.md`; component-specific reference/evidence targets are in `VISUAL_NOTES.md`.
