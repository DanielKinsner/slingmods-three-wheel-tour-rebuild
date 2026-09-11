# Astra Review05 — P03B2 First Drive

Project root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`  
Captured runtime commit: **f55d83971d278fb31b9d5c502065efcb5373ec3c** on `main`. The later packaging/review-only commit is recorded in PACKAGE-MANIFEST.json. All captured build inputs are hashed in evidence/Review05-final/build-inputs.json; the browser also verified served bytes. No deployment or push.

## Start the current build

From PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5187/. Choose **Drive**, then **Enable sound** in that driving page. Mute/volume are available and persisted. Browser audio needs a document gesture; a controller gesture alone does not guarantee activation. Node24.15/npm11.6.2 were used. Ordinary launch does not require Blender, FFmpeg or Playwright. Source evidence/repackaging scripts additionally expect a Git checkout; the archive intentionally excludes .git.

## What is playable

One current 2024 Slingshot R interpretation, a compact unoccupied inspection bay and the same car on the existing test pad with 18 noncolliding handling guides. P03B2 adds a separate seated helmeted Blender driver, near/far/cockpit selection, immediate held rearward glance, telemetry-driven engine/road/wind/shift sound, persistent sound preferences, and visible speed/gear/RPM.

| Action | Keyboard | Standard controller |
|---|---|---|
| Throttle / brake | W / S, arrows | RT / LT |
| Steering | A / D, arrows | Left stick |
| Near → far → cockpit | C | Top face |
| Held rearward glance | B | LB |
| Request direction | X | Right face |
| Reset start | Hold R one second | Hold bottom face one second |
| Pause / resume | Escape | Menu |

I toggles diagnostics. Release controls after focus loss/disconnect and resume deliberately. Camera changes while looking back select the mode restored on release. Helmet/head are hidden only in cockpit; the same fitted arms/body remain.

There are no playable races, AI, campaign, garage upgrades/customizer/shop, additional selectable vehicles, new track or nighttime driving. Bay tools, instruments, infotainment, mirrors and lamp appearance remain passive. Historical prototypes remain in the full repository but are omitted from this compact package.

## Source methods and retained foundation

The separate driver source is assets/blender/drivers/test-driver.blend with scripts/driver_p03b2_build.py and driver_p03b2_materials.py. It exports 28,411 triangles, 4 materials, 1 skin and three 1024² PBR maps. Runtime distinct-texture estimate is 16,777,218 bytes with mipmaps; this is not measured hardware allocation. There was one geometry fit correction and one material candidate. The source and GLB have hashes in the artist manifest.

Attachment JSON records seat, pedal, eye and actual steering-wheel anchors. A bounded two-bone arm solve follows the displayed wheel matrix; alternating regrips keep a supporting hand on the rim, which may slide while the other hand transfers. The driver shares the vehicle's interpolated pose. Small acceleration response is clamped; fingers are authored shapes, not collision-simulated grasping.

Car body/source/maps, bay, pad, contact layout, InputResolver, DrivingSession and all simulation code are unchanged against the accepted starting checkpoint 30520ca2bef6f059d82ccad79ec73ce3abd6a075. The current car remains 211,431 triangles / 59 primitives, above the historical 140k racing-LOD aim. No vehicle fidelity approval is implied.

Audio is one original locally synthesized bank, not a recorded Slingshot engine. Estimated 1200/3600/6200 RPM load/lift beds, road/wind and a shift transient use actual telemetry through a shared mapper and graph. Road uses contact wheel longitudinal speed/slip/surface; shift events reflect real drivetrain transitions. No purchased/generated service audio, outside recording, credentials or new spending. Provenance and source hashes are in public/assets/audio/p03b2/provenance.json. **Aural character remains HOLD: no human or auditory-capable tool audition occurred.**

The archive includes the current car Blender source and reused maps because driver authoring inspects their anchors. Historical fit-comparison inputs required by the artist's comparative validation script remain in the full checkout; the normal driver build inputs are included. Downloaded Blender/tools are excluded.

## Start the review with the evidence

All media below are under director-kit/production/evidence/Review05-final/:

- **first-drive-game-audio.mp4**: 35 seconds, 1280×720, 24 fps, 840 frames. Continuous ordinary input/presentation path; actual peak 51.5066 mph, actual 1→2 shift at 6.85 s. It includes lift/coast, small faster steering corrections, lower-speed steering, braking to rest, camera changes, three 200 ms held glances, pause 24–25 s, mute approximately 25.967–26.967 s and the declared ordinary held-input reset at 29 s. Initial default practice placement z88 and 2 s stationary settling occur before timeline 0. There is no hidden successful-run montage.
- **audio-focus.wav**: 20 seconds, 48 kHz stereo, first 20 s actual telemetry with a separately declared review-only mute 18–19 s; idle/load/lift and real shift transitions.
- Six runtime PNGs: occupied rear three-quarter, side fit, cockpit, steering extreme, quick rearward and faster speed/gear. The first four use diagnostic inspection views outside the main film. The quick-rearward PNG is 91.7 ms after hold begins; the faster frame shows second gear. These are exported runtime views, not Blender renders.
- capture.json, timeline.json and build-inputs.json: source/served hashes, each raster frame's logical time/hash/index, all 4,200 states at 120 Hz input/presentation states and events. RESULTS.json and media-check.json summarize checks. The separate final review records supplemental framing/fit limits.

The 35-second film took 561.142 seconds wall time on isolated software rendering. 120 Hz controlled normalFrame updates use the ordinary input resolver, retained 60 Hz physics and ordinary interpolated pose/driver/camera path. Raster frames are saved at 24 fps. Near/far smoothing remains active; camera selection and held glance are intentional cuts. No direct chassis motion, invented speed/gear or snapped-follow capture shortcut is used.

Sound was rendered by OfflineAudioContext using the **same runtime graph factory, mapper and source buffers**, scheduled from every logical timeline update, then muxed without time stretching. This is **offline runtime-graph evidence**, not live hardware audio. Both video and sound are 35.000 seconds and fully decode. Source/mix finite and clipping checks pass; PCM sample peak −15.5715 dBFS and distinct oversampled true peak −15.6 dBTP. Declared pause/mute windows have zero measured RMS. Numerical loop-edge checks are recorded; these do not establish pleasing timbre or absence of perceptual artifacts.

## Verification and limits

Full suite 51/51; focused existing input/RPM 16/16 (11 input, 5 RPM); TypeScript/Vite build pass. The existing bundle-size warning remains. Quick-glance tests cover 100/200/500 ms holds at 30/60/120/144 Hz, all three modes and cycling while held. Driver math tests cover alternating regrips at the same rates. Main-film supporting hand-anchor error is below 0.000001 m; its moderate steering does not itself exercise a regrip.

Review05-browser-final/audio-browser.json proves real browser gesture activation and nonzero analyser output under ordinary autoplay policy, mute/pause/blur fade, suspension/resume, and missing-bank silent fallback. Physical output was muted during automation. One earlier fixed 350 ms blur snapshot failed: audio had already faded while the input snapshot awaited a rendered update. The final harness waits for the committed state and settled analyser response while retaining the assertions; the earlier attempt remains locally preserved.

The integrator performed implementation, tests and media validation. A separate reviewer evaluated driver fitting/material candidates and final runtime evidence; the concise verdict is P03B2/review-final.md. Exact hashes certify bytes, not Astra approval. Fresh independent 1280×720 and1680×720 contexts verified actual16:9/21:9 projection, cockpit road/hands and rearward visibility. These supersede a premature viewport-resize snapshot in original capture.framing. A separate300-state large-steering diagnostic contains98 releasing-hand states, zero simultaneous releases and maximum supporting rim-anchor gap0.000000142m. Its JSON is included; supporting local JPGs are intentionally outside the six-PNG selection. Remaining visual/contact limitations are listed in the final review. The close-barrier setup keeps the existing obstacle below the follow sightline; it checks clearance, not an activated clamp. Callback unit tests cover the clamp response. Original capture.events mute labels26/27 are raster labels; full timeline.life transitions at25.9667/26.9667s and is the authoritative audio schedule (33.3ms earlier, less than one encoded frame).

**G3 remains pending.** Whole-car visual fidelity, authentic engine sound, physical gamepad behavior, real speaker output, hardware FPS/GPU memory and subjective driving enjoyment are unverified. Driver materials/hand posing are a bounded game approximation. No campaign or next packet is authorized. Stop for Astra after this archive.

To repeat checks in the full checkout, use npm test and the fresh-directory capture/browser commands in README.md. Existing evidence must not be overwritten. The packaged state.json is the current ledger excerpt; the full historical ledger and evidence remain untouched in the repository.
