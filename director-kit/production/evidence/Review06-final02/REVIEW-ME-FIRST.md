# Astra Review06 — Harbor Shakedown

**P04A is implemented and submitted for review. G3 and G4 remain pending.** Review05 explicitly authorized this one course and timed event while final vehicle/aural approval remained held. This is not the full original P04 or a campaign.

## Project and launch

Project root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`

Branch: `main`. Captured runtime: **`e1fafb5ec4d371635bfbeca51663fc67734a40ca`**. Baseline Review05 packaging: `2fd926c38c7bf3b959d0fe3726e522ade1f8d483`. The later packaging-only commit and every included file's SHA256/size are in root `PACKAGE-MANIFEST.json`. Captured source and served-byte hashes are in `director-kit/production/evidence/Review06-final02/build-inputs.json` and `capture.json`.

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:5187/`. In the bay choose **Late afternoon** or **Harbor night**, then **Start Shakedown**. On the grid choose **Enable sound** if wanted, then **Start lap**. Finish and select **Retry now**. Development alternative: `npm run dev -- --host 127.0.0.1 --port 5187`.

Normal launch needs Node/npm and WebGL2. Blender, Python, Playwright and FFmpeg are authoring/evidence tools. Extract the archive into an isolated review directory when preserving an active tree; do not overwrite newer work. A ZIP without Git metadata builds with the cosmetic `review-package` label. No deployment or push was performed.

## Playable content and controls

One current stock Slingshot, the retained fitted helmeted driver, automatic drivetrain and free three-wheel physics. **Biscayne Harbor measures 1,230.867 m**, with **11 m roadway and 3 m runoff per side**. It has a waterfront straight, broad sweepers, a tighter bend and linked left/right changes. Sixteen directed planes comprise the finish and 15 intermediate gates. Render construction, collision boxes, surfaces, start, checkpoints and camera obstruction share the exported route data; the car is never attached to a spline.

The event provides ready → three-second countdown → standing-start lap → valid/invalid result → personal best → immediate retry or bay. Timing starts at GO, advances on 60 Hz physics steps and interpolates the final crossing. Initial line crossing does not count as a lap. Backward/skipped gates, impossible progress and sustained track-limit violations invalidate records. More than 0.35 seconds with two tires beyond runoff triggers invalidation. Reset starts a complete new attempt; pause stops the clock. Best-time compatibility includes course/version, stock vehicle configuration, rules and lighting. Settings edits preserve records; corrupt or unavailable storage permits play and discloses failed persistence.

| Action | Keyboard | Standard controller |
|---|---|---|
| Throttle / brake | W / S or up / down | RT / LT |
| Steer | A / D or left / right | Left stick |
| Near → far → cockpit | C | Top face |
| Held rearward glance | B | LB |
| Direction request | X | Right face |
| Restart whole attempt | Hold R one second | Hold bottom face one second |
| Pause / resume | Escape | Menu |
| Menu start/retry/continue | Enter | Bottom face |
| Menu return to bay | Backspace | Right face |

Release controls before rearming after interruptions. Audio enable needs a browser gesture; mute, volume and camera preferences persist. I toggles diagnostics. The ordinary HUD shows clock/checkpoints, speed, gear and RPM.

Day is fixed late afternoon; night uses stock road-facing beams, nearby harbor practicals and responsive brake lenses. Both presets have identical dry grip and separate records. The compact bay remains the entry/inspection backdrop (`?scene=bay`); its Drive action opens the existing pad (`?scene=pad`). Calibration remains `?scene=calibration`. Historical asset variants remain in the checkout but are omitted from this compact archive; old `asset=p01/fleet/p03a/p03a1` diagnostic URLs are not packaged choices.

## Changes and preservation

- **Engine coherence:** each contributing layer now uses sanitized RPM / reference RPM. The old independent 0.65–1.65 rate clamp made layers disagree: at 2,400 RPM the old bands implied 1,980/2,400/4,030 RPM; corrected bands all imply 2,400. Original failing and corrected passing tests plus a same-RPM WAV/parameter/spectral comparison are included. The comparison reconstructs only the old clamp using the same actual graph/bank. No new sound bank or drivetrain tuning.
- **Environment/event seams:** Simulation optionally accepts course data, with the old pad as default. DrivingSession accepts route reset and per-step/lifecycle hooks. Tire/force/drivetrain equations, mass, contact layout and fixed step are retained. Safe storage acquisition was added to existing callers. InputResolver itself is unchanged; harbor integration retains held-key safety and between-frame menu edges.
- **Presentation:** the current car and driver assets, eye and grip anchors remain unchanged. Harbor-only cockpit gaze/FOV exposes the upcoming apex; lower hands are more cropped. Headlight/brake response changes material/light presentation, not vehicle geometry.
- **Bounded land correction:** dense film review exposed land competing with the road for depth. The final Blender topology removes land beneath the complete road/runoff corridor; no road height or physical surface changed. All eight non-land material groups' expanded geometry attributes, nine embedded images and the entire route JSON are unchanged. Actual export checks found no land in 18,480 corridor rays; 1,232 outside rays retain Y=0. The ineffective depth-offset workaround was removed.

The current environment has **118,400 triangles, nine material groups and nine original 1K images** (48 MiB estimated RGBA8 plus mips, excluding geometry/targets). Source: `assets/blender/harbor/harbor.blend`. `P04A/artist/artist-final-manifest.json`, construction notes and land checks record exact source/export hashes and reproduction. All geometry and PBR maps are original local Blender/Python work; no downloaded stock assets, paid generation or outside map data. Current car/driver provenance is retained. `protected-foundation.json` verifies 25 protected files against the baseline.

## Current evidence and tests

All **eight PNGs** are actual exported runtime. Only the whole-route overhead uses a labeled diagnostic camera in a separate context. Waterfront, corner, cockpit and result images come from the ordinary driving attempts.

- `day-game-audio.mp4`: one uninterrupted **85-second** countdown-to-result attempt, **1280×720 at 24 fps**.
- `night-game-audio.mp4`: **25 seconds**, logical 35–60 seconds from a separately completed full night lap.
- Both runs record **120 Hz ordinary input/presentation state and 60 Hz physics**. Full timelines, events, frame hashes, renderer, wall time and results are in `capture.json` and the day/night logs. A disclosed local control agent supplies ordinary analog pedals/stick and camera buttons; it cannot set vehicle pose and is not a released rival or steering assist.
- Game audio uses the same graph/bank/corrected mapper through OfflineAudioContext, scheduled from every recorded logical state. Night audio retains the full earlier graph history before the excerpt. No stretching or music was added. This is aligned game-graph audio, **not live speaker capture or human audition**. Numerical decode/duration/frame-count/clipping/encoded true-peak checks are in `media-check.json`.

Local checks: **64/64 full tests**, **22/22 focused input/drivetrain checks**, TypeScript/Vite build pass. Tests cover gate order/direction, initial/repeated/backward/skipped finish, shortcut/invalid lap, countdown/pause/reset/retry, record compatibility, settings preservation and malformed/unavailable storage. Actual Rapier contacts were checked at both road edges and the seam; an exported barrier arrested the car. The route completed a valid real-physics lap before dressing. Separate 60/120 Hz route probes returned 78.7192038846 seconds.

The independent browser regression passes six interaction/lifecycle checks. The separate reviewer checked the repaired problem segment across **72 frames: two renderers, two presets, two aspect ratios and nine moments**, with unchanged prior physics. Both 16:9 and 21:9 retain apex/exit visibility and HUD framing. Final film/timeline findings and the scoped decision are in `P04A/review-final.md` and JSON. Both final day/night attempts completed a valid **1:18.719** lap with all 15 gates, no invalidation and no reset after the initial start. Record/settings/camera persistence and immediate retry passed in the original day context. Exact results, capture wall times and checks are summarized in `RESULTS.json`.

Earlier footage and unsuccessful local checks remain in the checkout. One earlier post-film test removed the active virtual controller, correctly invoking disconnect pause; its retry selector then timed out. The current capture helper keeps the controller connected and checks record, mute/volume, camera change, retry and reload. Final media is a fresh capture of the corrected runtime, not an edit of the earlier film.

## Environment, performance and holds

Windows 11; Node 24.15.0/npm 11.6.2; Blender 4.5.2; isolated Chromium 153.0.8010.12. The final browser uses **ANGLE Direct3D11 on the local NVIDIA RTX 4080**; physical audio output is muted. Package/lockfile pins Three, Rapier, TypeScript, Vite and Playwright. Local FFmpeg encodes/decodes the evidence. No desktop or mouse takeover was used.

Approximately ten-second 720p wall-clock fixtures measured: day-standard mean **16.887 ms**, p95 **16.8 ms**, maximum **150 ms**; night-standard and night-low mean **16.666 ms**, p95/max **16.8 ms**. The sampled frame submitted **138 calls / 661,787 triangles** including passes. Startup loads in that sequence were **3.11 / 0.58 / 2.24 seconds**; cache/compilation conditions differ. These short offscreen measurements are not sustained gameplay certification. Low mode changes shadow resolution 1024→512 and practical pool 4→2; a frame-capped run does not establish a speed gain. The earlier forced SwiftShader fixture stalled heavily and remains historical diagnostic evidence.

**Still held:** final whole-car/environment polish, authentic engine timbre/listening, physical-controller/human enjoyment and broad hardware/resolution validation. Scenery is a compact modular prototype with angular palms, repeated warehouses, sparse infield and oversized water reflections in the overview. Road textures and nighttime pools remain approximate. Mirrors/instruments, finger articulation and supporting-hand regrips are simplified. No photoreal or OEM-performance claim.

No campaign, AI opponents, ghosts, multiplayer, upgrades/product installs, currency/rewards, live catalog/storefront, additional playable vehicles, dynamic time/weather, music, narration or deployment. These are deferred; the event does not simulate them with placeholder buttons.

The archive includes current implementation/configuration/tests/scripts, needed public assets, editable current vehicle/driver/harbor Blender sources and a labeled current state/review excerpt, preserving relative paths. Historical helpers may reference omitted historical fixtures; use the documented current launch/test commands. It excludes `.git`, dependencies, downloaded tools, `dist`, caches, Blender backups, `.env`/credentials and redundant earlier captures. The full ledger/history remains in the existing repository. Stop for Astra; **G3/G4 remain pending**.
