# P10A — Ridge Run portable handoff

## Play and continue on main

Repository: https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git
Existing site: https://slingmods-three-wheel-tour-rebuild.vercel.app/

The repository currently reports public. Do not change its visibility. The owner authorized work, completed review archives and the recoverable project on main. Preserve the unrelated owner folder `SlingMods-Astra-Director-Review-17/` and all historical model/evidence/ZIP files. Never reset or force-push to reproduce a historical hash.

From a new directory, PowerShell:

```powershell
git clone --branch main https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git
cd slingmods-three-wheel-tour-rebuild
git status --short
git rev-parse HEAD
npm ci
python scripts/verify-p10a-assets.py
npm test
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open http://127.0.0.1:5197/ . The static server prints its owned PID and an exact stop command. If the chosen port is occupied, inspect that process or choose an unused port; do not kill an unrelated server. `npm run dev -- --host 127.0.0.1 --port 5197 --strictPort` is the source-editing alternative. Play requires Node/npm and a WebGL2 browser; Python and Blender are only needed for verification/asset authoring.

## What is playable

Use **Quick Race / Destinations → Smoky Ridge**, select **Late afternoon** or **Blue hour**, then **Test Drive** or **Quick Race**. Every existing part remains freely previewable before career unlock. A showroom test drive keeps the existing bay departure and explicitly travels to Ridge; it is not claiming the mountain sits outside the showroom door. Return to the build retains the exact recipe.

Complete the existing Coastline Cup to unlock Chapter 03. **Find the Ridge** is a one-lap afternoon solo event (400 first /75 repeat credits); **Nico Ridge Duel** is a one-lap afternoon duel (600/125); **Summit Invitational** is a two-lap blue-hour four-car race (900/175). Valid completion advances the chapter; winning records its own achievement. Rewards commit once after the field settles. Abandoning earns nothing. These are fictional game credits, not product prices or purchases.

Use the current pause/recovery controls when stranded. In a scored race, recovery restarts the attempt; it does not teleport forward for a reward. Severe prolonged guardrail wedging may still retire an AI after its bounded recovery attempts. The ordinary brush recovery proof has a precisely defined contact-and-release input sequence.

## Identity and evidence

The frozen gameplay implementation is `28daf3a4dfb702e2b4829ffda683cffeb117c858`. Final native tests, host, fresh-clone and packaging identities are recorded separately in `handoff/P10A-VALIDATION.json`, `P10A-PACKET.json` and `P10A-DELIVERY.json` when complete. Resolve the actual latest main with `git ls-remote origin refs/heads/main`; the archive commit is `git log -1 --format=%H -- Astra-Review-20-Lean.zip`. Later receipt-only commits do not imply a new gameplay test or recursive archive hash.

Full raw/final/failure evidence belongs in `director-kit/production/evidence/P10A/`. `DELIVERY-INVENTORY.json` lists exact files/bytes/hashes and packet selection. Review20 uses standard lossless XZ/TAR for selected final timing and motion data; exact duplicates may use TAR hardlinks. `python scripts/verify-p10a-packet.py` verifies every archive member. The lean ZIP is not a self-contained game distribution.

## Reproduce relevant checks

Each evidence command needs a NEW output directory. Do not overwrite final or historical evidence.

```powershell
$env:EVIDENCE_DIR='director-kit/production/evidence/P10A/geometry-new'
npx tsx scripts/p10a-route-metrics.ts
$env:EVIDENCE_DIR='director-kit/production/evidence/P10A/flat-new'
npx tsx scripts/p10a-flat-equivalence.ts
$env:EVIDENCE_DIR='director-kit/production/evidence/P10A/road-new'
npx tsx scripts/p10a-road-proof.ts
$env:EVIDENCE_DIR='director-kit/production/evidence/P10A/grade-new'
npx tsx scripts/p10a-grade-maneuvers.ts
$env:BASE_URL='http://127.0.0.1:5197'
$env:EVIDENCE_DIR='director-kit/production/evidence/P10A/career-new'
node scripts/p10a-career-loop.mjs
./scripts/run-p10a-native.ps1 -BaseUrl 'http://127.0.0.1:5197' -Suffix 'new'
```

Native measurement must run alone: no Blender, capture, tracing, encoding, archive compression or other benchmark browser. The suite includes two consecutive races per stock/equipped/resolution/lighting case, cockpit and old-route repeats. All original rows and failed runs remain part of evidence; thresholds are not relaxed.

For a new film, set a fresh EVIDENCE_DIR and BASE_URL, run `node scripts/record-p10a.mjs`, then `python scripts/assemble-p10a-film.py <that-directory> --runtime=<verified-source-SHA>`. Put FFmpeg/ffprobe on PATH and set FILM_FONT if no listed system font exists. This captures actual game audio; no separately generated replacement track. Original media and sync/drift reports remain in Git.

## Assets and tools

`P10A-REQUIRED-ASSETS.json` verifies the preserved Review19 assets plus new runtime/editable inputs and texture dependencies. `P10A-RIDGE-ASSETS.json` is the focused road/forest/scenery source closure. `assets/blender/ridge/README.md` explains authoritative mesh/elevation coordinates, licences, background Blender exports and exact regeneration commands. `src/ridge/route.ts` is the layout authority; the editable inspection GLB is not a second runtime road.

Pinned runtime dependencies are in package-lock.json. Validated host tools: Node 24.15.0, Python 3.13.5, Blender 4.5.2, NumPy2.2.6/SciPy1.17.1, Chromium 153.0.8010.12 and the installed FFmpeg/ffprobe. The fresh remote checkout reuses host executables, browser installation, driver and npm download caches, with a new node_modules installation and no copied project assets. Browser save storage, personal settings, tools, credentials and caches do not transfer through Git. Same-host recovery does not certify a second physical machine.

## Curated existing deployment

`npm run deploy:build` builds and stages the explicit demo-assets allowlist into vercel-dist. Do not publish the entire development tree. No new project, account, paid assets or unrelated-site changes are authorized. Vercel's existing build can modify its checkout vercel.json; the truthful `-working` build label is retained when that happens. Verify commit and per-input provenance rather than disguising a dirty checkout. Root loading, actual Ridge race/retry/return, product link and excluded-file404s must be checked after deployment; READY is not gameplay proof.

## Next action and limits

After final receipts confirm completion, send Astra-Review-20-Lean.zip to Astra for director review and gather owner driving feedback. Do not invent another development assignment. Forest/rocks/distant ridges remain stylized, foliage LOD does not crossfade, and distant visual terrain outside the 60m banks has no support collision. Physical-controller/other-hardware testing, subjective fun/listening approval, G3/G4 and global OEM fidelity remain open.
