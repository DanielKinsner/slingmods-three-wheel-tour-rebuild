# 03 · Physics, software, catalog and integration

## Technical decision

Start a NEW TypeScript / Three.js / Vite project, with lightweight DOM/CSS UI and no inherited Vue dependency. Use Rapier 3D for rigid-body collision/constraints and an isolated three-contact vehicle dynamics layer. Web Audio handles the runtime mix. Blender authors new assets. Fresh local versioned persistence comes first; no database or live AI service is required for the single-player slice. No old application code or asset bundles may be imported.

Read the installed package versions and relevant primary docs before writing API calls. Do not blindly pin the historic revision from the September 9 deployment. Lock dependencies once the small export/physics/rendering probes pass.

Rapier's raycast vehicle controller supplies per-wheel facilities and accepts added wheels; that is useful infrastructure, not a certified three-wheel racing model [T3]. Evaluate it on the test pad. The chosen production architecture is a rigid chassis with exactly three suspension/contact channels and a tire/drivetrain layer whose behavior can be tested. If using the built-in controller, disable overlapping forces in the custom layer; never apply the same tire/suspension force twice.

## Module boundaries: make pivots cheap

```text
InputAdapter ──> VehicleControl ──> Simulation (fixed step)
                                      ├─> RaceRules / AI / event log
                                      └─> immutable RenderFrame
RenderFrame ──> VehiclePresenter / CameraRig / AudioGraph / HUD
CatalogSnapshot ──> FitmentResolver ──> BuildConfiguration ──> VehicleSetup
RaceResult ──> RewardLedger ──> versioned SaveRepository
Approved product links ──> user-initiated StorefrontAdapter
```

Interfaces for the new implementation; keep them minimal and implement only the current packet rather than scaffolding a redundant second framework:

- `VehicleSpec`: model identity, dimensions, mass convention, wheel locations/radii, estimated physical setup, drivetrain type, units and provenance.
- `VehicleControl`: normalized steer/throttle/brake, shift request, reverse request, reset edge, and assist choices.
- `VehicleTelemetry`: transform/velocities, wheel contact/load/slip/rotation, steering, suspension travel, engine RPM/load, gear or CVT ratio, brake state.
- `RenderFrame`: interpolated read-only telemetry plus race state. The renderer/audio cannot overwrite authoritative speed or gear.
- `BuildConfiguration`: vehicle ID, installed item IDs/options, settings, visual choices, gameplay tuning version.
- `CatalogProduct`: real identity/fitment/URL separate from authored asset and simulation-effect definitions.
- `RaceResult`: unique race ID, course/build/version, valid finish event, rewards already committed or not.

No DOM or UI-state updates per tire per physics tick; do not let the UI own the simulation clock. Prefer simple bounded buffers and explicit lifecycle cleanup. Avoid worker/offscreen-canvas complexity until profiling shows it is useful. Engine-specific code stays out of catalog, story and save logic.

## Three-wheel dynamics

Use SI internally: meters, seconds, kilograms, newtons, newton-meters, radians. Convert at UI boundaries. Reference seeds are not runnable physics tunes. Dry weight, curb weight, fuel, rider mass, center of gravity and unsprung mass must be treated deliberately. Do not compare a dry Spyder to a loaded Slingshot as if they were the same measurement.

Fixed step begins at 60 Hz with an accumulator, bounded catch-up, and render interpolation. Pause safely on background/focus transitions; don't grant elapsed lap progress while paused. Increase solver/substep frequency only after testing reveals a need. Do not promise bit-identical physics across browsers, hardware, or updates.

Each of front-left, front-right and rear-center has a contact query, travel, spring/damper response, normal load and lateral/longitudinal tire response. Rear is the driven contact; both fronts steer. Apply forces at consistent contact/attachment points so chassis rotation and load transfer emerge. Use separate chassis colliders and robust road/curb collision. Validate casts over triangle seams and at high speed; a ray that tunnels through a curb needs a better query/CCD strategy, not magical grip.

Suspension: bounded travel and bump stops, positive spring stiffness, sensible rebound/compression behavior, no tensile road contact, front anti-roll response that redistributes support rather than creates downward force from nothing. Keep units and sign conventions in tests. If a simplified load-transfer model is used, do not add it on top of fully simulated load transfer without accounting for double counting.

Tires: slip angle and slip ratio with stable low-speed handling; gradual peak/saturation and combined acceleration/braking/cornering limits. A practical initial combined-force limit is an ellipse such as `(Fx/(muX*Fz))^2 + (Fy/(muY*Fz))^2 <= 1`, with tested regularization as Fz and speed approach zero. This is a chosen approximation, not a measured tire model. Surface coefficients and load sensitivity are provisional tuning data. Wheel spin cannot grant extra forward force after grip saturates.

Drivetrain: torque curve, inertia, idle/limiter, gear/final-drive ratios, efficiency assumptions, wheel radius, engine braking and actual shift transitions. Approximate missing torque curves transparently from available facts; do not label an invented curve a dyno plot. Audit torque/power consistency. Slingshot AutoDrive needs real five-speed transitions; Spyder SE6 needs six-speed behavior; Ryker needs a CVT ratio policy/engagement model with no fictional discrete shifts. The speedometer, engine sound and gearbox read one source of truth.

Controls: speed-sensitive steering, rate limits that feel immediate without instant full lock, analog deadzone/response curves, braking progression and controlled reverse engagement near rest. Slip-based traction help and bounded stability intervention may assist novices. These are game approximations, not claims of reproducing proprietary OEM safety systems. Keep body behavior plausible; no motorcycle-style leaning chassis on a non-leaning three-wheeler.

## AI and race integrity

AI controls the same physical vehicles using racing-line lookahead, curvature-aware speed targets, braking planning, neighboring-vehicle prediction, overtaking/defending decisions and recovery. Road splines supply references; they never directly dictate player movement or teleport the AI. No hidden super-grip. Any optional catch-up help must be bounded, declared, and disabled in time trials.

Course validity uses ordered, direction-sensitive checkpoints and sectors, not just increasing spline position. Test starting behind the line, wrong-way crossing, skipped checks, shortcutting, respawning near the finish, reversing and repeated reset. Finish order comes from actual valid crossing events with substep interpolation where useful. Do not award a lap for crossing a nearby spatially overlapping route.

Commits are idempotent by race UUID. Results reopening, duplicated events, background/resume and save/reload cannot grant multiple payouts. One-time chapter bonuses have their own ledger keys. Validate funds, item IDs/options and fitment before applying purchases. Create a fresh save namespace `slingmods-twt-rebuild-v1` with a versioned schema. Never read, import, overwrite, or clear the old game's keys, even on a shared development origin. Future migrations preserve progress within this new game only and keep rollback copies.

Ghosts store transforms/telemetry with track/physics/build version. They are non-colliding replays, not assumed deterministic re-simulations. No global leaderboard before server-side validation and its scope/budget are deliberately added.

## Objective test battery

Use isolated browser automation and headless simulation where valid. Record commands, environment and actual outcomes. These checks are tasks for Codex, not chores assigned to Dan.

| Test group | Acceptance intent |
| --- | --- |
| Coordinates/steering | Left input turns left in physics and visible front wheels; reverse and both chase views correct |
| Three contacts | Loaded rest, incline, one-wheel bump, curb, jump/landing, seam and barrier cases remain finite and stable |
| Motion | Acceleration, coasting, braking, steady circle, slalom, lift-off, traction loss and recovery demonstrate coherent behavior |
| Frame independence | Same nonchaotic scripted maneuver at 30/60/120/144 render caps stays within proposed 1% distance/speed tolerance at fixed simulated time; stricter unit checks for signs/units |
| Drivetrain | Shift/load/RPM/audio trace agrees; CVT has no synthetic six-speed shifts; no NaNs at rest/reverse |
| Race rules | Illegal laps rejected; safe reset; actual finish order; reward committed once |
| Build/shop | Fitment exclusions, option/dependency conflicts, stock restore, save/load and product-outage handling |
| Presentation | Every chosen camera, day/night, working lamps, visible rider contact and suspension; actual runtime captures |

A scripted trace is not proof of enjoyable controller feel. The reviewer should inspect motion and input response, and perform real interactive testing in the available isolated environment. Physical gamepad/phone tests are marked not run if hardware is not available; emulation is not a substitute for claiming those passed. Dan may enjoy a short optional demo without being the project's QA department.

Performance target: at 1080p desktop-high on recorded physical hardware, nominal 60 FPS, p95 frame time <=20 ms and p99 <=33.3 ms over a representative two-minute race after warm-up, with no recurrent >100 ms stalls. This deliberately permits small variance rather than asserting every frame is 16.7 ms. Capture frame times, resolution, quality, car count, CPU/GPU/browser and workload. Software rendering can catch errors, not establish the hardware performance claim. Failing performance blocks expansion; optimize hot paths and expensive effects before gutting vehicle recognition.

## Real catalog versus game design

`data/products.seed.json` is a small researched seed, not the entire SlingMods inventory and not a live commerce API. Every listed part must carry product URL, retailer part number, precise compatible game-vehicle ID, fitment evidence, checked date, required options, exclusions, asset state and rights state. A seller's SM number is not automatically the manufacturer's part number.

For the initial slice use **SM-133** TricLED base underglow, **SM-3223** DDMWorks sport shocks, and **SM-7720** Thermal 2020–2024 sport exhaust. Resolve all selected option values before presenting a part as an exact configured build. For expansion, the seed includes F3-T Thermal exhaust, F3 Baja Ron Ultra sway bar, Rally-specific Elka front shocks, and Slingshot storage bags.

Product categories affect the right systems:

| Category | Game behavior | Prohibited shortcut |
| --- | --- | --- |
| Lighting | Accurate visible fixtures, colors, switching, bounded spill on nearby surfaces | Adding horsepower, hiding lights only in a UI icon |
| Shocks / sway bars | Appropriate adjustable spring/damper/roll behavior; show hardware in the bay | Universal "+20 grip" regardless of surface and setup |
| Exhaust / intake / engine products | Accurate appearance and sound; verified or explicitly estimated simulation changes | Invented measured HP gains, attributing game buffs to the manufacturer |
| Throttle controller | Pedal-to-throttle mapping if modeled and sourced | Treating it as added engine power |
| Cosmetic / comfort / storage | Correct mounts and visual/inspection changes; optional show objectives | Racing advantage assigned solely because the part costs more |

Every numerical upgrade effect has provenance: measured data, manufacturer/seller claim, simulation estimate, or explicitly fictional game balance. These are not interchangeable. Real fitment and product identity remain factual even when driving is simplified. Gameplay-specific engine tuning may be separate from a vendor SKU; its UI must not imply the advertised part produces that result.

A product page may establish fitment but not reproduce the installed appearance or exact spring rate. Such assets/parameters remain pending. Never use "page confirmed" as shorthand for "modeled, licensed and tested."

## Website integration: useful without risky coupling

V1 uses a curated, versioned, locally cached catalog snapshot. Races do not depend on network requests or third-party site uptime. The garage can display factual product names and model-specific descriptions; pictures/videos need an authorized usage path. Do not scrape the full website on every visit or hotlink large product assets into every race.

**Shop this build** presents a bill of materials: chosen vehicle/year/trim, installed parts, required configuration choices, fitment notes, and deliberate links to the exact SlingMods pages. Save game state and pause before navigating away. No auto-opening a dozen tabs. No payment details in the game. Prices are omitted initially; display "See current price on SlingMods." If a price feed is later authorized, include currency and freshness and handle stale/unavailable data.

A future read-only first-party catalog adapter can be integrated after inspecting an authorized real API/feed. Do not invent endpoints, scrape customer sessions, send personal data in URLs, or simulate an unsupported multi-item cart. Links alone work; an actual unified cart requires the storefront's supported mechanism and separate authorization.

Optional build sharing can serialize a versioned, bounded, allowlisted configuration into a link; validate IDs and length, exclude user PII/secrets, and render names as text. Marketing attribution/analytics remains off unless an existing approved consent-aware setup is deliberately reused. No account requirement for the initial single-player game.

If a real part becomes unavailable, preserve the player's earned in-game item and authored asset. Mark the real-world listing appropriately; do not destroy game progression because inventory changed. Use scheduled/manual authorized catalog refresh outside the race loop, not a silent always-live scrape.

## Publication boundaries

Preserve the live SlingMods site and stable game. Prepare local builds and, only within a confirmed authorized deployment workflow, a separate preview. Do not register domains, promote production, add subscriptions, or publish new third-party trademarks/models/textures/audio as if permission had been established. Track rights for public game redistribution; access to reference photos or a vendor relationship is not by itself a documented asset license. Release remains blocked where required permissions or target-device tests are unresolved.
