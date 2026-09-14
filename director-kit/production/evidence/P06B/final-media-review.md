# Final recorded-media review

Reviewed build: `9348fa90311c5fbdfd74529feb50548582cdca17`, existing rebuild repository. Review performed by the outdoor lane on 2026-09-14. No browser, GPU capture, re-encoding or source mutations were performed for this review. This reviewer authored outdoor lighting/water; this is independent of the final capture operator, not an independent audit of all presentation code.

## Inspected evidence and outcome

I opened the actual saved `video-final/intro.png`, `contest.png`, `cockpit.png`, `final-lap.png`, `result.png`, `returned-bay.png` and `saved-build.png`. I read the corresponding capture provenance, run/state, reload, stream-probe and audio-verification records. These demonstrate a coherent first-chapter night race and return to the saved garage. They do not independently establish full-motion smoothness or subjective sound quality; I did not watch/listen to the entire movie in this review.

- Intro states the two-lap/top-three objective and shows the grid. The recording labels disclose `LIVE GAME AUDIO`, `VIRTUAL PLAYER INPUT` and `PRODUCTION RIVALS / SHARED PHYSICS`.
- Contest shows the normal chase view, player third at roughly 42 mph, actual rivals ahead, clear road-edge lighting and cyan underglow. The player remains distinguishable against the dark asphalt. Rival silhouettes are visible but mostly dark, with sparse color identification at distance.
- Cockpit shows the steering wheel/dashboard, mirrors and hood through the ordinary cockpit view; its runtime state reports mode/active `cockpit`, FOV 76. Driving script review confirms camera button edges and held-look-back device samples through `setDeviceSample`, rather than snapped camera poses or a controlled driving clock. Chase snapshots report ordinary near mode and speed-adapted FOV.
- Final-lap screenshot shows lap 2/2, third place, two rivals ahead while cornering. This image is a mid-lap snapshot, not itself the finish.
- Result shows third place, 2:45.903, +150 placement +400 first podium =550 game credits, balance850. Run state records player finish165902.668ms and no capture errors. The outcome was not a win, and should not be described as one.
- Returned bay shows chapter complete and850 credits. Saved build shows owned/installed SM-133, cyan at60%, lights on, night preview and the deliberate SlingMods product-page action. `reloaded-bay.json` confirms durable850-credit state, a550-credit crew receipt for this attempt, equipped ownership, cyan/.6/enabled, and completed/cleared crew chapter after reload.

The isolated profile began with an existing earned fixture:300 credits and already-owned/equipped cyan underglow. This film proves the subsequent race award and durable return, not a new-user purchase or fresh earning history. Existing earlier fixture receipts are not new evidence from this run. Stationary `bay-final` uses its own300-credit fixture and70% preview; it must not be conflated with this film's post-race850-credit/60% state.

## Media identity and audio limits

Fresh file hashes match the audio verification record:

| File under video-final | Bytes | SHA-256 |
| --- | ---: | --- |
| complete-race-LIVE-AUDIO.mp4 | 52774063 | d7cd2e8f258c62617fd8621a3733ea9879dc27c76f53b1777bc40bc8923957ee |
| complete-race-video-only.mp4 | 48419301 | 1374ef0077bb2ff1f1615bcf6e22bec1d26e80891f3bc6c0a3a3520ee36d3afc |
| live-game-audio.webm | 4275201 | 4603d283f3778dfbd0711e8e36c1022a1d8494c8d4c45f9596c616ffa95d67df |

Stored ffprobe identifies final H.2641280x720 at25fps,199.560 seconds, with48kHz stereo AAC. Audio is the captured live player and nearest-two-rival game buses; it is not dubbed engine sound. Three evidence-only chirps/DOM flashes are explicitly disclosed and retained. A single6.067-second offset aligns their measured start/middle/finish anchors; residuals are -18.67ms,+8ms,0ms. The25fps recording has40ms frames and analysis uses20ms windows/5ms hops, so those residuals must not be marketed as subframe acoustic precision. There is no time stretching.

The saved decoded-source analysis reports zero clipped and nonfinite samples, channel peaks0.21768/0.20816 and RMS0.03922/0.03912. These support clean signal bounds, not by-ear mix approval. Bay/loading intervals have no game audio graph and are silent. This is the recorded/capture lane and cannot establish clean production performance. No unsupported listening, frame-pacing or gate approval is given.

Every inspected screenshot and supporting record has a fresh SHA-256/byte count in `final-review-file-hashes.json`. Do not use the rejected `final-visual` attempt as current final still evidence.
