# Astra Review18 — P09B Signature Finish

## Review first

Play `media/P09B-Signature-Finish.mp4` in the ZIP (3:04). It shows the current showroom, finishes, installation cues, physical dash, Thermal-equipped bay departure, driving/braking/reverse, actual earned result, purchase and returned build. This is edited real-speed game footage with actual captured master audio, not a replacement soundtrack. Then open `media/engine-ab/LISTEN.html` for the35-second labeled level-matched engine comparison.

Read P09B-AUDIT.md, PERFORMANCE.md, UI-REVIEW.md and AUDIO-REVIEW.md. `handoff/P09B-VALIDATION.json` is the combined machine-readable receipt. `verification/P09B-complete-data.tar.xz` contains the complete relevant numerical/verification record, including failures and retries. Twelve selected screenshots span ordinary720/1080 UI, cockpit, departure, settings, racing and earned workshop.

## What became playable

- A coherent vehicle-first interface across free configurator, saved recipes, earned chapters/Cup, workshop, race HUD, ready/pause/results and recovery. Existing gameplay and five freely previewable products remain.
- 18 restrained authored action cues dispatched only after successful changed actions, with bounded voices and saved Master/Interface/Engine mix levels. Enabled audio intent carries across scene transitions when the browser permits.
- A powered physical Driver-home display in the existing cockpit lens, with selected-build thumbnail and actual speed/RPM/gear, plus independent showroom dash power. Unsimulated fields are unavailable rather than invented.
- Owner-supplied Thermal recording synchronized to the equipped departure, including pause/resume/skip and stock/mute/lock negative behavior.
- A bounded engine improvement attempt with seven coherent RPM anchors, telemetry-driven load/lift/shift mapping and a narrow, disclosed owner-recorded Thermal texture. Old sources retained for comparison.

## Preservation and evidence

Current front fascia, continuous accent lights, honeycomb, filled splitter, unbraced roll hoops, showroom floor/lift/bay, finishes and swingarm accent remain. No destination, vehicle, route/collision, suspension effect, reward or Sport-v2 simulation change. Existing progress/schema4 ownership and real-career/free-preview/demo isolation are preserved.

226 tests, release/static builds, all128 required asset hashes and relevant isolated browser flow pass in a fresh remote clone. Full earned chapter/Cup loop, ownership removal/reload, duplicate/no-op protection, preparation faults/cancellation and early-player-finish pause/resume pass. Native results are reported separately in PERFORMANCE.md; functional checks do not certify timing.

## Git and local play

The owner explicitly superseded the director packet's no-main rule and requested merging and working directly on main. Merge was pushed at `ea58b4f9c1df98ab16629bce24721596b6a43e32`; all subsequent delivery work stays on main. Frozen tested game runtime is `bf1297c9770357cf5a331288b14cae82d5510d86`; main recovery buildea58b4f has identical runtime source/assets. ZIP MANIFEST.json records the packaging commit; the external handoff/P09B-PACKET.json records the ZIP hash. A receipt-only later commit does not alter tested runtime.

Clone the verified private remote on main, `npm ci`, `npm run demo:build`, set `$env:PORT='5197'`, then `npm run demo:preview`. Open http://127.0.0.1:5197/. Ctrl+C stops a foreground server. Local authoring/playback needs no API key. See HANDOFF.md for the current owned server PID and exact commands. Browser saves do not transfer through Git and remain origin-specific.

This lean ZIP is a review packet, not a self-contained game. All required runtime/editable assets, original supplied WAV and authoring code are recoverable from Git; handoff/P09B-REQUIRED-ASSETS.json identifies every heavy asset by path/hash. No historical backup or full mesh/texture master duplication is needed in the upload.

## Limits and next action

No external generation calls or spending: no secure available key and verified prepaid cap were established, so local synthesis and the supplied recording were used. Engine fidelity remains an approximation; measured stock/Thermal multi-RPM source states and human listening approval remain missing. G3/G4, final OEM fidelity, physical controllers/devices, broad hardware and release approval remain open. Same-host Chromium recovery is not destination-device testing. There is no deployment or public hosting change.

**Next: Astra reviews the complete Review18 candidate, timing evidence and engine A/B, then supplies the next bounded direction.** Continue future implementation directly on main as requested by the owner.
