# SlingMods: Three-Wheel Tour — UX, career and showroom audit

**Reviewed:** September 22, 2026  
**Repository:** DanielKinsner/slingmods-three-wheel-tour-rebuild  
**Pinned source:** `5803a6bb366b5c51ff940435233e486cbccc3c80`  
**Commit title:** Align benchmark rendering and record sustained performance hold

## Scope and evidence limits

This is a **source-code audit**, not a reproduced visual/browser audit. Repository access succeeded and the findings below are based on the pinned current source, not the older review packets. The interactive game was not available in the audit environment. No game browser session, GLB geometry inspection, complete build, repository test suite, controller session, or deployed-commit verification was completed. No repository files, deployments or saved games were changed.

The listed reproduction steps are **tests for the implementer to execute**, not a record of actions performed in the live game. Arithmetic was executed for the storage-preset distance and the missing vertical-camera-bound counterexample; its output is included in `source-math-evidence.json`. That arithmetic does not substitute for rendering the room.

This report identifies source-confirmed implementation defects and source-backed UX inconsistencies. It does not assert that every bug in the project has been found. Priority P1 means protect progress or repair a central experience; P2 means repair navigation/control consistency; P3 means lower-impact metadata cleanup.

## Overall diagnosis

The project has one newer free-configurator presentation and a separate legacy career bay/workshop, plus a separate later-chapter hub. The two showroom paths share the base room GLB, but not the full scene composition, camera controller or user interface. These parallel implementations explain the room drift and several contradictory controls.

Career is **not** accessible only from the opening screen: Destinations also contains Continue Career. The real navigation gap is the absence of Career in the persistent header and on Build/Shop, plus the missing return context after a career-originated preview.

Ordinary free test drives through the signature scene deliberately use a preview recipe and do not enter the career adapter. Do not “fix” that isolation by making every test drive mutate career progress. The legacy shop night-drive path is a distinct mismatch described below.

## Findings overview

| ID | Priority | Finding |
|---|---|---|
| UX-01 | P1 | Temporary career progress is not carried through the free showroom |
| UX-02 | P1 | The career bay and the newer showroom have diverged |
| UX-03 | P1 | The legacy bay camera protects only one wall |
| UX-04 | P1 | The newer showroom still permits an above-room camera position |
| UX-05 | P1 | Chapter 01 Continue does not advance to Chapter 02 |
| UX-06 | P1 | Drive at night silently discards the temporary part preview |
| UX-07 | P2 | Career access disappears from Build and Shop navigation |
| UX-08 | P2 | Closing the career workshop overwrites the restored camera |
| UX-09 | P2 | Two Inspect mount behaviors do not match their controls |
| UX-10 | P2 | Build-level Test This Build is hardwired to Express |
| UX-11 | P2 | The control labelled Home is actually a Back/Build toggle |
| UX-12 | P2 | Screen state and URL/history disagree |
| UX-13 | P2 | Career-owned badges can never appear in the free showroom |
| UX-14 | P2 | The selected camera button can disagree with the actual camera |
| UX-15 | P3 | Legacy vehicle labels do not follow the selected visual model |

## UX-01 · P1 · Temporary career progress is not carried through the free showroom

**Evidence classification:** Source-confirmed state-transfer defect; applies to temporary/in-memory careers, not normal durable saves.

**Pinned source:** [`src/career/client.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career/client.ts); [`src/career-experience/hub.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career-experience/hub.ts); [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts).

**What the source does:** careerClient.handoff() carries nondurable career state through an explicit scene allowlist. The allowlist includes bay, pad, vehicle, harbor, crew, career, express and ridge, but excludes signature. Career hub links nevertheless navigate into signature. The signature scene does not open a career client to preserve or relay the in-memory state.

**Player impact:** A player using temporary career storage can earn progress, visit the free showroom, and return to a fresh in-memory career. This is not a claim that persistent IndexedDB careers are erased.

**Reproduction to perform:** In a fresh isolated browser context where career storage is unavailable, earn a valid reward, record the balance and chapter flags, enter Free showroom, then use Continue Career. Compare the returned state with the earlier state. Repeat via Inspect this build.

**Smallest coherent repair:** Provide one explicit temporary-career transport across every same-tab internal route, including signature. Keep the real career and demo namespaces separate. Merely adding signature to the allowlist is insufficient if the signature scene never consumes and relays the envelope.

**Acceptance condition:** Credits, purchases, chapter flags, pending race identity and ownership survive career → free showroom → career in temporary mode. Ordinary durable saves and demo isolation remain unchanged.

## UX-02 · P1 · The career bay and the newer showroom have diverged

**Evidence classification:** Source-confirmed integration and feature-parity inconsistency.

**Pinned source:** [`src/workbench.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/workbench.ts); [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts); [`src/presentation/signature-art.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/presentation/signature-art.ts); [`src/career/build-ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career/build-ui.ts).

**What the source does:** Both normal showroom paths load the same signature-showroom-refined.glb base. The signature scene additionally loads Tour Wall, the custom studio reflection environment and studio contact occlusion, and owns the newer view controls. The workbench bay uses its own inspection environment, lights, camera and legacy BuildUI. That old panel exposes lighting and suspension; the other career products are managed through the separate career hub.

**Player impact:** Moving into Chapter 01 or its workshop changes the room presentation and removes controls/content available in the free configurator. The missing Tour Wall is a scene-composition omission, not evidence that the room GLB failed to download. The bay does have a PoweredDisplay, mirrors and accessory presenters; do not remove or rebuild them under the assumption that they are absent.

**Reproduction to perform:** Compare signature Build with career → Build Matters → Build. Compare Tour Wall, lighting, reflection environment, contact presentation, available product controls and camera rail. Capture both at matching quality, dimensions, visual vehicle and a comparable build.

**Smallest coherent repair:** Extract and reuse the current signature showroom presentation, not a third showroom implementation. Keep preview editing and earned-career transactions as separate mode adapters sharing the same room, vehicle presentation and camera controller.

**Acceptance condition:** Equivalent builds share the same showroom assets and presentation across career and preview. A mode change changes permissions, labels and transaction behavior, not the room or camera system.

## UX-03 · P1 · The legacy bay camera protects only one wall

**Evidence classification:** Source-confirmed missing camera bounds; visual escape paths still require browser capture.

**Pinned source:** [`src/workbench.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/workbench.ts).

**What the source does:** The bay render guard only corrects camera.position.z when it exceeds 6.45. Its OrbitControls setup does not set bay-specific distance or polar-angle limits. There is no corresponding x boundary, negative-z boundary, floor boundary or ceiling boundary.

**Player impact:** Normal orbit/zoom paths can leave the room in directions the rear-wall guard never evaluates. The correction is not a room-containment system.

**Reproduction to perform:** In the Chapter 01 bay, orbit through all sides and above/below the vehicle, then zoom outward and inward. Repeat after each inspection preset and after opening/closing the workshop.

**Smallest coherent repair:** Use one shared camera-containment system derived from actual showroom geometry or an explicit measured safe volume. Apply it to orbit, zoom, presets, interpolation and resize, with near-plane clearance.

**Acceptance condition:** The camera and its near plane remain in the permitted interior during mouse, wheel, touch and supported controller camera interactions; no wall, floor or roof escape occurs.

## UX-04 · P1 · The newer showroom still permits an above-room camera position

**Evidence classification:** Source-confirmed missing vertical bound with an arithmetic counterexample; actual roof geometry was not loaded.

**Pinned source:** [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts); [`src/presentation/signature-art.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/presentation/signature-art.ts).

**What the source does:** constrainCamera() constrains x and z only. Orbit controls allow radius 10 and a minimum polar angle of 0.35 radians. Using the explicit storage-inspection target (-0.22, 0.43, 1), a permitted orbit position is approximately (-0.22, 9.824, -2.429). It is inside both configured horizontal bounds. The room loader documents a nominal inferred height of 4.2 metres.

**Player impact:** Horizontal clamping cannot prevent ceiling escape. The existing radius/polar combination admits a camera far above the nominal room height.

**Reproduction to perform:** Select storage inspection, orbit upward to the permitted limit and zoom out. Repeat from other targets. Capture the camera position and actual room ceiling to validate the geometric boundary.

**Smallest coherent repair:** Add measured vertical containment to the shared controller, and reconcile target-specific orbit limits with the room volume. Do not address this solely by arbitrarily reducing every preset distance.

**Acceptance condition:** No permitted target/radius/polar combination exits the safe room volume. Automated sweeps cover x, y and z, including transitions and different viewports.

## UX-05 · P1 · Chapter 01 Continue does not advance to Chapter 02

**Evidence classification:** Source-confirmed progression/navigation inconsistency, not an inaccessible Chapter 02.

**Pinned source:** [`src/career/chapter-ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career/chapter-ui.ts); [`src/career-experience/model.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career-experience/model.ts).

**What the source does:** ChapterUI.continue() chooses shakedown, Maya duel, the suspension shop, or a crew invitation. It never branches to Chapter 02 after the crew event is completed. A separate Harbor Express / Chapter 02 link exists, so later chapters are accessible through that link.

**Player impact:** The primary Continue action can keep returning a finished player to old activities or the shop, while progression requires discovering a secondary link. Stock builds are welcome, but the primary path can repeatedly recommend a purchase when the player has sufficient credits.

**Reproduction to perform:** Complete the crew event so chapterAvailable() is true. Test the primary Continue action with and without owned suspension, and compare it with the separate Chapter 02 link.

**Smallest coherent repair:** Compute the primary career action from a shared progression resolver. Once Chapter 02 is available, Continue should lead to the next unfinished career objective; rematches and optional purchases should remain explicitly separate actions.

**Acceptance condition:** Fresh and resumed careers get the correct next objective. A completed Chapter 01 advances without requiring an optional product purchase or replaying the crew race.

## UX-06 · P1 · Drive at night silently discards the temporary part preview

**Evidence classification:** Source-confirmed preview-to-career mode mismatch.

**Pinned source:** [`src/career/build-ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career/build-ui.ts); [`src/career-experience/chapter-one-race.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career-experience/chapter-one-race.ts).

**What the source does:** The legacy shop can preview an unowned underglow kit. Its Drive at night link calls close(), clearing preview state, and navigates to scene=harbor with preset=night. chapterOneRace() then builds the vehicle from careerRecipe(client.state) and launches a scored career shakedown, not a free test of the displayed preview.

**Player impact:** A player can preview a kit, choose a night drive expecting to inspect that kit, and arrive without it. The destination also changes the meaning of the action from a product preview to a reward-bearing career activity.

**Reproduction to perform:** With the lighting kit unowned, select Preview kit, choose a visible color, then Drive at night. Compare the displayed showroom build with the driven build and inspect whether the session is a career shakedown.

**Smallest coherent repair:** Split the actions: Test this preview at night must capture the displayed preview recipe and be unscored; a career shakedown must explicitly use the earned build and be labelled accordingly. Never implicitly purchase previewed parts.

**Acceptance condition:** The build driven matches the action label. Preview tests preserve the visible kit without spending or awarding career credits; career races use only the captured earned build.

## UX-07 · P2 · Career access disappears from Build and Shop navigation

**Evidence classification:** Source-confirmed navigation gap.

**Pinned source:** [`src/signature/ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/ui.ts); [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts); [`src/career-experience/hub.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career-experience/hub.ts).

**What the source does:** The persistent signature header contains Build, Destinations and Shop This Build, but no Career action. Continue Career exists on the opening screen AND on Destinations. Build and Shop do not offer it directly. Career preview links enter signature without a career breadcrumb or explicit return context.

**Player impact:** Career feels like an alternate entry experience rather than a persistent game mode. Inspecting an earned build in the showroom strands the player in the free-configurator navigation until they find another career entry.

**Reproduction to perform:** Open career, choose Inspect this build, and look for a direct Return to Career action. Also navigate opening → Build → Shop and try to return to career without detouring through entry or Destinations.

**Smallest coherent repair:** Add a persistent Career destination and a context-aware Return to Career action on career-originated previews. Continue should resolve the appropriate chapter/objective rather than always present the later-chapter overview.

**Acceptance condition:** Career is reachable in one deliberate action from Build and Shop. The UI clearly identifies whether the displayed build is a free preview or an earned build.

## UX-08 · P2 · Closing the career workshop overwrites the restored camera

**Evidence classification:** Source-confirmed contradictory camera restoration.

**Pinned source:** [`src/workbench.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/workbench.ts); [`src/career/build-ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/career/build-ui.ts).

**What the source does:** The workbench BuildUI open(false) hook restores normalCamera position, target and FOV, then immediately calls fitBuild(). fitBuild() assigns its own target, position-fitting and view offset. BuildUI.close() also resets hardware inspection before executing this hook.

**Player impact:** The saved camera state is not the final state after Done. Users can experience an unexpected snap/reframe rather than returning to the view they had before opening the shop.

**Reproduction to perform:** Orbit to a distinctive view in the Chapter 01 bay, open Build, optionally inspect hardware, and press Done. Compare before/after camera position, target, FOV and view offset.

**Smallest coherent repair:** Separate restoring camera state from fitting the workshop layout. Restore the saved state once after the correct UI layout is established, unless that state violates current room bounds.

**Acceptance condition:** Open → Done returns to the original valid view, including FOV and layout offset. A reset action alone intentionally returns to the default camera.

## UX-09 · P2 · Two Inspect mount behaviors do not match their controls

**Evidence classification:** Source-confirmed missing preset plus a numerically conflicting preset.

**Pinned source:** [`src/signature/ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/ui.ts); [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts).

**What the source does:** Every product renders an Inspect mount action. view() has special branches for SM-28919, SM-3223, SM-7720 and SM-26801, but none for underglow SM-133, so it falls back to a full-vehicle camera. The storage preset is 2.2565 metres from its target, but minDistance remains 3 metres before controls.update(). The close-up is pushed roughly 33% farther away by that minimum.

**Player impact:** Underglow inspection does not inspect the mount, and storage inspection cannot retain its authored framing. These are distinct from room-wall collision defects.

**Reproduction to perform:** Compare Full vehicle with underglow Inspect mount. Then inspect storage and record the camera immediately before and after OrbitControls.update().

**Smallest coherent repair:** Define and validate a preset for every visible inspection action. Make per-preset distance limits compatible with the authored camera, actual mounted part, and room safety constraints.

**Acceptance condition:** Each Inspect mount action targets its real product location. Storage framing is not changed unexpectedly by control limits, and all close-ups stay safely in the room.

## UX-10 · P2 · Build-level Test This Build is hardwired to Express

**Evidence classification:** Source-confirmed destination-context inconsistency.

**Pinned source:** [`src/signature/ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/ui.ts); [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts).

**What the source does:** The Build footer creates Test This Build with action test-drive and value express. Destination selection is separate UI state. The event screen sends the selected route correctly, but the Build footer ignores it and the remembered route.

**Player impact:** A player can select or return from Smoky Ridge or Original Harbor, adjust the build, then be sent to Express by the apparently generic test action.

**Reproduction to perform:** Select Smoky Ridge and Blue hour, return to Build, and choose Test This Build. Repeat after returning from a Harbor test.

**Smallest coherent repair:** Either preserve the selected destination and lighting for the Build action, open destination selection, or explicitly name the fixed route in the button. Do not silently imply a generic continuation while selecting another route.

**Acceptance condition:** The route and lighting launched by the Build CTA are predictable and match its visible label and selected context.

## UX-11 · P2 · The control labelled Home is actually a Back/Build toggle

**Evidence classification:** Source-confirmed control-label mismatch.

**Pinned source:** [`src/signature/ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/ui.ts); [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts).

**What the source does:** The brand button is labelled SlingMods home but dispatches back. The scene back handler goes from Build to entry, and from every other screen to Build. Clicking it on the entry screen therefore opens Build; clicking it on Destinations or Shop also opens Build rather than home.

**Player impact:** The same apparent Home control performs different actions depending on the screen, making navigation harder to learn and obscuring the route back to the opening experience.

**Reproduction to perform:** Activate the brand button independently from entry, Build, Destinations and Shop; record the resulting screen.

**Smallest coherent repair:** Implement a distinct Home action with an explicit destination. Keep Back/Escape behavior separate and context-aware.

**Acceptance condition:** Home always reaches entry/home. Back returns one meaningful navigation step or closes the active modal, without toggling unexpectedly.

## UX-12 · P2 · Screen state and URL/history disagree

**Evidence classification:** Source-confirmed routing/deep-link inconsistency.

**Pinned source:** [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts); [`src/demo/profile.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/demo/profile.ts).

**What the source does:** Signature initialization recognizes screen=build and screen=events, but falls back to entry for screen=shop, even though shop is an allowed screen value. In-app build/events/shop/back actions change the screen variable without updating the screen query or pushing navigation history. Recipe edits only replace the existing URL hash/search context.

**Player impact:** Reload can return to the original screen rather than the current one, direct Shop URLs do not open Shop, and browser Back does not traverse the internal screens like the visible navigation suggests.

**Reproduction to perform:** Open screen=shop directly. Separately enter from screen=build, navigate to Destinations and Shop, then reload or press browser Back. Compare the displayed screen with the URL.

**Smallest coherent repair:** Use a small explicit screen router covering entry, build, events and shop, with a declared history policy. Keep recipe hashes intact and avoid treating every recipe adjustment as a new navigation entry.

**Acceptance condition:** Each supported screen deep link opens correctly, reload retains the intended screen, and browser Back/Forward obey a tested navigation policy.

## UX-13 · P2 · Career-owned badges can never appear in the free showroom

**Evidence classification:** Source-confirmed disconnected state plumbing.

**Pinned source:** [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts); [`src/signature/ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/ui.ts).

**What the source does:** The UI contains a Career owned indicator based on ownedProductIds, but SignatureScene.state() always supplies ownedProductIds: []. The scene never supplies the player’s actual ownership list.

**Player impact:** Even an explicitly previewed earned build cannot show the ownership information the interface was written to support, reinforcing the impression that career and the showroom are unrelated.

**Reproduction to perform:** Own a product in career, choose Inspect this build or Preview in showroom, and inspect the product ownership label.

**Smallest coherent repair:** Read ownership through the shared career context without granting purchase rights to preview actions. Include temporary careers and the current profile namespace.

**Acceptance condition:** Owned and unowned parts are labelled correctly, while preview toggles remain independent of career purchases and equipment.

## UX-14 · P2 · The selected camera button can disagree with the actual camera

**Evidence classification:** Source-confirmed duplicate state ownership.

**Pinned source:** [`src/signature/ui.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/ui.ts); [`src/signature/scene.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/signature/scene.ts).

**What the source does:** SignatureUI.activeView changes when a user explicitly dispatches a view action. Several scene actions, including Build, Shop, Back and Quick Race, programmatically call view(hero) without synchronizing activeView in the UI. The UI uses its separate value for aria-pressed on camera buttons.

**Player impact:** A previous Rear, Interior or other button can remain marked selected after the scene has reset to the full-vehicle view. This is a state mismatch, not evidence of a physically wrong camera position by itself.

**Reproduction to perform:** Choose Rear or Interior, move to Destinations or Shop, return to Build, and compare the active button with the actual camera and the scene currentView.

**Smallest coherent repair:** Make the scene’s current view part of SignatureState; render selection from that single source. Distinguish a manual orbit from a named preset as needed.

**Acceptance condition:** Active camera labels and accessibility state always agree with the rendered preset after screen transitions, reset, inspection and layout changes.

## UX-15 · P3 · Legacy vehicle labels do not follow the selected visual model

**Evidence classification:** Source-confirmed stale metadata.

**Pinned source:** [`src/workbench.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/workbench.ts); [`src/presentation/vehicle-asset.ts`](https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/5803a6bb366b5c51ff940435233e486cbccc3c80/src/presentation/vehicle-asset.ts).

**What the source does:** The default selectedVisual() is 2026. The legacy workbench still assigns the title 2024 Slingshot R and a fixed Radar Blue Fade / AutoDrive subtitle rather than using the dynamic vehicle context and current finish.

**Player impact:** The current model can be presented with an older year and a finish label that does not match the chosen build. This makes the showroom split look like a model/version regression.

**Reproduction to perform:** Use the default 2026 visual and a non-blue finish in the career bay and practice surface. Inspect visible title/subtitle and accessible text; some labels may be hidden by the normal bay CSS.

**Smallest coherent repair:** Derive user-facing model and finish labels from the current vehicle context and displayed recipe. Preserve legacy save IDs when they are intentional compatibility identities.

**Acceptance condition:** Visible labels match the selected vehicle/finish, without migrating or relabelling historic race records unnecessarily.

## Repair order

First preserve temporary careers across navigation and make free preview versus earned build an explicit session distinction. Repair the existing navigation and Continue resolver without touching race reward certification or history.

Next unify the showroom presentation and camera code around the existing signature showroom. Keep the current assets, Tour Wall, vehicle bindings, materials, products, lighting and hardware inspection capabilities. Repair containment in three dimensions and eliminate camera/UI state duplication. Do not build a third showroom or simplify the visual treatment to conceal missing content.

Then resolve the preview-night-drive, chosen-destination, screen-history and ownership-label inconsistencies. Finish with small metadata cleanup. Keep handling, authored routes, progression rewards and certified result logic outside this repair unless a new reproducible defect specifically requires a change.

## Cross-flow regression matrix

The following journeys need actual browser runs, fresh screenshots at stable states, console-error capture and state assertions. Use throwaway browser profiles, not the player’s real career.

| Journey | Required assertions |
|---|---|
| Opening → Build → Career → return | Career accessible without a hidden detour; expected chapter; correct build/mode |
| Career → Inspect earned build → showroom → Career | Same credits, inventory and chapter flags; ownership labels correct; direct return action |
| Repeat the preceding journey with storage unavailable | In-memory progress survives; temporary status remains explicit |
| Demo career → showroom → return | No unintended real-career writes or namespace switch |
| Chapter 01 complete → Continue | Next unfinished chapter/objective; rematches remain separate |
| Unowned lighting preview → test at night | Displayed kit is driven in unscored preview; no implicit purchase or career reward |
| Ridge + Blue hour → Build → Test | Selected route/lighting retained, or the button explicitly presents another choice |
| Every product → Inspect mount → Full vehicle | Appropriate framing; correct visibility restoration; valid active-view labels |
| Every room/preset → maximum orbit and zoom | No wall/floor/roof/near-plane escape; no oscillation between fitting and clamping |
| Arbitrary career-bay orbit → open workshop → Done | Original valid position, target, FOV and layout restored |
| Home/Back from entry, Build, Destinations, Shop | Distinct, predictable behavior; no Home-to-Build inversion |
| Direct screen URLs + reload + browser Back/Forward | Screen and URL remain consistent; build hash preserved |
| Resize through wide desktop and narrow viewports | Framing and controls remain usable; no newly exposed bounds escape |
| Earned-build race → result → Continue | Existing reward and save safeguards still work, without duplicate awards |

## Follow-up runtime risks, not promoted to confirmed findings

- Harbor and Express supply no obstruction callback to the chase-camera path that Ridge uses. Exercise scenery collisions before claiming an outdoor camera bug.
- The old bay uses a fixed 370-pixel workshop layout offset. Exercise narrow viewports before claiming an actual clipping or accessibility failure.
- Performance, memory/resource cleanup, audio continuity, loading/cancellation recovery, gamepad focus and full chapter/reward progression were not executed in this pass. Do not infer pass/fail from this report.
- Current source access does not establish that the user’s live deployment, local uncommitted checkout or saved browser visual selection is identical to this snapshot.

## Implementation handoff

Use this audit as a starting point, not permission to rebuild the game. Discover the current checkout and branch. Read the repository’s current local instructions and handoff, inspect changes since the pinned commit, and re-establish each finding against the actual target checkout. Preserve all unrelated or uncommitted work.

Implement in one cohesive repair pass with internal verification. Reuse the existing signature showroom presentation for career and free-preview mode with explicit mode adapters. Keep career ownership, free recipe editing and demo profiles separate. Preserve current vehicle assets, Tour Wall, product meshes/bindings, physics/handling, routes, earned progress and result-certification safeguards.

Before reporting a fix, reproduce the original failing journey in an isolated context and show the same journey passing after the change. Cover mouse, keyboard and relevant controller input. Capture matching before/after showroom views rather than comparing unrelated lighting, models or viewport sizes.

Return one meaningful handoff: exact commit, changed files, issue-by-issue disposition, automated test results, browser reproduction evidence and any remaining blockers. Never label the task complete because the build compiles or a benchmark remains green. Do not deploy or alter the player’s real saved career as part of validation without separate authorization.

## Supplementary reference

[Three.js OrbitControls documentation](https://threejs.org/docs/pages/OrbitControls.html) explains the distance and polar-angle limits used in the camera arithmetic. The repository’s installed version and actual controls behavior should be used for the final regression tests; the documentation is supplementary, not a replacement for the pinned application source.
