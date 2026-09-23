# Three-Wheel Tour audio candidate

Owner assignment, September 22, 2026: redesign the game sound comprehensively, use the supplied temporary ElevenLabs access, add appropriate cinematic electronica, keep showroom music low with an off option, and work independently of the three other worktrees. This is a local integration candidate; no push, merge, publication or deployment occurred.

Branch: `codex/audio-redesign`. Base: `35cadcfb3c2a` from main. Isolated checkout: `.codex/worktrees/audio-redesign/slingmods-three-wheel-tour-rebuild` under the user's home directory. The owner's untracked `P06C-HOME-KICKOFF.md` and the premium UI, rider and race-cinematics worktrees were not edited. No subagents, new dependencies, physics changes or performance-gate changes.

## Listen and play

The packaged listening room is at `http://127.0.0.1:5379/assets/audio/tour-audition/index.html`; the candidate game is at `http://127.0.0.1:5379/`. The server is loopback only. The listening room has the actual 24.6-second post-limiter audio walkthrough plus individual score, vehicle, environment and foley previews. Individual previews use their asset levels, not the quieter game balance.

In the game, explicitly **Enable sound**, then **Sound mix**. Master, Interface, Engine, World and Music are independent. **Music off** persists zero music through scene recreation and compatible save loading, without muting engines or environment. Showroom score is restrained; the engine idles more quietly there. The existing showroom power button now also controls the audible engine. Music never bypasses browser activation, master mute, pause or focus loss.

Recover locally after checkout:

```powershell
npm ci
npm run demo:build
$env:PORT='5379'
npm run demo:preview
```

The static server prints its owned PID and stop command. Dependencies were reused locally through a `node_modules` junction to the original checkout; it is not committed or needed on another machine. Vite's development cache is isolated under this checkout's `.cache/audio-vite`. The development server used port 5217. Port 5218 was already occupied and was left alone.

## What changed

There are **71 newly mastered sounds**: 28 RPM/load/lift vehicle beds, shift/road/wind layers, 15 world/contact/ignition assets, 22 interface/workshop/race cues, and three instrumental score loops. The engine bank also retains one unchanged owner Thermal supplement, making 72 bank entries. Runtime audio adds approximately 18 MB, plus a compact listening-room walkthrough. Historical audio banks, door recording and Thermal departure recording remain intact.

| Area | Audible behavior |
|---|---|
| Slingshot | Designed four-cylinder textures across seven RPM references, separate load/lift spectra, existing limited Thermal treatment when fitted, one shift engagement cue per actual shift. |
| Ryker | Independent designed three-cylinder sample beds following CVT telemetry; no discrete gear-change sounds and no Slingshot Thermal layer. |
| Driving contact | Dry road rumble, speed-related open-cockpit wind, grounded tire scrub, gravel texture and wet tire spray. World slider owns these layers. |
| World | Distinct marina, coastal highway, ridge forest and showroom beds; outdoor night insects and rain follow the scene look. Environment recedes with speed. |
| Body movement | Bounded suspension/landing foley and heavy deceleration impact inference. Normal braking, reset, paused samples and repeated hits are suppressed. This is telemetry inference, not a new collision system. |
| Interface/workshop | Coherent restrained D/A tonal family, real textured assembly/latch/paint foley, correct component classification for both vehicles, transaction/cooldown gating and existing eight-voice bound. |
| Races | Countdown/start, accepted checkpoint changes, valid finish, explicit invalid/DNF result and free-drive recovery cues. No new reward or finish logic. |
| Score | Three original instrumental cues: **Built for the journey**, **Find your line**, **Beyond the ridge**. Garage/result, race, and ridge/free-drive moods crossfade. First 18 seconds of each 100-second free-drive interval leave room for natural sound. Important cues duck the score temporarily. |
| Lifecycle | One captured master limiter; all new buses obey mute/pause/disposal. Music loads lazily, caches at most two tracks, and owns at most two crossfading voices. Environment foley is capped at six one-shots. Late loads cannot attach to a disposed scene. |

`ui.error` is retained as a spare cue in the authored library; existing screen-specific error handlers are unchanged. No announcer, licensed commercial songs or invented character dialogue was added. Existing door motion and the owner-recorded Thermal departure remain on their established clocks.

## Integration with the other worktrees

The delivery is split into an **asset/authoring commit**, a **runtime integration commit**, and this handoff/evidence commit. `AUDIO-REDESIGN-VALIDATION.json` records the first two exact IDs. Apply assets first; the assets are usable independently of the game changes.

Most code is under `src/audio/`. The shared-file changes are intentionally small:

- `src/express.ts`: send place, weather, free/race and phase into `setSoundScene`; keep ready-screen ambience active; cue successful free-drive recovery. Continue using the other branch's frame/cinematic code and insert these calls at its existing audio update point.
- `src/signature/scene.ts`: pass the existing ignition state to `setEnginePower` immediately before the ordinary audio update. Keep other branches' UI, rider and cinematic work.
- `src/save.ts`: additive `musicVolume` and `environmentVolume`, with defaults .45/.8 and zero preserved. No save version, vehicle IDs, records or career schema changes.
- `demo-assets.json`: append this package's asset paths. Merge as a union with the other branches' entries.
- `src/audio/tour-controls.css`: owns just the expanded sound menu. A future UI redesign can move the same controls while retaining the IDs and handlers; five sliders plus Music off are required.
- `scripts/static-demo.mjs`: add Ogg/MP3 MIME types for the local packaged listener.

The race-cinematics branch can call `setSoundScene`, `cue`, and existing departure methods. Do not add a second score/AudioContext, replay countdowns during camera cuts, or bypass the shared post-limiter capture. Runtime logic only reads simulation/race presentation state.

To locate delivery commits without relying on directory names:

```powershell
git log --oneline codex/audio-redesign -- public/assets/audio/tour-engine-v1/provenance.json
git log --oneline codex/audio-redesign -- src/audio/tour-director.ts
git log -1 --format=%H -- handoff/AUDIO-REDESIGN-VALIDATION.json
```

## Authorship and rebuild

`assets/audio-redesign/sources/` retains 29 untouched ElevenLabs responses: 26 sound-effect designs and three 64-second instrumental compositions. `generation-plan.json` records the exact prompts, durations and models; `generation-receipt.json` records hashes and returned metadata. One initial overlong prompt was rejected before creation, shortened, then generated successfully. No automatic retries or account/plan/purchase changes were made.

The key lacked subscription-read permission. Successful SFX responses reported a total **2,005 credits**; music responses did not return credit cost. This is not a total-account billing receipt. The key is not saved in source, manifests, receipts or browser code. Rebuilding mastered assets or running the game requires no key and makes no provider calls.

The generators use the documented [sound-effects endpoint](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert) and [instrumental music endpoint](https://elevenlabs.io/docs/api-reference/music/compose). Source provenance is user-authorized ElevenLabs generation under the account's applicable terms, plus original local tonal synthesis. Vehicle RPM labels are prompt/reference estimates, not measured recording tachometer values; OEM or aftermarket sound authenticity is not claimed.

```powershell
# Existing local ffmpeg, Python numpy/scipy required for authoring only.
python -X utf8 scripts/audio-redesign/master.py
python -X utf8 scripts/audio-redesign/verify-assets.py
python -X utf8 scripts/audio-redesign/audition.py
# Re-render the walkthrough using the browser script below before transcoding:
ffmpeg -y -i assets/audio-redesign/evidence/runtime-audio-tour.webm -c:a libmp3lame -b:a 192k public/assets/audio/tour-audition/runtime-audio-tour.mp3
```

`generate.py` is the only metered script. It requires an explicit process-only `ELEVENLABS_API_KEY`, skips existing source files, makes no automatic retry, and stops after a failed or uncertain request. Its reported-credit stop cannot measure music charges when the API omits them; it is not a guaranteed financial cap. Do not run it to restore an ordinary checkout.

## Verification and limits

- **417/417 tests passed** in the final full run, including the five new audio regressions.
- **71/71 delivery files decoded and checked**: finite samples, headroom, source/runtime hashes, loop joins and production allowlist. Circular filtering and short endpoint correction repaired an initial loop-boundary discontinuity before final capture.
- Real Chromium runtime service: gesture unlock, banks and music, scene changes, ducking, bounded voices, persistent Music off, mute, pause and disposal passed. The 24.6-second actual post-limiter walkthrough has peak 0.266, RMS -26.65 dBFS, zero clipped samples and zero nonfinite samples. It uses staged telemetry and is not represented as a driven lap.
- Actual showroom at desktop/mobile widths and brief controlled-input driving through Harbor/Slingshot, Ridge/Ryker and Express/Slingshot passed in both development and packaged builds. Packaged scenes have no recorded page/audio asset errors. Ryker generates no shift events. Sound controls have no overlapping rows.
- Curated production build passed: 371 files, 425,811,333 bytes. Existing large-chunk warning remains. The packaged listening room's Ogg playback, category selection, single-player policy and stop control passed.

The first full test run had one regression: an absent attempt ID reset race cue history on every repaint. Normalizing the optional ID repaired it; explicit invalid-result sounds require an actual terminal status. A scene run was interrupted by development hot reload during an edit; the stable development and packaged reruns passed. Test logs and final reports are in `assets/audio-redesign/evidence/`.

No physical sound-device or human listening/fun approval is asserted. No measured OEM sound, full campaign replay, sustained High/Ultra performance pass or Phase 3 start is asserted. Existing performance HOLD remains. The chosen default mix is implemented and ready for direct integration. No user decision, listening sign-off or additional user-run test is required to complete this assignment. The listening room is optional and outside the player flow.
