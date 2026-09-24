# Phase 3: UI and cinematic transitions (2026-09-24)

The owner asked to start Phase 3 of `docs/plans and prompts sep 21/01-MASTER-PROMPT.md` after the performance gate
passed. A drift check against the code first showed most of the cinematic list already shipped with the GX
overhaul, so this pass built only the gaps. Every item was checked in the browser with screenshots (and numeric
traces where a picture could not prove it), ran the full test suite and production build, and was pushed on its
own. Physics, steering, saves, routes, products, reward certification and the perf-gated race render paths are
unchanged (the drive only gains a film-lens option while photo mode is open).

## Drift check: plan vs. code before this pass

| Phase 3 item | State found | This pass |
|---|---|---|
| Persistent, animated showroom UI | Rebuilt by `innerHTML` on every change (the plan's root cause) | Built (`90253fd`) |
| Motion tokens honoured by reduced motion | Present (`src/game/shell.css` `--gx-ease`, `--gx-t-fast`, ...) | Reused |
| Design language, tach arc, big gear | Present (GX HUD) | Shift light added (`d694a79`) |
| Boot sting / bay / lights / hero | Present | - |
| Category change: glide + rack focus + highlight sweep | Glide on inspect only | Rack focus built (`7b6df47`); highlight sweep deferred |
| Part install: fly-in, click, spark, underglow pulse | Instant swap + sound + stamp | Built (`eabd2ff`, `1950d24`) |
| Garage -> drive: letterbox, engine, cut to route | Departure, engine start and arrival film present; no bars | Letterbox + GX styling (`471f53d`) |
| Pre-race establishing shots, countdown | Present (grid film) | - |
| Finish slow-mo / slam / replay behind results | Present | - |
| Loading: turntable silhouette, progress rule, tips | Present | - |
| Replay broadcast cameras | Present | - |
| Photo mode: orbit, FOV, hide HUD, PNG / 4K | Present | - |
| Photo mode: DoF, underglow colour | Missing | Built (`1bb5517`), plus Film look |
| Photo mode: time of day | Missing | Deferred (see below) |

## What was built

| Commit | What |
|---|---|
| `90253fd` | **Showroom panel morphs instead of rebuilding.** `src/game/morph.ts` patches the live DOM: unchanged elements keep identity, focus and typed text; the inspector for a new category slides in (240 ms) with its lines staggered 20 ms; colours/borders transition; a newly pressed swatch/view button pops once. Screen changes still draw fresh. `tests/morph.test.mjs`. |
| `eabd2ff` | **Part install moment.** `src/presentation/install-motion.ts` finds whatever a preview change newly draws on the car (any vehicle, no per-presenter hooks), flies it in from outside the car with a small seating overshoot, bursts sparks off its own components, then plays the install sound; the INSTALLED stamp follows 260 ms later so it does not cover the part. Lights ignite instead (flicker, flash, settle). Spyder parts now also get the stamp. `tests/install-motion.test.ts`. |
| `7b6df47` | **Rack focus** in the showroom: camera glides and category changes pull focus from behind the car onto it, then the lens effect fades out (resting image unchanged). Uses the pipeline's existing film lens; the depth pass exists only during the ~1 s pull. Test hook `__SIGNATURE.focusFreeze(u)` (`test=1`). |
| `471f53d` | **Letterboxed departure** with the controls seated in the bottom bar, restyled to GX type/colours (it was Arial and grey). |
| `1bb5517` | **Photo mode:** Focus blur slider (car sharp, surroundings soft), Film look toggle (race-film grain, vignette, streaks), underglow colour swatches when fitted (photo only; exit restores the build). 4K captures include them. The bar wraps into compact rows down to 601 px. |
| `d694a79` | **HUD shift light:** five LEDs over the tach (green, green, amber, amber, red from 72% of the limiter, flashing from 95%); none on the Ryker's CVT. `tests/shift-light.test.ts`. |
| `1950d24` | Fitted underglow **pulses once** when any other part seats (680 -> 1292 -> 680 nits measured). |

Tests: 508/508 (from 503), build passes, main == origin/main after each push.

## Deferred, with reasons

- **Highlight sweep across the part on category change:** needs a per-material shader hook on shared vehicle
  materials (the vehicle-surface system owns them). The rack focus carries the moment for now.
- **Photo mode time of day:** changing time of day in a drive currently reloads the page
  (`__EXPRESS.choose` -> `location.replace`); a live switch touches lighting, sky, wet road and the perf-gated
  render paths. Worth doing as its own task with a perf re-check.
- **Numbers tick / thumbnail crossfade:** the morph now makes both possible; there is no changing number or
  thumbnail in the showroom build flow worth animating yet (the inspector swap already slides/fades).
- The Spyder front suspension install is subtle because the parts sit inside the bodywork; the sparks leave from
  the corners correctly.

## Hand-test (about 3 minutes)

1. Showroom -> Build. Click Paint swatches and categories: the right panel slides in, nothing flashes or jumps;
   typed build names survive clicks.
2. Exhaust -> Preview part, with Rear view: the pipes fly in from behind, seat, sparks, sound, then INSTALLED.
   Aero: the wing drops in. Lighting: the underglow flickers on. Install another part with underglow on: it swells once.
3. Click Front/Rear/Full vehicle: focus pulls onto the car as the camera glides, then everything is crisp.
4. Test this build: black bars slide in, "Opening the bay" in the game's font, red Skip button.
5. In a drive: rev in first gear; the LEDs over the tach fill green -> amber -> red and flash at the limiter.
6. Pause -> Photo mode: drag Focus blur up (background softens, car sharp), try Film look, pick a glow colour;
   Back restores your own colour.

The showroom's reduced-motion setting turns off the panel pops/slides, part flights and focus pulls; the
system reduced-motion setting also stops the departure bar slide and the shift-light flashing.
