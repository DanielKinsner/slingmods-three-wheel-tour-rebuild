# Bounded fix — one engine speed across active sound layers

## Evidence

The failing expression is in both engine branches of `src/audio/mapper.ts:9`:
`rate: clamp(rpm / ref, .65, 1.65)`.

At telemetry 2400 RPM, nonzero load beds request effective reference RPMs of 1980, 2400 and 4030. See `evidence/audio-pitch-probe.json`.

Astra executed the included regression against the submitted code: two checks pass, one coherence check fails. A separate diagnostic copy replacing the two rate expressions with `rpm / ref` passes all three. No submitted source was altered and no integrated fix or pleasing timbre has been claimed.

## Assigned correction

Default to **the exact ratio of the existing sanitized RPM to each positive source reference RPM** for all contributing layers. The sanitizer already bounds engine RPM; source reference values are known positive constants. Preserve finite-positive safeguards without clamping an audible layer to a different effective engine speed.

Keep the existing bank, graph factory, phase/loop handling, shift event ownership and lifecycle logic. Do not generate another audio library or use paid services. This fixes a mathematical inconsistency; authentic exhaust character remains a separate hold.

A narrow-band resampling policy is acceptable only if its audible weighting and coverage are correct. Merely fading all unsupported beds with the old ratios leaves a gap between 1980 and 2340 RPM for this three-bed bank. Do not introduce silence or manipulate the reported RPM to pass.

## Regression

Copy `regressions/audio-pitch-coherence.test.mjs` to the project's `tests/` and run it explicitly with the **already installed** `tsx` runner (the current `npm test` glob includes only `.test.ts`). Alternatively port it to the repository's typed-test style, preserving the assertions. The optional `AUDIO_MAPPER_URL` environment variable is for isolated diagnostics; do not set it in normal project validation.

Assertions: nonzero beds represent the same telemetry RPM through acceleration/deceleration samples; continuous finite nonzero coverage; lifecycle/road-at-rest behavior preserved. Add full-suite/browser/media checks after integrating. Keep the original failing diagnostic log; do not edit the historical evidence or weaken a tolerance to bless the mismatched ratios.

Capture one short numerical/spectral before/after fixture at 2400 RPM with the same source graph and a new ordinary-route film with the fixed audio. A waveform/spectrum does not certify timbre. Report whether genuine auditory audition actually occurred; do not invent a listening reviewer.
