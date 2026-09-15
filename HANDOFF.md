# P09A - Own the Build

Current branch: `feature/p09a-own-the-build`. Private remote: `https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git`. Baseline: P08B `51f34a341200cf76bf69106bdfae300590419e88`. No merge or publication authorized.

Implementation checkpoint: Sport v2 braking, responsive route preparation, Chapter 02 earned exhaust/wing/bags, five free showroom previews, and explicit crash recovery. Full tests pass (213); final native performance, film, remote-clone verification and Review17 packaging are in progress. Do not infer release approval from this checkpoint.

## Launch

```powershell
npm ci
npm test
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open `http://127.0.0.1:5197/`. Continue Career opens Own the Build; new careers first complete Build Matters. Free showroom/test drives remain separate from career ownership. Prepared historical demo: `/?scene=crew&play=demo`. Existing browser saves do not transfer through Git.

Read `handoff/P09A-DRIVING.md`, `handoff/P09A-CAREER.md`, and director-kit/director-addenda/review-16/CODEX_NEXT.md. Full current runtime assets are in `demo-assets.json`; editable/refinement dependencies remain those of `handoff/P08B-REFINEMENT-ASSETS.json`. No art/runtime asset was replaced in P09A. The previous authoritative handoff is preserved in `handoff/P08B-HANDOFF-PRESERVED.md`.

## Limits

Sport v2 is a documented game tune, not manufacturer physics. Deliberate extreme curb collisions can still overturn the car; recovery is explicit, never an invisible steering assist. Free test drives respawn on the road; scored events restart with a fresh attempt and no abandoned-attempt payment. Chapter 01 and prepared demo retain their historical Sport v1 setup; fresh preview and Chapter 02 use Sport v2. Historical saved preview recipes retain their version; select Sport v2 under Build Presets to compare.

G3/G4, final OEM/art fidelity, hardware controllers, human fun/listening and release approval remain held. Hosting is separate and not a development blocker. Final next action: Astra reviews Review17; do not merge or publish before director approval.
