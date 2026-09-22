# Phase 2 performance: render CPU fixes (2026-09-22)

**Result.** High harbor dusk-rain CPU per frame fell from 13.6 to 9.7 ms (-29%), measured inside one
race with the fixes switched on and off every 3 s. In the one sustained attempt that ran without
outside load, High uncapped met p95 (13.1 ms), p99 (16.5), max (35.3) and the 10 ms average (9.75),
but not worst-1% (24.8 ms against 16.6). **The gate stays HOLD** until both attempts pass on a quiet
PC. Ultra has not been re-measured. Receipt: `PHASE-2-PERF-FIX-VALIDATION.json`.

## Root cause

The game is CPU-bound in render submission (`renderer.render` JS), not GPU-bound. Three costs:

1. **Transparent two-sided vehicle parts** (decals, glass, wheel caps: 25 per car, about 100 in a race).
   three draws each as a back-face half (FLIP_SIDED program) then a front half, flagging the
   material changed before each. Every such draw re-resolved its program (262 times a frame) and
   re-uploaded all material and light uniforms. Hiding only the rivals' transparent parts saved
   4.7 ms a frame.
2. **Scene-graph updates per pass.** Mirrors, wet road and view each call `renderer.render`, and
   three walked all ~2000 objects to update world matrices every call.
3. **Rear presenter** searched each car by name every frame and built an evidence report nobody read.

Frames over ~16 ms also cost a whole extra frame slot, so the saving on average interval is larger
than the CPU saving. Wet-reflection frames (every other frame on High, ~700 extra vehicle draws) carry
most of the remaining tail: CPU p50 10.8 ms / p99 22 ms, against 7.6 / 17 on the other frames.

## Fixes (each exact; `?perf=legacy-<name>` restores the old path, hosted only with `test=1&profile=1`)

| Commit | Switch | Change |
|---|---|---|
| `d2f57e7` | `transparency` | `src/presentation/transparent-halves.ts`: both halves use the plain program; the back half is drawn with the object's normal matrix negated (what FLIP_SIDED computes; negation is exact) and BackSide winding. Same draws, order and pixels. Tangent meshes, transmission and custom hooks keep three's path. Skid marks (flat, seen from above) draw once. |
| `19473ad` | `matrix` | `express.ts`: one `scene.updateMatrixWorld()` before the passes; per-call update off while they run, restored after. |
| `1f6a596` | `rear` | `rear.ts`: attachment nodes found once; the race calls `update(w,false)` and the report is built only in `inspect()`. |

`__EXPRESS.setPerf('legacy' | 'legacy-matrix,...' | '')` flips the switches inside a running race
(evidence builds only). That in-race A/B is the only measurement that survived this PC's load.

**Pixels:** `scripts/perf/render-fixes-ab.mjs` (`602fc6c`) compares all fixes vs `?perf=legacy` at
72 controlled-clock views (player and two rivals; express day, harbor night, harbor dusk-rain): 138
pixels differ in total, at most 15 per 1.44 M-pixel view, none by more than 3/255. Two loads of one
build differ by up to 2 pixels at 1 level.

## Tried and not kept

- Single-pass transparency (`forceSinglePass`): -27% CPU, but hundreds of pixels change (closed 3D
  decals lose their back-then-front order).
- Two-sided (DOUBLE_SIDED) program for both halves: back faces sample the sun shadow with the normal
  bias pointing the other way (normalBias 0.012, 82 of 87 materials receive shadows).
- Only-the-visible-half for flat decals: only 4 of 25 transparent parts per car are flat.
- Instancing the rivals' identical solid parts (225 parts -> 75 draws): no measurable gain in the
  in-race A/B and float-level pixel noise, so removed.
- Sorting opaque draws by program: no gain.

## Measuring on this PC

Timing swings 30-100% with other work: this session Blender (two background instances, ~14 cores),
two ffmpeg encodes, a HyperFrames render and Premiere were running. Pinning the benchmark Chromium to
P-cores improved the tail only partly. Never kill owner apps; ask for a quiet window. The gate command
is unchanged: `PHASE-2-CLOSING-GATE.md` (build, serve 5209, `sustained.mjs high uncapped harbor`,
then `ultra`).

## Next

1. Quiet-PC gate run: High and Ultra uncapped harbor, new evidence directory each.
2. If worst-1% is still over 16.6 ms when quiet, the remaining lever is the wet-reflection frame
   (~700 vehicle draws every other frame); the rivals' transparent parts are the largest single cost
   inside it.
