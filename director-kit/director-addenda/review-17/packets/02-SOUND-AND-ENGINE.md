# 02 — Sound that makes actions feel physical

## Outcome and taste

Create a small coherent sound family used across free configuration, career, race menus and results. Dry, close, restrained, tactile: a brief metal clink/seat when shocks attach; a relay click for lighting; a short clamp/metal sound for the exhaust; a compact latch for the wing; a fabric zip/snap for the bags. Tiny navigation/confirmation sounds sit BELOW those physical changes. No constant hover chatter, slot-machine rewards, arcade explosions or a rev every time the pointer moves.

Use `audio/CUE-PLAN.json` as the initial event-to-cue plan. These are prompts and intended edits, not supplied finished audio. Reuse an appropriate cue across flows and small variants at restrained gains rather than generating a new sound for every button. Existing bay-door audio stays unless a measured mix/lifecycle defect needs correction.

## Bounded ElevenLabs production

The owner says the local key is still available. Discover its existing secure local configuration without printing it; verify provider, authorization, remaining allowance, output support and current endpoint pricing before metered requests. Use a read-only subscription/usage query only as needed, redacting personal/billing identifiers. The service may have changed since the original project setup; current official links are in SOURCES.

Upper bounds for this pass: **24 generation calls including retries, at most60 seconds combined requested output, concurrency1, and no more than the verified existing/prepaid available project allowance. Whichever is smaller wins.** These are ceilings, not generation targets or permission for a top-up. Cache before each call; persist usage after each response. Account/key existence alone does not authorize overages. If a safe per-request cost/remaining cap cannot be established, stop metered calls and finish with retained/user audio plus locally authored cues, recording the exact limitation. No plan, quota, subscription or limit changes.

Current documented service: `POST /v1/sound-generation`, `xi-api-key`, model `eleven_text_to_sound_v2`; explicit duration_seconds0.5–30, loop boolean supported on v2, prompt_influence0–1. Select an output format already supported by the existing plan; no upgrade for PCM. Use explicit durations, normally0.5–1.5sec, and trim processed one-shots locally. See current docs before issuing. Retain prompts/model/settings/request dates, original audio hash, chosen variation, license/source notes and derived edits in a redacted manifest. No raw key/authorization header or signed URL in logs/manifests.

All generation is local authoring-time. Browser game fetches only baked local audio assets. Never put keys in `VITE_*`, client bundles, source control, ZIPs or deployment settings. Test the complete result with the API key absent and external provider requests blocked. Do not resubmit the owner's recording to an external service unless that upload is separately authorized; local analysis/editing is enough here.

## Transactional events, not DOM click beeps

Fire a part-install cue only after a successful validated preview/equip transaction. Distinguish free preview from earned purchase without changing credits. Failed operations, locked actions, rehydrating a save, Undo, stock compare, repeat clicks, render updates and switching category must not accidentally trigger installation or purchase sounds. Batch preset changes into one cue. Avoid duplicate handlers after every panel update.

Brief navigation sound can fire once on actual category/focus activation; hover is silent by default. Rapid keyboard/gamepad repeats get a cooldown. Sliders use a very quiet detent only at meaningful steps/commit, not every pointermove or frame. Simple confirm/back sounds must remain subtle and short. Route cues through the game's captured master mix, never unrelated HTML audio or post-production overlay.

## Audio ownership and mix

Use one clear audio service per active scene/session and a shared cached decoded bank where lifecycle permits; avoid duplicate AudioContexts or repeated fetch/decode on every click. Separate Master, Interface and Engine levels in one compact settings area; preserve existing saved master/mute with a backward-compatible extension. Respect user gesture unlock, muted startup preference, keyboard/controller changes, focus loss, scene disposal and late-resolving decode cancellation. Powering the vehicle and muting audio are different states.

Starting mix policy: UI navigation notably quieter than mechanical install cues; no cue masks driving information. Keep a small bounded one-shot pool, defined priorities/cooldowns and a smooth limiter or equivalent headroom policy. Use short click-free ramps; no gain discontinuities, clipped summing or unbounded tails. Smooth motion-dependent playback/gain updates without breaking real RPM, shift and throttle relationships. Confirm no silent internal bus is omitted from the live capture.

## Thermal clip — actual equipped departure

`owner-audio/thermal sport sound.wav` is the user's original, unchanged:10.427083s/48kHz/stereo/PCM16. Current departure is5.8s with movement beginning around2.3s. Do not assume a fixed idle/rev timestamp based only on the filename. Audition/inspect it using available local audio tools, choose a convincing excerpt and align its events to the actual ignition/pull-away timeline. Record source in/out points, local gain/fades and start offset. Preserve the original and produce derived runtime files reproducibly.

Default: keep the existing departure length and select/crossfade a suitable excerpt. Only adjust the bounded cinematic timing when an actual audible event needs it; don't make people sit through a10-second recording just to hear the entire file. Always allow Skip. No stretching a long changing rev into a permanently looped engine.

Play the Thermal departure only for a validated build containing the supported Thermal Sport SM-7720 exhaust, whether free-preview or legitimately owned/equipped career. Stock and removed-product builds use their appropriate stock/fallback sound. Preserve coherent door sound, duck the overlapping synthetic engine layer, and crossfade cleanly into driving rather than playing two unrelated engines at once.

Schedule from the cinematic's own elapsed clock, not a free-running wall timer. Pause/focus loss suspends both; resume uses correct sample offset. Skip/cancel/scene change/retry/removal prevents tails and late decode starts. Ensure stock-to-Thermal-to-stock sessions don't leave the previous cue armed. If audio is muted/locked, the animation continues and no delayed burst occurs upon later unlock.

The cinematic vehicle motion is presentation, not physical telemetry. Its sound cue may be authored to that motion; it must not fabricate race speed/RPM values or change the physics to match a recording.

## Running-engine pass — do not defer the entire problem

The current bank is original synthesis at several RPM/load states, and Sport is only a gain/rate/filter variation. That is not an adequate stopping point simply because it passes coherence tests. Audit the audible result in available listening tools and the source spectra/envelopes, then make a real source/mix revision. Preserve the old bank for a level-matched comparison.

First inspect the supplied file and already authorized project media for clean steady/near-steady segments. Only derive loops when stable enough: explicit reference RPM (measured or estimated), loop points/crossfades, usable pitch range and provenance. Do not claim an unknown RPM is measured. Do not loop a full changing rev clip across all gears. More recordings may ultimately be needed for load/lift and high RPM; that is a source limitation to disclose, not a reason to leave obvious seams, harsh oscillators or excessive pitch swings untouched.

Improve adjacent-band crossfades, reasonable playback ranges, load/lift balance, idle stability, shift continuity and the mix of exhaust/body/road/wind. Use the same authoritative telemetry as the vehicle. No fake CVT shifts, engine revs on braking wheel lock or disconnect between throttle and load. Do not just lower the pitch and call it a new recorded exhaust.

Generated engine layers may be used only as explicitly original game-sound supplements, within the same total generation budget, after the important UI/mechanical cues. They are not evidence of an OEM/Thermal recording. Keep sample provenance obvious internally and game effect descriptions honest.

Deliver a small **level-matched old/new engine comparison** at idle, steady mid-RPM, acceleration, lift and shifting, and a recorded demonstration of the owner's clip in the actual equipped departure. If a final faithful engine bank is blocked, show the improvement achieved and a concise list of the specific missing source states. No claim of by-ear approval when no listening capability exists.
