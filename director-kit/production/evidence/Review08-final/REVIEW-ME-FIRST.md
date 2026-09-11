# Astra Review08 — Make It Yours

**Functional product loop delivered. Night product readability and wall-clock performance remain HOLD. G3/G4 remain pending.** This is one cosmetic product on the accepted rebuild, with no new car, course, opponent, campaign, body/scenery revision, spending or deployment.

## Root, source and launch

Root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`

Captured implementation: **dd2c3f9d3b917aec1a7f2e6750f93afe17505292**, branch `main`. Prior Review07 packaging baseline: `b51c846c173f4bdfd9772d265e80e0b472f66dac`. The manifest identifies the later packaging-only commit separately. All 230 captured input hashes and 41 frozen foundation inputs were checked. Existing owner work and historical evidence remain in the same checkout. The source/served asset hashes are in build-inputs.json and capture.json.

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:5187/`. The default is the existing bay. Start Shakedown, complete a valid lap, Return to bay, then **Build · Make it yours**. Preview/cancel the kit, Buy & install, choose color, compare stock, and Drive at night. Scroll the compact card for product details and **View real product**. On an isolated extraction without Git, the cosmetic build label becomes review-package. Do not overwrite a newer checkout with this package.

Keyboard: Tab/arrows and Enter in Build; Escape/Backspace cancel preview or close. W/S or arrows pedals, A/D steer, C camera, held B look-back, X direction, held R restart, Escape pause. Standard controller: top face opens Build from entry; D-pad navigation, bottom face confirms focused choice, right face cancels; release controls before resuming. Existing RT/LT, stick, camera, reset and pause mappings remain. Controller evidence uses a virtual standard device through ordinary DeviceSample/native clicks, not physical hardware.

## What works and what the money means

A fresh career has 0 game credits. Its first fresh valid Harbor completion pays 800 total once across both day/night; later unique valid attempts pay 100 each. Invalid/incomplete/restarted attempts pay 0. Base kit costs 600 once. No dollars, site reward points, refund system or real purchase requirement.

The actual ordinary capture followed **0 → 800 → 200 → 300**. Day UUID `5de3eeb6-dcd8-451e-b890-6ffa8602d668` earned 800. Purchase UUID `79bb8cac-0676-43ac-bd22-14bb8e8dd319` spent 600 and installed. Night UUID `d48e597d-0dc5-4c47-9f66-aacd524d2f3b` earned 100. Both laps were valid at 1:18.719. Reload retained 300 credits, owned/equipped kit, cyan, 70% brightness, and all three once-only chapter flags. Receipts are in RESULTS.json.

Career data uses a separate browser-local IndexedDB database, atomic readwrite commands and unique attempt UUIDs minted at real attempt creation. Award dispatch comes from the unchanged validated race finish, not result rendering or PB detection. Duplicate results/purchases, concurrent tabs, color updates and first flags do not multiply rewards or overwrite wallet changes. Old localStorage PB/settings and stock-compatible record keys are retained, with no retroactive rewards. Browser-local state is editable by the player; this is not server anti-cheat.

When IndexedDB is unavailable, the same state machine uses clearly disclosed session-only tab memory. Deliberate same-origin game navigation carries a one-shot window.name envelope, consumes it and restores the previous name. Nothing enters the product URL. Independent reload/new tab can lose this fallback state; it is not durable saving. A failure after durable boot reports an uncommitted transaction without a spent-but-unowned state.

## The exact product and artistic boundary

**TricLED SM-133 RGB underglow, Base Kit #1 with RF remote**, for the existing 2024 Slingshot R AutoDrive. Only this product is selectable. All optional grille/front-spoiler, interior, swingarm, halo, wheel and chaser add-ons are excluded. Solid red (default), blue, cyan, purple, white and amber; on/off and 15–85% game brightness. Controls are game design, not a simulated physical remote or Bluetooth pairing. The kit changes no driving stat, mass, tire force, RPM, gear or lap classification.

The artist rechecked the [primary product page](https://www.slingmods.com/polaris-slingshot-underglow-kit) and its linked official installation video. That video is earlier-generation, approximately 2015-era. It establishes base lower-front/outer-frame regions, not exact 2024 routes. Four Blender-authored visible runs use 2 materials and 2,368 triangles with no copied textures. The side runs are 1.2 m visible approximations, not the complete physical 102-inch strips; hidden continuation, harness and receiver are omitted. Source and mounting/ground checks are in ../P04B1/artist/. Current car/rear/driver and scenery assets are unchanged.

The separate accessory uses the same presenter/state in inspection, bay, pad and Harbor. Two narrow downward area lights follow the side strips, with emissive diffusers and no new shadow maps. Real receiver geometry/normals receive the falloff; fine occluder shadows and exact photometry are absent, and front strip pavement contribution is simplified. The darker bay shows the color clearly. **Harbor near-chase glow is weak under existing practical/headlight wash, so the requirement for unmistakable installed night appearance is held.** The initial spot-light construction made hot spots; the second area-light construction is the best bounded state. No third iteration or environment compensation was made.

Rae's three brief original text beats appear once at entry, first valid result and first installation. They are skippable, have no voice, and do not block reward. This is an opening fragment, not a complete story campaign. View real product is a deliberate HTTPS link with noopener/noreferrer; testing intercepted it without a storefront request or cart write. No live real price/stock claim is shipped.

## Evidence and verification

- `progression-silent.mp4`: 22.5 seconds / 540 frames at 24 fps. Actual UI frames held between native actions; explicitly SILENT. One labeled time cut skips the middle of the companion full valid day trace. No fabricated finish, reward or equip fixture.
- `night-game-audio.mp4`: 85 seconds / 2,040 frames, uninterrupted ordinary virtual-input/camera path with the actually purchased kit. Logical 120 Hz presentation / 60 Hz physics / 24 fps raster. Both full 10,200-row traces include attempt UUIDs and product state. Physics telemetry is exactly identical with kit off/day and on/night under matched input.
- Night audio is the retained graph/bank/mapper rendered offline against the full logical timeline, not live speaker capture or audition. Full decode/duration/frame checks pass; encoded estimated true peak is −15.3 dBTP.
- Eight runtime stills only: compact garage, opaque mounting detail, matched stock/installed bay night, cyan, daylight, moving night corner and persisted build. The mounting still is a labeled-purpose reference camera; no Blender beauty substituted. Beauty scene opacity is retained.
- `../Review08-profile/night-wall-clock-silent.mp4`: separate 12-second real-time Playwright recording at 25 encoded fps, explicitly silent, with a visible stall. Its context was cloned from the actually earned career; Equip/Unequip used normal menus. No controlled clock or pose teleport.
- Full suite 72/72; director subset 26/26; TypeScript/Vite build PASS. Fourteen career browser checks and the retained six UI regressions PASS. Real IndexedDB concurrency and aborted-transaction recovery were exercised. A separate current-route old-save fixture preserved PB/settings without retro-credit, then earned 800 from a fresh ordinary valid lap. Twelve equip cycles/seven scene loads show bounded geometry/light/resource residency; unowned preview is removed on night scene entry.

Main capture never injected ownership or reward. Separate negative/concurrency browser checks use explicitly labeled synthetic receipt commands. Backward/skip rule details are covered by the unchanged race unit suite; the additional browser invalidation drives off course normally. No physical controller, human handling test, human listening approval or broad device certification occurred.

Windows 11, Node 24.15.0 / npm 11.6.2, Blender 4.5.2 background, Chromium 153.0.8010.12. Final capture/profile identifies ANGLE Direct3D 11 NVIDIA RTX 4080; retained UI regression is separately labeled SwiftShader. Current dependencies unchanged. All tools isolated; no desktop/mouse takeover.

## Measured costs and unresolved holds

Accessory export: 89,992 bytes, 2,368 triangles, 2 material primitives, 0 images. Harbor render endpoint stock 164 calls / 808,819 submitted triangles versus installed 166 / 811,187; resident counts 85 geometries / 34 textures versus 87 / 36. The two extra textures are area-light lookup resources, not downloaded maps. Warm bay lifecycle shows 4 additional calls / 4,736 triangles including its existing rendering passes; no new shadow map. Cached accessory resources stay bounded when detached and are disposed with the scene. These counts are not GPU-memory-byte or spare-capacity proof.

Separate 12-second wall-clock observations, including recorder overhead: stock mean 21.458 ms, p95 = 16.8 ms, max 2699.8 ms; equipped mean 27.186 ms, p95 = 16.7 ms, max 4666.5 ms. **Severe stalls remain; their cause was not isolated.** Do not infer a measured causal accessory slowdown from two short runs or use the controlled film as smooth-live-performance proof. A sustained-performance hold remains alongside night-glow readability, approximate 2024 routing/photometry, OEM/body/environment fidelity, sound character and physical controls.

The archive contains current implementation/public assets, new accessory Blender source and its linked unchanged car-source dependency, new scripts/tests, exact manifests and a labeled state excerpt. Other unmodified Blender sources and older evidence remain locally. Historical variants, dependencies/tools, dist, caches, .git, .env and credentials are excluded. Stop for Astra; G3/G4 remain pending.
