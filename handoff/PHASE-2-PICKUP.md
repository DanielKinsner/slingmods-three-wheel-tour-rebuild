# Phase 2 pickup brief — start here if you are a new agent

Written so any agent can be told "pick up at 2D" with no access to earlier chats. Read this, then `docs/plans and prompts sep 21/01-MASTER-PROMPT.md` (house rules + the Phase 2 section), then the handoff note of the slice before yours.

## Where Phase 2 stands
| Slice | What | State | Note |
|---|---|---|---|
| 2A | Post pipeline, Low/Medium/High/Ultra, dynamic resolution, bloom | done | `PHASE-2A-RENDER-PIPELINE.md` |
| 2B | Time of day: Golden hour, Dusk, Night, After rain (+rain variants) | done | `PHASE-2B-TIME-OF-DAY.md` |
| 2C | Wet road, puddles, mirrored underglow | done | `PHASE-2C-WET-ROAD.md` |
| — | Draw-call cleanup + merged rivals | done (player car untouched, see note) | `PHASE-2-DRAW-CALLS.md` |
| 2D | Harbor water | done | `PHASE-2D-HARBOR-WATER.md` |
| 2E | Car touches the world (smoke, spray, sparks, skids, brake glow, exhaust) | done | `PHASE-2E-VEHICLE-EFFECTS.md` |
| 2F | Contact shadows and stable chase sun map | done | `PHASE-2F-SHADOWS.md` |
| 2G | Ridge forest | done | `PHASE-2G-FOREST.md` |
| 2H | Texture pass on flat-coloured surfaces | done | `PHASE-2H-SURFACES.md` |
| — | Benchmark/test scenes on the same pipeline, avg + 1%-low per preset | **next** (Phase 2 done-criterion) | |

Owner decisions already made (do not re-ask): three.js-native passes, no new dependency; After Rain is visual only (no grip change); Dusk-rain / After-rain are the default looks on Express / Harbor; Chapter 01 and Ridge retain required base looks; Chapter 02 shares the modern looks after story parity; 2K skies.

## Slice 2E — what "done" means
Master prompt: tire smoke on slides and launches, dust/leaf kick-up off-line, water spray on wet, brake-disc glow at night under hard braking, exhaust heat shimmer and pops of flame on lift (with the exhaust product fitted), headlight cones with slight volumetric fog, sparks on barrier contact, skid marks that persist for the session.

- Inputs already exist: `VehicleTelemetry` (per-wheel slip/contact in `src/simulation`), the wet flag on the look (`activeLook.wet`), `VehicleOptics` in `vehicle-materials.ts` for brake/lamp emissives, fitted products via `signature-art.ts` (`stock_exhaust`).
- P11 `vfx/` holds authored sprites; check `public/assets/p11/vfx/README.md` and add anything new to `demo-assets.json` + `optionalDriveAssetURLs`.
- Particles: one instanced or points mesh per effect kind, pooled, no per-frame allocation; rivals get the same effects at lower density. Skid marks: a persistent decal mesh with a ring buffer. Everything visual only; nothing touches physics or saves.
- Budget: a race is ~1,390 calls / ~10-11 ms on High already. Add at most a few draw calls per effect kind, never per car. Measure with `MODE=race scripts/perf/pass-cost.mjs harbor dusk high`.
- Toggle per preset (`graphics-settings.ts`), reduced motion respected for shimmer/shake-like effects.

## Rules that have already cost us once
1. **Hosted build ships an allowlist.** Anything new the game downloads must be added to `demo-assets.json` (CRLF file) and should be optional at load (`optionalDriveAssetURLs` in `src/signature/drive-preparation.ts`). `tests/phase1-speed.test.ts` fails if a download is not allowlisted. Verify on the real package: `npm run deploy:build`, `PORT=8071 node scripts/serve-demo.mjs --publish`, `node scripts/perf/hosted-check.mjs`. Pushing `main` auto-deploys to Vercel.
2. **Never silence `git add`; never list deleted paths in it.** Before push: `git show --stat HEAD`. After: `git diff origin/main --stat` must be empty. Pull first (Codex may be working in parallel).
3. **Line endings are mixed per file** (`git ls-files --eol`). Edit bytes in place; a whole-file diff means you converted one.
4. **Nested renders and per-pass material changes make three.js re-resolve programs** (GC hitches). Extra passes are top-level steps before `pipeline.render`, in the order: mirrors -> wet road -> frame (`src/express.ts`).
5. **Measure with `scripts/perf/draw-census.mjs` and `scripts/perf/pass-cost.mjs`** (dev server `tour-dev` on 5186, see `.claude/launch.json`). Benchmarks are one car; races are four. Park any open preview tab on a static URL first: it renders the showroom and skews GPU timings.
6. Assets are fixed at source (portable Blender in `.tools/blender-4.5.2-windows-x64/`, scripts in `scripts/`), never patched at runtime.
7. Each slice ends with: typecheck, `npm test`, one `npm run build`, a driving smoke test, a note in `handoff/`, commit, push. The owner is not a coder: report in plain English, bottom line first, with exact hand-test steps; give decisions as lettered options with one "(Recommended)"; an observation from him is a discussion, not a work order.
