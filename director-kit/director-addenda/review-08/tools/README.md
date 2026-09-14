# Optional review reproduction tools

These reproduce a read-only inspection of the submitted Review08 snapshot. They are not replacement implementation files and do not certify hardware performance.

`python tools/inspect_review08.py REVIEW08_ROOT Astra-Review-07.zip OUTPUT_DIRECTORY` verifies hashes, counts the accessory, compares protected bytes, analyzes provided trajectories and reconstructs the supplied profile's stall positions/light parameters.

Run `tools/replay-recorded-loop.mjs REVIEW08_ROOT OUTPUT_DIRECTORY` using the project's existing TS loader/tsx tooling. It executes the actual race and pure career logic against recorded data; it does not run physics or durable IndexedDB.

`review-ts-loader.mjs` preserves the exact Linux-side review transpiler path. It was used because the full npm dependencies could not be installed. Do not install or depend on that absolute path in Dan's Windows game; use the existing local tsx/TypeScript runner instead.

`regressions/light-pool-stability.test.ts` is a planned P04B2 test, not an executed pass. It needs the installed Three.js dependency and should be integrated/run locally. The blocked browser attempt is included only as a verification-limit record; it is not evidence of a game test failure.
