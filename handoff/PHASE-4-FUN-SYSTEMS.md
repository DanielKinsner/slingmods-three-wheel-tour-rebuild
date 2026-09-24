# Phase 4: fun systems (2026-09-24)

Owner order: A (passing fixes + slipstream), then B (handbrake drift -> boost), then C (quick wins: horn,
perfect-launch bonus, sector splits, gymkhana). Plan: `docs/plans and prompts sep 21/01-MASTER-PROMPT.md`, Phase 4.
Every item was measured headlessly or checked in the browser, ran the full suite and build, and was pushed on its own.

**Honesty rule kept throughout:** new physics (slipstream, scrape contact, drift, boosts) is off unless a race opts
in. Time trials, challenges and recorded runs are byte-identical (tested). Career events get racecraft (slipstream,
scrape contact, smarter rivals) but never the arcade drift/boost or catch-up.

## A. Racecraft: passing that isn't annoying (`04c45e1`)

| Piece | Where |
|---|---|
| Rivals never steer across onto a car alongside: checked every tick, aim pinned to where the car actually is, lift to tighten a drifting line | `src/competition/rival.ts` |
| Racing follow gap (~0.5 s), full-width passing lanes on straights only | `rival.ts` |
| Personalities under pressure: Jett runs wide, Maya one early defensive move (never a chop), Nico moves over on a straight; seeded small mistakes | `rival.ts` (`temperament`) |
| Slipstream: wake 2.5-25 m, widens with distance, up to 38% less drag after ~1 s; SLIPSTREAM tag, speed blur, wind drops | `src/simulation/index.ts` (`RaceWorld.setRacecraft`), `src/game/slipstream-hud.ts`, `audio/mapper.ts` |
| Rubbing is racing: glancing side-by-side contact keeps 30% of the yaw kick, 45% of the sideways kick; scrape sparks | `RaceWorld.softenRubbing`, `vehicle-effects.ts` `scrapeSparks` |
| Light catch-up (+-3% rival pace) in non-career races | `express.ts` `applyCatchUp` |

Old handling profiles (legacy, Sport v1/v2) keep the original rival behaviour byte for byte (tested).

Headless bench `scripts/game-feel/passing-bench.ts` (5 full races per cell; "racer" = a 10% faster clean passer,
"blind" = a pusher who ignores traffic):

| per race | Before (Express / Harbor / Ridge) | After |
|---|---|---|
| Clean racer passes | 0 / 0 / 0 | 1.0 / 0.8 / 2.2 |
| Clean racer spins | 0 / 0 / 0.2 | 0 / 0 / 0 |
| Rivals turning in onto a pusher (not touching) | 1.2 / 0.6 / 0 | 1.2 / 0.6 / 0.4 |
| Rivals knocked out by a pusher (per 5 races) | 2 / 5 / 3 | 0 / 4 / 3 |

Not done (plan items): widening overtaking zones and run-off (route geometry, needs Blender + colliders);
blue-flag logic for lapped cars (the rival AI has no lap information). Rivals are never teleported back to the road
by design, so a hard shove on narrow Harbor can still strand one.

## B. Handbrake drift -> boost, arcade layer (`67c4336`)

Hold **Space / controller X** with steering. Charge = time x rear slip; tiers at 0.8 / 1.8 / 3.2 (sparks and fitted
underglow go white -> orange -> SlingMods red). Straighten up cleanly: boost 0.6 / 1.0 / 1.6 s with exhaust flame,
speed-blur kick and whoosh. A hit or a spin forfeits. Arcade assists: slide angle held near 32 degrees, a catch
assist after release (keyboard full-lock counter-steer no longer snaps into a spin), momentum kept through the slide.
On in Quick Race, series races and free test drives; off in career, trials, challenges. Meter above the skill-chain
score; one-time hint at the first green light; controls list updated.
Code: `src/simulation/index.ts` (`DRIFT`, `enableDrift`, `drift()`), `src/driving/input.ts`, `src/game/drift-hud.ts`,
`src/presentation/drift-sparks.ts`. Probe: `scripts/game-feel/drift-probe.ts`. Tests: `tests/drift.test.ts`.

## C. Quick wins

| Item | State |
|---|---|
| Horn (H / RB) | `e324d05`: synthesised dual-tone, follows volume/mute/pause (`src/audio/horn.ts`) |
| Perfect-launch bonus | The PERFECT START / GREAT accolade already existed; `81f7154`: it now pays a 0.6 / 0.3 s boost in arcade races |
| Sector splits green/red vs best | Already built earlier (`race-fx.ts` checkpoint splits, `slingmods-gx-splits-v1`); verified, no change |
| Gymkhana / donut mode | **Not started: needs an owner decision** (there is no drivable open lot: the physics pad exists but its only scene is the retired workbench). See below. |

Other Phase 4 hooks already in the game before this pass: PB ghosts + medals (Time Attack), near-miss and drift
skill chains, daily run with streak, speed-trap challenges, crew radio lines. Not built: drift zones with
leaderboards, rivalry meter, SlingMods Points pickups, "products felt" moments.

## Gymkhana decision (open)

Options put to the owner: (A) a new open lot scene built on the existing pad physics (cones, boxes, donut pole,
figure-8; recommended), (B) gymkhana props on an existing route's start area, (C) skip for now.

## Hand-test (about 5 minutes)

1. Quick Race on Harbor Express: sit right behind a rival on the straight; SLIPSTREAM appears and fills, you gain.
   Pull alongside in a corner: the rival holds its line instead of moving onto you. Lean on a rival gently: sparks,
   no spin.
2. Same race: throttle exactly on the green: PERFECT START plus a short flame boost.
3. Hold Space + steer into a corner: the tail steps out, meter fills white -> orange -> red; let go and straighten:
   BOOST. Hit a wall mid-drift: LOST.
4. Press H: horn (sound enabled).
5. Career race or Time Attack: Space does nothing, no drift meter.

Tests: 515 pass. Everything is pushed to main (deploys Vercel).
