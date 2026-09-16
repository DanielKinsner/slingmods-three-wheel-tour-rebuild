# P09B portable implementation handoff

## Scope and preserved identity
Current branch `main`, private origin DanielKinsner/slingmods-three-wheel-tour-rebuild. The owner's later direct instruction authorized merging and continuing on main, superseding the packet's feature-only restriction. Merge pushed at ea58b4f9c1df98ab16629bce24721596b6a43e32. No publication. Starts at b967d6f887593d3c84181aa4f88d2a42ce79221d. Current immutable vehicle remains public/assets/hoop-refinement/slingshot-hoops-refined.glb, editable assets/blender/hoop-refinement/slingshot-hoops-refined.blend. Front fascia, honeycomb, diffuser lights, hoop geometry, showroom textures/door, all five products and Sport-v2 physics remain intact. No simulation coefficients, routes, collision or career reward rules changed.

## Rebuild / play
```powershell
git clone --branch main https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git
cd slingmods-three-wheel-tour-rebuild
npm ci
npm test
python scripts/verify-p09b-assets.py
npm run build
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```
Open http://127.0.0.1:5197/. Ctrl+C stops the foreground server. Standard Node24/npm11 used here; pinned package-lock is authoritative. Runtime is offline-capable on a local static server after dependencies/build; no ElevenLabs/account/API access. The default prepared demo remains separate from real career. Sound needs the initial Enable sound gesture. Subsequent same-tab scene transitions retain enabled intent and attempt browser-permitted resume; blocked browsers keep Enable sound. Cross-document asset loading can leave a short silent gap; no fabricated continuity.

## Audio / display editable sources
`python scripts/author-p09b-audio.py` authors baked WAVs/manifests from the original `director-kit/director-addenda/review-17/owner-audio/thermal sport sound.wav` and deterministic local synthesis. Python3 plus NumPy/SciPy required for this optional regeneration, not game playback. Follow AUDIO-REVIEW.md for exact dependency/tool commands and source envelope decisions. No generation calls were made: no available secure key or verified prepaid cap. No external upload of the owner's sample.

`src/presentation/powered-display.ts` is the original editable512x336 canvas layout and mount. Current exported P03A cockpit lens is centered at(0,.665,-.178), size(.216,.147,.008), frontz=-.174. Bounded plane(.202,.133) atz=-.1735 fits its inner flat face; surrounding mesh/materials unchanged. Initial guess used older clay coordinates and was rejected by screenshot inspection, then corrected against current GLB vertices. Reference-only Polaris guide https://publications.polaris.com/owner/owners-manuals/0000724956.xml?onepage=true and vehicle-statistics illustration0000727238.png; no OEM/manual image shipped. Original dark Driver-home approximation, not firmware reproduction. Thumbnail renders only on build changes; numeric uploads at most10Hz changed values when near/front-facing/in-view, player only. Speed/RPM/gear are actual telemetry, unsimulated fields unavailable. Showroom ignition is presentation-only and independent of sound/underglow/driver.

## Validation commands
With static candidate on5202, set `BASE_URL=http://127.0.0.1:5202` and a fresh `EVIDENCE_DIR` for each:
- `node scripts/p09b-integration.mjs` — screen fit/state, transactional exhaust cue, real cinematic pause/resume/skip, actual driving telemetry/reverse/reset (controlled clock).
- `node scripts/p09b-ui-validation.mjs` — responsive ordinary UI/save-isolation checks.
- `node scripts/p09a-career-loop.mjs` — preserved full earned chapter/Cup/purchase/remove/reload.
- `node scripts/p09b-finish-wait-resume.mjs` — physically earned early-player finish with production input, pause field/resume/save (controlled clock, not native timings).
- `node scripts/p09a-demo-smoke.mjs` — ordinary prepared-demo preservation.
- `node scripts/profile-p09b.mjs` with WIDTH1280/1920, ROUTEharbor/express, BUILDstock/equipped, RACES2 — native full attempts/retries; thresholds unchanged,1e-6ms numerical tolerance.
- `P09B_TRACE=1` adds diagnostic trace; never counted as native matrix. `VIEW=cockpit` adds separate cockpit cost case.
- `node scripts/record-p09b.mjs` and `python scripts/assemble-p09b-film.py <capture-directory> --runtime=bf1297c9770357cf5a331288b14cae82d5510d86` — current wall-clock footage and real captured master mix with measured sync. See script env vars and final evidence receipt.

## Limits
Same-host Chromium/RTX4080 proof is not other hardware or a physical controller test. Virtual standard-gamepad events verify mappings; human listening and subjective engine/OEM fidelity remain open. Local synthesis and narrow owner texture are disclosed approximations, not measured multi-RPM exhaust recordings. No physical service or manufacturer performance claims. Native matrix, exact runtime, remote recovery, film and ZIP receipts are recorded separately after completion. Keep failures and historical evidence.
