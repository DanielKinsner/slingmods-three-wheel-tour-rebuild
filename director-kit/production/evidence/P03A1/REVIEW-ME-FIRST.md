# Astra Review 03 â€” P03A1 fidelity lock

Project root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.
**Visual status: HOLD.** The outer brow still has broad flat end-cap bands and segmented leading-edge transitions. The bounded construction attempts are preserved; no blanket fidelity PASS is claimed. Tire grooves remain a coarse approximation of the reference. Runtime/capture commit: `404dff91255eb0dadcaadeb81075f86508f36607`. The ZIP manifest records the later review-ledger commit, which changes no runtime inputs. The on-screen `-working` suffix reflects the pending production ledger when compiled; all 71 runtime/capture inputs were frozen and hashed.

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open **http://127.0.0.1:5187/**. Inspect opens the compact bay controls; Drive loads the same candidate on the existing pad. W/S accelerate/brake, A/D steer, X requests reverse, C near/far chase, hold R to reset, Escape pauses. The normal build has no audio or driver.

This packet changes the named front sections, wheel/tire master, steering/dash/seat shapes, paint-graphic edge coverage, and the compact inspection rig/framing. Editable candidate: `assets/blender/vehicles/slingshot-p03a1.blend`; runtime: `public/assets/vehicles/slingshot-p03a1.glb`; authored maps: `public/assets/textures/p03a1/`. P01 and Review02 assets and historical evidence are preserved. The simulation, signed-RPM correction, shared contacts and repaired caster policy remain unchanged.

Read `director-kit/production/evidence/P03A1/review-final.md` and `STATISTICS.md` for the actual outcome, specific remaining limits, and measurements. `comparisons.html` pairs unchanged P03A and P03A1 runtime views under identical current cameras/lighting. A small pre-material surface-review subset has its original input hashes in `surface-review-provenance.json`; it is diagnostic evidence, not the final mapped build. Reference-camera estimates and uncertainty are recorded separately; photographs are not OEM CAD or paint measurements, and are not runtime textures.

The orbit and pad movies are **SILENT**, actual isolated runtime screenshots encoded at 12 fps. The orbit is 13 seconds and fully framed; the pad maneuver is 20 seconds with scripted simulation acceleration, steering, braking and camera change, including an exit onto the existing grass edge. This is frame-stepped capture with a snapped chase-camera path, not ordinary camera-smoothing proof, real-time rendering, keyboard-recording proof or human driving. Still images and movie manifests identify their actual runtime inputs.

Environment: Windows 11 build 26200; Blender 4.5.2 LTS; Node 24.15.0/npm 11.6.2; isolated Playwright Chromium 153/SwiftShader. The production build and 30/30 tests pass; the focused RPM check passes 5/5. Asset/binding and served-byte browser results accompany the evidence. No physical GPU/FPS, controller or subjective handling approval is claimed. Source/texture complexity and the showroom-mesh-on-pad exception remain disclosed.

**G3 remains pending.** No rider, audio, gamepad, complete camera set, full workshop, road/racing sample, campaign, rivals, upgrades or other finished vehicles were added. Instruments, displays and lamps remain passive approximations. This handoff stops at P03A1; no next gameplay packet is authorized here.

The ZIP omits Git, dependencies, downloaded tools, caches, dist, credentials/environment files and redundant historical/intermediate archives. Those historical files remain in the existing workspace. Ordinary ZIP launch needs no Git metadata; capture/audit reproduction requires the full Git checkout and installed isolated Chromium/FFmpeg.
