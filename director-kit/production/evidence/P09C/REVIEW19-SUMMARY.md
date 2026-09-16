# Astra Review19 — Freedom to Drive

## Play

- Local: http://127.0.0.1:5197/ (launch from the recovered checkout using HANDOFF.md).
- Verified hosted root: https://slingmods-three-wheel-tour-rebuild.vercel.app/. Exact checked deployment/build is in handoff/P09C-VALIDATION.json; archive-addition and later receipt commits are separate.
- Tested game source: `5b2c99af2c567c04b5ea9d896765e7a6ddeec25e` on main. Complete source,128 required runtime/editable assets and raw evidence are recoverable from Git. This ZIP is a review packet, not the game distribution.
- Film: media/P09C-Freedom-to-Drive.mp4 — approximately three minutes, continuous matched comparisons and current gameplay with captured game master audio.

## Visible result

Sport v3 has more useful steering reserve, a smoother response and steering that remains available under braking. Fresh builds and new ordinary entries consistently use v3. Historical recipes retain v1/v2; Build Presets → Use current driving makes an updated draft and preserves the original. Save build retains the new version under a name. In-progress events/Cups stay frozen; ownership, credits, receipts and historical best-time provenance survive.

Review18's UI, action sounds, powered dashboard, Thermal departure, showroom/floor/closed bay, front and hoop refinements, paint/accent behavior and five freely previewable products are retained. No new vehicle, destination, product or audio generation.

## Proof

- 250 source tests pass; normal, curated and Vercel output builds pass.
- Matched50mph/90m and65mph/150m sweepers pass both directions for8 scored seconds. V3 RMS0.963/1.105m, peak<=1.316m, no brake required. Average steering demand66–72%. At65mph the same v2 protocol has5.573m RMS/7.246m peak. The50mph v2 case already passed; v3 adds command headroom there.
- V2 straight stopping retained:36.032m from60mph,116.366m from110mph;0–60 remains4.733333s. Historical v2 full telemetry matches the original source in3,600 ticks. V3 stock/removed/street setup equivalence, combined force bounds, transitions,110mph lane changes, reverse and actual severe-curb overturn/recovery are tested.
- Actual browser entry/profile matrix, complete earned chapter/Cup, purchases/removal/reload, preparation failure/retry, display/Thermal/audio and finish-before-rivals pause/resume pass. Original failed tests and tuning candidates are retained and explained.
- Native performance: **16/16 matrix attempts pass**, 0 active intervals over100ms; two additional cockpit checks: **PASS**. Same sample rules and thresholds as Review18, no concurrent capture/trace.
- Fresh remote recovery: **PASS**. Actual hosted-root gameplay: **PASS**. See complete receipts for checked identities and HTTP/media behavior.

## Review focus and limits

Judge ordinary steering and brake-turn freedom in the film and playable build, then try the new tune from a historical saved build. An endpoint screenshot can hide the old curve oscillation; use the continuous take and scored RMS/peak. Numerical data is in verification/P09C-complete-data.tar.xz with a complete original/extracted hash map.

The film uses a disclosed control-only driver for comparisons/racing, actual keyboard for free driving, and explicit restart; it does not fake a filmed rollover. Source tests cover the actual stress-case overturn/recovery. Human driving enjoyment/listening, physical controllers, destination-hardware behavior, G3/G4 and final OEM fidelity remain open. Current engine sources are unchanged; no new engine A/B is required for this driving-only pass.

Next action: Astra review of this packet and owner driving feedback. Do not restart an older phase or invent a further assignment.

The numerical archive uses standard TAR hardlinks for byte-identical decoded records, preserving every logical file path and SHA256. No rows or precision are removed. Python tarfile or 7-Zip can restore it; `python scripts/verify-p09c-packet.py` verifies the ZIP and all nested logical members directly. The first over-cap packaging attempt is recorded in packaging-01/failure.json.
