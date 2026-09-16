# P10B — Cinematic Identity

## Play and recover
Continue on `main` in the existing repository: https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git . Visibility is PUBLIC and was preserved. The supplied historical private-repository descriptions are not current visibility facts.

```powershell
git clone https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git
cd slingmods-three-wheel-tour-rebuild
npm ci
python scripts/verify-p10b-assets.py
npm test
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```
Open http://127.0.0.1:5197/ . The server prints its immutable output directory and owned PID/stop command. Existing hosted root: https://slingmods-three-wheel-tour-rebuild.vercel.app/ . `npm run deploy:build` constructs the same curated allowlisted runtime for the existing Vercel project. Never deploy raw development output or create another project.

Frozen game input identity: `d341ae77e48f0d3a99cb1b8dfa7d20be6ef91fa6`. It follows P10A main `3585a411bca855c415b6016454ecb38b776beedc`. Later evidence, handoff and ZIP commits do not imply changed gameplay. Resolve latest main using `git ls-remote origin refs/heads/main`; archive commit with `git log -1 --format=%H -- Astra-Review-21-Lean.zip`. Final receipts separate runtime, tested hosted deployment, packaging, archive and final remote retrieval.

## Playable presentation
Entry, seven-category builder, destination selection, shop/career, open race instruments and truthful results share licensed condensed typography and restrained red/graphite treatment. All four finishes and five existing products remain freely previewable; Save/Undo/Compare and all options remain. Build → View → Tour Wall reveals the physical left wall; selecting a category restores the hero and inspector. Destinations offers Harbor, Express and Smoky Ridge; only Ridge has afternoon/blue-hour selection. Test This Build prepares the same recipe and existing Thermal-equipped departure; pause/skip/reduced-motion behavior remains.

## Required recovery inputs
`P10B-REQUIRED-ASSETS.json` hashes 166 runtime/editable inputs. The wall's native 2172×724 flat panorama, separate accurate lettering, packed Blender source, generator scripts, rejected art proofs and provenance are in `assets/blender/p10b`. Font TTF/OFL sources are in `assets/fonts/barlow-condensed`; served WOFF2 derivatives and selected actual-game route JPEGs are allowlisted in `demo-assets.json`. Historical vehicle/world/product/driver editable sources and runtime derivatives remain in Git. No downloaded tools, credentials, personal browser saves or cache files are required from this checkout.

Background authoring uses `.tools/blender-4.5.2-windows-x64/blender.exe` where installed (install Blender separately on another machine). Font regeneration uses Python fontTools/Brotli (`python -m pip install fonttools brotli`). Review still assembly uses Pillow (`python -m pip install pillow`). These authoring packages are optional for playing the already recoverable runtime. FFmpeg is needed only for media assembly; runtime requires Node/npm and a browser supporting WebGL2. Tests use the locked package dependencies. Browser capture scripts use Playwright Chromium; install it with `npx playwright install chromium` if absent. Isolated headless ANGLE D3D11 is the measured Windows lane; no desktop control.

## Verification commands
```powershell
python scripts/verify-p10b-frozen-inputs.py
python scripts/verify-p10b-packet.py
# Native performance, alone (fresh evidence directory for each run):
$env:BASE_URL='http://127.0.0.1:5197'
$env:EVIDENCE_DIR='director-kit/production/evidence/P10B/new-native-run'
$env:ROUTE='ridge'; $env:LIGHTING='day'; $env:BUILD='stock'; $env:RACES='2'; $env:WIDTH='1920'
node scripts/profile-p10b.mjs
```
Do not run media capture/compression, tracing, Blender or another browser benchmark alongside native measurements. `scripts/P10B-FILM.md` has exact capture/assembly controls. Review ZIP is a compact source/evidence packet, not a standalone game distribution. Full original evidence and raw film/audio remain in Git; its inventory hashes omitted heavy files.

## Limits and next action
Existing vehicle/world remain stylized relative to the photoreal cinematic concepts; this is a presentation implementation, not global OEM fidelity approval. Room is recognizable and preserved; the mural is an authored fictional coast-to-ridge illustration, not surveyed geography. Contact shading is a lightweight authored cue projected to the existing surface, not dynamic physical shadow simulation. Severe prolonged Ridge rail wedging, foliage/LOD and decorative off-road camera limits are unchanged. All performance is one Windows RTX4080 workstation; logical renderer counts are not measured VRAM. No physical-controller/mobile/human listening/fun or G3/G4 approval is claimed. Collect Astra Review21 and owner visual feedback; do not infer another assignment.

Final validation/delivery records are `P10B-VALIDATION.json`, `P10B-PACKET.json`, `P10B-DELIVERY.json`. Until present and complete, remote/film/archive work must not be called delivered.
