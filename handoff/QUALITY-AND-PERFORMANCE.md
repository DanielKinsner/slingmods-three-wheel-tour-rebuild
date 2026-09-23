# Quality and performance continuation — 2026-09-23

Owner request: keep improving fidelity, optimization and the unfinished roadmap. Work is local on main;
no remote publication, purchase, physics/input retune, save migration or source-model replacement.

## Implemented

- **4K photo export:** Pause → Photo mode → Photo size → 4K. Renders the actual scene at up to
  3840×2160, preserving aspect ratio and GPU size limits. Temporary HDR/bloom targets are released
  immediately; interactive size, DPR and quality are restored. Export does not advance the simulation.
  Screen-size export remains available. Desktop and landscape-phone controls use fixed grid rows.
  Entering photo mode from cockpit restores the rider's head; leaving restores cockpit visibility.
- **Vehicle shader reuse:** surface kinds with identical GLSL share programs; each material retains its
  own texture, scale, fade and roughness uniforms. Fully faded micro detail skips its texture samples.
  Lacquer, metal, rubber and leather settings, texture resolution and mesh detail are preserved.
- **Rival preparation:** material comparison no longer calls Texture.toJSON on nested micro-surface maps
  (which serializes image data using canvas PNG encoding). Resource IDs identify maps; colour comparisons
  retain exact linear values and shader keys participate in equality.
- **Shared compressed texture sources:** concurrent/repeated KTX2 requests decode once per renderer/URL.
  Each consumer gets independent UV/sampler settings and disposal. Failures remain retryable; late loads
  are discarded after disposal. Full and half-resolution variants remain distinct.
- **Clean runtime scenery exports:** 29 derived GLBs omit 96 unused master-image bindings. Runtime already
  supplies the shared KTX2 materials; it no longer creates placeholder PNG textures just to replace them.
  Every binary payload byte, node transform, geometry accessor, material name and original P11 file is
  preserved, with source/output hashes in `public/assets/runtime-scenery/manifest.json`.
- **Asset audit:** `scripts/audit-runtime-assets.mjs` checks the curated package with the existing Khronos
  validator, dependency closure, KTX2 mip bounds, model counts and hashes. Editable purchased-source
  formats are rejected from the served allowlist. No new licence, purchase or source asset was introduced.

## Verification

475 tests passed serially; typecheck and the curated production build passed. The final production
candidate and exact input hashes are in `demo-current.json` and its `review-build.json`; the compact tracked
receipt is `handoff/QUALITY-AND-PERFORMANCE-VALIDATION.json`. After the full suite, the cockpit/photo
visibility fix passed six camera tests and the packaged photo smoke below.

Controlled Ultra A/B against pre-change `8167284`, at 1600×900: all three current vehicles and all three
routes, 12 camera pairs, 17.28 million compared pixels. Only 52 pixels differ, each by at most 1/255 in
any colour channel. Geometry/texture counts remain unchanged; no missing requests or browser errors.
The Ridge forest loads in full and reuses two compressed texture decodes.

| Scene | Shader programs before | After | Local load sample before/after |
|---|---:|---:|---:|
| Slingshot, wet Harbor | 176 | 152 | 58.86 / 15.74 s |
| Ryker, Express day | 145 | 124 | 36.12 / 10.47 s |
| Spyder, Harbor day | 185 | 149 | 50.03 / 14.68 s |
| Slingshot, Ridge day | 166 | 142 | 52.52 / 14.12 s |

These are sequential local loading diagnostics, including compilation and caches, **not** portable
loading-time guarantees or FPS comparisons. Raw A/B evidence: `.tools/quality-assets-ab-20260923/`.

Packaged photo smoke saves a 3840×2160 PNG, keeps simulation time unchanged, resumes driving, and returns
GPU allocations to 524 geometries / 144 textures. The corrected controls were inspected at 1600×900 and
844×390. The final cockpit-entry export was also inspected directly: 3840×2160, 9,554,145 bytes, complete
rider visible; returning to cockpit restores the hidden head. Raw evidence:
`.tools/quality-photo-cockpit-20260923/` (near-camera checks in `.tools/quality-photo-final-20260923/`;
the earlier crowded layout is retained in `.tools/quality-photo-20260923/`).

The exact 396-file runtime allowlist contains 63 GLBs and 72 KTX2 files. Zero structural/closure errors.
672 validator warnings remain: 602 generated-tangent-space, 68 non-root skinned-mesh, two unsupported
image-feature warnings. Six VFX atlases have a single mip; two already-small scenery families have equal
LOD triangle counts (100 and 142). These are retained findings, not claims of universally finished art.
The complete audit has no issue cap; the earlier report capped each GLB at 200 messages and is superseded.

### Sustained performance: HOLD

The packaged High uncapped Harbor run completes two valid races (all four finishers each), 156.55 active
seconds, with zero browser errors or missing assets. It **fails** the unchanged frame budgets: pooled
20.87 ms average / 47.91 FPS, 100.64 ms worst 1%, 468 ms maximum. Dynamic resolution spends almost all
of the run at its 0.6 minimum. Both attempts fail; no stalls were removed from the score.
Raw evidence: `.tools/quality-high-final-20260923/`. This build includes the latest biker/surface work.

Final packaged Ultra also completes two valid races, 161.99 active seconds, at full 2560×1440 resolution,
with zero browser errors or missing assets. It fails: pooled 31.55 ms average / 31.70 FPS, 218.70 ms worst
1%, 641.1 ms maximum. The attempts differ substantially (45.67 and 23.55 ms averages); the second has no
100 ms stalls but still exceeds p95/p99 limits. Both are retained, and their variance is unexplained.
Raw evidence: `.tools/quality-ultra-complete-20260923/`. **Neither preset clears the performance gate.**

The diagnostic CPU profile is dominated by Three draw submission, uniform uploads and transforms.
In its sampled straight-line view, the main pass has 869 calls and the wet-road pass adds 419 calls.
That short view is diagnostic only, not a sustained score or a complete route cost. The worst sustained
stalls also occur after the program count has stabilized; first-use shader compilation alone cannot
explain them. GPU execution time and the contribution of other machine activity remain unresolved.
Raw diagnostic: `.tools/quality-cost-current-20260923/`. Its harness now skips the start cinematic and
waits on the lightweight race state, avoiding an obsolete startup assumption.

The frozen pre-change source `8167284` also completed two valid High races and failed (32.75 ms average,
266.64 ms worst 1%, 580.6 ms maximum). This source baseline uses Vite while the candidate is packaged;
machine load was not controlled. It establishes that stalls also occur before this patch, **not** an
attributable FPS improvement or a resolved regression analysis. Raw evidence:
`.tools/quality-high-baseline-complete-20260923/` and `.tools/quality-baseline-source.json`.

## Reproduce

```powershell
node --import tsx --test --test-concurrency=1 tests/*.test.ts tests/*.test.mjs
npm run assets:scenery
$env:EVIDENCE_DIR='.tools/new-runtime-audit'
npm run assets:audit
npm run demo:build
$env:PORT='5225'
node scripts/serve-demo.mjs
```

Use a separate terminal for `scripts/perf/photo-export-smoke.mjs` and the existing
`scripts/perf/sustained.mjs high uncapped harbor` / `ultra uncapped harbor`, with `BASE_URL` and fresh
`EVIDENCE_DIR` values. Run one GPU measurement at a time. The Khronos validator is a pinned development
dependency, installed by `npm ci`; `GLTF_VALIDATOR` can point at another installed copy.
Original source models and prior evidence remain recoverable. Local raw captures do not transfer in Git.

## Remaining work

- Finish the Phase 2 sustained-performance gate, with the latest biker and surface shaders included.
  Do not infer gate clearance from loading improvements or short visual checks.
- Profile reflection frames separately before changing their geometry, transparency or refresh rate.
- Author and compare source-based distance LODs for the dense current vehicles: Spyder 957,915 triangles,
  complete Ryker 813,647 (stored asset triangles, not per-frame visible counts). Preserve close-up
  silhouettes, transferred normals, rig channels, grip/seat fit
  and product attachments. No vehicle decimation was silently applied in this pass.
- Revisit remaining tangent warnings and VFX mip policy with close-up/motion evidence; a clean structural
  validator does not prove photographic quality, OEM accuracy or product fitment.
- Replace the P11 foliage/card/decal atlases with higher-detail authored sources when that work is scheduled.
  `assets/p11/STATUS.md` and `GENERATIONS.md` explicitly identify the current 4K files as resamples of
  preserved 1254-pixel sources. Their file dimensions do not establish native 4K detail. This pass preserves
  those approved textures and records the limitation rather than relabelling them as final-quality scans.
- Continue the original roadmap's broader gameplay additions only after the frame-time foundation is
  settled. Existing GX photo/replay/daily/challenge features already cover much of its later presentation work.
