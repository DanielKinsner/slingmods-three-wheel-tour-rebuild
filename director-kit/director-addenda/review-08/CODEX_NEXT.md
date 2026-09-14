# Codex assignment — Astra Director Review08
## P04B2: Night Drive

Continue in the existing rebuild:

`C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`

Read `AUDIT.md`, `packets/P04B2-NIGHT-DRIVE.md`, `references/RENDERING-NOTES.md` and `ACCEPTANCE-CASES.json`, then implement. Make routine creative/engineering decisions yourself; do not send Dan a selection of approaches or ask him to perform QA.

**The first real-product/career loop is accepted for continued development. Night-kit readability and wall-clock performance remain held. This packet authorizes changes to the lighting presenters, renderer preparation/lifecycle and capture/profiling code that earlier packets froze. It does not reopen vehicle, scenery, physics or economy design. G3/G4 remain pending.**

The target is simple: earn/buy the existing kit, see its color clearly in the ordinary night chase view, and drive without a multi-second first-encounter hitch. Fix the cause established by profiling—not a suspected cause presented as fact.

## Start safely

Confirm root/HEAD/status. Last reviewed runtime: `dd2c3f9d3b917aec1a7f2e6750f93afe17505292`; its packaging commit: `dc62adfd1e79ce3248f81752301d5a4d10453b80`. Do not reset to either, overlay older source, or discard newer unrelated work. Keep all current saves and receipts. This ZIP contains instructions and evidence, not replacement game files.

Use the existing isolated tools, not Dan's mouse, desktop, browser profile or Blender UI. One lead; one narrowly scoped helper only when useful. No new paid services, assets, API generation, spending, credential requests, storefront/cart writes, pushing/deployment or public uploads.

## Execute in this order

1. Establish a minimally instrumented cold-run baseline; isolate shader/light-pool changes and measurement overhead using the packet's tests. Preserve evidence before repairs.
2. Keep a stable, prepared lighting configuration during driving and interactive kit toggles where the installed renderer supports it. Add an honest preparation state before countdown; do not mask freezes by dropping timing data. Verify the actual installed Three.js version.
3. Calibrate the existing kit's emitted light in the unchanged harbor. Inspect matched stock/red/cyan views, motion and daylight. Keep the physical strip geometry and wallet/product configuration.
4. Run the real-time first-lap and retry checks, including a clean run without recording or the heavy inspect callback. Then make a separate short truthful wall-clock clip. Keep existing race/career/regression tests and test settings/save preservation.

At most two evaluated diagnosis/fix cycles. Do not restart the engine, migrate renderers, lower the whole scene's quality, or add features to escape a hold. If a blocker remains, return the best preserved working state, measurements and exact blocker; no third unbounded rewrite.

## Return Astra-Review-09.zip

Keep relative paths. Include current source/config/lockfile/tests, all public assets required by the captured build, changed scripts and a current state/review excerpt. Unchanged historical Blender sources need not be duplicated. Include a SHA-256/size manifest, captured source/served-asset hashes and separate packaging-only commit identification. Do not overwrite an existing ZIP; number it if necessary.

Include `REVIEW-ME-FIRST.md` with actual launch path, tested hardware/browser, diagnosis versus hypotheses, source changes, cold versus warm results, kit luminance parameters, preserved economy, and explicit remaining holds.

Evidence should be lean:
- At most eight matched-purpose stills and a 20–30-second ordinary wall-clock night clip with readable kit color. The clip must be actual elapsed-time capture, not a controlled-clock smoothness substitute. Label audio honestly.
- Raw frame-interval data for the bounded runs, source event markers, shader/program/light-state counters, viewport/drawing-buffer size, renderer identity and recorder status. Separate scored no-recording measurements from diagnostic traces and video overhead. Include all outliers and cold preparation time.
- One unchanged-physics check, retained regression/full-build results, a native menu/reload smoke test of the owned kit and no-cost power/color/stock comparison. No need to recreate a long credit-earning montage solely to inflate the archive.
- Frozen current car/rear/driver/route/contact/physics/audio hashes, and old career/PB/settings preservation evidence. Do not erase Dan's earned build.

Exclude .git, node_modules, downloaded tools, caches, dist, .env, credentials, redundant history and every failed full video iteration. Keep compact failed-diagnostic logs when relevant. Return the exact ZIP path and size, then stop for Astra.
