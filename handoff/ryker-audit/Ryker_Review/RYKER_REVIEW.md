# Ryker: from visual selection to a complete second vehicle
## Source audit and implementation direction

**Prepared:** September 22, 2026  
**Repository:** `DanielKinsner/slingmods-three-wheel-tour-rebuild`  
**Reviewed revision:** `7b041acea01be9f13ba0da6007158ebbd7191525`  
**Comparison baseline:** `de5e5ac82797ae36788555b287d19b37ff422742`  
**Remote status at inspection:** reviewed revision was on `main`.  
**Changes made by this review:** none to the repository or deployed game.

## Decision

Keep the existing game, the purchased Ryker conversion, editable masters, recoverable stock geometry, and the Slingshot's working behavior. Do not restart the game or replace the model wholesale.

The next assignment should make the Ryker an actual vehicle definition, not a visual selection applied to a Slingshot simulation. At the same time, repair the part-production workflow so a named accessory has correct replacement boundaries, recognizable geometry, credible mounting, appropriate motion, and consistent materials between the showroom and road.

A successful import is not the same deliverable as a successful vehicle integration.

## What this review establishes—and what it does not

**Source-confirmed** means the cited implementation directly demonstrates the behavior or limitation. **Code-traced** means the source establishes a problematic path and a likely symptom, but that symptom has not been reproduced in this review. **Reported** means the implementing agent recorded the result; this review did not rerun it. **Proposed** means an engineering or creative recommendation, not a statement about the current build or a factory specification.

This review inspected the pinned source, commit changes, conversion/equipment documentation, tests, and primary manufacturer/product references. It did **not** execute the current build, load its latest GLBs into a renderer, inspect current accessory screenshots, or independently repeat the 401-test suite. Consequently, it does not certify current visual fidelity, playability, frame rate, or exact part collisions. Those are explicit acceptance requirements for the implementing agent, not evidence invented by this review.

The owner has already expressed dissatisfaction with the parts. The findings below explain concrete pipeline weaknesses without pretending to have seen a particular broken silhouette.

## 1. What the latest commits actually delivered

The comparison against the previous main baseline contains 15 additional commits. The useful checkpoints are:

| Revision | Work |
|---|---|
| `10c679c` | Purchased Ryker conversion and isolated visual integration |
| `58d2161` | Rider/contact presentation, source workflow and validation |
| `0ccb93d` | Cockpit, mirrors and instrument presentation |
| `dc164af` | Adrenaline Red / black default finish |
| `4b470dd` | Four equipment-preview families and persistent vehicle switching |
| `9fc3ab9` | Vehicle-choice/navigation layout separation |
| `74da096`, `7b041ac` | Final evidence and production-build readiness records |

The final receipt reports 401 passing tests, a successful production build, and both-vehicle driving/career entry smoke tests. It explicitly retains shared Sport v5 physics and the sustained-performance HOLD. The simulation directory is not changed by this Ryker comparison. [R1, R14–R17]

This is a substantial visual integration, not a Ryker handling implementation. The README explicitly says physics changes were outside that assignment. Do not treat this as proof that the agent disobeyed an unseen prompt; make the next assignment's authorization unambiguous.

## 2. Prioritized findings

### RYK-01 — P0 for a complete vehicle: the visible bike and simulated vehicle disagree
**Status: source-confirmed.** [R1, R5, R8, R14, R15]

The simulator imports the Slingshot contact layout globally and retains its estimated 850 kg loaded mass. Its drivetrain uses five discrete forward ratios. The Ryker presenter rescales wheel rotation and relocates visual effects, but that does not move the physics contacts or resize the chassis.

The documented old contact footprint is 2.667 m wheelbase / 1.755 m front track. The scaled Ryker asset has a 1.709 m wheelbase and approximately 1.059 m modeled front track. The wheelbase difference is 0.958 m; if the front axles share the same lateral centerline, the track difference places each old front contact approximately 0.348 m farther out than its visible counterpart. These are dimensional calculations, not an observed curb test.

A steering retune cannot fix this mismatch. It affects where curbs, edges and barriers are encountered and what lever arms generate pitch, roll and yaw.

**Required change:** resolve an immutable per-vehicle definition before creating the rigid body or any tire channels. Use that definition for contacts, guards/chassis, mass/inertia, wheel radii, powertrain and suspension. Preserve the old Slingshot specification and historical handling profiles. Player and rivals must be able to have different definitions in the same world.

**Proof:** overlay real simulation wheel centers/contact patches and collision geometry on the assembled vehicle; test both sides of a curb and narrow clearance at low speed. A suggested project target is <=1 cm static contact-center disagreement and <=2 cm on a smooth moving surface, measured in a declared coordinate frame. These are engineering acceptance targets, not OEM tolerances. Curbs need contact-envelope-aware comparison rather than an indiscriminate center-distance test.

### RYK-02 — P1: finish binding occurs before replacement panels exist on the road
**Status: code-traced, high-confidence likely visual regression; not browser-reproduced here.** [R4, R7–R9]

`SignatureFinishPresenter` traverses the car once during construction and retains the materials it found. `RykerProducts` subsequently hides the original `body_panels`, `front_suspension` and `rear_mechanical` nodes and adds separately loaded stock partitions.

In `src/express.ts`, the finish presenter is constructed and the finish is applied **before** `SignatureProducts.load()` adds these replacement meshes. In `src/signature/scene.ts`, accessories load **before** the finish presenter is constructed.

That ordering can leave the visible replacement body panels at their exported finish on the road while the showroom paints them correctly. A default-red-only smoke test can conceal the problem. This is about material ownership and lifecycle, not merely a color value.

**Required change:** compose base geometry and mounted/replacement parts before binding paint, optics, motion, shadows and instrumentation. A dynamic material registration mechanism is an acceptable alternative, but there must be one consistent binding contract across modes.

**Proof:** use non-default white and graphite builds; test with the body kit off and on. Inspect the actual visible material slots—not just a recipe label—in showroom, departure, first road frame, retry and return. Keep stock and parts comparisons under matched lighting when evaluating image differences.

### RYK-03 — P1: static stock extraction is brittle; the tests do not prove correct part identity
**Status: source-confirmed implementation weakness; incorrect current masks not established.** [R3, R4, R13]

The partition script selects some body islands with bounding-box rules and selects shock/exhaust islands with connected-component enumeration IDs, including `8320`, `11084`, `3492`, `861`, `37908`, `23951` and `11062`. These identifiers can change when input topology or component traversal changes.

The test proves aggregate triangle-count conservation, finite accessor bounds, nontrivial geometry and a draw-call bound. Those are useful checks. They cannot prove that the triangles assigned to “stock exhaust” actually are the complete exhaust rather than an equally sized collection containing a neighboring bracket or body panel.

**Required change:** produce a stable, reviewed semantic partition manifest against an input hash. Store part names, selected islands, local bounds, material sets, mount anchors and replacement membership. On a changed source, fail visibly and regenerate the mapping rather than silently trusting old enumeration IDs. Retain exact purchased surfaces where possible.

**Proof:** color-ID renders of selected/retained regions, assembled stock reconstruction against the unchanged baseline, and spatial/material/normal comparison—not only counts. Confirm that removing each part removes only that part and that returning to stock reconstructs the whole vehicle.

### RYK-04 — P1: the new accessories are approximations, and some motion groups have been welded together
**Status: source-confirmed construction and motion limitations; final visual severity unreviewed.** [R2–R6]

The Panther, Elka and Treal accessory meshes are original procedural approximations built from reference-inspired polygons, curves and cylinders. They were not extracted from manufacturer CAD or recovered as exact product meshes from the purchased bike.

The export script joins every child of the shock product into a single mesh. That joins all three coilovers together. `RykerProducts` only toggles visibility; it does not animate mounting endpoints. `RykerMotion` poses wheel carriers and handlebars, while the Ryker branch returns before the shared `FrontLinks.update()` call. The rear mechanical group remains rigid and rear-wheel vertical travel is explicitly cosmetic.

A static beauty shot cannot validate this arrangement. Wheel travel can be disconnected from the hardware that should explain it. Future A-arm-mounted lights also cannot follow individual arms if the whole kit is one body-fixed rigid group.

**Required change:** merge by shared rigid motion, not by retail kit. Keep left/right/rear suspension channels separate. Define upper/lower shock anchors, telescoping bodies/shafts, spring endpoints, wishbone pivots, steering carriers, swingarm/rear linkage and correct body-fixed or moving mounts. Decorative fasteners that never move relative to each other can still be merged.

**Proof:** steering through both signs; left-only, right-only and rear compression; droop, braking pitch and acceleration squat. Verify stock and installed parts independently. Do not hide a missing kinematic relationship with extreme smoothing or by freezing wheel travel.

### RYK-05 — P1: a Ryker build is still serialized as a Slingshot build
**Status: source-confirmed schema limitation; not a claim of observed save corruption.** [R10–R12]

`BuildRecipe` still requires `vehicleId: 'slingshot-r-2024'` and a Slingshot Sport v1–v5 profile. Ryker equipment is an optional field. Separate `-ryker` storage keys are valuable isolation, but they do not make a serialized recipe self-describing. Some summaries and storage selection depend on the global current visual.

A complete vehicle system needs identity in the saved build and race snapshot, not only in the current tab's presentation state. Otherwise a link, reload, retry, career transfer or later new vehicle can resolve against the wrong context.

**Required change:** introduce a versioned discriminated build format and explicit vehicle definition/tune IDs. Migrate by adding a new representation while retaining historical records and legacy interpretation. Never rewrite the legacy `slingshot-r-2024` identifier merely because its visual model now represents 2026. Do not silently convert old results into Ryker runs.

**Proof:** a copied build reconstructs the same vehicle, parts, tune and finish in an isolated browser context. Switching vehicles, loading named builds and retrying must not alter another vehicle's draft or a run's frozen identity.

### RYK-06 — P1: career and preview semantics are not a complete second-vehicle workflow
**Status: source-confirmed current scope and routing.** [R2, R8–R12]

The current four Ryker parts are free visual previews, not career purchases or performance upgrades. Choosing a vehicle from `scene=bay` explicitly routes to `scene=signature&screen=build` and removes `play`. That is an exit into preview, not a vehicle switch that remains in the career garage.

The road still configures suspension and exhaust treatment from Slingshot product IDs. A Ryker appearance over an earned Slingshot recipe can therefore inherit hidden Slingshot systems, while the visibly chosen Elka/Treal flags do not control those systems. This follows the current visual-only design; it must not remain the architecture of a real Ryker.

**Required change:** resolve eligibility and behavior from the saved vehicle/build. Keep free preview, owned/equipped career state and the frozen race entry distinct. Make a preview departure explicit and return it to its originating context. Do not require the owner to reset progress or grind simply to use the new bike.

**Proof:** complete garage -> build -> drive/race -> retry -> results -> return -> reload journeys, including a resumed career entry. Verify that no hidden Slingshot equipment affects the Ryker, and that no free preview selection becomes an owned career purchase without a valid transaction.

### RYK-07 — P2: stock width is unresolved, and optimization evidence is limited
**Status: documented source limitation and reported performance, not independent measurement.** [R1, R2, R6]

The README records a uniformly scaled bike approximately 1.198 m wide and explicitly contrasts it with a 1.509 m MY21 overall-width reference. The modeled front track is approximately 1.059 m. Overall width and track width are different measurements. The asset's exact year is not established, so mixing dimensions from different trim/year combinations would be another error.

Do not stretch the entire bike sideways to force one specification. First compare orthographic wheel-center, tire, fender and handlebar relationships against appropriate references. Correct assemblies intentionally only where evidence supports the change, and version the resulting contact layout together with the geometry.

The base export contains 719,254 triangles. The old short showroom receipt reports fewer draws but substantially more submitted triangles for the Ryker than the Slingshot; the separate stock partitions add approximately 5.5 MB. Its refresh-limited frame samples do not establish sustained road performance. The shared project performance HOLD remains.

Additionally, `loadDrivingHero()` loads a Slingshot rival template whenever the selected player is a Ryker, including callers that need no rivals. Avoid that unnecessary load before sacrificing visible detail.

**Required change:** lazy-load fleet resources; consolidate duplicate stock geometry without removing reversibility; profile the actual assembled vehicle in main, shadow, mirror and wet-reflection passes. Introduce measured LODs only where useful. Do not flatten moving assemblies or declare a triangle target a frame-rate guarantee.

## 3. The architecture: one resolved vehicle, not a collection of visual exceptions

This is a proposed minimal extension of the existing engine—not a rewrite.

A `VehicleDefinition` should own stable logical identity, model/asset revision, geometry/contact data, physical specification, powertrain, tuning version, material roles, motion/mount anchors, rider/camera attachments, instrumentation/audio routing, and compatible product definitions.

A frozen `VehicleBuildSnapshot` should resolve that definition plus installed product options, finish, setup and driving mode at the start of a run. A `VehicleInstance` should then compose its meshes, physics body, presenters, resources and disposal path.

Conceptually:

```text
Saved build + vehicle definition + installed product options
    -> validated, immutable run snapshot
    -> physics instance AND fully assembled visual instance
    -> showroom / free drive / career / race / retry / replay
```

The same authoritative contact data must drive simulation, wheel animation, contact shadows and tire effects. The same product identity must drive its geometry, setup controls and any supported game behavior. The same resolved build must drive the HUD and results.

`RaceWorld.addVehicle(id, pose, definition)` is a useful direction, but the agent should adapt the exact API to the existing code. Avoid broad reformatting or generalized frameworks unrelated to the Ryker integration.

## 4. A defensible Ryker physics baseline

Use the **2025 base Ryker 900** as an explicitly declared physical reference, while retaining `visualModelYear: unknown` until the purchased source establishes a year. Do not imply that choosing a physical reference proves the mesh is a 2025 model. [R1, W1]

BRP anchors: 1.709 m wheelbase; 280 kg estimated dry weight; 82 hp / 61.1 kW at 8,000 rpm; 79.1 Nm at 6,500 rpm; automatic CVT with reverse and shaft final drive; base-model front/rear suspension travel 136 / 145 mm; front 145/60 R16 and rear 205/45 R16 tires. BRP lists ABS, traction control and stability control. Dry weight excludes the rider and fluids; power-peak rpm is not proof of the redline. [W1]

Everything else must carry its provenance: published, measured from this asset, estimated for simulation, or a deliberate gameplay assist. In particular, actual axle loading/CG, inertia, spring/damper curves, CVT ratio limits/clutch behavior and exact loaded rolling radii have not been established by this review.

### Mass and suspension

Use an explicit mass budget. An illustrative starting case is 280 kg dry + 80 kg assumed rider + 15 kg assumed fuel + 5 kg other-fluid allowance = 380 kg. The added values are game-model assumptions, not weighed measurements and not the owner's body weight. Refine them consistently rather than quietly retaining 850 kg or using dry weight alone.

Estimate a combined vehicle/rider CG from named mass contributions and known attachment locations. Derive static axle loading from that CG and the axle positions. Choose provisional wheel rates and damping against corner sprung mass, sag and desired response, then verify bump and turn behavior. Keep wheel travel distinct from shock stroke and account for linkage motion ratio where modeled.

Useful design equations, with all chosen parameters documented:

```text
wheelRate = (2*pi*chosenNaturalFrequency)^2 * cornerSprungMass
wheelDamping = 2 * chosenDampingRatio * sqrt(wheelRate * cornerSprungMass)
```

These are starting approximations for a game suspension, not an Elka specification.

### CVT and tire coupling

Implement a rear-wheel-driven CVT model with a launch/clutch region, bounded continuously changing ratio, realistic direction-change handling and torque/power limits. Do not retain five artificial shift interruptions or label a five-gear HUD a Ryker CVT.

Use rear wheel angular speed and the current rolling radius consistently. Enforce `power = torque * angularSpeed`; a curve matching a torque peak can still violate the published power peak elsewhere. Idle, redline, ratio range, ratio response rate, engine braking and clutch slip remain explicitly estimated until sourced.

Drive sound and instrumentation from the new powertrain state. A higher RPM under CVT acceleration should not be accompanied by a fake manual-shift audio cycle. Any synthesized or borrowed development sound must be identified as a game sound, not a recording of a Treal product.

### Handling and game feel

Retain the existing fixed-step Rapier integration and the useful three-tire force framework. Replace vehicle-specific geometry and coefficients instead of creating a second physics engine. Preserve finite grip and combined braking/cornering demand.

The creative target is a lighter-feeling, responsive, predictable bike: usable steering during braking, progressive rear slip, a stock setup that is enjoyable without upgrades, and forgiving recovery from ordinary mistakes. Do not recreate the owner's prior high-speed steering frustration by importing a Slingshot-specific steering envelope unchanged. Do not solve it with unbounded yaw forces or infinite grip either.

Any anti-roll, traction or stability assistance should be bounded and named as a gameplay approximation. The existence of factory electronic systems does not establish their proprietary calibration. Characterize their effect with assisted/unassisted telemetry.

## 5. Make the four existing product families believable before expanding

### Elka Stage 3: use this as the dynamic-quality pilot

Elka describes low-speed compression and spring-preload adjustment for Stage 3. Do not expose an unsupported rebound-adjuster control simply because another product's UI has one. The SlingMods rear listing flags Stage 3 for solo riders. Exact selected fitment and current product options still need to be resolved against the chosen trim. [W3–W5]

Model recognizable body/reservoir/collar/shaft proportions from the exact selected product, separate front and rear hardware, and mount each end correctly. Keep hose/reservoir routing tied to the proper part. Use game-estimated damping effects only with explicit labeling; do not claim a manufacturer dyno curve that was never obtained.

A controlled test road should make a suspension change visible in travel, body response and tire contact—not just replace a red spring and add a handling percentage.

### Panther body kit: this is a recognizable front end, not a generic angular shell

The listing describes a two-piece injection-molded fascia/hood using factory mounting locations and excludes 2022+ Rally fitment. It is a cosmetic product, not crash protection. [W2]

Prioritize the assembled front silhouette, grille opening, hood contours, panel transitions, headlight relationship and molded surface finish. Validate it beside reference views before adding tiny badge or grille details. The present low-vertex procedural construction is a starting point, not evidence of product fidelity. Do not award armor, grip or downforce without an actual supported reason.

### Treal Street exhaust: identify the exact system and model its mounted relationship

The current repository identifies manufacturer part `TRP-RKR-SES`, a polished oval silencer and slash-cut outlet. Preserve that provenance and research the corresponding SlingMods shopping page rather than treating a manufacturer link as the only possible route. [R2, R12, W7]

Validate the stock cut mask, inlet route, can orientation, outlet, bracket and clearances under suspension travel. Product sound and horsepower are separate claims from geometry. Do not invent an authentic recording or transfer a marketing peak-gain figure directly into an arbitrary game torque multiplier. Preserve any use restrictions carried by the actual listing.

### TricLED Kit #1: mounts and combinations matter

The repository's chosen product is a headlamp/grille/A-arm kit with a steady RGB approximation, not a completed chaser controller or all three optional kits. [R2, R12, W6]

Attach moving-arm strips to the appropriate moving assemblies. Test grille lighting both with stock bodywork and with Panther fitted; a strip positioned for the removed stock surface may need a different mount or a declared incompatibility. Do not call whole-body generic underglow a faithful representation of a specifically mounted kit.

### Future expansion

After the four selected products pass, extend into products whose purpose can be represented coherently: suspension/anti-roll response, touring capacity, comfort/presentation and lighting. Do not make an empty Storage category mandatory now, but do not turn its temporary absence into a permanent design prohibition. Record researched-but-unmodeled products separately from selectable finished assets.

## 6. A better agent workflow

### Protect the source, inspect the assembled result

Keep the original purchased model immutable and separate from runtime publication. Use the existing local/headless Blender toolchain; do not ask Dan to install or learn the GUI. Work from the existing editable game master and asset scripts.

The conversion should output a semantic manifest and actual renderer evidence: stock assembled views, color-coded removable parts, material-role isolation, steering/compression poses and one mounted product at a time. No generated marketing image is validation evidence.

A compact set of deliberately chosen front/side/rear/three-quarter/detail views is more useful than many unreviewed screenshots. Render with the game's actual tone mapping and representative lighting as well as a neutral diagnostic light. Keep camera and exposure fixed for comparisons.

### Authorize the right scope

The next active instructions must explicitly allow **Ryker-owned physics and the minimal shared interfaces needed to support it**, while freezing the Slingshot's existing equations, versions, history and owner work. Retire the previous visual-only restriction for this assignment; do not let historical documentation accidentally become the current acceptance target.

Keep the shared performance HOLD honest. A bounded Ryker assignment is not permission to declare the unrelated graphics phase complete or start a new site/engine. Do not use the HOLD as an excuse to stop after writing another proposal either.

Use one implementation lead. Discover the actual checkout, current branch, worktree status and Blender paths. Do not hard-code an old work-machine location or assume older Review ZIP milestones are current. Protect uncommitted work; no reset, clean, force push, visibility change, source upload or deployment without the owner's applicable authorization.

## 7. Implementation order and finish lines

| Slice | Implement | Required evidence before moving on |
|---|---|---|
| A. Honest assembled baseline | Resolve width discrepancy; validate stock partitions; fix finish lifecycle; preserve recoverable source | Stock reconstruction, non-default paint departure check, explicit dimension manifest |
| B. Actual stock Ryker | Minimal vehicle-definition seam; own contacts/body/mass/inertia/CVT; correct wheel telemetry | One existing road: forward/reverse, left/right steering, braking and curb/contact overlay; Slingshot regression |
| C. Coherent moving vehicle | Front links, rear linkage, individual stock/accessory shocks, rider grips/feet, camera/instrument/audio routing | Compression/steer pose set plus actual driving evidence; no detached hardware |
| D. Four credible upgrades | Refine exact chosen product geometry and compatible mount sets; begin with Elka pilot | Reference comparison and stock/mod A/B; combined body+lighting clearance; no unsupported product functions |
| E. Complete player journey | Self-describing builds; vehicle-aware entry snapshots; clear preview/career/ownership/return behavior | Save/load/new-context/retry/return/career reward regression; hidden cross-platform parts rejected |
| F. Measured handoff | Production allowlist, targeted full-flow regression, frame-tail/resource comparison | Actual commands, tested SHA, concise limitations, selected renders and telemetry; no invented pass status |

Execute these as coherent internal stages, not six compulsory owner interruptions. Make local commits at meaningful stable points. Do not produce a film or repeated giant review archives unless requested. Do not stop after a menu, an import, a validator success or a written plan when the assignment is implementation.

## 8. Acceptance checklist

- The assembled stock Ryker is recoverable and visually compared with its preserved baseline.
- No part mask removes neighboring retained components; geometry/material/normal reconstruction is validated.
- Non-default finish survives showroom -> departure -> road -> retry -> return.
- Physical contacts and collision footprint correspond to the chosen modeled geometry; the dimensional limitations are explicit.
- The player's Ryker resolves to a Ryker definition and CVT, not the old Slingshot profile in a new namespace.
- Slingshot rivals can retain their own geometry and physics in the same world.
- Wheels, links, shocks, lights, rider contact points and mirrors remain attached through relevant motion.
- Stock driving is enjoyable without buying a handling fix; subjective owner feel remains a real final approval, not a test assertion.
- Product options expose only supported functions; game estimates are not represented as measured OEM/product data.
- Build identity, eligibility and run snapshots survive mode changes and reloads without changing historical saves/results.
- Old Slingshot products cannot invisibly change Ryker behavior, and preview parts do not become owned purchases automatically.
- New tune/version records do not silently overwrite existing records or alter frozen active event snapshots.
- Resource and frame-time claims identify hardware, resolution, pass costs, loading conditions and measurement length. The existing HOLD is not silently removed.
- The final agent report identifies the actual revision and evidence inspected. A passing validator or test total alone cannot certify the requested result.

## Sources

Repository references below are pinned to the reviewed revision. Their implementation and embedded claims may be superseded by later commits; reconcile before editing.

- **[R1] Ryker conversion scope, geometry, source limitations, and reported validation:** [assets/ryker/README.md](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/assets/ryker/README.md)
- **[R2] Equipment implementation and fitment notes:** [assets/ryker/MODS.md](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/assets/ryker/MODS.md)
- **[R3] Procedural accessory construction, stock partition masks, final joins:** [scripts/ryker/build-mods.py](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/scripts/ryker/build-mods.py)
- **[R4] Runtime stock replacement and accessory visibility:** [src/presentation/ryker-products.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/presentation/ryker-products.ts)
- **[R5] Ryker wheel/handlebar motion and explicit contact mismatch:** [src/presentation/ryker.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/presentation/ryker.ts)
- **[R6] Hero composition, rival loading, and Ryker early-return motion path:** [src/presentation/hero.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/presentation/hero.ts)
- **[R7] One-time finish binding and independently loaded accessories:** [src/presentation/signature-art.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/presentation/signature-art.ts)
- **[R8] Road assembly order, simulation creation, and equipment consumers:** [src/express.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/express.ts)
- **[R9] Showroom assembly order and career/free-preview composition:** [src/signature/scene.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/signature/scene.ts)
- **[R10] Build recipes, vehicle identity, storage namespaces, and snapshots:** [src/signature/config.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/signature/config.ts)
- **[R11] Vehicle selector and career-bay to preview routing:** [src/presentation/ryker-selection.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/presentation/ryker-selection.ts)
- **[R12] Current four-family Ryker catalog:** [src/signature/ryker-catalog.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/signature/ryker-catalog.ts)
- **[R13] Equipment tests and aggregate triangle-conservation assertion:** [tests/ryker-mods.test.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/tests/ryker-mods.test.ts)
- **[R14] Single Slingshot contact layout and global simulation specification:** [src/simulation/index.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/simulation/index.ts)
- **[R15] Five-speed estimated powertrain retained from baseline:** [src/simulation/drivetrain.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/simulation/drivetrain.ts)
- **[R16] Pre-integration test/build/browser receipt; reported, not independently rerun:** [assets/ryker/evidence/main-readiness.json](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/assets/ryker/evidence/main-readiness.json)
- **[R17] Versioned Slingshot tuning:** [src/simulation/profile.ts](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/7b041acea01be9f13ba0da6007158ebbd7191525/src/simulation/profile.ts)

Primary external sources and implementation reference links:

- **[W1] BRP, 2025 base Ryker 900 specifications; accessed 2026-09-22:** https://can-am.brp.com/on-road/us/en/models/previous-models/2025/ryker.html
- **[W2] SlingMods Panther Customs body kit, SM-8167; accessed 2026-09-22:** https://www.slingmods.com/canam-ryker-front-end-body-kit-panther-customs
- **[W3] SlingMods Elka front shock options, SM-5475; accessed 2026-09-22:** https://www.slingmods.com/canam-ryker-front-shocks-coilovers-elka-suspension
- **[W4] SlingMods Elka rear shock options, SM-8178; accessed 2026-09-22:** https://www.slingmods.com/canam-ryker-rear-shock-coilover-elka-suspension
- **[W5] Elka manufacturer Stage 3 Spyder/Ryker feature and adjustment documentation:** https://www.elkasuspension.com/spyder/stage-3/
- **[W6] SlingMods TricLED Kit #1; current repository research reference, revalidate before implementation:** https://www.slingmods.com/canam-ryker-chaser-led-underglow-lighting-kit-1
- **[W7] Treal manufacturer listing used by the current repository; retain as secondary provenance:** https://trealperformance.com/products/treal-performance-can-am-ryker-600-rally-900-exhaust-system

All unmeasured physical parameters, proposed architecture, tolerances, and game-feel choices in this document are recommendations, not facts about the current game or a real vehicle.
