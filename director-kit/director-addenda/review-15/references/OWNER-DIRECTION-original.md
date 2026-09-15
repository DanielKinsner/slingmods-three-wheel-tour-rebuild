# SlingMods: Three-Wheel Tour — Owner Direction
## Recognizable vehicles. Desirable builds. A great drive.

**Owner clarification: 15 September 2026. Prepared from Dan's message and five supplied photographs.**

## Status and use

This is a priority/reference addendum, not a completed implementation or a replacement kickoff. P08A — Build Matters is currently running locally toward Astra-Review-15; its completion and unpublished changes have not been inspected here. Finish that authorized assignment without silently adding this entire brief to its scope. Preserve its work, evidence and portable Git handoff. Use this addendum at the Review15 planning decision to define the next substantial assignment.

Do not restart, migrate engines, revert the existing rebuild, or resume obsolete packets. Do not treat earlier vehicle/physics freezes as permanent creative requirements: a subsequent explicitly scoped assignment can authorize those changes. Until that assignment exists, preserve current runtime and work. No deployment, account changes, spending, or Git mutation is authorized by this reference packet alone.

## The actual customer experience

The product is a SlingMods vehicle-customization showroom with an exciting racing/test-drive experience. Customers should recognize their machine, enjoy inspecting it, discover compatible real accessories, preview combinations, then drive a machine that feels powerful and satisfying. Story chapters and rival systems support that experience; they are not the primary product.

Success is not the number of passed tests, objects placed, documents produced, or chapters added. Those checks support a customer-facing result: a desirable, recognizable vehicle and a drive worth repeating.

## 1. Vehicles must hold up under inspection

- Preserve each chosen vehicle's generation, proportions, silhouette, cockpit and mechanical identity. Do not combine reference generations or assume model years from these room photographs.
- Dan reports odd clipping, holes and disconnected-looking sections in the current Slingshot. Reproduce and locate these defects. Review all customer camera positions, installed accessories, full steering and relevant suspension movement. Do not conceal them with framing, darkness or global double-sided materials. Distinguish unintended gaps from genuine open-wheel/open-body construction.
- Correct topology, panel joins, material boundaries and mounting clearances where needed. Keep wheels and suspension visually connected. Reuse accepted source geometry where it works; do not rebuild the whole vehicle indiscriminately.
- Provide several coherent paint/livery choices through intentional body masks. Do not recolor tires, glass, upholstery or fittings with a global tint. Label invented color schemes as game finishes rather than claiming OEM options.
- One canonical vehicle/configuration should supply showroom and driving presentations; any display/racing detail differences must preserve visible identity and installed parts.

## 2. Showroom: the real YouTube set, art-directed for the game

The five supplied photos are primarily **room/showroom references**, not a command to replace the existing vehicle reference fleet. They are enough to establish the visual direction without asking Dan to produce another shoot.

Retain the identifying room composition visible across the photos:
- Dark cabinet towers and overhead cabinetry with long bright metal handles.
- Central light-colored logo wall, wood-toned worktop and lower drawers.
- SlingMods logo at the heart of the presentation.
- Wire-grid accessory displays on both sides, populated with recognizable products rather than anonymous clutter.
- Gray/charcoal checker floor with visible tile texture and a red perimeter/accent band.
- Left-side vehicle lift as a supporting architectural feature, not the primary hero.

Improve rather than copy the captured exposure. Plan broad neutral studio illumination that describes glossy panels, soft fill that reveals black components, controlled edge highlights, readable tire/underbody separation, and restrained architectural practicals. Keep SlingMods red deliberate; do not flood the whole room with red or use bloom as the finish.

Provide a flattering default three-quarter hero view, a useful orbit and zoom, and close views of the actual selected mounting region. A dimmable accessory-light preview should complement a neutral inspection mode. Keep the same parts identifiable in both. Do not assume a room reflection trick works until it has been evaluated in runtime.

References establish visible arrangement, not surveyed dimensions or unseen walls. Infer unshown areas conservatively and label those design decisions; no invented measurements presented as fact.

## 3. Handling: approachable, energetic racing

**Owner observations, not independently reproduced here:** reverse was unavailable/discoverability failed; turning did not feel sharp even with braking; acceleration rarely felt strong; observed maxima were roughly 70–80 on the current route. The owner explicitly noted that frequent corners may limit attainable speed. Do not describe 70–80 as a proven engine speed cap, or assume units without verifying the HUD.

A read of the last pushed source at `ed363b28ec6ba933dd82c576153bd73c80ea6619` found:
- `src/driving/input.ts`: X toggles requested direction; W/up remains throttle; S/down is braking. The input path supplies traction control as enabled.
- `src/simulation/drivetrain.ts`: reverse engagement is implemented with a near-stop condition; pending direction changes request braking and withhold throttle.
- `src/simulation/index.ts`: steering authority is explicitly limited as speed rises, followed by steering-rate limiting and combined longitudinal/lateral tire-force saturation.

These are source observations, not proof that the owner's current build or mode behaves correctly. Local P08A work may differ. Diagnose the exact served build and production input path before changing constants.

The next authorized driving pass should target:
- Obvious, reliable reverse and a visible direction indication. Design automatic brake-to-reverse behavior around a stopped vehicle and deliberate input so holding the brakes at a stop does not cause an unexpected launch backward. Preserve deliberate direction selection as appropriate.
- Strong, satisfying acceleration and braking, prompt low/medium-speed turn-in, usable corner exits and predictable high-speed control.
- A forgiving, deliberately game-tuned driving profile. Controlled oversteer may be evaluated; no mandatory drift mode, instant yaw teleport, or decorative speedometer inflation.
- Diagnose input limits, tire saturation under braking, traction control, gearing and route geometry separately. Simply multiplying grip, power and steering at once obscures the problem.
- Use a separate acceleration/braking/turning fixture to distinguish drivetrain limitations from the existing course. Measure before and after, then show normal human-style keyboard/gamepad-input driving rather than only a scripted optimal trajectory.
- Preserve prior stock tuning and evidence as a reference, but do not make exact reproduction of an unsatisfying baseline a permanent acceptance requirement for a newly authorized handling pass.

The next route expansion should supply room to accelerate and enjoy sustained speed: longer acceleration sections and flowing bends contrasted with purposeful tighter corners. Preserve the Harbor baseline until a new layout is separately authorized.

**Marketing separation:** entertaining game handling and balance are not real-world vehicle performance evidence. An upgrade must not be used to hide a deficient stock driving experience.

## 4. A showroom people can use to explore real products

Customers should be able to preview compatible products and combinations without grinding through a campaign or purchasing an actual accessory. Keep free showroom/test-drive previews separate from progression ownership and real-world shopping.

Plan a reusable product system covering visible customization and functional upgrades. Every supported item needs an exact product identity, verified fitment/options, correct mounting, a useful preview, and a deliberate link to the actual SlingMods product page. Installed geometry must agree with the selected item. Label approximations and unsupported configurations.

Curated build packages should be explicit lists of compatible items. When no corresponding retail package exists, call them game build presets rather than inventing an official SKU, price, discount or bundle. Exclusion/conflict rules must prevent incompatible combinations.

Simulated performance effects must be documented separately from catalog facts. Do not claim lighting adds power, a throttle controller increases engine power, or an exhaust produces an unsupported horsepower gain. Actual appearance, fitment and manufacturer claims require suitable references. Sound variants are not authentic exhaust recordings unless that provenance is established.

## Review15 decision and following work

Review15's suspension and progression work remains useful and should be retained if sound. Do not reflexively follow it with more story chapters or another broad scenery pass.

At Review15, inspect the actual returned changes against the priorities above and scope the next substantial customer-experience assignment. Immediate needs are driving feel/reverse, Slingshot surface integrity and paint variety, and the recognizable set-based showroom. Vehicle art/showroom and driving work can use separate ownership where safe; test their integration before delivery. Product breadth and a more flowing course are the expansion priorities after that foundation is present.

Return meaningful playable changes with internal critique/repair, not a sequence of tiny review-only deliveries. Keep automated regression, save integrity, performance sampling and model inspection inside the local run. Do not present automated evidence as human approval of driving fun.

The full source, editable assets and current dependencies must remain recoverable through the established Git handoff. Review uploads remain lean: target 60 MB, hard cap 100 MB, with source changes, exact commits, selected visuals, a gameplay clip and complete relevant measurement records. Do not repeatedly upload unchanged art or historical archives.

## Reference packet contents

`references/01` through `05` follow the owner's attachment order. They are reduced JPEG review copies of the supplied PNG photographs, preserving the whole frame. No compositional or lighting edits were made. The PNG originals are NOT included in this lean packet; they remain the source uploads, and their original filenames and hashes are recorded in `REFERENCE-MANIFEST.json`. Retain originals in the project reference store when supplied to the local agent; these photographs are guidance, not runtime textures or a substitute for editable 3D geometry.
