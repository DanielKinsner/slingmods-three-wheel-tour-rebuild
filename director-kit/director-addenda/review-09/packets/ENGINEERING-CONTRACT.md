# Engineering contract — change the architecture narrowly, not the driving model

## A. One physical world, four actual vehicles

The submitted `src/simulation/index.ts` creates a private Rapier World, creates one body, applies all tire forces and calls `world.step()` inside `Simulation.step()`. Four separate instances are four disconnected collision worlds. Do not use that shortcut for the race.

Extract a minimal `RaceWorld`/vehicle-body layer (names may differ) with one environment, a stable ordered participant registry, independent vehicle state and one authoritative fixed-step coordinator. Per tick: capture participant state, obtain player/rival controls, apply every vehicle's existing forces, call **one** world step, then publish all telemetry and race events. No car gets advanced four times because four render presenters update. Renderer interpolation, audio, driver arms and rear articulation each read the matching vehicle ID, not a shared 'current car' singleton.

Preserve a single-vehicle facade compatible with existing tests, pad, solo Harbor and tools. Share the actual tire/drivetrain implementation; do not maintain two copied equations that will drift. World ownership/disposal must not let despawning one rival free the player's world or shared render assets. Add/remove is a race/menu operation, not uncontrolled mid-race allocation.

Keep 1/60 fixed stepping, contact layout, stock mass/inertia, force law, steering envelope, gearing, RPM handling and surface coefficients unchanged unless a concrete reproducible regression demands a bounded, separately documented correction. Do not tune grip to rescue a bad AI. Take baseline telemetry BEFORE the refactor. Use the same input fixture and installed engine build afterward. Require exact one-vehicle parity where feasible; any unavoidable change must get a quantified explanation and physics-specific tests, not broader tolerances to silence failures. Preserve reverse, braking, curb/seam behavior and front/rear sign conventions.

In a multi-car world, tire-support queries must not treat other cars or race checkpoint sensors as the roadway. Use explicit filter groups/predicates for drivable static surfaces, while maintaining body/body collision response for all participants. Do not turn off vehicle collisions to make the ray tests pass. Keep equal collision dominance and the existing reasonable CCD policy. Real contacts, not kinematic cars pushing an infinitely light player.

## B. Production controllers, not captured trajectories

A controller outputs `VehicleControl` only. Ordinary AI never sets body poses, angular velocity or speed to a route sample. The spline describes target paths and progress, not authoritative motion. Cache route geometry and consider bounded local projection lookups when necessary; a naive full-route scan multiplied by four cars, every tire and all lookahead samples deserves profiling before importing a new spatial library.

Implement lookahead pursuit, curvature/braking-distance speed planning, signed lateral tracking, time/distance headway and a small state machine: follow, prepare pass, pass, settle, recover. Target paths stay inside a corridor that accounts for full vehicle width. Commit to a pass briefly to avoid left-right oscillation. Return toward a stable line when clear. Nearby-car bounding envelopes must consider relative motion, not only center distance. Lift/brake when no clean space exists; leave room beside the player. No invisible grip/torque advantages or gap-driven rubber-band.

Use deterministic seeds for reaction/line margins so test failures reproduce. The three characters may have different conservative choices, not different physics. Low-level controls can run each tick; expensive strategic planning can run at a documented lower cadence with smooth held targets. No unbounded per-frame allocations or browser automation in production code.

If a rival is stuck, try bounded physical recovery/reverse while yielding to traffic. If genuinely stranded, label it retired/DNF; never silently teleport it into a valid finish. A clean standard race should not require any retirement. A player restart restarts the whole crew event with a fresh attempt; the existing solo reset semantics remain intact. A separate mid-race rescue is not required.

## C. Race timing, ranking and fairness

Build a separate crew-event state manager using the existing crossing math where appropriate. Do not bend `standing-lap-v1` results into a two-lap traffic event. One synchronized three-second countdown, two laps, validated ordered gates and a common time origin. All four start behind the initial line with nonoverlapping footprints.

Each participant has its own current lap, next expected gate, launch state, valid/invalid status and result. Position comes from validated lap/sector progress plus bounded projection within the accepted sector; it never comes from distance to the start line alone. Show intermediate order changes when they actually happen. A skipped checkpoint, backward crossing, major track cut or relocation must not earn valid progress, rewards or a better placement. Define/communicate invalid and DNF outcomes for all participants consistently.

Collect finish candidates across **all** cars for a simulation tick, calculate crossing fractions, and sort by the common tick time plus fraction. Loop order must not decide a close finish. Use a deterministic tie policy only for truly indistinguishable times, disclosed in tests. Lapped cars cannot become leaders when they cross the same line. Repeated terminal updates and retried result writes cannot create new winners or credits.

On the player's finish, show their final time/place and live status for rivals still running. Allow a bounded 30-second postfinish window before unresolved rivals become DNF; returning earlier may terminate remaining simulation with explicit unfinished status, not invented times. Award the player's established result once. A bounded overall AI recovery/retirement policy must not leave the player stranded in a result screen.

## D. Persistence and existing work

Keep the same persistent stores and legitimate progress. This is migration within the new rebuild, NOT migration from the old abandoned game. Follow the separate progression spec for exact payouts. All changes are atomic, idempotent and event-specific. Race-result IDs must bind one actual attempt and one result; do not permit menu replay to generate new result IDs. Closing/reloading the result view cannot repeat a first-clear bonus.

Test v1 fresh, earned-but-unpurchased, purchased/equipped, unequipped and storage-unavailable states. Preserve credits, old receipt IDs/timestamps, ownership, appearance, chapter flags, solo PBs and settings. Use a validated, repeatable v1→next-version migration if needed. Unknown/corrupt schemas produce a useful error/export/recovery option; never silently wipe the user's progress. If older live tabs can overwrite the new record format, close/refresh their writer path safely (IndexedDB version change or explicit version guard). Maintain the disclosed session-only fallback.

Allow the user to retry a failed reward transaction; disable destructive scene transitions only while a transaction is actually pending. Permission/storage failure must not trap them forever or falsely state that progress was saved. Browser QA uses isolated profiles and copied synthetic/earned fixtures, never Dan's real profile.

## E. Rendering, audio and performance

Clone the **renderable vehicle and driver**, not an entire player session containing light pools, listeners, UI or physics. Share immutable textures/geometries, clone mutable materials/rig state. Preserve player cockpit head visibility and independent per-rival steering/rear motion. Any derived rival LOD must be authored/exported with Blender from the accepted source, stored separately, and justified by measured cost; do not replace hero geometry or remove mechanical landmarks just to hit a triangle number.

Default light budget remains the current one shadow map, six spot slots and two player-kit area slots. Opponent lens emission is sufficient for this first chapter. All allocated light configurations/material variants are present during preparation; inactive contribution uses zero intensity. Do not reintroduce the light-count program churn fixed in Review09. First grid, first rival appearance, first cockpit/near/far transition, retry and bay return must be exercised.

Reuse decoded engine buffers, one audio context/listener and shared lifecycle settings. Cap audible rivals to two nearest. Gain/pan or spatial attenuation responds to actual relative pose; player sound remains intelligible. Crossfade selection to prevent pops, and release unused nodes. No extra voice synthesis, commercial music or new spending.

Profile clean native-RAF **four-car** runs at actual 1080p and 720p on the available hardware, with stock/equipped player; repeat the heaviest 1080p case with first race + retry. No recording or full scene inspection in the scored loop. Keep all loading and racing outliers. Count world steps/participant count, programs, draw calls, triangles, textures/geometries and collector costs; separately record physics/control costs. Do not describe CPU submission time as GPU time or resource counts as GPU memory bytes.

Planning target on the known RTX 4080 host: p95 racing intervals ≤20 ms, p99 ≤33.4 ms, no recurring >100 ms first-use stalls; investigate every >100 ms interval rather than deleting it. This is a target for the new grid, not an already achieved claim. Preserve simulation consistency, course clarity and player quality before reducing presentation cost. If a target is missed, diagnose the bottleneck and repair locally; no arbitrary resolution decrease mislabeled as full-resolution performance. Hardware/physical-controller gaps stay explicit.
