# Continue on another machine or with another agent

Repository: https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild (private). Branch: `main`. Authenticate as an account with access before cloning. All implementation commits are already on main; no separate feature branch needs merging. The handoff preserves history and adds missing review evidence and historical source files.

## Start here

Run from your chosen parent directory; the original Windows username/path is not required for the game:

```powershell
gh auth login
gh repo clone DanielKinsner/slingmods-three-wheel-tour-rebuild
Set-Location slingmods-three-wheel-tour-rebuild
git status --short
git log -1 --oneline
npm ci
npm run build
npm test
npm run preview
```

Open http://127.0.0.1:5187/. The compact bay opens the existing first chapter, time trial and saved build. Node 24.15.0/npm 11.6.2 were used; dependencies are pinned. Ordinary play/build/tests require no Blender, API keys, external service or review ZIP. Allow space for the full history, editable art and evidence; this is a substantial binary-asset repository. No Git LFS setup is required.

For another agent, give it this prompt:

> Work in this cloned slingmods-three-wheel-tour-rebuild repository. Read HANDOFF.md, AGENTS.md, director-kit/production/state.json and the P06B REVIEW-ME-FIRST.md. Review12 is already delivered: do not restart or re-execute P06B. Preserve accepted car/rear/driver, shared physics, route/race rules, rewards, ownership and saves. Read the next director packet supplied by the user before implementation. Use isolated testing/background Blender; no desktop takeover, spending, deployment or unsupported gate approval. Report current branch/status and any missing local prerequisites, then follow the new assignment.

## Exact delivered state

- Last pre-handoff commit: `f8f7674be909259a3191bcc96c294cfe1818cbcd`.
- Frozen P06B runtime: `9348fa90311c5fbdfd74529feb50548582cdca17`; handoff changes do not alter that runtime.
- Review12 packaging commit: `7f5e8c4f16eacd1e466de0fed359087b6156e598`.
- Current handoff SHA: use `git rev-parse HEAD`; the validation receipt records the exact tested source commit. Later receipt-only commits may follow it.
- G3/G4 remain pending. The environment visual target is **not met**: sparse lawns, repeated distant facades/asphalt, wispy palms and simplified water/props remain review debt. Human driving/fun/audio and physical-controller approval are not established.
- Working chapter: fresh solo reward, one SM-133 cosmetic product preview/purchase/install/color/save loop, three actual rivals in shared physics, two-lap race/results/retry/first-podium progression. Time trial, original pad, chase/cockpit/held look-back and live synthetic audio remain intact.

Read `director-kit/production/evidence/P06B/REVIEW-ME-FIRST.md`, `PERFORMANCE-REVIEW.md`, `final-stationary-art-review.md`, `final-media-review.md`, and `independent-scoped-code-art-review.md`. The last completed assignment is `director-kit/director-addenda/review-11/CODEX_NEXT.md`; it is context, not a new instruction to repeat work.

## What Git transfers

All existing tracked history, src/scripts/tests/public, lockfile/configuration, director packets and state, source licenses/maps, editable Blender assets and the complete curated Review12 file selection at its original source paths. Additional baseline fixtures needed by current capture scripts are included. `handoff/TRANSFER-MANIFEST.json` records file hashes, and `handoff/REVIEW12-PACKAGE-MANIFEST.json` preserves the delivered archive manifest.

Current evidence lives in `director-kit/production/evidence/P06B/`:

- `final-visual-02/`: correct current daylight/night stills, scene and asset provenance.
- `bay-final/` and `interface-final/`: room/product and interface views.
- `video-final/complete-race-LIVE-AUDIO.mp4`: actual ordinary-path race with captured game audio and disclosed sync chirps; live audio and timing verification alongside it.
- `day-final-02/garage-day-SILENT.mp4`: correct ordinary-path daylight lap, explicitly silent.
- `verified-scored-*/`: clean native wall-clock performance, distinct from capture overhead.
- Fresh career, transitions, lifecycle, audio/controller, source and regression reports. Existing tracked historical evidence remains intact.

The rejected `final-visual/` and `day-final/` trials are not current proof. Do not replace correct evidence with those local experiments. Historical absolute filenames in reports identify their capture origin; do not redirect new work to the old machine.

Three previously untracked historical files are now preserved unchanged: `assets/blender/vehicles/slingshot-p03a-material-lab.blend` and the two review-05 regression helpers. The material lab is not the accepted current vehicle and must not replace it. The regression helpers are original director reference files, not automatically installed tests; their comments describe diagnostic usage.

## What stays local

The original `Astra-Review-12.zip` is redundant with the transferred implementation/evidence and is not committed. Its 466,223,855 bytes have SHA-256 `e4685e6fe73ff5cd57738d3966956840dfa13b3499a70c5c87378af871c270f8`. Other ZIPs, extracted staging, rejected/intermediate untracked captures, raw-video duplicates, node_modules, dist, downloaded executables, caches, backups and credentials remain ignored. `handoff/LOCAL-ONLY-ARCHIVES.json` inventories ZIPs on the originating machine; it is not a claim that those archives transfer through Git. Use the source tree and curated evidence directly on the new machine. No remote release/upload/deployment was requested.

**Personal browser saves do not travel through Git.** Career storage is the origin-local IndexedDB `slingmods-twt-rebuild-career-v1`, database version 2; solo records/settings use localStorage `slingmods-twt-rebuild-v1`. This handoff does not export or read your browser profile. A fresh browser starts a fresh career unless its storage is separately transferred. The included earned-career fixture is isolated test data, not your personal save. Do not overwrite a personal save with it.

## Authoring and isolated validation

Accepted source files include `assets/blender/vehicles/slingshot-p04a1.blend`, `assets/blender/drivers/test-driver.blend`, the product source, harbor source and `assets/blender/showcase-quality/` packed Blender files/materials. Already shipped GLBs work without re-exporting. Downloaded Blender itself is excluded; use Blender 4.5.2 for reproduction. Python 3.13.5 with requests 2.32.4, Pillow 11.3.0 and numpy 2.2.6 was used by material tooling. Source downloads are already retained, so no re-download is needed for play.

```powershell
# Additional isolated browser tooling, only when testing/capture is needed:
npx playwright install chromium
# Read-only transfer/source verification, from the cloned project root:
python handoff/verify.py
```

Prior validation: production build and 119 tests passed; 4,200-row solo replay identical; protected physical/game inputs unchanged. Five native configurations/six races met the working race thresholds. Stock720 p99 was at 33.4 ms; startup/ready gap and exact late shader variant remain unresolved. Performance is machine-specific: do not carry forward old FPS as a new-machine measurement. Windows D3D11 headless Chromium was used; other OS/GPU behavior is not yet certified.

Use fresh `EVIDENCE_DIR` names for current scripts and an isolated browser context. Review capture scripts target localhost:5187 and some explicitly request Windows D3D11. Do not run historical batch scripts over existing evidence. Several historical packagers, including `scripts/package-astra-review12.py`, intentionally assert the originating absolute root; adapt a copy for a new delivery rather than rewriting old proof. The Blender helper expects `.tools/blender-4.5.2-windows-x64/blender.exe`; alternatively invoke your Blender executable directly with `--background --python scripts/p06b_quality_build.py -- --stage full` only under a newly authorized art assignment.

Do not rerun source-writing validators or parity scripts on immutable evidence merely to read it: they write reports at historical paths. Perform those checks in an isolated checkout and retain the original proof. The handoff verifier is read-only. `handoff/VALIDATION.json` records the separate clean-checkout handoff checks when completed.
