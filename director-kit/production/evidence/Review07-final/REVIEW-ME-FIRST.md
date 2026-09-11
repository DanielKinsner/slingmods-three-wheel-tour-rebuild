# Astra Review07 â€” Rear Assembly Integrity / Waterfront Cleanup

**Implemented for review. G3 and G4 remain pending.** Local rear clearance/connectivity tests pass. Final independent visual signoff is held: the separate reviewer completed the initial source/lighting checks, then both specialist sessions stopped at their usage limit. The lead completed a separate final review phase. No additional spending or owner QA was requested.

## Root, version and launch

Project root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`

Captured build: **fd59df31f9f03f168b6a93e26d48c296526e1b53**, branch `main`. Baseline: `3f200c43bf33262d6bf6aaeccd8805e2f0bb83ba`. The implementation was committed at `c12dccb5ab1d68c030d41b8bef3699e1a3f6f6ac`; the later captured commit changes only the rear diagnostic capture fixture. The archive manifest reports its later packaging-only commit separately. Captured source hashes and served bundle/asset hashes are in `build-inputs.json`, `capture.json` and `../Review07-rear/rear-capture.json`. No push/deployment occurred.

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:5187/`. Choose Late afternoon or Harbor night in the existing bay, then Start Shakedown. Select Enable sound if wanted, then Start lap. Finish all15 checkpoints and the finish plane; Retry now starts another countdown. A ZIP extracted without `.git` builds with the cosmetic `review-package` label. Extract into an isolated review directory to preserve any active/newer checkout.

`?scene=bay`, `?scene=pad`, and Harbor all use `slingshot-p04a1.glb` with the same shared rear presenter. The earlier `asset=p03a2` URL now aliases the current repaired vehicle. Old files remain as history. Calibration remains `?scene=calibration`.

Keyboard: W/S or up/down throttle/brake; A/D or arrows steer; C near/far/cockpit; hold B quick rearward view; X direction request; hold R one second restart; Escape pause; Enter menu start/retry; Backspace menu return. Standard controller: RT/LT pedals, left stick steer, top face camera, LB rearward, right face direction/menu return, held bottom face reset, Menu pause. Release controls after interruptions. Mute/volume/camera and compatible best records persist.

## Rear finding and actual repair

Astra's two owner rear-view concerns are addressed directly. The old exported rear tire had200 surface vertices inside the closed rear firewall, with a64.34mm deepest conservative margin. Its center already matched the contact contract; the wheel was not the part to relocate. The arm/axle/shock also stayed fixed while the wheel moved up to26mm relative to them in the recorded lap.

The current Blender rear source replaces that solid wall and two lower returns with closed hollow behind-seat enclosures, a stepped right mechanical recess, forward central bulkhead and tire passage. The upper deck and accepted front/cockpit/paint remain. Access faces are static; usable luggage interiors and animated doors are deferred. The single-sided arm/belt region stays on vehicle-right (+X), based on the exact-year reference study; hardpoints and storage shapes remain author estimates.

A common rear presenter now connects the hub/axle and non-spinning caliper to wheel telemetry. The arm points from its fixed pivot to the hub; the upper shock stays fixed, the lower end follows the arm, opposite-end sleeves telescope and the spring changes length. The pulley spins under the existing wheel node; suspension groups do not spin. Geometry revision02 added the missing cross-pins and extended brackets into the retained deck after actual ray tests found6â€“8mm unsupported gaps in revision01.

The accepted vertical raycast wheel path remains authoritative. Visual-only arm/belt axial adjustment is **up to1.189mm (0.182%) on the recorded lap**, and **32.832mm (5.020%) at the supported extreme**. The minimum sleeve overlap across that range is21.985mm. These are game approximation measurements, not OEM dimensions.

Preservation is substantive:32 protected source/assets remain unchanged;687 retained evaluated Blender components preserve geometry/UV/transforms/materials within the same process. An export-only UV/index-order concern was corrected by separating the new pulley and retaining exact baseline buffers/material definitions for unaffected parts. All55 protected export comparisons pass;7148 old rear-shell triangles are deliberately removed from the body-polymer batch. The same original16 texture images remain. New rear geometry is Blender-authored. See `../P04A1/authoring-and-references.md` for the two-step reproducible export and primary references.

## Geometry, runtime and evidence limits

- Actual exported BVH tests:41 supported hub heights Ã— four quarter-turn spins, with no tire/fixed-body or moving-mechanism/new-shell intersections. All4852 distinct recorded-lap hub heights were also checked at four spins, with no reported intersections or mechanism vertices inside reserved storage boxes.
- Conservative continuous tire envelope: every actual fixed triangle lies outside the full swept tire box, including a10micrometre safety pad; minimum conservative separation is approximately6.85mm. This covers intermediate wheel travel/spin. The complete moving-link sweep remains sampled, not a continuous OEM articulation proof.
- Sampled tire-to-new-shell nearest distance is13.85mm over the full travel fixture and35mm over recorded-lap heights. The5mm aim is a project asset tolerance.
- Runtime captures verify wheel center/axle and link endpoints within1mm across324 poses and four spins, plus the ordinary lap logs. Actual exported pins and bracket/deck overlap are separately measured in `geometry02-connections.json`; attachment math alone was not treated as mesh proof.

`../Review07-rear/` contains matched daylight left/right side, directly behind, three-quarter, enclosed low view and the same low view with a labeled storage/attachment overlay. The normal body remains opaque. The **18second rear-motion clip is silent**: first rest, then explicitly injected supported travel/spin, then ordinary pad throttle and braking. During injected travel only, the chassis is raised0.27m so the diagnostic floor cannot conceal droop; this is not a physics pose or ground-contact claim. The separate **8second bay orbit is silent**. Earlier floor-clipped diagnostic footage is retained locally as a failed capture fixture, not selected evidence.

The full day film is one uninterrupted85second countdown-to-result attempt at1280Ã—720/24fps. The25second night excerpt is logical35â€“60seconds from a separately completed full85second lap. Both use120Hz ordinary input/presentation,60Hz physics, the same disclosed local control agent through player controls and no transform reset after the ordinary start. Full timelines record rear presentation, physics, gates, camera, driver and sound state. The local controller is not an implemented rival or player assist. Results/retry/settings details are in `RESULTS.json`.

Game audio is aligned from the same graph/bank/corrected RPM mapper via OfflineAudioContext and the recorded logical timeline, including the night's earlier graph history. It is not live speaker capture or human audition. Numerical decode/frame/duration/clipping checks are in `media-check.json`.

## Three waterfront changes

Curved midribs and tapered leaflets replace segmented crowns, with three variations; asphalt uses original isotropic detail at2m/tile with restrained variation; concrete/paint roughness and waterfront light balance/pool falloff are adjusted. No route, barrier, collider, tire surface or camera path changes. The full1230.867m circuit,11m road,3m runoff per side and prior land exclusion are preserved.18,480 land-corridor rays remain clear and1232 just-outside rays retain their height.

Four matching Review06 before PNGs are included under `comparison-before/`, with their original captured source/PNG hashes. Current waterfront/corner PNGs use the same logical moments. Road bands are reduced and night road cues remain readable. **Palm crowns still read thin at720p; repeated buildings, sparse infield, strong hood highlights and remaining light-pool contrast keep final environment polish held.** No extra city fill or foliage subsystem was added.

Harbor geometry118400â†’192448triangles,9â†’9primitives,9â†’10embeddedimages; GLB+3,837,644bytes. Current car:210899rendered triangles,72primitives,16images and20,520,076GLB bytes. Baseline data retained in the export adds unused buffer bytes; these are not additional rendered meshes. Measured actual draw/frame/load differences under the same720p fixture are in `../Review07-performance/`; counts and a frame cap are not spare-capacity proof.

## Tests, environment and holds

Local full suite **67/67**, existing director subset **26/26**, TypeScript/Vite build pass. The new tests cover complete supported linkage travel, chassis transforms, spinning isolation, return-to-rest and missing rig failures. Existing course/collision/seam, physics/input, audio pitch, save, directed-gate/countdown/reset/result/retry tests are retained. All six frozen browser regressions pass; results are in `../Review07-ui/`. All four movies pass decode, duration and frame-count checks; day/night encoded true peaks are -15.3/-16.0 dBTP. Short isolated 720p performance means are 16.860/16.666/16.666 ms (day/night/low night), with a 133.3 ms day stall. Combined scene calls rise 138 to 164 and rendered triangles 661,787 to 808,819; these include render passes. See `../Review07-performance/comparison.json`. The old recorded physics is compared against the new full ordinary traces before claiming mechanics preservation.

Windows11, Node24.15.0/npm11.6.2, Blender4.5.2 background, isolated Chromium153 via ANGLE Direct3D11/NVIDIA RTX4080 for captures/performance; the browser regression uses its recorded software-rendering configuration. Existing numpy/scipy support geometry analysis/export preservation. Pinned game dependencies are unchanged. No desktop/mouse takeover, paid downloads, new service, physical-controller test, human playtest or listening approval.

**Held:** separate final visual signoff after specialist quota exhaustion; OEM rear/body fidelity and overall polish; authentic audio timbre; physical-controller feel; broader and sustained hardware validation. No known old rest tire/firewall collision is left hidden, but this does not grant G3/G4. Product upgrades, campaign, rivals, additional vehicles/courses, rewards/commerce, weather and deployment remain deferred.

The ZIP includes current implementation/config/tests/scripts, needed public assets, editable Blender sources and the predecessor sources needed for local surgery, manifests and a labeled current ledger excerpt. The full ledger and earlier evidence remain in the same repository. Dependencies, tools/Blender downloads, `.git`, `dist`, caches/backups, `.env`/credentials and redundant local captures are excluded. Stop for Astra's Review07 decision.
