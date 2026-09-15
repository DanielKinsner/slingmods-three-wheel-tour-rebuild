# P08B — SlingMods Signature Experience

Current private branch: `feature/p08b-slingmods-experience`, descended from P08A `ef592752741333faee496edff95b8abb68b76840`. Remote: `https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git`. Main remains outside this assignment.

Current tested runtime: `822ff5f5a9cc211775076074c7d106e8d372286a`. The latest owner refinement adds reference-guided vented tiles/lift bay, a closed door with skippable departure and live door audio, and finish-matched swingarm accents. Read `handoff/P08B-REFINEMENT.md`, `P08B-REFINEMENT-VALIDATION.json` and `P08B-REFINEMENT-ASSETS.json` first. The refreshed Review16 MANIFEST identifies the exact pushed packaging commit. Earlier P08B evidence below remains historical.

## Launch from any checkout

```powershell
npm ci
npm test
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open `http://127.0.0.1:5197/`. Build Your Slingshot → choose finish/products → Test This Build opens a free Express drive. Quick Race offers Express and Original Harbor. Continue Career opens the existing earned chapter. Prepared easy-entry demo remains `http://127.0.0.1:5197/?scene=crew&play=demo`.

The configurator has five free previews and named build recipes; credits and purchases remain in the separate career database. Test drives capture a validated recipe and restore it on return. URL fragments carry temporary recipes when storage is blocked; fragments are not sent to the server. Browser career saves do not transfer through Git.

## Required assets and editable sources

`demo-assets.json` is the runtime closure. `assets/blender/p08b/README.md` describes the three packed Blender sources and repeatable background export. The original Harbor kit remains in `assets/blender/showcase-quality/built-waterfront.blend`; new Express placement/road/collider sources are `src/express/route.ts` and `presentation.ts`. Runtime GLBs, finish atlases and thumbnails are under `public/assets/p08b/`. Do not delete preserved original art, vehicle rigs, audio, routes or evidence.

## Evidence and exact identity

Final runtime/packaging SHAs, launch receipt, verification commands, asset hashes, native results and clean remote recovery are recorded in `handoff/P08B-VALIDATION.json` and `director-kit/production/evidence/P08B/`. Original pre-refinement runtime is `6aa1dafaac03168525a1f7e69a6831ea886f45d2`. The pushed documentation/evidence follow-up is identified by `git rev-parse HEAD` and the Review16 ZIP MANIFEST.json. Internal validation and same-host fresh remote recovery are complete. See `handoff/P08B-COMMANDS.md` for exact verification, film recovery, and fresh-session instructions. Prior handoff retained at `handoff/P08A-HANDOFF-PRESERVED.md`.

## Limits / next action

New handling is a versioned game tune, not an OEM dynamics claim. DDM adjustments use documented estimated damping/preload parameters; exhaust treatment is original game audio, with no horsepower claim. Wing and bags are visual previews. Room dimensions and product meshes are reference-based approximations, not surveyed/CAD assets. Native measurements describe this Windows RTX4080 host only. G3/G4, hardware, OEM fidelity, human fun/listening and release approval remain separate. Hosting stays pending. Give **Astra-Review-16-Lean.zip** to Astra for director review; do not merge or publish before that decision.
