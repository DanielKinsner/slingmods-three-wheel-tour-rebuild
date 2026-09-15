# P09A commands and evidence methods

Run from the verified rebuild checkout, not the older `slingmods game` directory. Node 24.15.0 / npm 11.6.2 were available on the authoring host; `package-lock.json` pins all package versions. Python 3.13.5 and FFmpeg/FFprobe are used for review media/data, not game playback. No live audio service or API credential is required.

## Play

```powershell
npm ci
npm test
npm run build
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open `http://127.0.0.1:5197/`. The delivered server uses the existing local origin so prior browser career saves can migrate in place; 5202 is the separate validation server. Use **Continue Career** for Own the Build; **Build Your Slingshot** remains a free configurator. New careers complete Build Matters first. Existing earned crew access is retained. The historical prepared demo is `/?scene=crew&play=demo`, separate from real career progress.

Fresh preview and Chapter 02 use Sport v2. Existing saved preview recipes keep their recorded handling version; **Build Presets → Sport v2** selects the repaired tune without changing owned parts or career saves. Sport v1 remains available for comparison. Chapter 01/prepared demo retain their established handling and record identities.

## Repeat isolated checks

Every `EVIDENCE_DIR` must name a new directory. The scripts create isolated Playwright contexts; they do not use an owner's Chrome profile or take over the desktop. The Playwright browser must be installed (`npx playwright install chromium` if missing; the validated host already had it).

```powershell
$env:BASE_URL='http://127.0.0.1:5202'
$env:EVIDENCE_DIR='director-kit/production/evidence/P09A/my-preparation-run'
node scripts/p09a-preparation-validation.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P09A/my-career-run'
node scripts/p09a-career-loop.mjs
```

The career script uses the existing **test-earned** P08A fixture, then earns every new event result through production physics/checkpoint validation. It accelerates the rendering clock; it is functional proof, not performance evidence. The default fixture is `director-kit/production/evidence/P08A/loop-final-02/earned-career.json`. No personal browser saves are copied.

Native measurements run alone, with no video, builds, other browser tests or heavy tools:

```powershell
$env:WIDTH='1920'  # 1280 selects the 720p low profile
$env:ROUTE='express'  # or harbor
$env:BUILD='stock'    # or equipped (all five products)
$env:RACES='2'
$env:EVIDENCE_DIR='director-kit/production/evidence/P09A/my-native-run'
node scripts/profile-p09a.mjs
```

This uses real wall-clock RAF and a disclosed pedal/steering generator. Rivals and the player use the shared physics. Audio is enabled in the game graph; the isolated browser's host output is muted. Full intervals, outliers, finishers, shader counts and logical geometry/texture counts are retained. These counts are not VRAM measurements.

## Film and raw diagnostics

```powershell
$env:EVIDENCE_DIR='director-kit/production/evidence/P09A/my-film'
node scripts/record-p09a.mjs
$env:PYTHONUTF8='1'
python scripts/assemble-p09a-film.py director-kit/production/evidence/P09A/my-film
```

The film uses actual real-speed game frames and live WebAudio. Flash/chirp markers measure synchronization and are cut from the final output. Career workshop screens are authentically silent; no music or substitute engine sound is pasted over them. Original video/audio and verification receipts remain in Git. FFmpeg and Python/Pillow are media-tool prerequisites only. Blender sources are preserved; this assignment does not require re-exporting unchanged art.

In the lean packet, `python scripts/restore-p09a-data.py NEW_OUTPUT_DIRECTORY` restores every included numerical/text payload with SHA256 checks. `REMOTE-EVIDENCE-INDEX.json` lists omitted duplicate/superseded comparisons by exact commit/path/hash. Runtime and editable asset inventories include `public/assets/slingshot-contact-layout.json`; no missing fixture should be guessed or copied from another project.

## New-machine resume prompt

Read HANDOFF.md, AGENTS.md, handoff/P09A-VALIDATION.json and the Review17 manifest. Fetch the private remote and use feature/p09a-own-the-build, preserving local changes. Confirm the manifest's runtime/packaging/tested-remote identities before rebuilding. Do not repeat older assignments or assume browser saves transfer through Git. Launch locally with the commands above. Await Astra's Review17 decision; no merge to main, publication, spending, new destination/vehicle or release approval is implied.

The delivered film-02 has one manually selected silent-UI boundary, documented with inspected original frames. Rebuild its exact edit using:

```powershell
python scripts/assemble-p09a-film.py director-kit/production/evidence/P09A/film-02 --silent-start=05-earned-workshop:146.5
```
