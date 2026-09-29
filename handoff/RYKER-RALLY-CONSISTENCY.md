# Redstone Rally: drift retune and consistency pass (2026-09-28)

Owner feedback after `ced55da`: the rally drift was too extreme, and the new track should be made as consistent
as the rest of the game. This pass tames the drift and brings the rally's entry, HUD, results, art and return flow
in line with the three road courses. Road handling, road drift, career saves and road records are unchanged.

## Drift

`src/rally/tuning.ts` only. The simulation and `ROAD_DRIFT_DYNAMICS` are untouched.

Paired probe (same start, 20 m/s, full lock + handbrake 0.3-1.6 s, then release and countersteer, rally dirt):

| Tuning | Held slip (mean) | Peak slip | Speed lost in the slide | Recovery after release |
| --- | --- | --- | --- | --- |
| Road layer | 28.2 deg | 42.8 deg | 4.6 m/s | 0.28 s |
| v2 (`ced55da`) | 39.2 deg | 61.8 deg | 9.7 m/s | 0.38 s |
| v3 (this pass) | 32.1 deg | 49.4 deg | 5.7 m/s | 0.32 s |

v2 swung the tail about 19 degrees past its hold angle and scrubbed twice the road layer's speed, so it looked
dramatic but drove loose and slow. v3 keeps a visibly looser dirt slide (+14% held angle) with nearly the road
layer's catch and speed carry. A firmer hold torque was also probed and rejected: the overshoot comes from the
turn-in snap that the road layer shares, so it would have needed a simulation change for little gain.

Records now compare within `redstone-rally-v3`; v1/v2 records stay stored and never compete with v3 laps.
`tests/rally.test.ts` bounds the tune from both sides (held angle 1.08-1.25x road, peak under 55 degrees, speed
loss under 1.5x road), so a future retune cannot silently drift back to v2 behavior.

## Consistency fixes

- **Event card.** The rally had a duplicated copy of the whole event screen. Selecting it relabelled the other
  courses "ROAD CIRCUIT", dropped their lengths/types and removed Continue Career. Redstone is now a normal entry in
  the shared card (`src/signature/ui.ts`): same rail, headline, facts, map/in-game shot and footer; only the actions
  differ (Start Rally, Explore the stage).
- **Return flow.** Leaving a rally entered from a Slingshot or Spyder returned the event-supplied Ryker to the
  showroom, replacing the player's own vehicle. The origin build is now remembered for the session and restored
  (`rememberRallyOrigin` / `rallyReturnFragment`). Change Event and Back reopen the Redstone card like the road
  courses reopen theirs (`rememberDestination` / `rallyWasChosen`). Both are session-only and tolerate denied storage.
- **HUD.** The rally panel used its own fonts, colors and green panel. It now uses the shared `--gx-*` glass, type
  and edge-accent treatment of the drift-zone and Gymkhana HUDs, keeping Redstone's dust-orange accent. It hides in
  film and photo modes like the other HUDs. It sits below the stage timer (measured: no overlap at 1600x900, 390x844 or
  844x390); landscape phones get a compact sector-and-score panel that clears the speedometer.
- **Results.** Times use the game's `raceTime` format (`2:02.930`, was `2:02.93`). A new best time or drift score
  plays the shared `gx.record` cue and says so, as drift zones and challenges do.
- **Race menu subtitle** no longer falls through to "Quick race / 1 lap / Rivals: ..." for the rally host.
- **Art.** The loading and map plates shipped as 2.5 MB / 3.4 MB PNGs with special-cased paths (including the
  boot-screen script). They are now JPEGs (350 KB / 485 KB) resolved by the same `artUrl` / `courseMap` / boot lookup
  as every other course.
- The rally scenery load is measured by the entry trace like Ridge and Express; Options lists the handbrake as
  "Quick Race · Rally".

## Validation

- `npm test`: 546 passed (two new rally tests: return/origin/denied storage; shared art lookups).
- `npx tsc --noEmit` and `npm run deploy:build` pass; the staged build serves both JPEGs and no PNGs.
- Packaged browser checks against a fresh publication stage, all passing with zero browser errors or failed requests:
  - `verify-browser.mjs`: Slingshot entry supplies a Ryker; desktop/mobile event card; full physical lap 2:02.933;
    records persist across reload; retry resets scoring; pause freezes clock and score; recce keyboard drift with no
    record or boost; Express/Slingshot, Ridge/Ryker and Harbor/Spyder keep their road modes.
  - `verify-drift.mjs`: ordinary keyboard handbrake on a timed stage scores 201 drift points over 50 slide ticks,
    peak rear slip 0.87 rad (50 degrees), no boost, no premature record.
  - `verify-polish.mjs`: JPEG boot plate, all four pre-race shots, finish film, skip controls, reduced motion,
    saved auto-film preference, map and in-game postcard on desktop and mobile.
- Receipts and change-specific images are in `rally-consistency-evidence/packaged/` (`browser.json`,
  `scored-drift.json`, `presentation.json`, `event-*.png`, `hud-*.png`, `loading.png`, `map-mobile.png`).
- The automated lap driver does not use the handbrake, so its lap time matches v2; drift feel itself still needs
  the owner's hands-on judgement.
