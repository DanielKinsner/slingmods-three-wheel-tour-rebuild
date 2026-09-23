# TOUR / 001 — premium UI candidate

Implemented on `codex/premium-racing-ui`, in the isolated `premium-racing-ui` worktree, from committed base `7b041acea01b`. This branch is for later integration. Main, the rider worktree and the other agent's uncommitted Ryker work were not edited, merged, pushed or deployed.

## Design

A motorsport atelier: oversized Barlow Condensed headlines, Manrope controls, warm ivory specification sheets, carbon/olive neutrals and race red. The opening is a live vehicle editorial. The builder has an indexed category rail and material samples. Destinations pair current in-game photographs with real route outlines and a departure panel. Career, workshop, shopping, loading, race instruments, pause and results share the same visual language.

The vehicle still renders live. The existing measured safe-region logic frames it around the panels. Existing actions, button data attributes, keyboard/controller handling, recipe edits, ownership/fitment disclosures and career navigation are retained. Reduced-motion settings disable the new entrance animations. Narrow screens have scrollable category/inspector surfaces and retain every action.

Design research: [Gran Turismo 7](https://www.gran-turismo.com/us/products/gt7/) for its emphasis on the vehicle and destination presentation; [Forza Motorsport's Builders Cup](https://forza.net/news/forza-motorsport-builders-cup) for the relationship between building and racing. No UI, imagery or assets were copied from either game.

## Review locally

The running packaged preview is `http://127.0.0.1:5219/?play=demo`. It uses the branch's committed-base vehicles, without the other agents' unfinished work. The development preview is on port 5218.

To restart from this worktree:

```powershell
npm ci
npm run demo:build
$env:PORT='5219'
npm run demo:preview
```

The preview server prints its own PID. Stop only that PID when done. Do not stop other agents' servers.

Selected actual browser captures are in `ui-redesign/`. These are the functioning game, not static design mockups. The career captures use a fresh isolated career; the result capture comes from a valid simulated race.

## Integration boundary

Nearly all implementation is new under `src/interface/`. Only four existing files change:

| File | Change |
|---|---|
| `src/main.ts` | One import of `./interface/install`; adds an HTML class and loads scoped CSS. |
| `src/signature/ui.ts` | Two presentation imports; opening-screen markup delegated to `tourEntry`; destination thumbnail resolved through `tourRoutePreview`. |
| `demo-assets.json` | Add the Manrope font, its license and four route photographs to the static allowlist. |
| `tests/p08b-ui.test.mjs` | Find the renamed opening action by “Make it yours”; all behavioral assertions retained. |

No physics, inputs, routes, renderer settings, vehicle/rider models, equipment definitions, save schemas, reward certification or historical evidence are changed. No npm dependency, render loop or per-frame DOM traversal is added. Four actual 1600×900 route photos add about 1.22 MB; the local variable font adds 165 KB. No network font service is used at runtime.

After the other agents have committed their work, integrate this branch in a clean integration checkout. Do not switch or merge over their dirty main checkout. An ordinary merge of `codex/premium-racing-ui` or cherry-pick of its UI commit is sufficient; neither was performed here.

Likely overlap is `src/signature/ui.ts`, which the Ryker agent was editing. If a conflict occurs, keep that agent's current product/vehicle/action logic. Bring over only the two imports, the `private entry()` delegation and the `tourRoutePreview(r.id, night) ??` prefix in `events()`. Preserve the existing recipe, `ryker`, career-label and destination state sources. Merge the asset allowlist as a union. The rider's files do not overlap.

Removing the main import restores the prior stylesheet presentation; restoring `entry()` and the route preview prefix completes a revert. No save conversion is required.

## Validation

- `npm test`: **401/401 passed**.
- `npm run demo:build`: **passed**, including TypeScript and curated static packaging.
- `scripts/verify-tour-ui.mjs` on the packaged preview: opening/build/destinations at 1920×1080, 1280×720 and 390×844; layout boundaries; actual paint/part/lighting controls; undo/compare/reset cancellation; named recipe save; keyboard activation; shopping links; exact career-state preservation through showroom/return; existing Ryker rendering; actual Sport v5 quick race, live speed, pause/resume, phone pause screen, valid finish and distinct retry attempt. Receipt: `ui-redesign/validation.json`.
- All four destination photographs and the new font are packaged locally; the browser check verifies decoded route images before capture and collects failed HTTP requests and uncaught exceptions.
- Existing files' original line endings retained. Whitespace check uses `git -c core.whitespace=cr-at-eol diff --check` because the repository retains historical CRLF bytes. The copied upstream OFL file retains its original single trailing space and is excluded from that whitespace-only check.

Re-run the UI verification against a running preview:

```powershell
$env:BASE_URL='http://127.0.0.1:5219'
$env:EVIDENCE_DIR='.tools/tour-ui/recheck'
node scripts/verify-tour-ui.mjs
```

The first suite run had 400 passing tests and one obsolete text selector; the selector was updated and all 401 subsequently passed. The initial new browser script used the wrong career inspection alias and failed to release virtual controls after pause; both harness issues were corrected. No production simulation change was made to accommodate testing. Early screenshots were also taken before new route-image decoding completed; captures now await decoding.

Limits: Chromium/ANGLE only, phone viewport emulated, no physical-controller or human-play approval. The race uses the existing evidence driver with actual fixed-step physics and a controlled clock, so it is functional UI evidence, not timing evidence. The existing Phase 2 performance **HOLD remains unchanged**. Recheck the assembled UI after integrating the concurrent Ryker/rider branches, especially long labels and any new controls they add.

## Asset provenance

- Manrope variable font: [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/manrope), SIL Open Font License copied to `public/assets/fonts/Manrope-OFL.txt` and included in the static build. Existing Barlow fonts retained.
- Route photos: captured from this game's existing committed scenery and 2026 model using `scripts/capture-tour-route-art.mjs`; high quality, 1600×900, daylight for Harbor/Express, late afternoon and blue hour for Ridge. Camera relative to the player: position `[6, 2.8, -7]`, target `[0, .7, 3]`. Original historical preview images remain intact.
