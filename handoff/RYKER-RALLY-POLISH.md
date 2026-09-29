# Redstone Rally presentation and drift follow-up

Owner request, 2026-09-28: generated map and transition images, much less dirt-camera shake, more dramatic drifting only on this track, and race cinematics consistent with the rest of the game. Main push remains authorized as part of the rally task.

## What changed

- New illustrated map follows the actual course topology; the event card uses the same map, course-outline fallback, and labelled in-game postcard treatment as the road tracks.
- New Ryker dirt-drift transition plate appears in the critical boot screen, page-change curtain, and scene preparation screen. Both images ship in the demo/publication allowlist. Original prompts, references, and built-in image-generation provenance are in `assets/game-feel/rally/README.md`.
- Rally joins the normal cancellable asset-preparation flow. Ryker recce also uses the existing showroom departure. A supplied Ryker from another selected vehicle enters directly after preparation, so the departure never shows the wrong vehicle.
- Rally starts through the shared cinematic director, score, letterbox, title system, skip controls, and accessibility preferences. Four stage-specific shots frame the dirt start, tire contact, the Ryker, and the driving-camera handoff. A valid finish uses the shared victory sequence with stage-specific copy.
- The constant rough-surface camera term is multiplied by 0.16 on Redstone (84% reduction); cockpit buzz is multiplied by 0.25. Existing speed, roll, FOV, and road-track settings retain their defaults.
- Redstone opts into its own drift dynamics: more rear-tire release, a wider held angle, more momentum, and gentler exit assistance. There is still no arcade boost. The default road dynamics retain the exact previous values. Driving without the handbrake is bit-identical in the paired simulation check.
- Revised rally records use the `redstone-rally-v2` comparison suffix. Earlier records remain stored; they do not compete against laps driven under the revised drift rules. Career and road record schemas are unchanged.
- The redundant keyboard shortcut hint is hidden during cinematics on compact screens; the visible skip button remains accessible.

## Verification

`npm test`: 544 passed. Production demo build and publication staging pass. The staged build contains both images and all required rally assets. Existing large JavaScript chunk warnings remain.

`tests/rally.test.ts` checks a full physical lap, scoring safeguards, persistent records, default handling isolation, controlled slide recovery, camera quaternion jitter, and finite custom film samples with the original audio timings.

The paired drift probe uses the same initial position, speed, steering, throttle, handbrake, and countersteer on the same dirt surface. Mean held rear slip rises from 28.18 to 39.23 degrees; peak rises from 42.82 to 61.77 degrees. By four seconds both settle below 0.01 radians at over 21 m/s. Raw paired telemetry is in `rally-polish-evidence/drift-comparison.json`. These are controlled input comparisons, not a claim that every driver will produce the same angle.

Packaged browser receipts and rendered screenshots are in `rally-polish-evidence/`.

- The physical lap completes all gates in 2:02.93; records survive reload, retry resets the score, and pause freezes scoring and elapsed time.
- Timed keyboard handbrake input produces 143 drift points and 51 active drift ticks, with no boost or premature saved record.
- Entry from a Slingshot supplies a Ryker. The existing Express/Slingshot, Ridge/Ryker, and Harbor/Spyder flows pass with no browser errors or missing asset requests.
- Desktop and portrait cinematic captures are inspected. The stage timer stays at zero through the intro; normal completion and both skip controls start one countdown. Reduced-motion and saved auto-film preferences bypass correctly.
- A separate full-motion lap finishes in 2:03.28 and triggers the automatic stage-complete film. Its saved time, score, and run count stay unchanged through the film. The small timing difference includes the neutral controller connection after countdown, exercising the normal input release gate.

Reproduce against a fresh static stage with:

```powershell
$env:PORT='5274'
node scripts/serve-demo.mjs --publish
# In another terminal:
$env:BASE_URL='http://127.0.0.1:5274'
node scripts/rally/verify-polish.mjs
$env:EVIDENCE_DIR='handoff/rally-polish-evidence/packaged'
node scripts/rally/verify-browser.mjs
node scripts/rally/verify-drift.mjs
```

These are functional and visual checks. This follow-up does not claim a new sustained performance qualification. The earlier normal-cadence pass and separate uncapped-stress limitation remain documented in `RYKER-RALLY.md`.
