# Feel pass: transitions and the crew recovery card (2026-09-29)

Owner request: look at the paint-job, camera-angle and title-to-menu transitions, and make the "respawn vehicle" card
feel part of the game and more fun. The owner chose option (a): one feel pass on all four, in this order. Four local
commits on main: `799422f`, `ac49074`, `229c3a6`, `a894091`. Not pushed yet; see "Push" below.

## What changed

| Area | Before | After | Files |
| --- | --- | --- | --- |
| Showroom camera presets | Straight line between views: front to rear cut ~1.5 m from the car's centre, zoomed in and back out, fixed 800 ms, lens snapped | Swings around the car (angle, height, distance eased separately), lifts over long swings and cockpit dives, lens eases, 450-1150 ms scaled by travel | `src/presentation/camera-orbit.ts` (new), `src/signature/scene.ts` |
| First cockpit/interior view | 8.8 s freeze (about 30 clipped mirror shaders compiled on the spot); side view 0.6 s | 34 ms / 28 ms: mirrors prime their clipping before the loading-veil warm-up | `src/presentation/vehicle-mirrors.ts` (`prime`), `src/signature/scene.ts` |
| Respawn card | Plain grey status box | CREW RECOVERY card: stamped headline per reason (ROLLED IT, OFF THE EDGE, OFF THE MAP, BEACHED), crew portrait and radio line, the game's input glyph (R / pad A / touch) in a ring that fills while the reset is held, slam and whoosh cues | `src/driving/recovery.ts`, `src/driving/input.ts` (`resetHold`), `src/express.ts`, `src/game/race.css` |
| Paint change | Colours swapped in one frame | 750 ms wipe nose to tail with a bright spray edge; only real paint changes wipe (loading, parts and reduced motion stay instant) | `src/presentation/signature-art.ts`, `src/signature/scene.ts` |
| Title to menu | Title fade, camera swing and menu slide all at once | Title punches out, camera swoops to the hero view (1.3 s), then the menu and achievements arrive 450 ms later | `src/game/title.ts` (`revealMs`, `onReveal`), `src/signature/scene.ts` |

Unchanged: recovery reasons, timing and respawn rules (tests pin the wording), physics, saves, routes, products,
race shaders (the wipe is studio-only), and all race render paths. The feel pass does not touch anything the race
performance gates measure.

## Evidence

`handoff/feel-pass-evidence/`:
- `camera-into-cockpit.jpg`: hero to cockpit, arcing down over the hood.
- `paint-wipe.jpg`: blue/orange to black/red, 8 frames.
- `title-to-menu.jpg`: title out, camera beat, menu in.
- `crew-recovery-card.jpg`: keyboard and touch versions.
- `crew-recovery-in-race.jpg`: the card over the race HUD.

Measured in the controlled-clock harness:
- Front to rear keeps at least 5.68 m from the car (the straight line came to 2.57 m).
- Every move lands exactly on its preset.
- The longest frame gap during moves is 33 ms or less.
- Races have no camera-switch stall, because their mirrors were already primed.

Tests: `tests/feel-pass.test.ts` (4 tests: orbit distance, timing/lens/shortest way, cockpit arc, recovery labels and
hold). The full suite passes 569/569.

## Hand test

1. Garage, then the FRONT -> REAR -> INTERIOR camera buttons: the camera swings around the car, never through it, and
   INTERIOR opens without a pause.
2. Pick a different paint (for example Gloss black / red): a bright line sweeps the new paint on from nose to tail.
3. In a fresh tab, press any key on the title: the title leaves first, the camera swoops, then the menu slides in.
4. In a free drive, flip or strand the car: after about a second the CREW RECOVERY card appears with a crew line.
   Holding R fills the ring and respawns; clicking the button also works.

## Push

Hold the push until the quiet-PC A/B from `handoff/GRAPHICS-AUDIT.md` has run (unchanged `3432998` vs HEAD,
`scripts/perf/sustained.mjs high uncapped` on Harbor and Ridge, about 20 minutes, with Premiere/Photoshop closed).
The feel pass itself does not change race rendering.

## Known, not fixed here

The showroom logs a flood of WebGL "Mismatch between texture format and sampler type" errors (about 256; also on the
live site, so it predates this pass). It was split off as its own task and is not caused by this pass.
