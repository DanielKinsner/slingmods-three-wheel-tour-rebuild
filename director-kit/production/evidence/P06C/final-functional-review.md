# P06C independent functional evidence review

## Verdict and scope

The nine completed functional reports support their bounded regression checks on frozen runtime `b4eef3c7dab3eb77b131a5100c3be0fd1110b095`. No integration blocker was found in this evidence review. This is an independent read of completed JSON reports and setup logs, not an independent rerun. No browser, Blender, build, source edit, or heavy asset hashing was performed during the concurrent native timing runs.

The reviewed runtime states consistently identify `b4eef3c7dab3`; the bay build manifest records the full frozen commit and `workingTreeDirty: false`. The solo report also identifies that full HEAD. This report does not certify the native performance matrix, final media, continuous motion, physical controller operation, human audio listening, or G3/G4.

## Completed evidence

| Report under P06C | Result supported by the recorded states |
| --- | --- |
| `fresh-final/fresh-flow.json` | PASS. Ordinary fresh navigation starts with zero credits and no kit. Valid solo completion awards 800; purchase costs 600; a valid two-lap third-place crew result awards 550 including the first-podium bonus. Final 750 credits, owned/equipped cyan kit, chapter state and receipts match reload. Reward durability is true and pending is false. Controlled-clock driving is functional proof. |
| `lifecycle-final/lifecycle.json` | Four distinct completed race attempts, all four participants finished and player results valid. Three normal retries produce balances 850, 1000, 1150, 1300: later races award the repeat 150, without repeating the first bonus. All attempts retain 306 geometries and 76 textures. Three subsequent bay/crew transitions retain bay 87/35 and crew 306/76. Controlled clock; logical renderer object counts, not VRAM. |
| `transitions-final/transitions.json` | Three additional native-wall-clock, audio-active crew-to-bay document transitions. Each retains crew 306 geometries/76 textures and bay 87/35 with 13 bay programs. This complements the controlled-clock lifecycle check, without measuring global GPU memory. |
| `controller-final/controller.json` | Three completed virtual-standard-pad checks cover neutral/edge separation at first connection, cameras/lookback/pause/focus-loss neutralization, and replacement/disconnect/focused-neutral rearm. Final state identifies the frozen runtime. The report has no separate error array; the checks and completed log are the available success evidence. |
| `audio-final/audio.json` | PASS for active signal and lifecycle gain control. Shared running AudioContext and decoded buffers, eight player loops and two opponent buses are recorded. Active player RMS is 0.0261 with positive opponent RMS; mute and pause set all master targets to zero; volume 0.25 sets the player target to 0.25 and scales opponent targets. No loading failure is recorded. |
| `crew-ui-final/report.json` | Five completed checks cover ready/blur/countdown, all-participant pause and held-key rearm, actual two-lap podium/result proof, immediate retry without duplicated award, and saved chapter/equipped cyan reload. Recorded third place adds 550 to the earned fixture's 300, with persisted balance 850. Controlled-clock browser UI proof. |
| `bay-final/bay.json` | Four installed/stock comparison states in day/night complete without reported errors. Stock comparison leaves earned ownership and credits intact; compare/night flags match each row and durability remains true. This uses an isolated copied earned fixture migrated by the runtime, not the user's personal save. |
| `interface-final/review.json` | At 1280x720 and 1920x1080 all 11 listed controls are in bounds and hit-testable. Closing Build restores focus to `chapter-build`. Crew help/pause checks show four participants; 16 captures are listed, with no reported errors. This review inspects metadata, not those images. |
| `solo-ui-final/review-functional.json` | Six explicit PASS checks cover selected Night start, quick Enter/Escape/Backspace between frames, held-key/repeat disarm through pause and reset, denied localStorage acquisition, and virtual-pad neutral resume/camera/rearward behavior. Isolated Chromium/SwiftShader, controlled clock and browser keyboard events; no physical input-device claim. |

The seven reviewed reports that expose top-level error arrays record empty arrays. Audio instead has PASS plus empty failure strings; controller uses its completed check list/log.

## Frozen automated checks

`setup/frozen-tests.log` records **121 tests passed, zero failures, skips, cancellations or todos**. Coverage includes shared vehicle contact/support behavior, room teardown, save/ownership/UI contracts, and the new road color channel and original packed masked-frond asset checks. `setup/frozen-parity.log` records **exact parity across 4,200 rows**, digest `7a6c43ce2c55c97c4f9a21997179ee5d0f712b957da13209acd5a19222fd8696`. The frozen build completed; its chunk-size and Node deprecation warnings are non-failing build warnings.

## Limits and evidence wording

- Audio mute/pause snapshots retain nonzero immediate player RMS despite zero gain targets. They do not establish settled output silence or absence of audible tails, clicks or dropouts. The browser output was host-muted; no human audition occurred in this check.
- Bay caption correction: actual recorded `cameraTarget: [0,0,0]` is authoritative over the inherited method prose naming target Y=0.6. All four comparison states retain the same recorded target, position and FOV. The original report and tool remain unchanged; this is an evidence-label correction, not a runtime repair.
- The solo check title's “physically held W” denotes browser keydown/repeat/keyup events in this harness, not an observed physical keyboard session.
- Controlled-clock lap validity and reward evidence are valid for the exercised simulation, but do not establish wall-clock performance. Renderer counts do not prove global memory release. No final native timing result, final video/audio artifact, or full visual acceptance is inferred here.
