# Independent review diagnostics

`inspect_rear_snapshot.py PROJECT_ROOT OUT_JSON` reads the exact Review06 snapshot and writes its intersection/pivot/articulation report. It requires numpy and trimesh in a separate analysis environment. It intentionally matches the old closed firewall component; it is not a future acceptance test for a new geometry. Do not force-install these into the game or change the game to satisfy the old diagnostic. Implement permanent rear-clearance checks using the project's Blender/runtime tools.

`review-ts-loader.mjs` shows the temporary TypeScript transpilation adapter used for Astra's 26 independent dependency-free tests. Its compiler path is local to Astra's container, not an instruction to replace the project's pinned compiler. Local Codex should run the normal existing test/build commands and add the scoped rear tests.

The independent race replay is summarized in evidence/independent-race-replay.json. It re-evaluates submitted positions through fresh RaceAttempt instances, not an independent Rapier drive.
