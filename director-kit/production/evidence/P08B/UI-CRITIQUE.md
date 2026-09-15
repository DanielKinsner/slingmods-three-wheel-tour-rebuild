# P08B UI internal critique and repairs

## Customer flow
Actual showroom entry -> free configuration -> mounted product inspection -> stock comparison -> setup -> saved recipe -> shop digest or Express/Harbor test. Career entry remains separate with earned ownership and receipts intact. Entry, configurator, catalog, event cards, race HUD, pause/help/results, career chapter/workshop and recovery now use shared red/graphite tokens and visible keyboard focus.

## Reviewed actual images
- `ui-proof-reviewed/`: actual application, three desktop sizes (1280x720, 1920x1080, 2560x1440), seven category panels, entry, both lighting modes and shop digest. All 21 panel geometry/image checks passed; no page errors. These are development candidate captures, not final pushed-build certification.
- `ui-integration-final/`: installed views for all five authored products; suspension controls, blue LEDs, and all-five shop digest. Twenty finish swaps produce a stable warmed texture count. Full verification JSON retains each sample.
- Earlier `integration/entry-first.png` and `ui-proof/` exposed low contrast, unwanted page margin/overflow and thumbnail cropping. Those images remain historical failure evidence.

## Repairs after critique
1. Added a restrained entry scrim and readable secondary text; showroom/vehicle remains the actual 3D background.
2. Corrected default page margin creating horizontal overflow. The panels keep their own vertical scroll; the entire page never scales down to fit.
3. Fixed selected category hover turning dark text onto a dark fill. Current selection stays distinct by text, red edge and background.
4. Moved status feedback away from camera controls. Increased detail-panel opacity, body type and legacy earned-workshop control sizes.
5. Rendered asset thumbnails use contained full images, including tall shock geometry; no CSS crop disguises missing hardware.
6. Numeric damping and RGB/brightness controls work with controller focus. Pending saves disable navigation and edits. Destructive reset confirms and restores the opened or last explicitly saved recipe.
7. Modal reset and crew invitation trap navigation and restore focus. Race menus include keyboard focus containment, controller-neutral arming and audio/help navigation.
8. Map aids project the real route centerline and player telemetry. Free drive has no lap requirement/reward claim; reverse behavior is explicitly explained in driving help.
9. Storage inspection labels the temporary hidden seats/open doors; Full vehicle or a category switch restores visibility. Product pages open only from deliberate per-item links.

## Verification scope
`tests/p08b-ui.test.mjs` covers three sizes, controller setup, pending navigation interlocks, reset cancellation/focus, escaped long names, blocked fitment and safe external-link metadata. Existing showcase and P08A suspension browser tests pass. Showcase controller testing now locates Help through bounded real focus navigation rather than assuming Help is always the third item; all existing behavior assertions remain.

`ui-integration-final/verification.json` confirms 20 actual finish changes; all five preview/remove/reinstall actions; inspection restoration; setup/RGB/power/lighting/driver controls; compare/undo; three presets; named save/full reload; reset; unchanged career IndexedDB and record/settings sentinels. External-tab destination transport is stubbed in isolation; URL, deliberate opening and return preservation are tested, not retailer uptime.

## Remaining limits
UI testing uses isolated Chromium on this machine, not physical controller hardware or other browser engines. These captures do not certify final art fidelity, performance, release or publication. Mobile play is not claimed. The right product panel deliberately scrolls at 720p rather than compressing text. Final exact-commit game/audio/film/timing and portable handoff remain the integrator's acceptance pass.
