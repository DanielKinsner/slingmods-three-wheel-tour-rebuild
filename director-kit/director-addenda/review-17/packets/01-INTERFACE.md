# 01 — A designed interface, not a wall of widgets

## Art direction

**Precision automotive configurator with a motorsport finish.** The vehicle is the hero; the controls feel engineered, light and deliberate. SlingMods red identifies selection and the primary action, not every border. Graphite surfaces, warm white type, restrained hairlines, genuine negative space and a single small accent system. Preserve the official logo and existing brand identity. No neon gradients, generic glass-dashboard template, gratuitous pills, bounce comedy or giant blurry layers.

The complaint is inconsistent hierarchy/size and too many rectangular enclosures. Simply changing border radius or shrinking the entire DOM is not the assignment. Remove unnecessary containers and prioritize information.

## Specific composition

- Replace the seven equally boxed left navigation tiles with a compact labeled rail: simple text/icon rows, subtle selected backing and a restrained red marker. The whole hit target stays easy to use; visible chrome does not need to fill it.
- Replace the full-height right slab with a content-sized contextual inspector capped by the available viewport. Product image, concise name, fitment/status, actual choice and one relevant primary action. The same panel adapts to Paint, Lights, Shocks and Presets; no enormous empty rectangles when a category has little content.
- Product installation is not a destructive action. Show a quiet Installed state and secondary Remove; do not make a red Remove compete with Test This Build as the visual hero.
- Consolidate the scattered camera/view/light/driver controls into one clear rail with labels or tooltips and keyboard/controller focus. Advanced motion/inspection options can expand on demand. Do not bury ordinary orbit/front/rear/interior or sound controls.
- Use an unobtrusive footer/build strip with summary and a strong Test This Build action. Shop This Build is secondary and clearly external. Keep Undo, Compare and Reset accessible without creating another equal-weight row of boxes.
- Reframe the hero within the actual unobstructed region. At 720p the car should not become a postage stamp between panels. Inspector collapse and inspection focus must leave an obvious way back. Preserve camera orbit and wheel zoom without input capture fighting controls.
- Use finish swatches plus clear names and selected marks, not four giant cards. Preserve full body/trim/hardware material separation and actual preview changes.
- Rework career events into a clear compact progression sequence with distinct next/resume/completed/locked states. Feature the current Cup continuation rather than pushing it and the next event below a huge heading. Reuse actual route/vehicle imagery from the game, not unrelated stock imagery.
- Rework earned parts into consistent product rows/cards with honest thumbnail crops, clean dark backplates and no accidental white letterbox strips. Keep status/credits/requirements secondary to the part, without deleting fitment, ownership or simulation limitations.
- Refine HUD, pause, results, recovery and settings as part of the same family. Speed/gear and next driving information dominate during play; results have one clear finish/rank/time/reward hierarchy, not two competing large readouts. Maintain readable driving overlays on bright pavement AND night views.

## Sizing starting points (design targets, not rigid certification)

At 1920×1080, start around 72px header, 64–72px footer, 150–168px category rail and 300–340px inspector. These are CSS-pixel starting points; scale/reflow intentionally at 1280×720 rather than globally scaling text down.

Use a small unified type scale: ordinary body14–16px, labels13–14px, secondary metadata12–13px, panel headings24–28px. Reserve larger display type for the entry hero or the principal result/speed, not every panel. Avoid important controls under12px. Use tabular numbers for speed/time/credits. Typography and visual hierarchy must be judged in actual screenshots, not just by the token names.

Use 4/8-based spacing, a few meaningful surface levels, thin separators and restrained 4–10px corners where appropriate. Keep useful hit regions near44px even when the visible mark/text is smaller. Do not trade legibility for “sleekness.” Use existing licensed fonts or properly sourced redistributable fonts; no external font request dependency at runtime and no new font purchase.

## Motion and sound together

Selection marker movement and inspector changes: approximately140–220ms, small distance, no spring bounce. Installation confirmation happens after the preview transaction succeeds, with a small state change and matching sound. A recipe that changes several parts gets one restrained build-complete cue, not five stacked impacts. Toasts are short, nonblocking and do not overlap the car's inspection target. Honor reduced motion and maintain focus when replacing content.

## Scope checklist

Entry; showroom/configurator; paint/lighting/suspension/product/preset inspectors; Shop This Build; event selection; both existing career chapters and Cup continuation; earned-parts UI; HUD; pause/settings; results; preparation/cancel/retry; invalid/corrupt save recovery. Do not leave the existing career as a different-looking plain website. Do not modify economy or race contracts as a side effect of markup work.

## Evidence and internal decision

Capture matched before/after configurator and career screens at1280×720 and1920×1080 early, evaluate them locally, and finish the rollout in the same run. Validate1366×768 and2560×1440 plus125%/150% browser zoom where usable; disclose unsupported layouts rather than hiding overflow. Physical mobile quality is not added to scope. Verify keyboard, tab focus, virtual gamepad, long titles, expanded technical details and mixed locked/owned states.

Acceptance question: can a first-time visitor identify their car, choose a finish/mod, understand its state and find Test without reading a page of controls? The same person should recognize the same game in career and results. This requires actual visual review, not only a screenshot existing on disk.
