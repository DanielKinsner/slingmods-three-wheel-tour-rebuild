# P08B reproducible commands

Run from the repository root in PowerShell. Node 24.15/npm 11.6, Python 3.13 and Blender 4.5.2 were used; Playwright's pinned Chromium was 153.0.8010.12. Discover tool locations on the destination machine. Do not copy browser profiles or saves.

```powershell
git fetch origin
git switch feature/p08b-slingmods-experience
git pull --ff-only
python scripts/verify-p08b-portability.py
npm ci
npx playwright install chromium
npm test
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open http://127.0.0.1:5197/ . This starts the Signature showroom. Build Your Slingshot → Test This Build; or Quick Race → Harbor Express / Original Harbor. Continue Career retains the earned P08A chapter. The prepared isolated demo remains `/?scene=crew&play=demo`.

Keyboard: W/S pedals, A/D steer, C camera, B look back, Esc pause, hold R one second restart. Brake to stop, release, then press S again to reverse. Release and press W after stopping reverse to drive forward. X selects direction directly. Controller uses RT/LT pedals, left stick steering, right face direction, top face camera, Menu pause. Physical controller testing remains pending.

## Focused verification

Use a **new evidence folder per command**, preserving accepted outputs. These scripts use isolated browser contexts and never the active desktop. Functional controlled-clock runs are not performance measurements.

```powershell
$env:BASE_URL='http://127.0.0.1:5197'
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/new-career-run'
node scripts/validate-p08b-career.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/new-preview-run'
node scripts/validate-p08b-preview.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/new-preservation-run'
node scripts/validate-p08b-preservation.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/new-ui-run'
node scripts/p08b-ui-integration.mjs
```

Native RAF benchmarks: close task-owned capture/Blender jobs first; do not stop unrelated applications. Audio graph is enabled while host speaker output is muted by the isolated browser.

```powershell
$env:FIXTURE='director-kit/production/evidence/P08A/loop-final-02/earned-career.json'
$env:WIDTH='1920'; $env:RACES='2'; $env:SUSPENSION='equipped'
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/new-native1080'
node scripts/profile-p08b.mjs
$env:WIDTH='1280'; $env:SUSPENSION='stock'
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/new-native720'
node scripts/profile-p08b.mjs
$env:WIDTH='1920'
$env:EVIDENCE_DIR='director-kit/production/evidence/P08B/new-express1080'
node scripts/profile-p08b-express.mjs
```

All original P08B numerical/text evidence (including failures) is stored once, losslessly, under `director-kit/production/evidence/P08B/complete-data`. Restore into a new directory:

```powershell
python scripts/restore-p08b-data.py C:\some-new-directory\P08B-evidence
```

Blender editing/export and source verification commands are in `assets/blender/p08b/README.md`. Use background mode only. The room, repaired vehicle and product kit are packed `.blend` files; Express placement and colliders are editable TypeScript. Required runtime/source hashes are in `P08B-ASSET-MANIFEST.json`.

## Film

`director-kit/production/evidence/P08B/film-01/P08B-Signature-Experience.mp4` is the final real-speed 171.434-second edit. Original Playwright video is in `film-01/raw-video/`, and all five original live-audio WebMs are beside it. Reassemble using installed FFmpeg/ffprobe and Python:

```powershell
python scripts/assemble-p08b-film.py director-kit/production/evidence/P08B/film-01 --exclude=04-original-harbor
```

Restore the indexed film JSON/text records first if needed. The optional Original Harbor segment was excluded because its recorded visual sync markers were absent. The retained four sections have measured absolute endpoint drift at most 49.3 ms. The film is evidence of actual game audio, not human listening approval.

## Fresh-session resume prompt

Read HANDOFF.md, AGENTS.md, handoff/P08B-VALIDATION.json, handoff/P08B-DESIGN-AND-CRITIQUE.md and the Review15 packet. Discover the checkout, branch, remote, HEAD and working tree. P08B runtime is 6aa1dafaac03168525a1f7e69a6831ea886f45d2; later feature-branch commits contain verification/packaging only. Preserve newer and uncommitted work. Review16 is ready for Astra; await the director's next assignment, without restarting completed milestones. No main merge, publication, spending, desktop takeover or G3/G4/fidelity/hardware/release approval is granted.
