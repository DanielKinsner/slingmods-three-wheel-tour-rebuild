# P06 independent live-audio capture review

Reviewed `src/audio/evidence.ts`, `src/audio/game-audio.ts`, `src/audio/opponents.ts` and graph factory. This review used the current shared working files; the accompanying JSON binds their actual hashes. No main-runtime audio file was edited by the reviewer.

Player graph analyser feeds one shared unity mix; each of two persistent opponent graphs feeds its stereo panner, then that same mix. The mix has one hardware destination. A capture adds one MediaStream destination branch and removes only that branch. It does not request microphone, display capture or system loopback. Opponents retain bounded two-slot ownership and their player-relative attenuation/panning. Capture markers are explicit diagnostic oscillator chirps feeding only the evidence destination, with associated DOM flashes; they are not invented race engine audio.

The reviewer identified constructor/start rollback and error/abort cleanup gaps. The lead implemented constructor rollback, idempotent destination/track cleanup, stop cleanup in finally, and ignored aborted late data. `tests/live-audio-capture.test.mjs` verifies those fixes against a native AudioContext and injected recorder failures. Six cases: unsupported MIME, constructor throw, start throw, stop error, late aborted data, and earlier active recorder error followed by stop. All release tracks and leave only the hardware branch. A later active recorder error is still expected to be surfaced at stop; inspect the final source hash if this behavior changes.

## Verified current isolated tests

Two tests passed (`live-audio-tests.log`). The content test uses actual production GameAudio, current local decoded audio bank, mapper, rival graph and native MediaRecorder. Telemetry is explicitly a test fixture; one short window directly silences only the player bus to isolate the rivals. This is routing proof, not a driving performance or race presentation recording. The browser is fresh headless Chromium, native wall clock, with host audible output muted. No user's profile or desktop was used.

The decoded test recording contains one stereo Opus audio stream at 48 kHz, 3.000 seconds, peak 0.2711, 0 nonfinite and 0 clipped samples. Player-only RMS 0.04987; opponent-only 0.00909; combined 0.05548; paused effectively zero. All three diagnostic chirps were found in their expected time windows, with 20–40 ms peak-window offsets and 20 ms spread; real associated DOM flashes were observed. These numerical checks do not establish human-perceived mix quality or main-video synchronization. The final chapter video still requires its own beginning/middle/end audio/video checks and provenance.

Duplicate capture start is rejected. Normal stop restores one hardware branch, ends its media track and clears buffered chunks. A second recording succeeds. Disposal of an active third recording closes its context, ends every destination track, leaves no buffered aborted chunks and removes sync flashes. No duplicated audible routing was observed by connection accounting.

`live-audio-test/report.json`, `faults.json` and `actual-graph-routing.webm` are the test artifacts. Streaming WebM may omit a container duration field, so encoded track fields were read with ffprobe and duration was calculated from fully decoded PCM sample count. Context sample rate and encoded stream sample rate are distinct fields.

No subjective listening approval, physical-device approval, G3/G4 approval, actual continuous-race audio/video approval or performance claim is made by this review.


## Final capture cleanup addendum — 2026-09-14T19:50:29.065230+00:00

The current lead repair immediately releases its recording branch and ends tracks when an active recorder error is received. A later stop rejects that failure and clears already buffered data. The six fault cases now assert zero buffered chunks, and the active-error case explicitly observes release before stop. Both focused tests passed again into the new `live-audio-final-routing/` directory (`live-audio-final-tests.log`). Source SHA-256 for `src/audio/evidence.ts`: `1e3a34113af4f8bd41dc74e88c568d71203d2f78dfdf540047f2dc5cf088e2ff`. Test SHA-256: `0fe6198264e5b565ab72b26b775d25bc1147f06a5d807e760caf75fb9d975b9b`.

The test harness accepts `AUDIO_EVIDENCE_DIR`; its default is a timestamp and random suffix, shared by both tests. It exclusively creates the run directory and exclusively creates artifact files. A second invocation targeting the existing final directory failed with EEXIST before browser work; all original artifact hashes remained unchanged (`live-audio-no-overwrite.json`). No historical routing evidence was overwritten.

Final decoded duration: 3.06 s; sample peak 0.27130651473999023; clipped 0; nonfinite 0. Original fixture-only/native-clock/no-subjective-approval limitations still apply.
