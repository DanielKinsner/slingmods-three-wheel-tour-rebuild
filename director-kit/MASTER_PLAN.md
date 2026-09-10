# SlingMods: Three-Wheel Tour

**REVISION 2 — FRESH START. This plan supersedes the earlier continuation handoff. New directory, new local repository, new application and assets. Yesterday's game remains untouched.**
## Creative direction and execution plan
**Prepared by Astra for Dan Kinsner · September 10, 2026**

**Built to Be Yours.**

A story-led racing game about taking a recognizable, believable three-wheeler, building it into your own machine with real SlingMods products, and putting that build to work on the next race.

This is the director's plan, not a claim of finished software. The companion kit contains detailed art/physics/site specifications, exact research sources, reference data, work packets, gate definitions and an evidence validator. No finished vehicle meshes or playable game are bundled.

## 1. The decisions are made

Keep the **Three-Wheel Tour** title, but start from scratch in a NEW directory and local Git repository. Build browser-first, with desktop/controller quality as the initial benchmark and a mobile profile afterward. Do not import yesterday's source, assets, physics, interface, layouts, scripts, save schema, or deployment configuration. The new design and reference research carry forward; the old implementation stays untouched. `FRESH_START_POLICY.md` is authoritative. This revision supersedes the earlier continuation handoff.

Use Blender for editable vehicle, accessory and environment sources. Export actual runtime geometry, PBR maps, rigs, collision shapes and LODs. Use TypeScript/Three.js for the game presentation and Rapier plus a dedicated three-contact dynamics layer for driving. Start with an established WebGL2 rendering path; evaluate more complex rendering only when a measured shortcoming warrants it. Start with a fresh TypeScript/Vite project and lightweight DOM/CSS interface; no inherited Vue requirement. Prove the export and simulation pipeline before broad scaffolding.

The intended first release contains three fully realized starting vehicles, five compact destination environments, eight story chapters, roughly 24 events, a persistent premium garage, local ghosts and photo mode, daytime/nighttime sessions, and an initial curated catalog of approximately 18 genuine compatible products. Those are staged scope targets—not a request to generate everything immediately.

## 2. The vehicles must be different machines

The exact reference fleet is a **2024 Slingshot R AutoDrive**, **2024 Spyder F3-T**, and **2024 Ryker Rally 900**. Exact references prevent bodywork, dimensions, dashboards and product fitment from drifting between generations.

The Slingshot is the low, wide, open two-seat hero with steering-wheel controls and five-speed AutoDrive behavior. The F3-T brings the muscular touring form, windshield/luggage and six-speed SE6. The Ryker Rally is compact, with its own suspension/rider posture and CVT delivery. Do not give a CVT fake gear shifts or dress the same chassis in three unrelated bodies. Manufacturer references and their limitations are in the source register.

Build all three scale blockouts early, but finish the Slingshot first. It establishes the body, material, rider, mounting and export pipeline. Then use that proven process on the Can-Ams. Physical masses, tire behavior, gearing and geometry remain distinct; default races use compatible classes. Mixed events use declared handicaps/class scoring rather than secretly equalizing every engine.

The referenced Ryker source contains an inconsistent overall-length conversion; the seed explicitly leaves that measurement unresolved. The local agent resolves it before final geometry approval rather than converting a probable typo into canonical physics. Other missing values, including full torque and damper curves, are explicitly estimates or unknowns—not invented manufacturer data.

## 3. The campaign is about becoming a builder-racer

You join a traveling three-wheel invitational crew with a stock vehicle. Early events establish your driving; later events make your setup choices and growing relationship with the crew matter. Write new Rae/Maya/Jett characters and dialogue from the roles in this design; old scripts impose no constraints. Keep dialogue short, distinct, skippable, and occasionally sharp. No endless tutorial radio or mandatory account before driving.

The destination identities are forested Smokies elevation, flowing Ozark roads, exposed Black Hills speed, coastal Atlantic night racing, and a Biscayne waterfront invitational. Author all courses, story beats, event IDs, and progression afresh. Biscayne belongs to this new campaign from its design stage; it is not a retrofit of old content.

The player loop is race, earn, understand the machine, fit a part, compare, and race again. Circuit races, sprints, duels, sectors and exhibitions supply variety without a huge empty open world. A quick loss does not trap the player in grinding. Parts bought with game credits remain owned when uninstalled. Every starting platform can complete the campaign without buying a real product.

## 4. Make the garage worth returning to

A premium functioning workshop, not a spinning model behind shopping cards: charcoal architecture, restrained SlingMods red, brushed metal, organized tools, convincing concrete, a central presentation bay and supporting fleet bays. Use real approved branding. Let materials remain visible under neutral light instead of soaking everything in red.

Orbit the vehicle, select the correct mounting area, preview a compatible part, install it and immediately drive a short test loop. Show stock-versus-modified builds. Show suspension hardware and installed exhausts in useful close-ups. Keep riders/drivers, hands, feet and controls physically connected rather than treating the vehicle as self-driving.

A lighting-preview mode dims the garage and shows real fixtures and their illumination on nearby surfaces. It does not merely turn up bloom. The same car has to look right in daylight. Showroom cameras, close/far chase, cockpit/rider, nose, look-back and replay/photo cameras each have a clear purpose and predictable controls.

## 5. Real product catalog, honest simulated effects

The seed contains seven researched products; the first complete slice uses these three:

| Part | Retailer part number | What the first implementation must demonstrate |
| --- | --- | --- |
| TricLED base RGB underglow kit | SM-133 | Installed light layout, controllable color and convincing nearby spill |
| DDMWorks adjustable sport shocks | SM-3223 | Actual replaced hardware and meaningful, transparently modeled suspension adjustments |
| Thermal dual rear-exit Sport exhaust, 2020–2024 | SM-7720 | Correct installed appearance and distinct drivetrain-driven sound |

Other seeds cover the F3-T Thermal exhaust, Baja Ron F3 sway bar, Rally-specific Elka front shocks, and Slingshot Stealth Bags. The Thermal F3 product explicitly excludes F3 base/F3-S; the Elka Rally product differs from earlier/base configurations; the underglow kit's optional 2015–2019 halo add-on must not appear on a 2024 Slingshot. Exact options remain the local catalog agent's job to resolve.

Lighting does not add horsepower. A throttle controller does not create engine power. Suspension changes are not universal “+20 handling” bonuses. Exhaust appearance and sound can be meaningful without an invented dyno number. Any estimated/fictional performance balancing is marked as game modeling and separated from real product claims.

The website connection begins with a fitment-aware **Shop this build** parts list and exact product links. Game credits and real money are different. Prices are initially omitted in favor of checking the current listing. Races work with a cached catalog and do not depend on the store being available. A future authorized first-party feed can supply richer integration; do not invent an API or an unsupported multi-item cart.

## 6. The physics have to earn the presentation

The machine has a rigid chassis, two steering front contacts and one driven rear contact. Suspension loads, tire slip, combined braking/cornering limits, engine torque, ratios and shift/CVT response determine motion. Physical units and fixed-step timing are explicit. Splines guide AI and course information; they never pin the player's position to the road.

The same telemetry drives wheel rotation, steering, suspension, dashboard and sound. AI has to brake and obey traction limits too. Valid ordered checkpoints and one-time result commits prevent shortcut laps and duplicate rewards. New saves use an isolated versioned namespace. Do not read, migrate, overwrite, or delete saves from the old game; future migrations apply only to versions of this rebuild.

Controls favor analog triggers, readable progressive steering and optional assists, with remapping and keyboard support. The default is approachable physical racing, not a punishing engineering simulator. Camera shake, FOV and effects support speed perception without concealing unreadable handling. Physical gamepad/phone testing is reported separately from scripted or emulated tests.

## 7. The first complete slice is deliberately small

**Biscayne Harbor:** an approximately 1.4 km closed-circuit benchmark with around eight useful corners, a straight, a hairpin, a rougher section, an overpass shadow and a waterfront return. One Slingshot, three rivals, one garage, one story beat, the three parts above, and both day/night sessions.

It must support the entire loop: leave the garage, race, finish validly, earn the correct reward once, fit a part, inspect its effect, save/reload, race again. This tests the whole product without five unfinished locations distracting from its weaknesses.

The first visible work happens even earlier: a reference-matched clay hero and a real driving pad, followed by the finished material/rider/audio/garage pass. Diagnostic blockouts are labeled as such; they are not presented as finished high-end graphics.

## 8. Orchestration: no more expanding a bad foundation

A local Codex lead executes Astra's direction with at most three independent workers. Vehicle art, dynamics, environments and gameplay/catalog work have separate ownership. A separate reviewer examines the actual artifacts before the lead advances. Where separate subagents are unavailable, a distinct review pass is allowed with that limitation disclosed.

| Gate | Required proof |
| --- | --- |
| G0 | Fresh standalone workspace/repository, working toolchain/export/capture, isolated saves, old project untouched |
| G1 | Recognizable reference-matched Slingshot and three-vehicle scale checks |
| G2 | Actual three-contact test-pad driving and coherent telemetry |
| G3 | Finished hero/rider/garage, day/night track sample, sound and measured runtime presentation |
| G4 | Complete garage-to-race-to-upgrade slice, including real fitment and save/reward integrity |
| G5 | All three finished vehicles, distinct powertrains and compatible catalog |
| G6 | Individually accepted destinations and a complete tested campaign |
| G7 | Evidence-backed release candidate, target-device/rights/security review and safe deployment route |

G1 and G2 may proceed in parallel after G0; both precede G3. A failed gate blocks expansion. After two revisions fail for the same reason, the director changes that specific approach—body construction, contact model, material export, lighting—not the promise. Preserve the best build and stop churning after bounded unsuccessful approach changes. Never lower the bar silently or pretend an unavailable capability was tested.

The included Python tool verifies that review declarations, required criteria, dependencies and nonempty hashed evidence files exist. Its 16 synthetic unit tests pass. **It does not evaluate visual quality or prove that the footage is truthful or the game is fun.** Review must actually inspect the source, captures and behavior; the project's integration workflow must honor the gate. All actual game gates remain pending in this kit.

Dan sees short milestone demonstrations and useful progress, not a queue of technical decisions or a request to perform QA. Use background Blender and isolated browser automation, not his active desktop. Routine design calls belong to the local director; new spending, public rights, storefront mutation and production publication do not become authorized just because taste decisions are delegated.

## 9. Begin in Codex

Place the complete kit in a NEW empty `slingmods-three-wheel-tour-rebuild` folder outside the old game's Git root and give Codex `CODEX_KICKOFF.md`. The lead initializes a new local repository, executes P00, and records actual evidence. If started inside the old project, it must establish a separate workspace first; no old-project edits, old-save migration, or production changes are authorized.

Astra's plan provides the creative authority and standards. Codex performs the local tool work. This chat does not automatically operate a separate session in the background.

The first success is not a giant map. It is a vehicle an owner recognizes, a corner worth learning, and a garage that makes the next race feel personal.

## Research references

The technical brief and seed data distinguish published specifications, retailer fitment, unresolved measurements, and game-design estimates. These selected primary references support the vehicle and product details above; the full register and limitations are in the kit.

- **V1 — Polaris — 2024 Slingshot R AutoDrive, Radar Blue Fade, specifications**: https://slingshot.polaris.com/en-ca/2024/slingshot-r/slingshot-r/auto-slingshot-r-radar-blue-fade-2024-slg/
- **V2 — Can-Am — 2024 Spyder F3 family, F3-T section**: https://can-am.brp.com/on-road/us/en/models/previous-models/2024/spyder-f3.html
- **V3 — Can-Am — 2024 Ryker, Rally section**: https://can-am.brp.com/on-road/us/en/models/previous-models/2024/ryker.html
- **P1 — TricLED Kit #1 Standard RGB UnderGlow, SM-133**: https://www.slingmods.com/polaris-slingshot-underglow-kit?vehicle=3
- **P2 — DDMWorks 3-Way Adjustable Sport Shocks, SM-3223**: https://www.slingmods.com/polaris-slingshot-3-way-adjustable-sport-shocks-coilovers-ddmworks?vehicle=3
- **P3 — Thermal R&D dual rear-exit Sport exhaust 2020–2024, SM-7720**: https://www.slingmods.com/polaris-slingshot-ceramic-coated-dual-rear-exit-sport-exhaust-system-2020-up?vehicle=3
- **P4 — Thermal R&D Spyder F3-T/F3 Limited cat-back, SM-29043**: https://www.slingmods.com/canam-spyder-f3t-f3l-cat-back-exhaust-thermal?vehicle=1
- **P5 — Baja Ron Ultra F3/ST/RS sway bar kit, SM-18320**: https://www.slingmods.com/canam-spyder-f3-st-rs-ultra-performance-sway-bar-kit-baja-ron?vehicle=1
- **P6 — Elka front shocks for Ryker Rally 2022+, SM-25561**: https://www.slingmods.com/elka-front-suspension-canam-ryker-rally?vehicle=4
- **P7 — EvolutionR rear storage Stealth Bags, SM-28919**: https://www.slingmods.com/polaris-slingshot-rear-storage-compartment-stealth-bags-evolutionr
- **T2 — Three.js GLTFLoader documentation**: https://threejs.org/docs/pages/GLTFLoader.html
- **T3 — Rapier DynamicRayCastVehicleController API**: https://rapier.rs/javascript3d/classes/DynamicRayCastVehicleController.html

V1 was available in manufacturer-indexed specification text; subsequent direct requests returned 403. V3 contains the explicitly flagged length discrepancy. No source supplies blanket game-redistribution permission.
