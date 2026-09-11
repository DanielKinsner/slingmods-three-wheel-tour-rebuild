# Reproduction

`audio-pitch-coherence.test.mjs` is the new negative regression. Copy it into the project's tests/ folder and explicitly invoke it with the already-installed tsx runner, or port it to the typed test naming convention. The default module path expects placement in tests/. Do not install another runner just for this file.

Astra tested the provided mapper with `AUDIO_MAPPER_URL=file:///absolute/path/to/src/audio/mapper.ts node --experimental-transform-types --test audio-pitch-coherence.test.mjs`. The environment override is diagnostic only. Expected submitted-source result: 2 pass, 1 fail. The separate exact-ratio diagnostic copy gives 3 pass; integrating and validating remains Codex's job.

`ts-resolve-review-only.mjs` was used only in Astra's container to resolve local extensionless imports for the dependency-free input/RPM tests. It is not an application dependency and must not be added to the production build. Use the project's pinned normal runner locally.
