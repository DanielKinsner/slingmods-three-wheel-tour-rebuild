# Current entry point

Read HANDOFF.md for P07B, fresh-clone setup and the pending publication boundary. Current local game: npm ci, npm run demo:build, npm run demo:preview (localhost5188). The sections below describe earlier milestones.

---

# Historical record below (superseded)

# SlingMods: Three-Wheel Tour â€” Environment Quality Lock (P06B)

For another machine or agent, start with [HANDOFF.md](HANDOFF.md). Continue this existing rebuild. The active director packet is `director-kit/director-addenda/review-11/CODEX_NEXT.md`. P06B reauthors presentation with free CC0 photo PBR materials, metre-scaled road UVs, connected harbor paving and shoreline, swept palm geometry with three levels of detail, an outdoor HDR sky/probe, water response, and a finished compact inspection room. The existing first chapter, vehicle and game systems remain intact. G3/G4 remain pending; this is a local review build, not a release or the full campaign.

## Install and run

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5187/. The root opens the compact bay with Continue chapter, Time trial and Build. No diagnostic URL, account or service is required. Node24/npm11 were used for this review; dependencies are pinned in the lockfile.

A fresh career starts with one clean Harbor shakedown. It earns800 fictional game credits; later unique valid solo laps earn100. The SM-133 base underglow costs600 game credits, previews in the bay and saves equipment/color. Buying it is optional. Existing completed careers can meet the crew immediately, without repeating the first reward.

Accept Rae's text invitation and enter the existing harbor at night against Maya, Jett and Nico: three independently driven Slingshots in the same Rapier world. Start fourth, complete two validated laps, and earn300/200/150/100 credits for first/second/third/fourth. The first podium adds400 once and clears Chapter1. Results are immediate; unfinished rivals remain labeled until finishing or the30-second limit. Retry restarts all four with a fresh attempt ID. Return to the bay retains your build. There is no Chapter2 yet.

Time trial remains a separate one-lap event with day/night presets and separate personal bests. A crew result cannot change solo records. Drive in the bay opens the original practice pad; inspection and calibration remain available.

| Action | Keyboard | Standard controller |
|---|---|---|
| Throttle / brake | W / S or up / down | RT / LT |
| Steer | A / D or left / right | Left stick |
| Near â†’ far â†’ cockpit | C | Top face |
| Held rearward glance | B | LB |
| Request direction | X | Right face |
| Restart entire attempt | Hold R one second | Hold bottom face one second |
| Pause | Escape | Menu |
| Menu confirmation | Enter / focused native button | Bottom face |
| Return from race menu | Backspace | Right face |

Release controls after pause, focus loss, controller disconnect or reset. Race timing uses1/60 physics ticks and fractional gate crossings, with one world step for the entire field. All cars share the same physical constants. Rivals only issue driving controls; their different lines, braking and passing decisions do not change grip or power. Off-route cuts, wrong-way gates and relocation invalidate an event. Finish ties use exact time, then lexical vehicle ID only for indistinguishable times.

## Saves and sound

The current-rebuild career remains in `slingmods-twt-rebuild-career-v1`, now IndexedDB database/version2 and career schema2. Valid v1 records migrate atomically without changing their money, receipts, ownership, appearance or old flags. Old live writers close on version change. Unknown/corrupt records are protected with export/recovery options. Denied storage uses clearly labeled temporary, same-tab scene handoff; it is not durable across an independent reload. Solo records/settings retain the existing `slingmods-twt-rebuild-v1` namespace. Nothing is imported from the abandoned game.

Enable sound activates the current synthetic telemetry-driven player engine. Two stable opponent audio slots reuse its decoded buffers and context, attenuated/panned from actual relative positions and RPM. Mute, volume and pause apply to all buses. P06 provides an opt-in isolated MediaRecorder tap of that actual mixed graph. The main review video contains live game audio with three disclosed evidence-only synchronization chirps; a short secondary garage/day demonstration is explicitly silent. Signal tests do not grant human listening approval.

## Retained Blender source and limitations

The accepted exported vehicle, rear repair, driver, road and collider geometry are unchanged. Current modular scenery and showroom sources are in `assets/blender/showcase-quality/`; original `showcase/` sources remain historical. authored spatial instance cells and shared PBR maps extend the same course. Runtime rivals share immutable geometry/textures and own their mutable materials, skeletons and articulation. They use material identifiers instead of newly modeled cars. Sources remain in `assets/blender/vehicles/slingshot-p04a1.blend`, `assets/blender/drivers/test-driver.blend`, `assets/blender/harbor/harbor.blend` and the existing product Blender source. Authoring scripts remain under `scripts/`; do not overwrite historical exports when reproducing older packets.

Night rendering preserves one shadow map, six spotlight slots and two player-kit area slots. Rival lenses use emission only; no extra projected rival headlights or kit lights. Their paint variants omit the blue color map while retaining the accepted mechanical geometry and other surface maps. The harbor is visibly improved but its broad outer lawns and repetitive distant architecture still fall below the realistic environment target. Provisional hero materials/driver, synthetic audio, simplified mirrors/instruments and approximate underglow photometry remain review debt. No other vehicles, products, tracks, multiplayer or deployment were added. Physical-controller feel, foreground-display responsiveness and human fun/audio approval remain unavailable.

## Verification

```powershell
npm test
npx tsx scripts/parity-p06b.ts
```

Current P06B evidence is under `director-kit/production/evidence/P06B/`; its frozen `build-inputs-verified.json`, current performance summary and review report identify exact source/assets and limits. The full P05 ledger/evidence remains local and in history; its original 366.6ms outlier and 33.4/50ms heavy repeat remain unresolved historical observations. Do not overwrite old evidence directories. Build freezing uses `scripts/build-review12.mjs`; fresh output directories are mandatory for capture/test scripts. Controlled-clock rule/UI/lifecycle tests are separate from clean native-RAF measurements and continuous wall-clock audio/video.

Selected Review12 movies, traces, screenshots and provenance are tracked for the cross-machine handoff. Redundant captures, dependencies, dist, review ZIPs, caches and Blender backups remain local and ignored. Editable assets and shipped public files are source. G3/G4 and release approval remain pending Astra.

## P06B source reproduction

Material download URLs, original/derived SHA-256 values, licenses, channels and physical scales are recorded in `public/assets/showcase-quality/source-manifest.json`. All 33 selected source records are CC0; runtime assets are local, with embedded GLB maps. Day uses the selected Poly Haven pure sky; night uses an authored sky. The outdoor light probe excludes the concentrated daylight sun to avoid double-counting the aligned directional light.

```powershell
python scripts/p06b_acquire_materials.py
# With the already installed local Blender CLI:
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python scripts/p06b_quality_build.py -- --stage full
python scripts/p06b_validate_assets.py
python scripts/validate-review12.py
```

The review ZIP includes the new packed Blender sources, downloaded material source files and the unchanged harbor Blender foundation used by the authoring script. Blender itself is excluded. Source acquisition is unnecessary for ordinary install/play. The ground repair keeps the exact road/runoff domain open and the existing collision envelope unchanged. Outdoor depth uses reversed depth when supported and logarithmic depth otherwise, preserving the 0.06 m cockpit near plane. P06B originally prohibited remote changes; the later user instruction explicitly authorizes this private main-branch handoff. It does not authorize deployment or further feature work.
