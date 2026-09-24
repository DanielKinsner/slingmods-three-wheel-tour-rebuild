# Polish pass 2 - 2026-09-23

Follow-up to `handoff/VISUAL-POLISH.md`. Owner (remote on phone) asked to build out the remaining list and
push to main, with Claude making the calls. Every item: before/after screenshots, full test suite and
production build before the push. All pushed to main (deploys the Vercel game).

| Commit | What |
|---|---|
| `d63e0ff` | **Ridge start-line terrain, fixed in physics.** The off-road ripple fit 17.8 cycles per 3200 m lap, leaving a 1.16 m step 9 m+ off the road. `ridgeCrossHeight` now eases off-road ground into the station-0 height over the last 44 m. Road/shoulders (<=9 m) bit-identical everywhere (tested every 7 m); off-road unchanged outside the last 44 m (tested); no guardrail in that stretch. Visual blend removed; baked scenic land edge snaps onto the terrain edge (`snapRidgeLandEdge`). |
| `e58a496` | **Chosen vehicle kept when leaving the garage.** The career client and the garage used different rules for "this is the garage page"; on test/play URLs without `scene=` the garage showed the chosen vehicle but Shop opened the Slingshot. Both use `sceneOf()` now. Real player links always carried `scene=`, so play wasn't affected. |
| `5746c4f` | **Slingshot front calipers** rebuilt around their rotors (curved body over the rotor edge, rounded ends, piston bosses, glossy red). Same mesh/draw. Lesson recorded in the code: the caliper material's detail normal map turns degenerate UVs or zero normals into NaN pixels (bloom smears them into black squares); a test fails on any non-unit normal. |
| `5ba4c61` | **Rider kit:** black leather gloves (were bare skin), black balaclava (neck skin showed under the helmet), leather normal strength halved (read as melted plastic). Runtime pass `src/presentation/rider-kit.ts`; only biker materials match. |
| `dee532f` + `19e2a0b` | **Console button icons** 64 px -> 512 px vector redraw (`scripts/model02/sharpen-cockpit-decals.py`, original preserved in `assets/source/model02/`). Changing the Slingshot GLB bytes trips `tests/underglow-fit` (pinned car hash): re-ran `scripts/product_sm133_fit_2026.py`, strips byte-identical, only the recorded hash updated. |
| `6bcfa7e` | **Lamps:** Ryker lamps were flat pale paint (white patches) -> dark mirror reflector under the unchanged glow; showroom lamp level 0.9 instead of night 2.6. Spyder tail light was a flat orange block (real F3 lens is red) and amber reflectors sampled a tiny photo patch -> planar UVs + generated prismatic red/amber lenses, role metadata kept so the brake glow still binds (`src/presentation/lens-detail.ts`). |
| `6b1f914` | **Showroom floor moire:** vented tiles use 2x anisotropy instead of 8x (fine ribs rippled at grazing angles). |
| `b564ab4` | **Road paint** decals at 0.78 (real paint reflectance) so headlights no longer clip lines into glowing bars. |
| `ae5f2de` | **Wording:** leaving to a place is always "Back to <place>" (sentence case); the hint bar always says "Back". "Exit replay", "Reload showroom", "Close" and "Leave without this reward" keep their own words. |

## Skipped, with reasons

- **Sustained performance measurement:** run afterwards once the PC was free (see the section below).
- **Slingshot tyre sidewall lettering:** the tyre has no sidewall UV space. Lettering needs a shader patch
  that would collide with the vehicle-surface system, or extra draws. Not worth it vs the HOLD gate.
- The historical proof scripts `scripts/p08b-departure-proof.mjs`, `p08b-recovery-check.mjs` and
  `verify-ux-repair.mjs` still look for the old "Back to Showroom" / "Return to career" text. They are not
  part of `npm test`; update them if they are ever re-run.

## Hand-test (about 3 minutes)

1. Showroom, Slingshot: open View -> Interior. The console knob and rocker icons are crisp. Look through the
   front wheel spokes: a drilled rotor and a smooth red caliper.
2. Showroom, Spyder, Rear view: a red ribbed tail light above the plate instead of a flat orange block.
3. Showroom, Ryker, Front view: the lamps look like lenses, not white paint.
4. Any drive: the rider wears gloves and no neck skin shows. At night the white lines don't glow.
5. Smoky Ridge: the hillside beside the start line has no crack.

## Sustained performance (run 2026-09-24, packaged build `49aadf797022`, Harbor, uncapped)

PC otherwise idle (no remote session); the owner's Chrome was open. Two complete races per preset, all four
finishers, no stalls removed. Raw evidence (local only): `.tools/polish2-high-20260924/`, `.tools/polish2-ultra-20260924/`.

| Pooled | High (dynamic res.) | Ultra (full res.) | Gate | Previous High / Ultra (QUALITY-AND-PERFORMANCE.md) |
|---|---:|---:|---:|---:|
| Average frame | 11.91 ms (83.9 FPS) | 13.77 ms (72.6 FPS) | High <= 10 | 20.87 / 31.55 ms |
| Worst 1% | 35.06 ms | 41.17 ms | High <= 16.6 | 100.64 / 218.70 ms |
| p95 | 19.5 ms | 29.4 ms | <= 20 | - |
| p99 | 30.9 ms | 36.6 ms | <= 33.4 | - |
| Max | 46.1 ms | 47.1 ms | <= 100 | 468 / 641 ms |
| Frames > 100 ms | 0 | 0 | | many |

**Verdict: HOLD remains.** High passes p95/p99/max pooled (attempt 2 alone misses p95 by 0.2 ms) but misses the
10 ms average and 16.6 ms worst-1% budgets. Ultra misses p95 and p99. Both are far better than the last recorded
runs (roughly 2x average, no 100 ms+ stalls), but the cause can't be separated: the fleet-render CPU work
(`d4446dc`), this pass, and a quieter machine all differ.

Observation for the next performance step: High's dynamic resolution still sits near its 0.6 floor (average
0.63), yet full-resolution Ultra is only ~1.9 ms slower. Frames are CPU-bound (draw submission), so dropping
resolution buys little and costs sharpness. A GPU-aware resolution controller, or cutting draw calls further,
would be the next lever.

Verification at the end: 499/499 tests, build passes, main == origin/main.
