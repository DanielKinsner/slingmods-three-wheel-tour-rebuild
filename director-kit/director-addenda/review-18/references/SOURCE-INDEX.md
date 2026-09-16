# Evidence and source index

No external rendering/physics documentation was required to derive this code-level steering diagnosis. Findings refer to the actual submitted runtime and complete recorded samples, not manufacturer specifications or claims of real Slingshot handling.

## Submitted sources

- `src/simulation/profile.ts` — per-profile command ceiling and coefficients.
- `src/simulation/index.ts` — brake multiplier, rate-limited request, Ackermann wheels and real tire forces.
- `src/driving/input.ts` — keyboard/gamepad, reverse/focus/pause lifecycle.
- `src/presentation/hero.ts` — visible steering wheel tied to telemetry.
- `src/harbor.ts`, `src/crew.ts`, `src/express.ts` — route-specific active profiles.
- `src/signature/config.ts`, `scene.ts`, `ui.ts` — recipe version/default/selection.
- `src/career-experience/model.ts`, `race-adapter.ts` — career/Cup frozen builds.
- `src/competition/rival.ts`, `stability.ts` — normalized AI/recovery command mappings.
- `tests/p09a-driving.test.ts` — existing v2 stopping, launch, support, brake-turn and old-profile tests.
- `src/audio/interface.ts` and audio graph/presentation modules — cue dispatch/mix/engine/departure.
- `review/PERFORMANCE.md`, nested `verification/P09B-complete-data.tar.xz` — raw native timing.
- `media/engine-ab/level-matching.json`, `Engine-AB-level-matched.wav` — A/B numerical analysis.

## Remote reads during review

Repository: https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild
Observed main: `52c234cb8757cc2cfb387738f800a4056c221237`.

https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/52c234cb8757cc2cfb387738f800a4056c221237/HANDOFF.md
https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild/blob/52c234cb8757cc2cfb387738f800a4056c221237/src/simulation/profile.ts

GitHub metadata returned private:false/visibility:public. Vercel connector get_deployment returned production READY on the same main commit; get_deployment_build_logs returned ordinary npm run build. The chat made no remote edits or deployment changes.

## Limitations

Reviewer scripts used Node22.16 with a read-only TypeScript loader because npm registry DNS failed. They are independent checks, not the full pinned application. Numerical timing comes from the local agent's hardware runs. The film was sampled visually; no by-ear approval or independently recomputed AV synchronization is asserted.
