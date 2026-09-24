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
| Gymkhana / donut mode | `d31dd40`: built as the Gymkhana Lot (owner chose A), see below |

Other Phase 4 hooks already in the game before this pass: PB ghosts + medals (Time Attack), near-miss and drift
skill chains, daily run with streak, speed-trap challenges, crew radio lines. Not built: drift zones with
leaderboards, rivalry meter, SlingMods Points pickups, "products felt" moments.

## Owner decisions taken after A/B/C (2026-09-24): both "A"

### Parts tune the car; levels unlock driver skills (`5157c53`)

- `src/game/tuning.ts`: Slingshot exhaust +4% power, shocks +3% grip, wing up to +3% grip at speed for +3% drag;
  Ryker exhaust +4% power, Elka shocks +3% grip, Panther kit -2% drag; Spyder front/rear shocks +1.5% grip each,
  sway bar +2% grip. Throttle controller stays response-only; lights, bags, wheel lights cosmetic. Applied through
  `Simulation.configureTuning` (neutral = byte-identical) for the current tunes only (Sport v5, Ryker, Spyder).
- Standing starts are traction-limited, so power shows from a rolling start (`scripts/game-feel/tuning-probe.ts`).
- Garage: a Performance card under the categories (acceleration, top speed, grip, stability); the open part's share
  glows when fitted and shows as a ghost when not. Labelled "Game tuning". Product copy that said "no horsepower /
  grip change" now states the game value and that it is not a claim for the real product.
- Tuned Slingshot/Ryker builds get their own Time Attack / challenge records (`...|tuned:SM-3223,SM-7720`); stock
  keys and every existing record are unchanged.
- Driver skills (`src/game/driver-skills.ts`), Quick Race and test drives only: LV2 Launch Control, LV4 Drift Feel,
  LV6 Nitrous Nerves, LV8 Draft Hunter, LV10 Clean Exit. Tour Log > Stats lists them; a race-results level-up names
  a new one. The drive reads the saved career read-only for the level.
- Balance note: career rivals keep their certified pace, so parts make career races easier. That is the intended
  progression; revisit if it feels too easy.

### Gymkhana Lot (`d31dd40`)

- A 90 x 110 m lot on the Harbor Express infield (clear of all colliders: `scripts/game-feel/lot-search.ts`), launched
  from the Harbor Express card as a free test drive (`?gymkhana=1`). Painted markings, two donut poles, a two-row cone
  slalom, a barrier. The physics world is built as before; the lot is added after (`RaceWorld.extendEnvironment`).
- 90 s score attack (`src/game/gymkhana-score.ts`): drift points with a x5 chain, DONUT +400, FIGURE 8 +1500, cones
  -150. Medals 3,000 / 6,500 / 11,000 (first guesses: retune after the owner plays it). Best per build, local only.
- Respawn returns to the start box; lap/clock/course title/circuit map hidden on the lot.
- Test-only helper: `?test=1&spawn=x,z,yaw` places the car anywhere in a free drive (used to find the lot).

## Finishing Phase 4 (owner: "do those in the order that makes the most sense")

| Commit | What |
|---|---|
| `3b2d70e` | **SlingMods Points**: tokens on every route (10 racing line, 25 by the wall on straights, 50 inside the sharpest fifth of bends, 100 at the three tightest apexes; always on the tarmac). Chain x2..x5 within 2 s with a rising chime; contact/grass drops it; respawn each lap; minimap dots; results line + route best; Tour Log lifetime total. Quick Race / series only. **Not career credits** (the career save and certified rewards stay untouched; conversion is an owner decision). |
| `37f46e7` | **Fix**: the deployed (demo-mode) build filters URL params through `visitorSearch`; `gymkhana=1` was stripped, so the live Gymkhana Lot button opened a plain test drive. Allowlisted (and `harbor-cargo`); verified on a local production build. Lesson in memory. |
| `7cce841` | **Cargo Run** (bags felt): Harbor waterfront sprint with four loose crates; ~0.75 g sustained spills one (+2 s, it tumbles off). Slingshot storage bags (SM-28919) secure the load. Also: tuned builds now keep separate challenge records. |
| `fcf7d56` | **Drift zones**: two per route with purple gates; live score, banked on exit into a local top five; Tour Log lists zone bests. Arcade drives only. |
| `1fa894a` | **Rivalries**: record + heat per rival; the hottest rival (raced twice, some heat) calls you out at the start with the real score; results line; Tour Log with heat bars. Presentation/local only. |
| `a51699e` | **Daily Run**: each day also sets a condition and a build rule (any / stock only / tuned); the card shows them, Go launches in that condition, only a fitting finish counts, a fast non-fitting run says why. |
| `28b8bbc` | **Blue flags**: a rival the player is about to lap gives way on the next straight. |

### Not built, with reasons (owner decisions)

- **Shocks "felt" moment (bumpy mid-corner section).** Tried a game-tuning bump model for upgraded shocks (cap and
  rate limit on a wheel's load spike) with headless probes: a line-holding driver over ridges and the production AI over
  a ridge strip in the Express sweeper at 5 paces x 2 ridge heights. Upgraded shocks did NOT reliably help (sometimes
  calmer, sometimes more upsets, no consistent time), so it was reverted rather than shipped. Doing it properly needs a
  damping-based shock model (rebound/high-speed compression) in the suspension. Shocks keep their +3% grip tuning.
- **Overtaking zones / run-off.** Harbor Express rails are generated in code (movable), but (1) race rules invalidate
  after 0.35 s with two tyres beyond the runoff, so a grass run-off only trades a wall for an invalid race unless the
  certified track-limit rule changes; (2) the layout version (`express-layout-v1`) is bound into career chapter events,
  so a new layout means a career migration; (3) Original Harbor and Smoky Ridge are Blender-authored. This is a
  "track layout v2" project for the owner to approve.

## Hand-test (about 5 minutes)

1. Quick Race on Harbor Express: sit right behind a rival on the straight; SLIPSTREAM appears and fills, you gain.
   Pull alongside in a corner: the rival holds its line instead of moving onto you. Lean on a rival gently: sparks,
   no spin.
2. Same race: throttle exactly on the green: PERFECT START plus a short flame boost.
3. Hold Space + steer into a corner: the tail steps out, meter fills white -> orange -> red; let go and straighten:
   BOOST. Hit a wall mid-drift: LOST.
4. Press H: horn (sound enabled).
5. Career race or Time Attack: Space does nothing, no drift meter.
6. Garage > Exhaust: the Performance card shows the ghost gain; Preview part turns it green.
7. Tour Log > Stats: Driver skills list with unlock levels.
8. Events > Harbor Express > Gymkhana Lot: leave the box, hold Space + steer round a pole for a DONUT, then the
   other pole the other way for a FIGURE 8; clip a cone (it tumbles, -150). After 90 s: results and Run it again.

Points: Quick Race on Harbor Express, drive through the coins (chain chime rising), see SLINGMODS POINTS in the
results. Cargo: Challenges > Waterfront Cargo Run with and without the storage bags. Drift zones: the purple gates;
the card top-right banks your score. Rivalry: after two races with a rival, they call you out at the start. Daily card on
the home screen shows the condition and build rule.

Tests: 537 pass. Everything is pushed to main (deploys Vercel).
