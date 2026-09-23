# Continue on another machine

The owner authorized committing the remaining work and pushing main for transfer on September 22, 2026. This supersedes the earlier local-only/push restrictions for this transfer. No separate deployment was requested. Continue on main with one lead; retain the existing performance HOLD and do not start Phase 3 automatically.

All four completed worktrees are merged: rider, premium racing UI, race cinematics and audio. Their merge history, source assets and validation evidence are on main. The subsequent rider-hand repair is implementation commit `edd042111d441610abf05847884cb1922ad3add3`. See [WORKTREE-INTEGRATION.md](WORKTREE-INTEGRATION.md), [RIDER-HANDS.md](RIDER-HANDS.md) and their validation receipts. These describe completed work, not tasks to repeat. The original worktree folders are unnecessary on the next machine.

## Get the current checkout

For an existing checkout with no local changes:

```powershell
git switch main
git pull --ff-only origin main
git rev-parse HEAD
```

Or clone the existing repository:

```powershell
git clone https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git
cd slingmods-three-wheel-tour-rebuild
```

Do not reset or discard work in an existing checkout. The repository includes historical evidence and assets, so a full clone is sizeable. No Git LFS, submodule or worktree junction is required.

## Install and run

The transfer machine used Node **24.15.0** and npm **11.12.1**. Install Node 24, then run from the repository root:

```powershell
npm ci
npx playwright install chromium
npm test
npm run demo:build
$env:PORT='5252'
npm run demo:preview
```

Open <http://127.0.0.1:5252/>. Use an available port if needed. The server prints its PID and stop command. On macOS/Linux, use `PORT=5252 npm run demo:preview` instead of the PowerShell environment assignment. Playwright Chromium is needed for tests, not for building or playing in your own browser. Linux may also need Playwright's documented OS dependencies.

For development use `npm run dev -- --host 127.0.0.1 --port 5253`. Build output and the preview pointer are recreated locally; they are intentionally not committed. Building and playing use the committed assets and require no asset-generation credentials.

## Editable inputs and tools

- Vehicle sources and editable masters: `assets/source/`, `assets/blender/`, and `assets/ryker/`. The current Ryker can be rebuilt from the committed `Ryker-Game-Master.blend`, semantic part map and scripts, without the vendor purchase ZIP.
- Rider: `assets/blender/drivers/tour-rider.blend`, `scripts/build-tour-rider.py`, and the shipped GLB/manifest under `public/assets/drivers/tour-rider/`. Preserve the historical rider source as well.
- Audio: `assets/audio-redesign/sources/` contains all 29 original generated responses; mastering scripts and runtime banks are committed. See [AUDIO-REDESIGN.md](AUDIO-REDESIGN.md). No provider key is needed to remaster existing sources. Do not rerun the metered generator to restore this checkout.
- Authoring requires a separately installed Blender (4.5.2 was used for the latest rider and complete Ryker work). Supply its executable path in place of historical `.tools/.../blender.exe` examples. Audio authoring additionally needs Python, numpy/scipy and ffmpeg on PATH. These tools are not needed for ordinary game builds.
- Historical Ryker browser checks now default their output to `.tools/ryker-work`; `RYKER_WORK` can override it. Use the current acceptance scripts in [RYKER-COMPLETE.md](RYKER-COMPLETE.md) for the completed vehicle.

Installed tools, `node_modules`, caches, incremental `.blend1` backups and generated build folders remain local. Browser saves/career progress also remain in that browser and origin; Git does not transfer them. The original `canam-ryker-900.zip` purchase download remains a separate local vendor archive (391,115,953 bytes); keep it separately if you need the untouched vendor formats or purchase provenance. Current editable game masters and runtime assets are tracked.

The old owner kickoff note is preserved byte-for-byte at [history/P06C-HOME-KICKOFF.md](history/P06C-HOME-KICKOFF.md). It is historical provenance, **not a current assignment**. Its original root copy remains untouched and untracked on the originating machine.

## Current verification and next work

[TRANSFER-VALIDATION.json](TRANSFER-VALIDATION.json) records the asset/commit audit for this transfer. The hand repair's complete 431-test run and packaged browser/geometry checks are retained under `handoff/rider-hands/`. The tested clean package inventories 614 inputs; the transfer audit compares each input's SHA-256 and checks that every input is tracked. Documentation and portable test-output paths do not change those runtime inputs.

Continue from owner feedback. The sustained High/Ultra performance gate remains HOLD and needs a quiet destination-PC run; the earlier visual/gameplay checks do not release that gate. Preserve Slingshot Sport v5, independent Ryker physics, career saves, approved products and historical evidence.
