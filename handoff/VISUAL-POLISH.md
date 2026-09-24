# Visual polish pass - 2026-09-23

Owner request: reduce bloom, fix the red line on the F3 underglow, upgrade weak assets/textures,
clean up UI inconsistencies and clipping, remodel the Ryker Panther body kit and Treal exhaust.
Work straight on main; push when confident. Done by Claude (lead) with three helper agents
(UI audit, environment art, rider fit) and one read-only asset/clipping audit.

## What changed (all on main, pushed)

| Commit | What |
|---|---|
| `157be88` | F3 underglow: frame strips followed "nearest surface" and zigzagged through the engine (up to 10 cm off). Now follow the measured frame-rail axis, meeting its underside with upward rays (6-7 mm). `scripts/spyder/products.py` |
| `e62beb5` | Bloom: energy normalised across quality presets, 70% scatter per mip (halo not haze), higher thresholds/lower intensities in every look, bloom input capped at 6x white (kills chrome "fireflies"), Slingshot underglow 900 -> 680 nits, headlight fog cones fade at grazing angles |
| `1880cfe` | Ryker Panther kit remodelled from retail photos (`scripts/ryker/panther-kit.py`): molded hood with plateau and beak, hex scoop, wedge louver gills, V brow, shark-nose grille with struts, fish-scale mesh, creased cheeks with vents. Treal exhaust (`scripts/ryker/treal-exhaust.py`): polished oval can with rolled ends, straight rolled-lip 3-inch tip, heat-tinted weld, clamp hanger |
| `afe8d9c` | Spyder licence plate showed the model seller's "RS 3D" branding; replaced with an original SlingMods plate (`scripts/spyder/replace-plate.py`) |
| `ffbf080` | Showroom wall sign 360x86 -> 1440x344 from the owner's 2000x500 wordmark; shared GLB image tool `scripts/replace-glb-image.py` |
| `1d91945` | UI: header controls no longer overlap once sound is on; menu/player-card/logo collisions at mid widths fixed; sideways-phone (844x390) layouts for menu, title, garage, race select, shop, options, loading; key-hint bar no longer covers panels; consistent caps and picker styling |
| `e30fe15` | Showroom open end (flat navy void in rear views) closed behind the camera volume with the room's own materials (`src/presentation/showroom-front-wall.ts`) |
| `cd99121` | Slingshot shock close-up no longer shows two floating underglow light pools |
| `5aa6ea1` | Wet-road puddles: macro variation and ragged edges instead of repeating camouflage blobs |
| `cfe131e` | Slingshot brake rotors rebuilt at load as drilled/slotted two-piece rotors, fitted to the originals, zero extra draw calls (`src/presentation/brake-rotors.ts`) |
| `102438f` | Ridge: start-line hillside crack and teal stripe closed (visual blend), shaded layered mountains (fewer draws), round sun. Harbor Express: lawn/quay/paved yards instead of a flat brown plane, shader-waved reflective water |

Rider clipping (`git log -1 -- scripts/build-biker-rider.py`): Spyder thighs/shins no longer pass through
the side panels and boots rest on the pegs; Ryker sits on the seat with boots on the pegs; Slingshot hands
at 10/2 clear of the spokes, boots out of the floor. Deepest overlaps went from 7-10 cm to about 1 mm;
fingertips still press up to ~8 mm into rubber grips and the Slingshot seat cushion ~8 mm. Riders sit
higher, so the Spyder cockpit eye is ~12 cm higher. Measuring scripts: `.tools/rider-fit/` (local only).

Final verification on the complete tree: typecheck clean, 497/497 tests, production build passes, and
all three vehicles load in a drive with no page errors.

## Rebuild commands

- Spyder products: `.tools/blender-4.5.2-windows-x64/blender.exe --background --factory-startup --python scripts/spyder/products.py`
- Ryker kit/exhaust: `.tools/blender-4.5.2-windows-x64/blender.exe --background --factory-startup --disable-autoexec assets/ryker/Ryker-Game-Master.blend --python-exit-code 1 --python scripts/ryker/build-mods.py -- public/assets/ryker/complete assets/ryker/Ryker-Complete-Parts.blend` then `node scripts/ryker/assemble-glb.mjs`
- Spyder plate: `python scripts/spyder/replace-plate.py`; any GLB image: `python scripts/replace-glb-image.py <glb> <image name> <new image>`

## Known limits / owner decisions

- **Ridge seam** is a visual blend over the last 44 m before the line, 9 m+ off the road. Driving that
  far off-road there still meets the old 1.16 m physics step. The real fix is making the ripple wrap
  in `ridgeCrossHeight` (`src/ridge/route.ts`) - a physics change, so not done without approval.
- The painted centre line lit by the headlights at the start grid is road paint, not a bloom bug.
- Not changed: Spyder rim material (already machined alloy at runtime), showroom floor moire (mild),
  Slingshot caliper shape and plain tyre sidewalls, biker leather/neck close-up detail, 64 px cockpit
  button decals. The audit list with screenshots was in the session scratchpad (not tracked).
- **Performance HOLD is unchanged.** No new sustained measurement was run. Net draw calls went down
  (Ridge -4/-5; rotors, Panther and Express add none; the Treal exhaust adds one small rubber-isolator
  material draw when fitted).
