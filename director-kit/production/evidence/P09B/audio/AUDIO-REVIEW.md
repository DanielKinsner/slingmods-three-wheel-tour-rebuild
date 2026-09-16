# P09B audio implementation and review

## Delivered sources

- `public/assets/audio/p09b-cues`: 18 short deterministic modal-contact/noise cues. These are original authored game sounds, not recorded physical products or ElevenLabs output.
- `public/assets/audio/p09b`: seven RPM anchors (1200, 1650, 2200, 3000, 4000, 5300, 6800), independent load/lift beds, retained road/wind/shift, and a narrow owner-recorded Thermal texture.
- `public/assets/audio/p09b-departure/thermal.wav`: local 5.8-second excerpt of the unmodified supplied WAV. Source in/out 0.2–6.0 seconds; gain 0.85, 40ms in/250ms out fades. Its large envelope rise at source ~2.5 seconds maps to cinematic pull-away at ~2.3 seconds. This is envelope alignment, not a claim that a particular ignition event has been identified by ear.
- Original owner WAV and its hash remain in `director-kit/director-addenda/review-17/owner-audio/`. No upload to an external provider.

Every runtime bank has a hash manifest. Reauthor from the tracked script:

```powershell
python -m pip install -r scripts/audio-authoring-requirements.txt
python scripts/author-p09b-audio.py
```

Installing authoring dependencies is optional for running the game: all baked audio is tracked. The game requires no key, provider connection, generated runtime request or external media URL.

## Service allowance decision

`generation-decision.json` records **zero generation calls, zero requested generated seconds, zero spending and zero account changes**. Current official endpoint/model and pricing sources were checked. No ElevenLabs key was present in process/user/machine named variables, project/home env configuration or identified local provider configuration. Prior authoring code explicitly used an ephemeral process environment variable. The available home env had a different provider only; its values were not printed or used. No old credential was recovered from conversation logs.

An account-specific prepaid allowance and safe per-request billing cap could not be established. Current API pricing and legacy credit descriptions differ. Therefore no metered request was made, following packet02's fallback. The requested audio work proceeded using authored cues and the supplied recording.

## Routing and lifecycle

One `GameAudio` owns one AudioContext per active scene. Module-scoped decoded-bank promises deduplicate concurrent preparation and context recreation in that document. One-shots have an eight-voice cap, priorities, per-cue cooldowns and bounded transaction-key deduplication. There is no hover handler or playback queue.

Callers dispatch after validated changed transactions; preset application emits one cue, and failed/no-op/rehydration/stock-comparison/Undo paths do not create installation sounds. Legacy workshop and Chapter02 career purchases/equips follow the same rule. Existing master/mute settings migrate unchanged; Interface and Engine levels default to1 and persist separately.

Engine, opponent, interface, door and Thermal buses all enter the captured master through a compressor/headroom stage. The actual MediaRecorder tap is after that stage. No HTML audio element or soundtrack overlay bypasses capture. Gain changes use short ramps.

Thermal eligibility is captured at departure begin. Its source offset comes from `ShowroomDeparture.elapsed`; pause stops the source and resume restarts at the cinematic sample offset. Stock, muted or locked starts never arm a later burst. Skip, cancellation, removal and disposal disarm it. Synthetic player engine is ducked while the recorded departure is armed; normal engine mix restores through the graph ramp afterward. Existing bay-door recording remains on its own captured bus.

## Engine attempt and limitations

The old P03B2 bank is retained unchanged. The new shared bank replaces its bright harmonic stack with a damped pressure-pulse source, restrained body harmonics and lower-level intake texture. Seven closer source anchors use adjacent equal-power log crossfades; active beds preserve commanded RPM with playback rates between0.72 and1.4. Throttle/load/lift and shift events remain mapped from simulation telemetry. No drivetrain or physics change was made for audio.

The owner clip contains a near-steady low-frequency interval around4.55–5.35 seconds. It is locally bandpassed and loop-crossfaded as a **low-gain supplement only** between2800 and4000 gameRPM for Thermal-equipped builds, not stretched across all gears. Reference3400RPM is an authoring estimate; shaft RPM was not measured. The complete changing rev is never used as a permanent engine loop.

Missing source states: measured steady idle/load/lift at knownRPM; clean sustained highRPM acceleration/deceleration; and stock recordings with matched microphone conditions. Final OEM/Thermal fidelity and human by-ear approval remain open. Available verification was PCM/spectral/envelope inspection, real WebAudio analysis/capture and numerical comparison; no human listening judgment is claimed.

## Review and repair evidence

- First five-anchor attempt had a real crossover defect: its lower rate clamp detuned the upper contributing bed. Existing pitch-coherence tests caught it. Repaired using seven closer anchors; the original exact-RPM test remained unchanged and passed. Earlier A/B `engine-ab-02` is historical; **`engine-ab-03` is the repaired candidate**.
- `engine-ab-01` failed before rendering because a harness import used `simulation.ts` instead of `simulation/index.ts`. No audio file was produced in that attempt.
- Browser `browser-01` sampled an analyser too soon after cold graph initialization at100ms. The retained failure is distinct from the400ms settled analyser checks in passing `browser-02` and final **`browser-03`**.
- Updated the old capture test asset router to serve the new local banks and moved output-connection assertions to the actual post-limiter master. Player-only, opponents-only, mixed and pause windows, media faults, track cleanup, stereo and sync checks passed.
- Focused11 source/native-capture tests passed; TypeScript passed. Final integrated full-suite/performance results are in the parent P09B receipt.

## Engine A/B

Current `engine-ab-03/Engine-AB-level-matched.wav` is35seconds: five states, old then new, 3seconds each with0.5second separators. `LISTEN.html` labels every segment. `level-matching.json` records per-state gains and levels: target-23dBFS RMS, maximum A/B pair discrepancy0.0145dB after common edge fades. Both unmatched renders have zero clipped/nonfinite samples.

This is the actual old/new runtime graph and banks rendered in OfflineAudioContext with identical explicitly scripted telemetry states (idle, steady, acceleration, lift, shift). It is a controlled source/mix comparison, not a claimed captured race or subjective approval. The current game film is separately captured from the live master bus.

```powershell
$env:BASE_URL='http://127.0.0.1:5201'
$env:EVIDENCE_DIR='director-kit/production/evidence/P09B/audio/engine-ab-next'
node scripts/render-p09b-engine-ab.mjs
python scripts/match-p09b-engine-ab.py $env:EVIDENCE_DIR
$env:EVIDENCE_DIR='director-kit/production/evidence/P09B/audio/browser-next'
node scripts/verify-p09b-audio.mjs
```

The two browser scripts require the development server (`npm run dev -- --host 127.0.0.1 --port 5201`) and fresh evidence directories. `browser-03/actual-master.webm` contains a short actual engine+cue routing capture; it does not replace the integrated gameplay film.
