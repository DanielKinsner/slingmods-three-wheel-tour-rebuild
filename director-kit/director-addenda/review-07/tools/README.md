# Independent review tools

These scripts inspect the supplied **Review07 snapshot**; they are not game patches, Blender authoring scripts, or a replacement for the project's test runner. Keep them outside the live implementation or within a clearly labeled director addendum. No npm dependencies were installed and no game inputs were modified during this review.

## Python checks

Requires Python 3, NumPy and SciPy. Run against an extracted snapshot and the real prior ZIP (read-only):

```sh
python inspect_snapshot.py /path/to/review07 --previous-zip /path/to/Astra-Review-06.zip --output /path/to/output/inspection.json
python check_recorded_linkage.py /path/to/review07 --previous-zip /path/to/Astra-Review-06.zip --output /path/to/output/linkage.json
```

`inspect_snapshot.py` validates manifest sizes/hashes, captured inputs and protected files; parses GLB world coordinates; runs complete triangle-versus-box SAT against the conservative tire envelope; and samples tire vertices against reserved storage boxes. SAT axis sanity fixtures run before the model check. An empty rest-center bounds prefilter is not a general solid-union/manifold proof. It does not run the project's Blender moving-link BVH validator or prove engineering/OEM dimensions.

`check_recorded_linkage.py` independently reconstructs attachment points from the *recorded* matrices, computes visual arm-length/sleeve differences, checks same-height history/spin invariance, and compares the supplied lap physics telemetry to the previous archive. It does not launch Three.js, Rapier or a browser. It checks supplied evidence, not fresh physical motion.

## Focused Node tests

The following was independently executed in the unpacked input snapshot:

```sh
node --no-warnings --loader /mnt/data/SlingMods-Astra-Review-07/tools/review-ts-loader.mjs --test tests/input.test.ts tests/drivetrain-wheel-speed.test.ts tests/audio-pitch-coherence.test.mjs tests/harbor-race.test.ts tests/harbor-save.test.ts
```

Result: **26 passed, zero failed**; the raw TAP log is included. The loader points at this review container's globally installed TypeScript. It only transpiles modules for the dependency-free test subset; it is not type-checking or a portable application runner. In the actual project use the established package scripts and installed dependencies instead of changing them to match this container path.

The project's broader 67-test suite, six browser regressions and successful production build remain **reported by the submitted package**, not independently rerun here. This container had no project npm dependencies or Blender and could not resolve the npm registry. No physical controller, human handling assessment, sound audition or sustained hardware benchmark was executed here.

Images copied into the kit retain their original file hashes. Contact sheets are sampled from the submitted movies; they do not imply all frames were watched. `evidence/SOURCES.json` identifies each copied source.
