# SlingMods: Three-Wheel Tour — Rear Integrity / Harbor Shakedown (P04A1 + P04A2)

Continue this existing rebuild. The current Slingshot, fitted driver and accepted driving equations are retained. P04A adds Biscayne Harbor, one standing-start timed lap, ordered checkpoint validation, personal best, immediate retry and selectable late-afternoon/night presets. Current authority: director-kit/director-addenda/review-06/CODEX_NEXT.md. P04A1 repairs the rear body/storage clearance and adds shared visual rear suspension articulation; P04A2 improves only palm crowns, road materials and waterfront light. G3/G4 remain pending; final vehicle fidelity, aural realism and hardware validation are held.

## Launch

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5187/. In the existing bay choose Late afternoon or Harbor night, then Start Shakedown. On the grid, Enable sound if wanted, then Start lap. Complete all15 checkpoints and the finish. The result offers Retry now and Return to bay. Day and night have separate compatible best times. No account or network service is required.

| Action | Keyboard | Standard controller |
|---|---|---|
| Throttle / brake | W / S or up / down | RT / LT |
| Steer | A / D or left / right | Left stick |
| Near → far → cockpit | C | Top face |
| Held rearward glance | B | LB |
| Request direction | X | Right face |
| Restart entire attempt | Hold R one second | Hold bottom face one second |
| Pause / resume | Escape | Menu |
| Start / retry / continue menu | Enter | Bottom face |
| Return to bay from menu | Backspace | Right face |

Release controls before resuming after pause, focus loss, controller disconnect or reset. The clock runs on fixed physics steps, pauses with the session and stops at the interpolated finish crossing. Countdown is three seconds; timing starts at GO. Visit gates in order and remain within the road/runoff. More than0.35seconds with two tires beyond runoff invalidates a record. Invalid practice laps never replace a best. Settings writes preserve records; inaccessible browser storage permits play and discloses failed result persistence.

The compact inspection bay remains at `?scene=bay`; Drive there opens the original pad at `?scene=pad`. The calibration fixture remains at `?scene=calibration`. Harbor presets use `?scene=harbor&preset=day` or `night`; `&quality=low` reduces shadow/light cost. I toggles diagnostics. No campaign, AI opponents, ghosts, upgrades, shop, other playable vehicles or dynamic weather.

## Assets and foundation

The flat closed course measures1230.867m with11m roadway and3m runoff per side. Its Blender export supplies road sampling, physical surfaces, start, gates, oriented colliders and camera obstruction. Player motion is free physics, never attached to the route. Waterfront, warehouses, freight, palms, fences, lamps, quay and water use original local Blender geometry and generated original PBR maps. Authoring source: assets/blender/harbor/harbor.blend; current driver: assets/blender/drivers/test-driver.blend. Course generation uses scripts/harbor_build.py with HARBOR_DRESS=1 and imports harbor_dress.py/harbor_materials.py. Blender4.5.2 with its Python/numpy was used. Authoring can replace named outputs: use an isolated copy when reproducing historical candidates.

Stock headlight lenses now drive actual road-facing beams at night; nearby harbor practicals illuminate road and brake lenses respond to braking. One bounded shadow map is used. Harbor cockpit pitch/FOV is adjusted to see the apex; the eye anchor, grips, character and accepted front/cockpit geometry are unchanged. Rear assembly geometry is the narrowly authorized P04A1 exception. Mirrors and instruments remain simplified.

The bounded sound repair uses sanitized RPM / source reference RPM for every engine layer. The original bank and graph are retained. This corrects conflicting pitches caused by the old independent rate clamp. It is still an original synthetic approximation, with no human audition or authentic exhaust claim.

## Verification and capture

```powershell
npm test
npx tsx --test tests/input.test.ts tests/drivetrain-wheel-speed.test.ts tests/drivetrain-integrated.test.ts
```

The local integration suite has67 passing tests, including course direction/order, lap lifecycle, save corruption/unavailability, surface/collision alignment and the preserved pad regressions. The focused selection has22 passing checks. The independent frozen browser regression covers keyboard edges, held-key pause/reset, denied storage and virtual standard-controller lifecycle. Physical-controller/human driving and listening were not performed.

For a new isolated evidence run, install Playwright Chromium if absent, provide FFmpeg on PATH, use a Git checkout and running preview, then run scripts/build-review07.mjs followed by scripts/capture-review07.mjs with EVIDENCE_DIR set to a fresh directory. The build manifest verifies source and served bytes. The script uses a labeled local test controller through ordinary InputResolver/DrivingSession/physics/presentation. It does not ship as an AI opponent. Captures use120Hz logical presentation,60Hz physics and24fps controlled raster. The85second daytime movie is one continuous countdown-to-result attempt. The25second night movie is logical35–60seconds from a separately completed full85second timeline. Audio is rendered from those exact states using the same graph/bank/mapper and muxed without stretching; it is not live speaker capture.

The initial forced SwiftShader wall-clock fixture showed substantial stalls. The final isolated browser can use the local RTX4080 through ANGLE Direct3D11; renderer-specific measurements are supplied separately. Controlled capture is not sustained FPS proof. Lower shadow cost reduces resource budgets but has not established a hardware performance gain. See the compact Review07 guide, source manifest, per-frame logs, numerical media checks and separate review for exact evidence and remaining limitations. Do not advance G3/G4 or proceed beyond this packet without Astra's next direction.


An initial capture helper removed the virtual pad during a post-film settings check and correctly triggered disconnect pause. That failed fixture and footage remain historical evidence; the current helper keeps the pad connected. A Blender land-corridor cut also removes depth competition beneath the road/runoff, while preserving the complete physical route, road surfaces, props/maps and vehicle foundation. Final replacement evidence is under Review06-final02.


## Current rear and waterfront authoring

Bay, pad and Harbor share the current asset declared in src/presentation/vehicle-asset.ts and the same RearPresenter. Rear tire position remains exactly the wheel telemetry. The arm/belt use a measured visual-only axial adjustment to accommodate the existing vertical raycast path; the axle and non-spinning caliper follow the hub, the upper shock stays fixed, and opposite-end sleeves telescope while the spring changes length. No tire, contact or drivetrain equations change. Exact clearances, travel tolerances, geometry comparisons and remaining holds are in the Review07 evidence.

Current rear source: assets/blender/vehicles/slingshot-p04a1.blend. Historical P03A2 source/export remain preserved for comparison. The waterfront surgery script scripts/harbor_waterfront.py opens assets/blender/harbor/harbor-p04a.blend, preserving the land cut and route, and writes the current harbor.blend/GLB. Do not rerun the original full harbor generation chain over the current corrected source. The compact archive includes the predecessor sources required for these local authoring procedures.

Rear diagnostic capture uses scripts/capture-rear07.mjs with a fresh REAR_DIR and VERIFY_BUILD=1. Its full-travel injection, wheel-spin demonstration and actual pad braking are separately labeled; the rear and bay-orbit clips are silent. Full day/night evidence uses the ordinary driving path with aligned game-graph audio. Product upgrades remain deferred. G3/G4 remain pending.
