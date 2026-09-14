# P05 competition worker — final source review

Reviewed runtime commit: `7414ebfa6e462c897b3bbc604c39aaa26c9956c4`.
Project: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.

## Role and scope

This is a separate worker's read-only review of the lead-owned shared-world extraction and integrated crew runtime, hero clone ownership, input/reset guard, and opponent audio. This worker authored the competition modules and their deterministic tests earlier; that authorship is disclosed, so this note is not an independent-author review of those same modules. The final pass inspected source and existing test/evidence outputs, and wrote only this note. It launched no browser, GPU workload, desktop automation, or new test run while the lead's final QA/performance work was active.

## Previously reported findings

1. **Rival clone disposal — repaired in source.** `src/presentation/hero.ts` now removes the rival root from its actual parent, disposes its cloned skeletons and owned mutable materials, and retains shared geometry/textures. It no longer tries to detach the rival from the unrelated player root. Clone construction binds separate driver/rear presenters and material instances; player cockpit visibility remains per presenter.
2. **Reset during pending reward transaction — repaired in source.** `DrivingSession.reset()` checks `hooks.canReset` before invoking reset hooks or resetting simulation. The crew session supplies `()=>!rewardPending`; menu actions independently reject while pending, and `awardFinish` rejects duplicate concurrent entry. Thus held keyboard/controller reset cannot replace the attempt or its certified proof while the transaction awaits completion. An attempted disallowed input reset may rearm controls, but does not reset the event or mutate its reward identity. Failure clears the pending flag and offers retry/return.
3. **Opponent audio identity churn — repaired in source.** The two existing slots first retain any still-selected rival IDs and assign newly selected IDs only to vacated slots. Merely exchanging near/far order among the same two rivals no longer resets both fades or swaps their RPM sources. The same decoded bank/context, two-slot cap, actual rival telemetry, attenuation/pan, mute/pause state and bounded smoothing remain. This is source verification, not human listening approval.

## Source/evidence integrity

The shared world still applies all participants' retained force calculations before one authoritative fixed world integration, then publishes each participant's telemetry. Tire support rejects dynamic bodies and sensors; car/car collision remains enabled. Initialization performs its disclosed loading-only broadphase step and restores grid poses/times. The integrated ready/intro path does not run the session. Race controls, telemetry, independent rigs and audio reference matching participant IDs. No production path imports the evidence-only player agent.

Crew timing remains separate from solo standing-lap rules. Ordered directional gates, two completed laps, invalid/unfinished/DNF outcomes, fraction-sorted same-tick finishes, immutable certified result proof, and bounded postfinish updates remain present. Finished rivals have a disclosed 15-second physical rollout to clear the finish line; it cannot improve their frozen time/place. Existing solo race/PB keys are separate.

Read outputs: `tests-final.log` reports **93/93 passed**; `parity-final.log`/`parity.json` report **4,200 exact solo telemetry rows**, SHA-256 `7a6c43ce2c55c97c4f9a21997179ee5d0f712b957da13209acd5a19222fd8696`. The earlier competition rule output reports **8/8 passed**. I recomputed every recorded input SHA in `competition/seed-11.json`, `seed-97.json`, `podium-11.json`, and `podium-97.json`: all match current files. All four participants have valid finished results in each run. Those deterministic physics runs and their full fixed-tick telemetry establish controller/rule behavior; they are not native-RAF or rendered performance proof. The separately labeled evidence-only player achieved real first/second place in the podium fixtures.

## Disposition and limits

No remaining critical blocker was found in this bounded source review. The three reported integration defects are repaired. The lead's separate current-build browser, migration, native-RAF performance and capture evidence still determines those acceptance lanes. This note does not certify foreground hardware behavior, physical controller use, artistic fidelity, human audio quality, deployment readiness, G3 or G4; their unavailable/held status must remain explicit.


## Superseding source-review addendum — 7fe1e881b0712be2fa09b4c4eec6baa9d0ebb0d6

This addendum binds the lead-owned/integrated-module review to the new frozen runtime. The earlier7414ebf review and competition evidence statements above remain historical: the subsequently discovered native Maya track-limit failure required the separately recorded stabilization/evidence-driver repair. They are not a blanket approval of the current matrix. This worker authored those competition/controller repairs and does not independently approve its own code here.

All eight reviewed source files below match the SHA-256 values in `dist/review-build.json`, whose commit matches the current full Git HEAD. Read-only inspection confirms that the previously reviewed clone ownership, pending-transaction reset protection and stable opponent-audio identity repairs remain present.

Crew menu confirmation now requires a neutral standard controller after loss of focus, disconnect or changed device identity. The crew suspend path resets both menu and driving input state; held reconnect input cannot immediately activate the menu. Native keyboard/button paths remain available.

The career client marks refresh in progress, updates subscribers, and rejects older-revision asynchronous read/execute responses from replacing newer committed client state. Chapter actions are disabled during that refresh. Persistent read/migration and command execution still use serialized IndexedDB transactions. Upgrade/version guards reject obsolete writers. Unknown or corrupt data reaches explicit recovery choices with export when raw data is available; temporary play is opt-in for such recovery and does not replace the unreadable persistent record. Transaction failures clear pending UI state, leaving retry or another activity available. No critical blocker was found in this bounded source pass.

Read existing verification outputs only: `tests-verified.log` reports102/102 passing; `parity-verified.log` reports the same4,200-row exact parity hash `7a6c43ce2c55c97c4f9a21997179ee5d0f712b957da13209acd5a19222fd8696`. I did not rerun tests, browser work or GPU work during this addendum. Fresh native input/performance/capture and save-recovery execution remain the lead's separate evidence lanes. This is explicitly **not native-performance approval**, physical-controller approval, visual/human-audio approval, or G3/G4 approval.

| Reviewed source | SHA-256 |
|---|---|
| `src/presentation/hero.ts` | `1f7083963643650a3f680b8fc0d0e013d8feec6abacf369da53b9d04c2893165` |
| `src/driving/session.ts` | `28ba566ce3433329c03db9a6448f752e792eba55d7dacfce04ea4c8b66521b6a` |
| `src/audio/opponents.ts` | `fcf6f6b137cc7db9c096f4a60bfb11f4b0995c835585305586b2f480166a55f6` |
| `src/crew.ts` | `0c354407e1c3c5ebcdfeaa19b5869206a33c18553bb73398862ae5bad96b0a7f` |
| `src/crew-ui.ts` | `398776bd554867b25143deafd43f7ec4563fbf3c168060bd0911fc7dc3d1b017` |
| `src/career/client.ts` | `92ea24c72d8b9b5c1c02e52950bccd502e7d5092b650c367594ce833c67aa700` |
| `src/career/chapter-ui.ts` | `0b3cb1523b2e21e5d4b940000a4535d6954d0b071cf0284d8067389054fde7b4` |
| `src/career/store.ts` | `f6dfb8ffb551e362e5156fbea4911a70bfbdcf301d2fea623bea89051e31b146` |
