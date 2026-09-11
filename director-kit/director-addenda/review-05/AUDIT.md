# Astra review 05 — First Drive accepted for development; one audio correction

**Date:** 11 September 2026. **Input:** `Astra-Review-05.zip`.
**Captured runtime:** `f55d83971d278fb31b9d5c502065efcb5373ec3c`.
**Packaging checkpoint:** `2fd926c38c7bf3b959d0fe3726e522ade1f8d483`.
**Project:** `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.

## Director decision

Retain the driver, cockpit mode, quick held rearward glance, audio infrastructure, and higher-speed demonstration. This is a useful First Drive foundation. It is not final character art, authenticated Slingshot sound, validated racing at all speeds, or a complete game.

One reproducible audio mapping defect requires a bounded correction. It does not justify replacing the audio graph or physics, and it should not hold the new course work hostage.

Proceed to **P04A — Harbor Shakedown**: one closed harbor course, one time-trial event, day/night presets, a readable racing HUD, valid finish/best-time handling and immediate retry. This is explicit permission to develop the environment and race primitives while whole-car/aural fidelity remain held. **G3 and G4 remain pending.** This packet does not waive their final criteria or authorize the original full P04 implementation.

## What I independently verified

### Archive and preservation

I extracted the mounted archive after file search returned no parsed content. I verified all **195 manifest-listed entries** and all **63 captured build inputs** against their actual bytes. No mismatches. The archive has 196 entries including its own manifest.

I compared **29 selected protected files present in both Review04 and Review05**, including all supplied simulation/input files, the accepted car source/export, retained P03A1 texture maps, contact layout, test pad, practice export, inspection bay and shadow policy. No changes were found in those compared files. This is a scoped comparison, not certification of files absent from these archives or of the owner's whole computer.

See `evidence/independent-inspection.json` for hashes, paths and counts.

### Tests

I ran the supplied **11 input tests and five signed-wheel-speed/RPM tests** directly under Node 22.16 using native TypeScript transformation and a review-only extension resolver. **16/16 passed.** The resolver only resolves extensionless local imports; it does not replace application logic or dependencies.

I also wrote and executed three audio-pitch checks against the actual submitted mapper. Coverage and lifecycle checks pass; the engine-layer coherence regression fails, as described below. A separate diagnostic mapper copy using the exact positive RPM/reference ratio passes all three. This demonstrates the local cause and a candidate correction; it is **not** an integrated game fix or a listening approval.

The archive's frozen log reports **51/51 full-suite tests** and a successful TypeScript/Vite build. Those are local-agent reported results, not my independent full-suite rerun. This container could not resolve the npm registry (`EAI_AGAIN`). An attempted isolated browser probe was blocked before navigation by local Chromium policy (`ERR_BLOCKED_BY_ADMINISTRATOR`); it produced no browser-audio result. I did not bypass that restriction or substitute incompatible dependency versions.

### Driver and camera

The exported driver has **28,411 triangles, four primitives/materials, three embedded images and one skin**. The retained car has **211,431 triangles, 59 primitives, 20 materials and 16 images**. These are GLB measurements, not GPU-frame-time or memory measurements.

I opened all six supplied runtime stills and inspected 2 Hz samples throughout the decoded movie, plus the quick-glance still. The driver is visibly seated and connected to the controls; the cockpit shows the arms, dash and road; rearward glance cuts to the road behind rather than orbiting around the vehicle. This meets the provisional First Drive presentation need. The character still reads as a simplified mannequin and the vehicle remains visually unfinished; neither becomes final art because a contact test passes.

The main timeline contains no regrip state and reaches only about 0.49 radians of displayed wheel rotation. The package reports a separate 300-state/98-releasing-state regrip diagnostic; I inspected the supplied report/source, not those unbundled diagnostic JPGs or an independently rerun regrip. The tiny measured supporting bone-anchor gap is not a measurement of detailed glove/finger contact or physical grasping realism.

The cockpit's level-chassis forward vector in `src/presentation/driving-camera.ts:12` is `(0,-0.43,-1)`, about 23.3 degrees downward before vehicle attitude is applied. In the reviewed still the hood/dash occupy much of the view. This is a **design concern to tune on the actual new corners**, not a mandate to move the driver's head or remodel the car. Preserve the fitted eye anchor and test useful apex visibility; keep the new quick-glance behavior.

### Motion and evidence meaning

I fully decoded both movie streams and inspected the 4,200-entry timeline. The film is **35.000 seconds, 1280×720, 24 fps, 840 frames**, with 48 kHz stereo audio. The supplied telemetry peaks at **51.506636 mph**, changes 1→2 at **6.85 seconds**, and returns to first at 10.583333 seconds. Three rearward holds last 200 ms; the deliberate reset is at 29 seconds.

These are independent measurements of **supplied capture data**, not a fresh physical simulation run. The source capture calls the ordinary input/session/interpolation/driver/camera route with a virtual controller and controlled clock. Its stated 561.142 seconds of wall time to capture 35 seconds is not hardware FPS. The x range is only approximately −0.843 to +0.385 metres: the successful higher-speed straight proves more than parking-lot speed, but it does not prove sustained cornering, a lap, race results, or subjective control feel. The next course addresses that gap.

### Sound: functioning infrastructure, not aural approval

The code uses a shared telemetry mapper and graph factory for runtime and offline rendering. It contains no separate pretend gearbox. Actual shifts feed event handling; contact/slip/surface affect road noise; mute, volume, activation and pause controls are implemented. The bundled ordinary-browser lifecycle report supports activation and failure/recovery behavior, but I did not independently rerun that browser report.

Numeric inspection of the decoded movie found finite samples, sample peak around **−15.60 dBFS**, and silence/negligible codec residual in the selected pause/mute windows. The original 20-second PCM focus file peaks around **−15.57 dBFS**. These are sample-peak/RMS checks, **not my true-peak certification or an auditory audition**. I did not hear or approve the engine's sound quality.

The audio source is explicitly original local synthesis, not an OEM/real Slingshot recording. Keeping its character on hold is correct.

## Reproducible defect: engine layers disagree on RPM

`src/audio/mapper.ts:8–9` blends engine beds centered on 1,200/3,600/6,200 RPM with broad logarithmic weights, while independently clamping every bed's playback ratio to 0.65–1.65. The weight window still contributes audio when the ratio has been clamped away from the intended engine speed.

At a single telemetry RPM of **2,400** and full throttle, executing the supplied mapper yields:

| Bed | Gain | Playback ratio | Reference RPM × ratio |
|---|---:|---:|---:|
| 1,200 load | 0.186426 | 1.65 | 1,980 |
| 3,600 load | 0.325061 | 0.666667 | 2,400 |
| 6,200 load | 0.063091 | 0.65 | 4,030 |

All three layers contribute, but their commanded pitch corresponds to three different engine speeds. `AudioBufferSourceNode.playbackRate` resamples its source (official MDN documentation, recorded in `SOURCES.md`); the runtime graph applies these rates directly with smoothing. It is therefore a pitch-coherence error, **not just an objection to the synthetic timbre**. Likely perceptual roughness/detuning is an inference, not a claim that I listened.

Use the same sanitized engine RPM for every contributing layer's reference ratio. The smallest diagnosed change is to remove the incompatible 0.65–1.65 clamp for these positive, finite ratios. An alternative limited-band solution must fade unsupported layers out and provide continuous correctly tuned coverage, not leave a silent RPM gap. Retain source-bank provenance, shift deduplication, mix/lifecycle controls and the shared offline graph. See `AUDIO_FIX.md` and the included executable regression.

## Next production decision

The car is now sufficiently integrated to evaluate it in an event. More static asset demonstrations alone will not answer whether it is enjoyable to race. Build one course and one time trial, not the whole campaign or a fleet.

The next environment is a fictional closed Biscayne harbor venue, not a geospatial replica. Raceable geometry is proved before decorative scene expansion. Day and night use the same dry layout and physics. A small, properly lit and textured harbor kit is reused around that layout; no giant city, no new hero vehicle, no broad character overhaul.

The original pad, bay and accepted dynamics remain usable. Minimal seams for world geometry/surface sampling and spawn/reset selection are explicitly allowed, because the current simulation and DrivingSession hard-code the pad. Extract only those seams; keep their default behavior and regression traces.

The local director carries routine decisions. The owner should receive a completed review bundle or a specific evidenced blocker, not a new request to choose an art direction or run QA.
