# P04A course / event implementation

Owned changes: src/course/environment.ts, src/race/attempt.ts, src/save.ts, src/driving/session.ts, src/simulation/index.ts; three harbor test modules; scripts/harbor-control-agent.ts and scripts/harbor-drive-probe.ts.

The simulation seam injects ground, oriented static boxes, ramps and surface classification. Default calls still use the existing PAD and its exact coefficients. The harbor uses its exported route data only. No mass, contact, steering, tire, suspension, drag, drivetrain or fixed-step equation changed. Camera obstruction can consume the identical route.colliders data. DrivingSession optionally takes resetPose, beforeTick, afterTick, onReset and onPause hooks; old two-argument constructors retain behavior. Reset notifies the attempt before relocation, resets input and resets pose history.

RaceAttempt has ready/countdown/running/finished and an explicit paused flag plus sticky invalidReason. Countdown uses normal zero-throttle/full-brake controls for 180 authoritative 60Hz steps. Timing starts at GO, not the initial finish-plane crossing. Every physics step tests directed ordered planes, interpolates the final crossing fraction, rejects relocation/progress corridor jumps and requires accumulated course distance. More than 0.35 seconds with at least two tire centers beyond road half-width + runoff + 0.25m invalidates. Invalid attempts retain practice time; missing gates cannot finish; completed invalid laps never update a best. Restart clears the entire attempt. RaceResult is immutable by later ticks and retains the earlier compatible record for difference display.

Save schema remains version1 in slingmods-twt-rebuild-v1. Optional records migrate empty, survive existing audio/camera setting writes and retain incompatible historical keys. Compatibility key includes route/version, stock vehicle configuration, rules and day/night. Malformed/unavailable storage is handled without crashing; write/saveBest report persistence failure to the application. Application commits only validated RaceResult once.

## Undressed route gate

Before environment dressing, the explicitly labelled local control agent completed the 1230.86710531256m course through ordinary standard-device InputResolver, DrivingSession, 60Hz Rapier and throttle/brake/steering only. No pose writes after initial spawn. Valid result 78.71920388459373 seconds, 15 ordered gates, 51.5974282511229mph, actual gear1 to2, maximum centerline offset0.6155977807508503m. Proof: harbor-route-probe.json. Artist and lead notified that dressing could begin without route correction.

A separate 120Hz normal-session/night-key probe returned the identical fixed-physics result: harbor-route-probe-120-night.json. This is simulation evidence, not the required final browser films or human driving approval. The evidence controller is not a shipped opponent or player steering assist.

## Focused checks

All60 tests passed after the first9 harbor checks were added; an additional actual course contact/collision check then passed (total61 expected in the integrated suite). Harbor checks cover full countdown/run/initial crossing/valid finish/fraction/repeated result/retry; backward finish, skipped gate, shortcut/relocation and invalid lap; pause/resume and record context; corrupt/unavailable storage and volume/mute/camera preservation; exact route measurement/surface edges/seam/shared boxes/no hidden pad; physical wheel contacts on both edges and seam plus driving into an exported barrier. The accepted pad regressions passed unchanged in the60-test run. Root will run the final full suite after integrated UI and dressed route freeze.

One initial synthetic skipped-gate test incorrectly expected a finished-invalid result after omitting required gates; actual behavior correctly retained an invalid practice attempt. The test was corrected to assert no result and sticky invalidation. No rule or assertion threshold was weakened.

G3/G4 remain pending. Final visual, aural, hardware-controller and complete browser event evidence are separate lead/reviewer responsibilities.
