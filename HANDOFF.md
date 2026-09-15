# Current owner refinement - roll hoops and updated Review17

The four invented rear diagonal braces have been removed. Outer/inner hoop shapes, black finish, wing mounts and the prior front correction remain. Current shared vehicle: `public/assets/hoop-refinement/slingshot-hoops-refined.glb`; editable source: `assets/blender/hoop-refinement/slingshot-hoops-refined.blend`. Branch remains `feature/p09a-own-the-build`. Pushed runtime: `55ea67553562c859968b15d14339a8de35c6db0d`; later packet/receipt commits preserve that runtime. See `handoff/HOOP-REFINEMENT.json` for required assets and verification.

218 tests and the isolated four-finish/five-preview/reload/departure/drive-return check pass. Only one runtime material batch changes; 74 other batches, all binding nodes and all materials retain the previous data. No simulation, collision or save changes. Global art/physical-device/release and historical performance HOLD remain.

The updated root `Astra-Review-17-Lean.zip` includes both visual corrections, current source, references, verification, and the original P09A gameplay film with game audio (clearly labeled as predating the visual refinements). `MANIFEST.json` inside the ZIP identifies the pushed commit and runtime. The prior ZIP is preserved as `Astra-Review-17-P09A-original.zip`.

Launch: `npm ci`, `npm run demo:build`, then set `$env:PORT='5197'` and run `npm run demo:preview`. Refresh http://127.0.0.1:5197/. Rebuild the hoop asset using background Blender 4.5.2: `./scripts/blender.ps1 -Script scripts/build-hoop-refinement.py`. It consumes the retained front-refinement Blend/GLB and exporter scripts. `npm test` validates preserved runtime data. With Vite at 5201 and a fresh `EVIDENCE_DIR`, run `node scripts/validate-hoop-refinement.mjs` or `node scripts/capture-hoop-refinement.mjs`. Build the updated review archive after push with `python scripts/package-review17-refinements.py` (Python plus Pillow).

Next: Astra/owner reviews the updated packet. No merge to main or publication.

---

# Historical front-only refinement

# Current owner refinement — front fascia

Branch: `feature/p09a-own-the-build`; same private remote. Pushed implementation/runtime SHA: `0b926d99fb96924099fff9640384fc973e5e931d`; subsequent receipt-only commits preserve that runtime. The owner's front correction fills the fascia gaps and splitter, replaces upper individual bulbs with continuous diffusers, preserves the lower continuous lenses and center lamp, and adds an open honeycomb grille.

Current runtime: `public/assets/front-refinement/slingshot-front-refined.glb`. Editable source: `assets/blender/front-refinement/slingshot-front-refined.blend`. Read `handoff/FRONT-REFINEMENT.json` for hashes and proof. Showroom, driving and rivals share this asset. Review17 ZIP/film and prior assets remain unchanged; they predate this correction.

217 tests pass. Isolated validation covers all four finishes, five free previews, reload, departure, keyboard driving/return and prepared-demo smoke. Seventy unaffected runtime batches retain their original bytes. Inspection draw calls remain 171; rendered triangles rise from 467198 to 477054. These counts are not FPS certification. Historical performance HOLD and G3/G4/fidelity/release limits remain.

Launch with `npm ci`, `npm run demo:build`, then `npm run demo:preview` with `PORT=5197`. Refresh http://127.0.0.1:5197/. Browser saves remain local. To rebuild the editable/runtime front, run `./scripts/blender.ps1 -Script scripts/build-front-refinement.py` with Blender 4.5.2 in background. The exporter preserves non-target runtime data from the retained P08B GLB.

Verify with `npm test`. For isolated UI validation, start `npm run dev -- --host 127.0.0.1 --port 5201`, set `BASE_URL` and a fresh `EVIDENCE_DIR`, then run `node scripts/validate-front-refinement.mjs`. The same environment variables work with `scripts/capture-front-refinement.mjs` for the dev-only inspection page. Next action: owner reviews the corrected front; no merge or publication.

---

# Historical P09A - Own the Build

Current branch: `feature/p09a-own-the-build`. Private remote: `https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git`. Baseline: P08B `51f34a341200cf76bf69106bdfae300590419e88`. No merge or publication authorized.

Runtime: `049c1cdd154f4ca83d087f99e0dad76040c049f7`. Implemented Sport v2 braking, responsive route preparation, Chapter 02 earned exhaust/wing/bags, five free showroom previews and explicit crash recovery. Full pinned tests: 215 pass / 0 fail. Build, static build, complete career loop and preparation/lifecycle checks pass. **Performance HOLD:** all 16 native races finished validly with all 64 finishers, but three exceeded the maximum-frame target (worst 200 ms). Full failures are retained; cause unresolved.

`handoff/P09A-VALIDATION.json` records the runtime/tested-remote identity and remaining gaps. Review17 `MANIFEST.json` records the exact pushed packaging SHA.

Verified pushed integration and fresh-clone test commit: `7a5d7d492bd9b7c5d51eda08815233a7b733486a`. The later receipt/packaging commit preserves the same runtime source and asset trees. Fresh remote install, all 215 tests, both builds, 183 asset checks, full career loop, prepared-demo smoke and preparation/cancel/retry loop pass. The 398 current evidence/capture originals at that integration commit were compared byte for byte. See `director-kit/production/evidence/P09A/remote-clone/verification.json`.

Deliverables: root `Astra-Review-17-Lean.zip`; film `director-kit/production/evidence/P09A/film-02/P09A-Own-the-Build.mp4` (2:55, actual game audio). The ZIP is a review packet; clone Git for the full playable/editable project.

## Launch

```powershell
npm ci
npm test
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open `http://127.0.0.1:5197/`. Continue Career opens Own the Build; new careers first complete Build Matters. Free showroom/test drives remain separate from career ownership. Prepared historical demo: `/?scene=crew&play=demo`. Existing browser saves do not transfer through Git.

Read `handoff/P09A-DRIVING.md`, `handoff/P09A-CAREER.md`, and director-kit/director-addenda/review-16/CODEX_NEXT.md. Full current runtime assets are in `demo-assets.json`; `handoff/P09A-ASSETS.json` hashes every required runtime/editable dependency, including contact-layout JSON and the isolated earned fixture. Run `python handoff/verify-p09a.py`. No art/runtime asset was replaced in P09A. The previous handoff is preserved in `handoff/P08B-HANDOFF-PRESERVED.md`.

## Limits

Sport v2 is a documented game tune, not manufacturer physics. Deliberate extreme curb collisions can still overturn the car; recovery is explicit, never an invisible steering assist. Free test drives respawn on the road; scored events restart with a fresh attempt and no abandoned-attempt payment. Chapter 01 and prepared demo retain their historical Sport v1 setup; fresh preview and Chapter 02 use Sport v2. Historical saved preview recipes retain their version; select Sport v2 under Build Presets to compare.

G3/G4, final OEM/art fidelity, hardware controllers, human fun/listening and release approval remain held. Hosting is separate and not a development blocker. Final next action: Astra reviews Review17; do not merge or publish before director approval.

## Portable recovery

Clone the private remote with `git clone --branch feature/p09a-own-the-build https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git`, then check out the exact packaging SHA from the Review17 manifest. `handoff/P09A-COMMANDS.md` contains tool versions, isolated validation/film commands and a next-machine resume prompt. Source, editable Blender inputs, runtime maps/models/audio, current raw verification and original film captures are in private Git. No live audio-service key is required.

Ignored root director/review ZIPs, historical demo-dist outputs, local tools/dependencies, and prior isolated validation checkouts remain on the authoring machine; they were preserved. Personal browser saves are not in Git. The local 5197 origin is retained for in-place migration; 5202 was the isolated final runtime test server. Other machines start with their own browser saves.

A repaired finish-before-rivals pause/resume edge has source review and synthetic real-browser UI/controller proof. Two physical input-only attempts did not achieve first place, so targeted natural full-runtime proof of that edge remains unverified. Do not label those attempts passing.
