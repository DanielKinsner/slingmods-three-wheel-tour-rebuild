# Executable work packets

These are deliberately narrower than the full design. The lead maps example paths to the real repository during G0, records that mapping, and gives each specialist only its own writable paths. Never fabricate a success just because a task is described here.

## P00 — Establish the workbench (G0)

**Owner:** lead. Read `FRESH_START_POLICY.md` first. Create or confirm a NEW empty `slingmods-three-wheel-tour-rebuild` directory outside the old game's Git root, and initialize a NEW local Git repository. If the current workspace is the old game, leave it untouched and establish the separate workspace within permissions before any application edits. Copy only this kit. Do not clone the old repo, create a legacy worktree, import old source/assets, or audit the old application as a prerequisite. Record the new absolute project root and Git root. Respect existing unrelated work and applicable instructions; never clear a directory.

Scaffold only a minimal TypeScript/Vite/Three.js/Rapier application, lightweight DOM/CSS overlay, test harness, and a renderer calibration scene. Verify installed APIs and pin the tested dependencies. Establish a new save namespace (`slingmods-twt-rebuild-v1`) and a test that old/unrelated storage keys remain unchanged; no legacy import or migration. Identify actual build/dev/test commands, Blender executable, and isolated automation. Do not copy old deployment configuration or secrets.

Run a minimal Blender CLI export and import the resulting calibration fixture in the NEW renderer: unit scale, axes, a clear-coated patch, rubber patch, emissive patch, and moving wheel pivot. Capture through isolated browser automation. Record tool versions and any automation limitations. Run new harness smoke tests, serialization/storage-isolation tests, and a minimal physics-world smoke test. Steering behavior belongs to P02 and race/reward behavior to P04; neither must already exist at G0. Configure the evidence-integrity check without claiming it proves visual quality. Do not touch production or the storefront.

**Reviewable output:** fresh-start.md with new root/Git boundary and zero-legacy-import checklist; commands/environment record; minimal running app; calibration GLB and `.blend`; actual runtime capture/export logs; smoke/storage-isolation test logs; initial local checkpoint. A Blender or workspace-permission blocker stays explicit; never generate pretend assets or change the old project as a workaround.

## P01 — Recognizable machine before detail (G1)

**Owner:** vehicle artist. Allowed: vehicle reference folder, Blender sources, asset manifest and calibration scene. Read vehicle seeds and art contract. Assemble exact model-year references. Resolve reliable dimensions and flag conflicts. Create all three cheap scale blockouts, then focus on Slingshot primary surfaces and cockpit. Export the clay hero and compare neutral front/side/rear and three-quarter views in the runtime. Match wheel centers, real scale, nose/fenders, cockpit, rear silhouette and lighting signature. Establish named pivots and mounting slots.

**Reject:** generic roadster, too-narrow stance, wrong model year, wrong wheel positions, empty body shell sold as a finished cockpit. **Output:** source `.blend`, GLB, dimensions report and comparison captures. No full city or fully detailed second hero.

## P02 — The driving pad (G2, may run beside P01 after G0)

**Owner:** driving engineer. Allowed: simulation/input/camera adapters, test-pad scene, tests. Use the exact dimensional contact configuration rather than independently guessing from the mesh. Implement chassis, three contacts, tire response, brakes, transmission, steering and assists in small tested increments. Add near-chase camera and debug telemetry. The driver can brake, reverse, leave the road, hit a curb and recover; the car is never glued to a racing spline.

Build automated straight/brake/circle/slalom/bump/seam tests with recorded inputs and sensible tolerances; render captures at 30/60/120/144 caps to check fixed-step behavior. Introduce surface differences and a simple traction-loss recovery. Verify wheel/steering visuals follow the actual state. **Output:** drivable pad, telemetry, actual motion recording, test log and explicit approximation list. No menus full of future content.

## P03 — One car that holds up to the camera (G3)

**Owners:** vehicle artist plus look-development worker; separate files. Detail the accepted hero, build rider contact rig and stock part slots. UV, bake and tune materials using calibration objects and moving lights. Build the premium garage, two light scenarios and a 150–250 m track sample. Integrate drivetrain-driven audio, lamps, near/far/cockpit/nose/look-back cameras and level-matched sound A/B tooling. Show the car in neutral daylight, not only flattering darkness.

Profile on identified hardware. Build simplified collisions and appropriate LOD. **Output:** actual in-engine turntable, cockpit and day/night sample clips with audio, material comparisons, source/export bundles and performance record. A Blender-only beauty render does not satisfy this packet.

## P04 — Garage → race → build → race (G4)

**Owner:** lead integrating driving, environment and gameplay/catalog work. Expand the accepted track kit into the 1.4 km Biscayne Harbor benchmark; one Slingshot plus three physically controlled rivals. Add a short story beat, two-lap race, valid checkpoints/results and once-only rewards. Model/install SM-133, SM-3223 and SM-7720 using real fitment and selected option records. Add shop-this-build links, new versioned save/load with storage-isolation tests, stock compare and immediate retry. Complete day and night runs with real runtime audio capture.

**Review:** appearance, frame times, handling, overtakes, input/camera stability, finish validity, reward integrity, fitment, stock restore, audible exhaust change and visible underglow. No numerical HP gain is required for an exhaust without supporting evidence. **Output:** a complete playable slice and evidence. No wider production until this passes.

## P05 — Three genuinely different choices (G5)

**Owner:** artist and driving specialist with separate ownership. Finish F3-T and Ryker Rally sequentially through recognition, material, rider, powertrain and driving gates. Validate six-speed SE6 versus CVT. Use the correct F3-T Thermal/Baja Ron and Rally-specific Elka parts from the seed, then add remaining verified lighting/performance/handling selections toward the 18-part release target. Resolve exact option configurations without inventing dropdown IDs. Verify class-specific races and clear mixed-event rules; no hidden equalization.

**Output:** all three selectable, editable, drivable and saved; no placeholder heroes. Each has its own references, part audits, lap captures and regression evidence.

## P06 — Destination-by-destination campaign (G6)

**Owner:** environment and gameplay/story workers. Author the new campaign from this kit's roles and chapter beats. There are no old scripts, track IDs, completed events, or earned rewards to import. Build one new destination sample, review, complete, test, then move on. Wire eight fresh chapters, roughly 24 varied events, fair upgrade economy, and clear class progression; Biscayne is part of the new story. Integrate time-trial ghosts, personal records, photo mode, and remaining cameras. Validate the full campaign on each starting platform without purchased products.

**Output:** one evidence bundle per destination and an end-to-end career check. Do not call five map names five finished environments.

## P07 — Release candidate, not unapproved release (G7)

**Owner:** review/integration. Run complete regression, physical target-device/controller tests when available, quality-tier/load-time profiling, readability/accessibility review, source/license/secret audit, new-game save/load and storage-isolation checks, and any later migrations between versions of this rebuild only. Confirm game hosting and storefront boundaries. Package a reproducible release candidate. A separate authorized preview is allowed only through confirmed account/project permissions; public/production promotion is not implied.

**Output:** evidence-backed release report, unresolved permissions/device blockers, rollback, and deployable build. Missing rights or a missing physical-device test remains visible, even if everything else is excellent.
