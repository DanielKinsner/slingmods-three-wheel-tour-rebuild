# P09B interface internal review

## Matched composition
- Before: `ui-before/` is the immutable owner-refined P09A static build on5197. After: `ui-after-03/` is the integrated working candidate on5201. Both use identical earned P08A save fixture and1280×720/1920×1080 viewports.
- Inspected actual screenshots. The old720p showroom used a full-height slab and8 boxed camera controls; the new inspector is content-sized with compact finish swatches and one labeled view rail. New career first-event action is fully visible at720p; previously it was below the frame.
- Product inspectors scroll independently while the car, Test action and view rail remain accessible. Sticky heading retains Hide panel. Collapse restores focus to Show category; Show restores focus to Hide.
- Career uses actual game route polylines, distinct next/completed/locked states, prominent saved entry/Cup callout, and dark-backed complete product silhouettes.
- Shared refinements include entry, events, external shop summary, Chapter01/workshop, Chapter02/Cup/workshop, HUD, ready/pause/results, sound settings, recovery.

## Critique and repairs in this run
1. Initial5201 capture failed because the dev server was stopped; no before screenshot was claimed. Started dedicated devserver and used immutable5197 for before proof.
2. Initial static capture omitted profile=1 and timed out waiting for the evidence hook. Repaired capture query; before files were empty before successful capture.
3. Thumbnail `cover` cropped shock and exhaust hardware; switched to contain on matching dark backplate and inspected original source thumbnail. Initial screenshots retained inui-validation-01.
4. Audio panel was normal document flow after the viewport canvas (computed y720, position static); fixed it to a compact persistent header rail. Sound settings initially inherited black text and content-box width, producing low contrast/overflow. Added explicit foreground and border-box sizing; ui-scaling-01 retained.
5. New collapse focus test exposed focus targeting a hidden inspector button. Repaired it to target visible restore control. Existing13px/44px control assertions retained; actual new controls repaired to meet them.
6. Existing UI test found renamed Preview button; updated selector to Preview part without removing behavior assertions. Added ignition dispatch, panel focus and virtual-controller audio detent checks.

## Verification
- `node --test tests/p08b-ui.test.mjs`: PASS after repairs (existing three-size state/fitment/pending/keyboard/gamepad tests plus added cases).
- `npx tsc --noEmit`: PASS.
- `ui-validation-02/verification.json`: PASS actual UI at1280×720,1366×768,1920×1080,2560×1440, all product installs, settings details, long recipe, collapse/restore, keyboard/modal focus, earned save/reload unchanged.
- `ui-scaling-02/verification.json`: PASS125%/150% effective logical-viewport+DPR layout stress. This is not a claim of native browser-chrome zoom or physical-monitor testing.
- Native performance and final film are separate lead-owned evidence; these UI checks do not certify FPS or listening approval.

## Targeted performance hypothesis
CrewUI retains the prior menu/order change-key caches. Added fixed DOM-node lookup caching and value-diffed text updates, with running numeric HUD updates at10Hz. Ready/paused/result updates remain immediate, route marker remains separately throttled by its existing policy. Physics, clock, race state and simulation parameters are unchanged. Matched native evidence must judge whether this affects stalls; no claim that frame spikes are solved merely from this change.

## Contracts
- SignatureState.ignition?:boolean; UI emits onAction('ignition', 'true'|'false').
- SignatureHooks.onNavigate? called once for a changed category. Successful transactions remain scene/client owned.
- BuildMenuInput optional extra scope allows showroom controller focus into sibling #game-audio; range/select horizontal detents dispatch native input/change events.
- GameAudio settings selectors: #game-audio, .audio-settings, #audio-master/#audio-interface/#audio-engine.
