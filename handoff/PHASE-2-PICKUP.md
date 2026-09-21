# Phase 2 pickup brief — start here if you are a new agent

Written so any agent can be told "pick up at 2D" with no access to earlier chats. Read this, then `docs/plans and prompts sep 21/01-MASTER-PROMPT.md` (house rules + the Phase 2 section), then the handoff note of the slice before yours.

## Where Phase 2 stands
| Slice | What | State | Note |
|---|---|---|---|
| 2A | Post pipeline, Low/Medium/High/Ultra, dynamic resolution, bloom | done | `PHASE-2A-RENDER-PIPELINE.md` |
| 2B | Time of day: Golden hour, Dusk, Night, After rain (+rain variants) | done | `PHASE-2B-TIME-OF-DAY.md` |
| 2C | Wet road, puddles, mirrored underglow | done | `PHASE-2C-WET-ROAD.md` |
| — | Draw-call cleanup | done; car decision open | `PHASE-2-DRAW-CALLS.md` |
| **2D** | **Harbor water** | **next** | below |
| 2E | Car touches the world (smoke, spray, sparks, skids, brake glow, exhaust) | todo | P11 `vfx/` |
| 2F | Contact shadows / AO, shadow tuning for the chase cam | todo | |
| 2G | Ridge forest | todo | P11 `ridge-trees/`, `ground-cover/` |
| 2H | Texture pass on flat-coloured surfaces | todo | P11 `material-library.json` |
| — | Benchmark/test scenes on the same pipeline, avg + 1%-low per preset | todo (Phase 2 done-criterion) | |

Owner decisions already made (do not re-ask): three.js-native passes, no new dependency; After Rain is visual only (no grip change); Dusk-rain / After-rain are the default looks on Express / Harbor; career events and Ridge keep their validated base look; 2K skies.

## Slice 2D — what "done" means
Master prompt: replace the harbor water shader with two scrolling normal maps at different scales, Fresnel reflection of the sky/env, depth-based colour (shallow turquoise -> deep blue-green), shoreline foam from depth, sun glitter, gentle vertex swell; boats bob; at night it reflects harbor lights as long vertical streaks.

- Current water: `src/presentation/harbor-water.ts` (`createHarborWater`, patched onto the `Showcase_Moving_Water` material in `showcase.ts`; pinned by `tests/harbor-water.test.ts`). Rendering only, no physics.
- Assets already authored: `public/assets/p11/harbor-water/` — `swell-normal`, `chop-normal`, `foam`, `caustics`, `depth-color-lut` as KTX2, plus reference `water.frag.glsl` / `water.vert.glsl` / `water.json`. Load with `src/presentation/ktx2.ts` (`loadKTX2`); compressed textures cannot flip Y, so negate `normalScale.y`.
- There is no depth buffer to sample cheaply: the existing shader uses an authored quay-distance gradient for depth. Keep that approach (or bake a shore-distance map) rather than adding a depth pre-pass.
- Every look in `src/presentation/time-of-day.ts` must read well: the water takes sun colour, fog and env from the active look. Night streaks: stretch the lamp reflections vertically in the shader; do not add a second planar pass (the wet road already owns one, see 2C).
- Boats: the `skiff` module is an instanced batch (`showcase.ts`); bob by rewriting instance matrices, not by un-instancing.
- Budget: harbor High must stay under 10 ms. It is ~840 draw calls / 7–11 ms after the cleanup. Water must add no render pass on Low/Medium.
- Toggle: effects follow the Graphics preset (`graphics-settings.ts`); honour reduced motion for swell/bob (`motionReduced()` in `speed-feel.ts`).

## Rules that have already cost us once
1. **Hosted build ships an allowlist.** Anything new the game downloads must be added to `demo-assets.json` (CRLF file) and should be optional at load (`optionalDriveAssetURLs` in `src/signature/drive-preparation.ts`). `tests/phase1-speed.test.ts` fails if a download is not allowlisted. Verify on the real package: `npm run deploy:build`, `PORT=8071 node scripts/serve-demo.mjs --publish`, `node scripts/perf/hosted-check.mjs`. Pushing `main` auto-deploys to Vercel.
2. **Never silence `git add`; never list deleted paths in it.** Before push: `git show --stat HEAD`. After: `git diff origin/main --stat` must be empty. Pull first (Codex may be working in parallel).
3. **Line endings are mixed per file** (`git ls-files --eol`). Edit bytes in place; a whole-file diff means you converted one.
4. **Nested renders and per-pass material changes make three.js re-resolve programs** (GC hitches). Extra passes are top-level steps before `pipeline.render`, in the order: mirrors -> wet road -> frame (`src/express.ts`).
5. **Measure with `scripts/perf/draw-census.mjs` and `scripts/perf/pass-cost.mjs`** (dev server `tour-dev` on 5186, see `.claude/launch.json`). Benchmarks are one car; races are four. Park any open preview tab on a static URL first: it renders the showroom and skews GPU timings.
6. Assets are fixed at source (portable Blender in `.tools/blender-4.5.2-windows-x64/`, scripts in `scripts/`), never patched at runtime.
7. Each slice ends with: typecheck, `npm test`, one `npm run build`, a driving smoke test, a note in `handoff/`, commit, push. The owner is not a coder: report in plain English, bottom line first, with exact hand-test steps; give decisions as lettered options with one "(Recommended)"; an observation from him is a discussion, not a work order.
