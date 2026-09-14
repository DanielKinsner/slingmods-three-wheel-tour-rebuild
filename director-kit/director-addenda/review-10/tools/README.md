# Optional Review10 audit reproduction

These utilities reproduce the dependency-free review against an extracted, unchanged **Review10** archive. They do not install libraries, change source, edit saves, claim to run a new physics simulation, or replace the local production test suite. Node with `node:module.stripTypeScriptTypes` transform support is required; the actual review used Node 22.16.0. Use the local project's full `npm test` and `npm run build` for production acceptance.

```text
node tools/run-focused-tests.mjs <Review10-root> <fresh-output-directory>
node --no-warnings --loader ./tools/ts-loader.mjs tools/replay-review10.mjs <Review10-root> <fresh-output-directory>
```

The first runs the ten named test files (53 tests in the reviewed source). It is not a TypeScript type check. The second feeds the two preserved P05 physical trajectories into fresh race-manager instances and exercises pure reward transitions. The starting solo award is a constructed valid fixture, not newly driven. Browser IndexedDB durability, forces/collisions, audio audition and hardware performance are outside these tools.

Write outputs to a new evidence directory rather than overwriting historical results. A changed future race implementation may legitimately have different fixture expectations; investigate rather than changing old raw data to obtain a pass. The root `evidence/independent-inspection.json` contains the original manifest and native-RAF recalculations, not a new machine's profile.
