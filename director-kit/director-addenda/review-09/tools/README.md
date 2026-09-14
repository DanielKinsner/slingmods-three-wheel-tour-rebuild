# Audit tools, not application code

`inspect_review09.py` independently recomputes delivered manifest/provenance/protected-file comparisons and raw native-RAF statistics. It does not launch a browser, certify hardware data independently or run the physics. Invocation:

```text
python inspect_review09.py EXTRACTED_REVIEW09 Astra-Review-08.zip OUTPUT_JSON
```

`review-ts-loader.mjs` was used ONLY in Astra's analysis container to transpile TypeScript on module load for 31 dependency-free original tests. Its installed-TypeScript path is environment-specific. Do not add it to the game, swap dependency versions or replace the project's normal `npm test` runner with it.

Executed in the extracted Review09 directory:

```text
node --no-warnings --loader /mnt/data/SlingMods-Astra-Review-09/tools/review-ts-loader.mjs --test tests/input.test.ts tests/drivetrain-wheel-speed.test.ts tests/audio-pitch-coherence.test.mjs tests/harbor-race.test.ts tests/harbor-save.test.ts tests/career.test.ts
```

P05 acceptance cases are criteria to IMPLEMENT and execute locally, not passed tests supplied in this kit. Do not represent a case's presence in JSON as evidence it succeeded.
