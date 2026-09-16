# P10B UI component critique and integration notes

## Implemented, actual screenshots inspected

- `src/signature/ui.ts` keeps the existing controller/recipe transaction boundary. Navigation is Build / Destinations / Shop This Build. All seven categories, five products and options, six lighting colors, setup controls, stock comparison, undo, reset, named save/load and historical tunes remain reachable.
- Entry follows C01 editorial hierarchy with a licensed heavy condensed face and the actual scene. Build follows U03's controls with slim rows, circular finish swatches, a measured 300–380 px inspector and one primary test action. `safeRegion()` reports actual DOM exclusions to the existing camera.
- Destinations follow U02's rail / single selected preview; route SVGs are derived from actual route data, fitted without stretching. `routePreviews` accepts actual captures and the separate Ridge night image. Selection updates real launch values without loading the next world or changing the recipe.
- Career hub and original chapter/workshop share the hierarchy; progress, ownership and transaction code were not changed.
- `tokens.css` and `ui.css` replace their repeated historical override layers. Two self-hosted Barlow Condensed weights come from Google Fonts' repository under SIL OFL 1.1. Original TTFs, license, source/runtime hashes and deterministic offline conversion script are included.

## Visual repair loops

1. Actual first composition showed the R on its own third line. Entry now uses POLARIS / SLINGSHOT while the exact 2024 Slingshot R identity is separately readable. Tiny destination outlines used the padded old 240×130 viewBox; now the true coordinate extent fits each rail icon with original aspect ratio. Product thumbnails and long official names consumed the first inspector viewport; both remain available in full details while setup controls receive priority.
2. Actual 1280×720 lighting capture showed setup below install/inspect/shop actions. The order is now brand → title → fitment/preview status → actual option → setup → actions → full details. The six colors and brightness are visible immediately at 720p; lower actions and long shock setup remain scrollable. Hiding the panel restores the center view.

## Verification scope

`ui-layout-03/verification.json` passes real-app UI controls at 1280×720, 1366×768, 1920×1080, 2560×1440 and a 600×900 narrow smoke. It checks panel/footer/nav bounds, all three destination choices and their launch values, lighting selection, exact recipe retention, all five free part install/removes and all six LED colors. The shipped condensed font loads in the isolated Chromium context. This is not a performance result or mobile gameplay certification.

`ui-layout-01/failure.json` is retained: the first four desktop rows passed before a live scene hot reload called the new camera safe-region hook before first state update. The safe-region query now handles that lifecycle. Runs 02 and 03 pass.

## Remaining integration acceptance

These working-tree captures include the lead's moving camera/art integration and the historical Ridge thumbnail. The final four route captures must replace that thumbnail and respond to day/night selection. Final immutable runtime, material/hero comparison, hosted font/assets, film, settings/regressions and native timings belong to lead integration evidence. Do not claim the entire cinematic target from component assertions alone.

The functional type/control hierarchy is substantially closer to C01/U03. The actual set/vehicle remain visibly more stylized than C01, and the lean inspector deliberately has more real controls than the generated example. Narrow mode is a readable stacked drawer, with Hide panel available for viewing the vehicle; it is not a shrunken desktop layout.
