# P04B1 — Make It Yours
## One real-product ownership loop, not a catalog full of promises

### Intended playable result

A new player completes the existing Harbor Shakedown, earns workshop credits, returns to the existing bay, previews and purchases a real compatible lighting kit, chooses its color, and drives the same car at night with that kit visibly installed. Reloading keeps the purchase, chosen appearance, existing personal bests and settings. A deliberate **View real product** action opens the verified SlingMods product page. Playing and buying virtual upgrades never require a real purchase.

This packet is newly authorized after Review07's rear repair acceptance. Do not wait for final scenery polish, and do not advance the original full-slice gates merely because this smaller loop works.

## 1. Product decision: locked

- Runtime vehicle ID: retain **`slingshot-r-2024`**, the existing 2024 Slingshot R AutoDrive configuration.
- Catalog ID: **`tricled-sm133-base-rgb`**.
- Product: **TricLED base RGB underglow kit, SlingMods part SM-133**.
- Configuration: **base Kit #1 only**; no optional front/grille, interior, swingarm, halo or wheel-light add-ons. The 2015–2019 halo add-on is not compatible with the selected car and must not appear as a free extra.
- Game slot: `lighting.underglow`.
- Game price: **600 game credits**. This is fictional balancing, not the store's price or reward points.
- Effects: appearance and lighting only. **Zero changes** to power, torque, mass, grip, braking, steering, suspension, RPM, gearing, lap validity or personal-best classification.
- Color controls: off/on, modest brightness control, and a restrained solid-color palette including red, blue, cyan, purple, white and amber. Default installed color: SlingMods red. No strobes, rapid flashes, music sync, chaser effects or simulated Bluetooth pairing in this packet. Game color controls are not a claim that a physical remote has precisely this interface.
- Factual catalog fields, sources and unknowns are supplied in `references/product-sm133.json`. Validate against the current site once at authoring time. The game ships a curated local manifest; no runtime scraping, price polling, store API or network requirement for racing.

**No placeholder inventory for the remaining products.** The code can be extensible, but only this delivered product is selectable. No purchase buttons for an unbuilt shock, exhaust or other vehicle.

## 2. Actual accessory art and attachment

Use the existing installed Blender in background mode to author a separate lightweight accessory source and export, for example `assets/blender/products/tricled-sm133-base.blend` and `public/assets/products/tricled-sm133-base.glb`. Use the included existing car as a read-only fitting reference.

Inspect the product page's installation media and photos to establish the **base kit's** actual mounting regions. Record the reference used. Do not infer the base layout from photos showing optional add-ons. When reference detail is insufficient, mark dimensions/mounting as photo-informed approximations rather than presenting invented measurements as factual. No new service or paid asset acquisition.

Represent a plausible strip/housing/diffuser with connectors/wiring only where visible from a useful inspection angle. Preserve world scale and clearance; no strips inside tires, storage shells, moving suspension or the road. Attach to chassis mounts, not the spinning wheel or articulating arm. Do not solve fit by changing the accepted rear rig or body. Store mounting transforms in a small versioned accessory descriptor. Keep the existing car GLB/rig hashes fixed.

Use the same product presenter/state in bay, inspection, pad and harbor. Equip, unequip, preview cancellation and scene teardown must remove accessory geometry and lights cleanly. No duplicate instances after retries or repeated scene visits.

Performance starting budget: **under 10,000 accessory triangles, at most four added normal-view draws**, reusing small original material maps where sensible. These are targets, not measured claims. An explicit, justified exception is better than hidden excess, but adding density is not a fix for poor light shaping. Do not re-export every car material or load every historical GLB merely to add one kit.

## 3. Lighting that reads as a mounted product

Night appearance must come from the correct mounted strip positions and interaction with nearby surfaces. It must not be just a glowing decal or one enormous flat colored rectangle following the car.

Choose the bounded runtime implementation yourself within this decision: physically based emissive strip surfaces plus a small receiver-aware/local-light treatment for the pavement. Keep spill close to the chassis footprint, falloff soft and brightness restrained; retain visible asphalt and curb detail. Respect road height/orientation, chassis motion, barriers and underside occlusion as appropriate to the selected method. Do not flood the cockpit, shine through the rear storage boxes, make the whole body emissive, or brighten unrelated parts of the track. Existing headlights and brake lights retain their behavior and priority.

Initially allow **no new shadow maps** and **at most two extra local lights**. A receiver shader/decal method may replace those lights if it handles road geometry and boundaries correctly; label it as an artistic game approximation, not measured photometry. Do not globally crank bloom/exposure or rewrite the harbor lighting to sell the accessory. Low quality may simplify the glow but must preserve ownership, chosen color and unmistakable installed state.

Create a controlled bay night-preview toggle using the existing bay's fixtures/environment. On exit, restore that scene's normal lighting. A/B comparison must preserve the camera, exposure, pavement and all other settings: stock versus installed should show the accessory's contribution, not a lighting-preset trick.

## 4. Garage presentation and normal controls

Keep the current bay as the hub. Add a compact **Build** view with the current vehicle, credit balance, one relevant product card, ownership/equipped status, color selection and `View real product`. Use charcoal surfaces, restrained red accents and readable type; do not cover the car with a full-screen inventory spreadsheet. A single proper category is better than five empty tabs.

The product card should support:

- **Preview** before purchase: temporarily show the kit; explicitly label PREVIEW and do not alter saved ownership/equipment. Cancel, escape/back, changing scene or starting a race must remove unowned preview effects.
- **Buy & install — 600 game credits** when affordable. Pending transactions disable repeat activation. On success, update balance, ownership and equipped state together.
- **Equip / Unequip** once owned, free of additional charge. Unequipping retains ownership and preferred color.
- **Compare stock** as a temporary preview override, never erasing the equipped state. Exit/reload returns to saved configuration.
- **Drive at night** as a convenient shortcut to the existing Harbor night event, not a new course or event rule.

Fit the actual whole vehicle in the free viewport; the current bay orbit can place the nose partly under the UI/offscreen. Correct the Build-view camera fit only; do not redo all cameras.

Keyboard focus and controller menu navigation must actually work: a focusable selection, visible focus, confirm, cancel/back, and neutral-release behavior after leaving a menu. Do not require Dan to use the mouse to test the new loop. Reuse the input architecture rather than a second hidden path. Preserve the current camera, pause, reset and ordinary driving mappings.

## 5. Credits, ownership and exact-once effects

### Locked economy

- A genuinely new career starts at **0 game credits**.
- The first fresh, valid completed Harbor attempt after this feature is installed grants **800 credits total**. It is a single shared first-completion bonus across day/night, not 800 for each lighting preset and not 800+100.
- Later unique valid completions grant **100 credits each**. Invalid/practice laps, restarts, quitting before completion, countdowns and duplicate result delivery grant **0**.
- The base kit costs **600** once; no selling/refunds in this packet. The intended first loop is **0 → 800 → 200**. A subsequent valid replay makes **300**.
- Existing old personal bests are preserved but do not auto-award credits. Require a fresh valid completion rather than guessing a past reward from a best-time record.

These are game-design decisions. Do not mirror dollar prices, site loyalty points, financing or shopping-cart quantities.

### Persistence decision

Implement a small **browser-local IndexedDB career store** for wallet, ownership/equipment/color, chapter flags and award receipts. No hosted database, server, login, API key or paid infrastructure. Preserve existing `src/save.ts` behavior and the existing localStorage key for settings/personal bests; do not silently wipe them or merge game-wallet fields into a decoder that drops unknown fields. The current rebuild's settings/records are the only migration concern; never read the old abandoned game's saves.

Use an in-memory implementation of the same career-store contract for tests and denied/unavailable storage, clearly marked **Session only — progress cannot be saved**. If durable storage works at boot and later fails, do not display a successful durable purchase before its transaction commits. Keep state coherent or explicitly switch to a disclosed session-only mode; no spent-but-unowned state.

Mint an opaque globally unique attempt ID for each **real new attempt** at its creation. The existing per-instance numeric attempt counter is insufficient across page reloads/tabs. Connect the award to the existing validated finish event, not result-page rendering, personal-best detection or a developer fixture. Store the award receipt and wallet/chapter mutation in the same IndexedDB readwrite transaction. A repeated ID is a no-op. Never trust a second call's higher claimed amount.

Purchasing must likewise atomically check fitment, catalog price, balance and existing ownership and then update balance + ownership + selected equipment. Ownership prevents repeat charges even when a caller supplies a different purchase UUID. Color/equip changes must not overwrite a newer credit balance. Serialize shared-store transactions so simultaneous tabs cannot double-award the first bonus or overspend. Mark stale views and refresh their state after changes. Offline, client-owned saves remain editable by the user; do not pretend this is server anti-cheat.

Because the kit is cosmetic, keep existing stock personal-best compatibility. Do not erase or split records by lighting color or accessory ownership. Future physics-altering configurations will need their own fingerprint; do not implement those unbuilt products now.

## 6. A small original story beat

Use **Rae** as a brief workshop/race-radio text presence. No new human model, voice cloning, paid speech, cinematic or dialogue tree. All lines are newly authored here and may be tightened to fit the UI without changing the intended progression.

- First entry: “Welcome to the harbor. Give me one clean lap, then we'll make this thing yours.”
- First valid result: “Clean lap. You're in. Your first workshop credits are ready.”
- First equipped kit: “That's your first build. Take it out after dark.”

Keep the cards skippable, infrequent and outside high-demand cornering. Dismissing a card does not block the reward. Reloading, replaying results, changing color or unequipping does not rerun the first-completion story. Identify this as an opening chapter fragment, not the complete story campaign.

## 7. Website connection: useful, intentional and read-only

Use a local curated product record with ID, short display name, brand, part number, fitment allowlist, slot, source URL, verification date, reference notes, game price, effect classification and explicitly excluded add-ons. Render external strings with safe DOM/text handling.

The **View real product** button opens the single verified HTTPS SlingMods product URL only after a user gesture. Use `noopener`/`noreferrer` when opening a new tab. Keep the race paused if the user leaves during play. Do not append user IDs, personal data or invented cart endpoints. No auto-opening, hidden redirect, auto-add-to-cart or store write. Do not show a cached real price/stock claim as live; the page is the source for those details.

Display a modest explanation in product details: **Game credits are virtual. Real products are purchased separately on SlingMods. Check the live page for options and fitment.** No claim that a real purchase is required, that the game provides an installation tutorial, or that colored lighting is road-legal everywhere. This is a closed-course game visualization.

A later multi-product `Shop this build` can reuse the same data. Do not build a fake cart integration now.

## 8. Implementation and acceptance boundaries

Work in small functioning increments: (1) store + reward + tests, (2) accessory + shared presenter + comparison, (3) ordinary-menu integration + story + external link, (4) full loop evidence. A local break should be repaired in its owning module rather than by restarting the game.

Required acceptance cases are provided as **planned**, not executed, in `ACCEPTANCE-CASES.json`. Run the existing full suite plus focused credit/store/product/menu tests, real browser persistence checks, same-trajectory kit-off/on physics comparison, and matching runtime captures. Product lights must not alter physics or invalidate the accepted rear clearance. Do not disable existing regression checks to make the new store easier.

Capture at the same 1280×720 baseline and report actual before/after calls, triangles, resident resources/load and a short wall-clock sample separately from controlled-clock movies. No sustained-60-FPS or mobile claim from the old ten-second 4080 result. Record any default/off accessory runtime cost and ensure objects/materials/lights are disposed on teardown. Do not spend the entire review on optimization that cannot be measured.

The owner should receive a working build and one `Astra-Review-08.zip`, not a menu of unresolved design choices. Return a bounded HOLD only for a specific unresolved blocker after the allowed iterations; retain the working baseline and complete independent authorized work. No unrelated palms/scenery/body repainting in this assignment.
