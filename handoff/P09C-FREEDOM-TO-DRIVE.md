# P09C — Freedom to Drive

Current source implementation: `5b2c99af2c567c04b5ea9d896765e7a6ddeec25e` on `main`. Completed validation, deployed identity and archive receipt are recorded separately in P09C-VALIDATION.json, P09C-PACKET.json and P09C-DELIVERY.json. These distinguish the frozen game, packaging, archive addition and later metadata commits.

## Continue on another machine

Clone `https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git`, enter that checkout and use its main branch. The repository currently reports public; do not change visibility. Do not use an old work-machine absolute directory as the new destination.

```powershell
git switch main
git pull --ff-only
npm ci
npm test
npm run build
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open http://127.0.0.1:5197/. The server prints its exact owned PID and stop command. Do not stop another server merely because it uses a familiar port; choose a free port instead. Node24 / npm11 were used. Pinned dependencies are in package-lock.json. For isolated browser evidence, install the Playwright Chromium version with `npx playwright install chromium`. Python3 plus FFmpeg/ffprobe are needed for evidence analysis/film assembly. Required Blender and game assets are enumerated by SHA256 in P09C-REQUIRED-ASSETS.json; 128 preserved Review18 inputs were verified. Background Blender4.5.2 is needed only if intentionally reauthoring those assets. No re-export is required to play. Optional trace plots use `python -m pip install -r scripts/p09c-evidence-requirements.txt` (matplotlib3.10.9). Historical-source comparison uses the retained52c234c commit; a shallow clone can fetch that commit explicitly before running scripts/p09c-historical.ts.

The canonical existing personal rebuild site is https://slingmods-three-wheel-tour-rebuild.vercel.app/. `npm run deploy:build` builds the existing curated demo, validates its publication stage and copies only that payload to stable `vercel-dist/`. vercel.json uses `npm ci`, this command and that output. Missing files remain404; ZIPs, source/evidence, editable Blender files and historical unused public assets are excluded. Main auto-deploys to this existing project. No other site/account/plan changes are authorized.

## What changed

Sport v3 permits a small, speed-dependent steering reserve beyond the old no-slip bicycle command ceiling. Reserve in radians is `0.025*v²/(v²+100)/(1+v²/500)` for speed v in m/s. It is limited by the existing mechanical/speed envelope and smoothed with a0.10s first-order response, subject to the existing steering-rate cap. Brake input no longer scales down the v3 steering request. Actual combined tire forces, normal loads, drivetrain, braking allocation and three-contact chassis policy remain v2. These are authored game parameters, not measured OEM/product claims.

New showroom recipes/presets, fresh/direct preview routes, prepared demo time trial/duel/crew and newly begun Chapter02 events use shared CURRENT_HANDLING_PROFILE. Explicit v1/v2 recipes stay historical. Build Presets → Use current driving creates an updated draft and preserves the original named recipe (or first saves an unsaved historical original). No credits or ownership are changed. Stock comparison removes products without changing tune or finish. Already-started events and Cups retain their frozen recipe through retry and later legs; new events after completion use current driving. Records and receipts retain their profile provenance.

Review18 UI, action sounds, dashboard, Thermal departure, showroom/closed bay, front/hoop refinements, finishes, swingarm palette and five products are retained. No new product, vehicle, destination, sound generation or spending.

## Evidence commands

Use a fresh EVIDENCE_DIR for each run; never replace reviewed evidence.

```powershell
$env:EVIDENCE_DIR='director-kit/production/evidence/P09C/motion-new-run'
npx tsx scripts/p09c-motion.ts
$env:EVIDENCE_DIR='director-kit/production/evidence/P09C/transitions-new-run'
npx tsx scripts/p09c-transitions.ts
$env:EVIDENCE_DIR='director-kit/production/evidence/P09C/maneuvers-new-run'
$env:PROFILES='slingmods-sport-v1,slingmods-sport-v2,slingmods-sport-v3'
npx tsx scripts/p09a-driving-maneuvers.ts
$env:BASE_URL='http://127.0.0.1:5197'
$env:EVIDENCE_DIR='director-kit/production/evidence/P09C/entry-new-run'
node scripts/p09c-profile-entry.mjs
pwsh -File scripts/run-p09c-native.ps1 -BaseUrl $env:BASE_URL -Suffix new-run
pwsh -File scripts/run-p09c-cockpit.ps1 -BaseUrl $env:BASE_URL -Suffix new-run
# Start a second dev server at 5201 for the source-import audio fixture.
# In another terminal: npm run dev -- --host 127.0.0.1 --port 5201
pwsh -File scripts/run-p09c-regressions.ps1 -BaseUrl $env:BASE_URL -Suffix new-run
$env:EVIDENCE_DIR='director-kit/production/evidence/P09C/historical-new-run'
npx tsx scripts/p09c-historical.ts
```

The matched pad uses the same control-only driver for both versions. After the initial reset it writes only pedals/steering; target circle placement never moves the car. Four seconds settle, then eight seconds are scored. All rows include real position, velocity, yaw, wheel angles, loads/slip/forces and demand. The diagnostic viewer under scripts is an evidence fixture, not part of the hosted game. Native race profiling uses real wall-clock RAF and valid race gates/rivals; audio graph enabled, host speakers muted. Do not record video, trace, compress archives or run another browser test concurrently with the native matrix. Virtual standard-gamepad/keyboard evidence does not certify a physical controller.

## Boundaries and next action

Existing browser saves live in their browser/origin and are not copied by Git. Synthetic earned test fixtures are evidence, not the owner's career. Dependencies, tools, generated build folders and caches rebuild from the pinned inputs. No credentials or personal browser profiles belong in Git.

Send the tracked Astra-Review-19-Lean.zip to Astra and await review; do not invent a further assignment. Verify the archive hash against P09C-PACKET.json after pulling on another machine. Subjective fun, human listening, physical-device/destination-hardware coverage, G3/G4 and final OEM fidelity remain separate open approvals.

The historical comparison requires a fresh output directory and never rewrites the committed test goldens. The native/regression collection scripts retain every case even if one fails; inspect each verification/summary and the final validation receipt. The full current Git working tree is approximately 4 GB because prior evidence remains recoverable; the Review19 ZIP is the smaller review transfer.

Completed: 250 tests; full profile/career/preparation/UI/audio regressions; 16 native race attempts plus two cockpit attempts; fresh remote clone with 128 asset hashes, entry matrix and native Express race. Hosted root and complete previews/test-drive/race/retry/return/product-link sequence pass. The provider reports only vercel.json as changed, so its buildRef retains -working; no tracked runtime inputs changed.

Next-machine resume prompt: Read HANDOFF.md, AGENTS.md, handoff/P09C-VALIDATION.json, P09C-PACKET.json and P09C-DELIVERY.json on main. Verify the tracked Review19 hash, install pinned dependencies, build and launch the curated game. Preserve historical tunes, frozen attempts, ownership and art; await the next owner/director instruction.
