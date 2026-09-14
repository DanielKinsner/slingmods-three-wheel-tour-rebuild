# SlingMods: Three-Wheel Tour — First Night at the Harbor (P05)

Continue this existing rebuild. The active director packet is `director-kit/director-addenda/review-09/CODEX_NEXT.md`. P05 adds one complete first chapter to the accepted car, driver, harbor, underglow and driving foundation. G3/G4 remain pending; this is a local review build, not a release or the full campaign.

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
| Near → far → cockpit | C | Top face |
| Held rearward glance | B | LB |
| Request direction | X | Right face |
| Restart entire attempt | Hold R one second | Hold bottom face one second |
| Pause | Escape | Menu |
| Menu confirmation | Enter / focused native button | Bottom face |
| Return from race menu | Backspace | Right face |

Release controls after pause, focus loss, controller disconnect or reset. Race timing uses1/60 physics ticks and fractional gate crossings, with one world step for the entire field. All cars share the same physical constants. Rivals only issue driving controls; their different lines, braking and passing decisions do not change grip or power. Off-route cuts, wrong-way gates and relocation invalidate an event. Finish ties use exact time, then lexical vehicle ID only for indistinguishable times.

## Saves and sound

The current-rebuild career remains in `slingmods-twt-rebuild-career-v1`, now IndexedDB database/version2 and career schema2. Valid v1 records migrate atomically without changing their money, receipts, ownership, appearance or old flags. Old live writers close on version change. Unknown/corrupt records are protected with export/recovery options. Denied storage uses clearly labeled temporary, same-tab scene handoff; it is not durable across an independent reload. Solo records/settings retain the existing `slingmods-twt-rebuild-v1` namespace. Nothing is imported from the abandoned game.

Enable sound activates the current synthetic telemetry-driven player engine. Two stable opponent audio slots reuse its decoded buffers and context, attenuated/panned from actual relative positions and RPM. Mute, volume and pause apply to all buses. A silent browser recording is labeled as such; signal tests are not human listening approval.

## Retained Blender source and limitations

The accepted exported vehicle, rear repair, driver and harbor geometry are unchanged. Runtime rivals share immutable geometry/textures and own their mutable materials, skeletons and articulation. They use material identifiers instead of newly modeled cars. Sources remain in `assets/blender/vehicles/slingshot-p04a1.blend`, `assets/blender/drivers/test-driver.blend`, `assets/blender/harbor/harbor.blend` and the existing product Blender source. Authoring scripts remain under `scripts/`; do not overwrite historical exports when reproducing older packets.

Night rendering preserves one shadow map, six spotlight slots and two player-kit area slots. Rival lenses use emission only; no extra projected rival headlights or kit lights. Their paint variants omit the blue color map while retaining the accepted mechanical geometry and other surface maps. The sparse harbor, provisional materials/driver, synthetic audio, simplified mirrors/instruments and approximate underglow photometry remain review debt. No other vehicles, products, tracks, multiplayer or deployment were added. Physical-controller feel, foreground-display responsiveness and human fun/audio approval remain unavailable.

## Verification

```powershell
npm test
npx tsx scripts/parity-p05.ts
```

P05 evidence, full-field traces, source hashes, independent reviewer notes and the final clean native-RAF measurements live under `director-kit/production/evidence/P05/`. `build-inputs.json` identifies the captured build. `scripts/build-review10.mjs` builds and freezes input hashes; `scripts/run-review10-matrix.ps1` requires fresh evidence directories and runs isolated browsers sequentially. Controlled-clock rule/UI tests are separate from real-time performance and continuous wall-clock video.
