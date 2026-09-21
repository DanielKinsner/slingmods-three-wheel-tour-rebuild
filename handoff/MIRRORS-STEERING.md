# Live mirrors and responsive highway steering — 2026-09-21

Owner request: working mirror reflections and easier high-speed turning. The owner
clarified that the car would not turn enough and ran wide. This supersedes the
previous handling freeze. Continue on main and the existing authorized Vercel game.

The 2026 player's two native mirror faces now show live scene reflections in the
showroom and all three current routes. Geometry and source assets are untouched.
The reflective surface retains every supplied vertex, with a small optical tilt
for the seated eye. Two 768x512 targets update only for visible, front-facing
mirrors. There are no recursive mirror passes, repeated shadow renders, or live
targets in rival/display clones. Targets are disposed with the scene.

The road renderer uses reversed depth or a logarithmic fallback. Conventional
oblique mirror clipping produced blank road reflections, so the mirror pass uses
temporary per-material world-space clipping. It restores material, visibility,
renderer and target state. Original glass is excluded from its own reflection.

Sport v5 increases available high-speed steering while retaining v4 power, finite
tire forces, braking and bounded stability assists. Low-speed steering lock and
the 100 ms steering response stay unchanged. At 65 mph, available wheel angle
rises from about 1.96 to 3.06 degrees; at 85 mph, from 1.21 to 2.60 degrees. These
are game tuning values, not vehicle specifications. The tire friction circle
still limits lateral force; braking remains necessary for sufficiently tight turns.

Fresh builds/events use v5. Existing builds, old links, records and active events
retain their original profile. **Build → Use responsive steering** makes a current
copy while retaining the original and career data. No purchase or reset is needed.
V4 is also available in the historical reference tune selector.

Validation:

- The full suite passed 296 tests before the final renderer correction. The
  expanded focused suite passes 13 tests, including all three renderer depth
  modes, unclipped foreground restoration, target reuse/disposal, native glass
  geometry, historical saves and v4/v5 steering comparisons.
- Clean asphalt A/B simulations at 45, 65 and 85 mph require at least an 18%
  tighter full-steering turn radius, upright chassis and bounded tire forces.
- The packaged browser smoke checks both showroom mirrors, an existing graphite
  v4 recipe upgrade/reload, 65 mph keyboard steering in cockpit, road mirrors,
  showroom return and Harbor/Ridge entry. Screenshots are visually inspected.
- Existing source geometry, five products, fitment, finish settings and career
  schemas are preserved. This is desktop Chromium evidence, not broad device or
  human handling approval. Mirror reflections add up to two scene passes.

Reproduce with `npm test`, `npm run demo:build`, then set `PORT=5208` and run
`npm run demo:preview`. In another terminal run
`node scripts/smoke-mirrors-steering.mjs`; `BASE_URL` and `EVIDENCE_DIR` override
the isolated browser target/output. No owner's browser storage is used.

Current validation receipt: `handoff/MIRRORS-STEERING-VALIDATION.json`. Hosted
commit identity is available at the existing game's `/review-build.json`.
