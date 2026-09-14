# P05 final integration reviewer pass

Reviewer: p05_career worker, separate reviewer of lead-owned crew/simulation/audio/hero integration; author of the career subsystem. This is a bounded source audit plus specifically listed regression execution, not an independent approval of every component.

## Scope and provenance

Root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.
Baseline HEAD at audit start: `76d3668089d1dac31b9b3f82fc93b9d597a17e3f`. The lead/competition worker are concurrently repairing native four-car contact behavior. This note therefore describes the candidate and bounded working-tree repairs; the final package must identify the subsequent frozen commit. No commits or gameplay/physics/geometry/audio edits were made by this reviewer.

Read the P05 acceptance cases and delivery requirements, README ordinary chapter flow, crew route/menu, shared simulation/session, competition result proof path, player/opponent audio, hero cloning, light preparation/product presentation and career client/store flow. The lead reported94 tests passing at76d3668; that count is reported context, not a new suite execution by this reviewer.

## Findings and repairs

1. **Controller replacement could abandon the race.** CPU reproduction on76d3668: neutral old controller -> absent controller while paused -> replacement controller holding right face emitted `bay`. The menu retained arming from the removed device. Neutral input while unfocused could also immediately re-arm it. Authorized repair in `src/crew-ui.ts` now tracks index+ID, disarms on absence/replacement/focus loss and only arms from focused neutral input. `suspendInput()` covers disconnect/reconnect using the same identity between rendered samples; the lead wired it into `src/crew.ts` suspension. Five CPU regressions exercise the production menu method, including preserved bare keyboard confirmation. They all pass. The GPU browser script was extended with actual replacement/held-face, same-ID disconnect and unfocused-neutral cases but **was not executed by this worker**; the lead must execute it on the next verified build.

2. **Protected-save recovery was hidden behind loading.** Career recovery usedz-index1000, while the real preparation veil uses9999 and remains pending until careerClient resolves. A corrupt/future stored career could therefore present an inaccessible recovery dialog behind a permanent loading screen. Authorized one-value repair lifts recovery to10000. A real isolated headless Chromium test uses the production preparation veil and careerClient with an actual unknown-schema IndexedDB record. It verifies button hit testing above the veil, performs the native temporary-play click, resolves a session-only client and verifies the original stored record remains byte-for-byte equivalent. This test passes; it creates no WebGL renderer and is not game/performance evidence.

3. The prior denied-storage crew handoff defect is fixed in76d3668: crew is included in the same-origin allowed scene list. The existing real-page bay -> crew -> bay handoff regression was rerun alongside this pass and passes, preserving the complete session career and actual BuildUI warning, while external origins/unsupported scenes receive no envelope.

Command executed for the bounded repairs: `npx tsx --test tests/crew-menu.test.ts tests/career-handoff.test.mjs` -> **7/7 pass**. `node --check scripts/verify-crew-controller.mjs` also passed. There was no game renderer, scored run, desktop interaction or personal browser profile used by this reviewer during this pass.

## Source conclusions within scope

- README describes the ordinary root-page bay -> solo shakedown -> optional Build -> crew invitation -> two-lap night race -> reward -> saved bay/retry path, with day/night time trials remaining separate. Launch commands target the existing repository and preview5187. It explicitly identifies virtual credits, limited scope, review status and held physical-controller/listening/foreground-display judgments.
- Crew entry requires the old legitimate firstCompletion flag, with no equipment/purchase requirement. Awards use the manager's cached certified result; repeated delivery remains attempt-bound in the serialized store. Reset/navigation are blocked only while reward writes are pending; rejection clears pending and retains retry/return actions. Existing solo receipts, price and PB/settings namespace are preserved. Safe migration and explicit recovery remain in place, with the visibility correction above.
- Shared-world source has one force application per participant followed by one authoritative fixed step, dynamic bodies using one tire/drivetrain implementation, and support-query filtering that excludes vehicle bodies and sensors. Initial world preparation contains a raw broad-phase initialization step then restores initial poses; simulation/event telemetry remains zero. Exact parity and contact behavior require the separately recorded tests, not source inspection alone.
- Each rival presenter has its own mutable materials, cloned skeleton/driver and rear bindings while sharing geometry/textures. Rival disposal removes its root/materials/skeleton resources without disposing shared geometry/textures. The player and each rival read their own telemetry IDs.
- Opponent audio has two persistent slots in the player's existing context, shares decoded buffers, uses actual pose/RPM for distance/pan/rates, and applies lifecycle/mute/volume through mapped bus gains. There is no independent audio-session clone per vehicle. Signal/source inspection does not establish human listening quality.
- Player spotlight/kit budgets and pre-play renderer preparation remain in the inspected integration. Rivals do not allocate individual headlights/kit lights. Stable source allocation does not by itself certify the new four-car frame-time target.

## Explicit unresolved limits at this pass

- **Do not certify P05-06/07/18 yet.** The lead reports a native repeat first-attempt Maya invalidation following real contact; root and competition worker are actively repairing it. Earlier clean seeds or CPU tests do not erase that failure. Preserve its evidence and rerun normal full-field native first/retry cases on the repaired frozen build before claiming the field completes normally or performance passes.
- The new controller integration script still needs actual-browser execution on that frozen build. The CPU menu tests certify only menu state transitions, not a physical controller or displayed game integration.
- Final video, stills, matrix and delivered source need matching hashes after these repairs. This reviewer has not run or approved final video, final performance matrix, physical-controller feel, foreground-display responsiveness, human audio quality or human fun.
- No broad G3/G4 approval. Optional rival quaternion interpolation remains a presentation refinement: the inspected crew renderer interpolates rival positions but uses their latest orientation, while the player orientation is slerped. This is not a claimed critical blocker or permission to expand the packet.

## Working repair hashes (SHA-256)

- `src/crew.ts`: `0c354407e1c3c5ebcdfeaa19b5869206a33c18553bb73398862ae5bad96b0a7f`
- `src/crew-ui.ts`: `398776bd554867b25143deafd43f7ec4563fbf3c168060bd0911fc7dc3d1b017`
- `src/career/client.ts`: `92ea24c72d8b9b5c1c02e52950bccd502e7d5092b650c367594ce833c67aa700`
- `scripts/verify-crew-controller.mjs`: `e14adac14b6de240922ddec2fc775cb3741d9c58478d5ff04695b1d0fe23be8e`
- `tests/crew-menu.test.ts`: `a6654d5610633f7d54fa98af4e6d49556cc0525aaff8de49a70a9d53fc721b53`
- `tests/career-handoff.test.mjs`: `8019928308849fcdc85fe4ad63014721ea9b84eb3918b31248639e31e7bcf3a3`


## Lead verification after the reviewed fixes

The recorded working hashes match frozen runtime7fe1e881b0712be2fa09b4c4eec6baa9d0ebb0d6. Full suite102/102 passes. The real isolated controller integration now passes replacement held-right-face, same-identity disconnect and unfocused-neutral checks; controller-verified/controller.json contains the executed result. Corrupt-record dialog hit-testing runs against the actual preparation veil and preserves the original record. The AI failure is retained and addressed in native-contact-repair.md. Refer to final performance/media reports for subsequent evidence; this source review itself does not certify them.
