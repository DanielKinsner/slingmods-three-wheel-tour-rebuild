# P10B showcase capture / assembly

Prepared from the successful P10A recording and paired chirp/flash assembly workflow. **Do not capture or encode alongside native performance runs.** The recording script is opt-in and rejects a live Vite/HMR server. It requires an immutable curated snapshot and checks its `review-build.json` identity before opening the isolated browser.

After the lead explicitly selects the frozen runtime and completes native performance:

```powershell
$env:BASE_URL='http://127.0.0.1:SELECTED_STATIC_PORT'
$env:EXPECTED_RUNTIME='SELECTED_12_CHARACTER_BUILD_REF'
$env:EVIDENCE_DIR='director-kit/production/evidence/P10B/film-01'
$env:P10B_RECORD='1'
node scripts/record-p10b.mjs
# Run only after recording has fully closed Chromium:
$env:PATH += ';C:\Program Files (x86)\Common Files\AutoPod\ffmpeg\bin'
$env:FILM_FONT=(Resolve-Path 'assets/fonts/barlow-condensed/BarlowCondensed-Bold.ttf').Path
python scripts/assemble-p10b-film.py director-kit/production/evidence/P10B/film-01 --runtime=VERIFIED_FULL_RUNTIME_SHA
```

Use actual values; these placeholders intentionally cannot certify a candidate. A fresh evidence directory is mandatory. No recording or compression was executed while preparing these scripts; only Node syntax and Python compilation checks were run.

## Planned actual-game sequence

1. Entry and real pointer orbit; actual Tour Wall view. Preview Harbor Sport, switch all four finishes, select final black/red. Install Lighting and Storage to join the preset's Suspension, Thermal exhaust and wing; inspect lights/exhaust; show setup, save build, shop list, all three destination selections and both Ridge conditions.
2. One continuous real-time Smoky Ridge Quick Race, from start/countdown to all finishers and truthful results. Existing test-only pedal/steering driver controls the same simulation. Camera-cycle inputs show cockpit; no vehicle transforms, gates, time or results are injected. Raw trace and exact selected recipe retained.
3. Return with an exact recipe equality assertion and show the same built car.
4. Actual Thermal-equipped test-drive departure **excerpt**, deliberately paused after approximately4.7 seconds, before the real5.8-second transition navigates. A captured and encoded label identifies the excerpt. It is not presented as a full departure/travel film.

Expected final duration approximately200 seconds, hard delivery band180–240 seconds. The encoder retains the full race without speed changes, at1280×720/25fps,1250kbps video ceiling and128kbps AAC game audio. Final film must remain below35MB. If the actual timing falls outside the band, repair the capture pacing or select additional truthful UI material; do not fabricate silence, freeze a frame or accelerate a race to meet the target.

## Audio and evidence

`--mute-audio` suppresses playback on the user's speakers while the game's real WebAudio master is captured. Eight paired original chirp/flash boundaries locate the four segments; the assembler measures the recorded chirps against recorded frames and retains the established160ms drift maximum. Sync markers and loading boundaries are cut. No replacement soundtrack or SFX are synthesized. All four required segments must have captured game audio; none may be silently omitted. Decode checks verify finite samples, nonzero energy and peak below1, without claiming human listening approval.

Keep all raw video/WebM audio, driver bundle, trace, original screenshots, runtime metadata and any failed attempt in Git. Inspect decoded final frames and listen where supported before promoting `FILM-VERIFICATION.json`. The optional career workshop overview was omitted from this bounded capture sequence to preserve a compact full-race showcase; functional career proof remains elsewhere in the review evidence.

Output: `P10B-Cinematic-Identity.mp4`, plus exact bytes/SHA, audio stream measurements, source cut timestamps and explicit excerpt disclosure in `FILM-VERIFICATION.json`.
