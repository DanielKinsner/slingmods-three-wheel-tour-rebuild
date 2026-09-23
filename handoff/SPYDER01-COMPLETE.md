# SPYDER01 — complete private local handoff

Implemented on the actual current `main` checkout, starting at `4e33aae2bda2fdf3ce95a75f638d8c9642c5dde9`. This is local working-tree work. Nothing was pushed, deployed, purchased or published. The earlier kit snapshot was not used as a rollback point. Existing Slingshot, Ryker, GX screens, career state and owner files were preserved.

## Play

The tested packaged version is served at **http://127.0.0.1:5214/?scene=signature&visual=spyder** while the local server is running. Choose **Garage**, fit free-preview upgrades, then **Test This Build**; **Race** provides the three roads, Quick Race, Time Attack and Challenges. **Career** uses earned credits and independent ownership. The ride selector contains all three vehicles.

From the repository, `npm run demo:preview` serves the latest `demo-current.json` candidate (default port 5188; set `PORT=5214` to match this handoff). For development use `npm run dev -- --host 127.0.0.1 --port 5213`. Do not use a deployment command to play locally.

The private delivery ZIP contains a self-contained static game plus `LAUNCH.cmd`/`serve.mjs`. Extract it fully, then run `LAUNCH.cmd` with Node.js 20+ installed. No npm install is needed to play that package. Keep the terminal open; Ctrl+C stops it. Its server binds to loopback only and serves only the `game/` folder. `PORT` can select a free port if 5214 is occupied.

Keyboard: W/↑ throttle, S/↓ brake, A/D or ←/→ steer, C cycles near/far/cockpit, hold B to look back, X switches drive/reverse safely, hold R for recovery/restart, Esc pauses. Enable Sound is a required browser gesture; Options is available from the pause menu. Controller mappings remain the existing RT/LT, left stick, Y camera, LB look back, B direction and hold A restart.

Saves are browser/origin-specific. Use the same browser and port to keep that local profile. Owner browser saves were not copied, reset or used for automated tests. A source checkout or ZIP does not transfer an existing hosted-site save to localhost.

## What is implemented

- Complete purchased Spyder geometry and source-preserving Blender conversion; own calibrated three-contact layout and six-speed/reverse powertrain with explicit auto-shift assist.
- Own handling, rider sleeves/IK, steering/travel/spin separation, seated camera, chase cameras, actual live mirrors, corrected headlamp origins, speed/RPM needles, gear/speed LCD and inline-three synthesis.
- Six independently removable upgrades: Pedal Commander, front Stage 4 pair, rear Stage 4 manual-preload shock, ULTRA bar with its end-link dependency, F3 underglow and stationary wheel lights. Real catalog links, bounded controls and persistent saved builds.
- Ordinary GX preview, three roads, earned career purchase/equip, immutable race entries/rewards, challenge records, Time Attack ghosts, Tour Log and difficulty. Spyder records include vehicle, definition, handling tune, assist and performance-relevant configuration rather than mixing them with the existing vehicles.

## Evidence and transfer contents

`SPYDER-VALIDATION.json` is the acceptance receipt for every kit ID. `assets/spyder/evidence/` contains actual screenshots, full test output, native Blender/GLB checks, real-control race results, reward evidence, live audio and measured native RAF frame tails. Controlled-clock gameplay evidence is explicitly separate from native performance.

Final results: **457/457 tests**, typecheck and production build pass. All six stock/equipped full-road runs pass. A genuine career lap earned 800 credits, bought the 550-credit controller and preserved the remaining 250 credits after reload. All three GLBs have zero validator errors. The final comparable native runs measured Slingshot 59.989 FPS over 4,591 frames, Ryker 60.002 FPS over 4,587 frames and Spyder 60.002 FPS over 4,703 frames; all had 16.8 ms p99 frame times. These are approximately 60 Hz capped measurements, not uncapped GPU headroom estimates.

The ZIP includes the final playable game, changed/new repository files as a **source overlay**, a binary-capable tracked-file patch, exact file hashes, all four editable packed Spyder Blender masters, the immutable supplied source kit/receipt, the original Tour rider master needed by the derivative script, conversion scripts and final curated evidence. Apply the overlay only to the named baseline or review the diff against a newer checkout. It is not a full Git-history backup or an invitation to overwrite unrelated work. The complete game can be played directly without applying the overlay.

Inside the ZIP, curated evidence is under `source-overlay/assets/spyder/evidence/`; receipt paths otherwise use repository-relative names. `HANDOFF-MANIFEST.json` hashes every delivered member except itself. The adjacent `.zip.sha256` and `.verified.json` identify the actual archive, whose CRC and every member hash were checked after compression. `SOURCE-BUILD.json` and `game/review-build.json` identify the tested working build exactly.

## Editing and reproducing evidence

Use the existing repository at the named baseline plus the reviewed overlay. Restore the four masters to `.tools/spyder/`, and `masters/Tour-Rider-Source.blend` to `assets/blender/drivers/tour-rider.blend` only if that source is absent. Extract `private-source/Spyder_Road_Codex_Kit.zip` into `.tools/spyder-kit/`, preserving its `Spyder_Road_Codex_Kit/` directory. Native conversion order and safe Blender flags are in `assets/spyder/ASSET-PROVENANCE.md`. The immutable kit can regenerate its import baseline; it was not necessary to include the larger duplicate original download or an installed Blender distribution.

For checks, run `npm ci`, `npx playwright install chromium`, `npm test`, `npx tsc --noEmit` and `npm run demo:build`. Full GLB validation uses `npm install --prefix .tools/gltf-audit gltf-validator@2.0.0-dev.3.10`, then `node scripts/spyder/validate-assets.mjs`. These tools require network access if dependencies are absent; playing the delivered game does not.

Before browser evidence, run `node scripts/spyder/prepare-evidence.mjs`, start the packaged server on 5214, and set PowerShell `$env:BASE_URL='http://127.0.0.1:5214'`. Run `visual.mjs` before `roads.mjs`; it writes the combined build that the road matrix consumes. Run `acceptance.mjs`, `career.mjs`, `cockpit.mjs`, `audio.mjs`, `departure.mjs` and `performance.mjs` from `scripts/spyder/`. The mixed-instance fixture requires the Vite server on 5213 and `node scripts/spyder/mixed.mjs`. Use a fresh `EVIDENCE_DIR` where supported to retain prior receipts. Run native performance by itself, without other renderers or Blender jobs. All evidence scripts use isolated browser profiles and actual game control/event paths.

`assets/spyder/ASSET-PROVENANCE.md`, `PHYSICS.md` and `PRODUCT-REFERENCES.md` distinguish source facts, custom dimensions, game estimates and physical-fit unknowns. No source archive, OBJ/MTL or editable Blender file appears in the served game.

## Honest limitations

- The existing performance gate remains **HOLD**. The bounded comparable audit covers this RTX 4080 / i9-12900K system at 2560×1440 High, native RAF. It is not the full High/Ultra release matrix or proof for lower-powered hardware.
- This custom model has no verified year. US 2023 base F3 is a reference, not an OEM geometry identification. Physics, ratios, rider mass, suspension damping and product force magnitudes are game estimates. Auto-shift is a game assist; BRP VSS/ABS internals are not reproduced.
- The approximately 958k-triangle donor derivative remains relatively heavy. No additional unused LOD is presented as active optimization. Reflections and scenery add passes beyond its stored triangle count.
- Product shapes/mounts, tubes and suspension links are visual approximations. Sampled rotating-wheel clearance does not certify physical fit, deformation, thermal behavior or road safety. Wheel lights use the standalone option; animation supports steady/pulse only.
- The rider GLB has 124 non-error warnings about generated tangents and non-root skinned nodes. Actual reimport, rendering, pose and disposal checks passed; warnings are retained in the validator receipt.
- Shared Tour medal thresholds remain the existing targets. Identity separation and result/ghost persistence are tested; every highest medal, every career chapter and every controller/device combination has not been exhaustively completed with every Spyder build.
- Engine audio is original synthesis, not an authentic engine recording. The live mixed signal and controls were measured/captured; the delivery makes no claim of OEM acoustic fidelity.

Failures found during implementation were repaired and superseded: initial intro-film-paused test, sparse/final-frame ghost harness capture, rider sleeve weights, ring radius, mistaken headlamp material/location, reverse-facing mirrors, cockpit helmet fittings/eye placement and static/occluded donor gauges. Retained receipts identify the final accepted runs rather than treating those earlier attempts as success.
