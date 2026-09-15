# P09A career implementation and integration

The free showroom remains independent from the career database. Every supported product is immediately previewable, including a locked career product via its **Preview in showroom** link. That link passes only a validated free-preview recipe; it cannot purchase or equip a career item. Career races read a committed attempt from IndexedDB, never an equipment payload from the URL.

## Player flow

Open `?scene=career&play=career` (also linked from Build Matters and the Signature entry). Existing players retain their earned access. A new player finishes the original Build Matters crew event first; older migrated crew access is honored. The original Maya duel, lighting/shock ownership, setup, wallet and receipts are retained.

1. **Open It Up:** one scored Express time trial. Finish to open Thermal exhaust.
2. **Jett / Hold Your Nerve:** one Express lap against the existing shared-physics Jett. Finish to open the NRG wing. A win is optional.
3. **SlingMods Coastline Cup:** one Original Harbor race, then one Express race, both against Maya, Jett and Nico. Finish both to open EvolutionR lower bags. The Cup keeps its entry build across both events, even if the workshop is edited between events.

Short invitations can be skipped immediately. The event screen exposes current stage, Cup standings, resume, abandon and rewards. A saved entry resumes from the start of that lap, never a fabricated mid-lap checkpoint. A successful race result returns to the chapter for purchases/next stage. Invalid runs can restart with a new attempt ID.

## Fictional credit table

| Event | First completion | Repeat | First win bonus |
|---|---:|---:|---:|
| Open It Up | 800 | 100 | 0 |
| Hold Your Nerve | 700 | 100 | 100 |
| Coastline Cup, both legs | 900 | 150 | 100 |

The first Cup leg writes a **zero-credit result receipt**. No Cup payment occurs until both legs commit. Cup scoring is 10/7/5/3 points for valid finishes; non-finishers receive zero. Equal points use combined time (a non-finish counts as a large sentinel), then driver ID for an exact tie. These are game rules, not retail prices or vehicle claims.

| Existing product | Career price | Unlock |
|---|---:|---|
| TricLED SM-133 Base Kit #1 | 600 | Existing shop |
| DDMWorks SM-3223 silver shocks | 1000 | Existing shop |
| Thermal SM-7720 Sport exhaust, 2020–2024 | 700 | Open It Up |
| NRG SM-26801 black aluminum Swan Neck wing | 650 | Hold Your Nerve |
| EvolutionR SM-28919 lower pair | 450 | Coastline Cup |

The three new items total **1800**, against **2400** earned by ordinary first completions without winning. Removing a part keeps its ownership; purchase installs it. Exhaust retains the established bounded game-audio treatment. Wing/bags add no physics effects. All product descriptions, options, thumbnails and site links use the existing Signature catalog rather than a duplicate product database.

## State and result contract

- Existing `Career` moves from schema 3 to **4**, with `ownBuild.version = 1`. Migration adds neutral chapter fields only; it pays no credit and invents no win or ownership. IndexedDB's existing database/store remains in use.
- `src/career-experience/model.ts` contains pure transitions, economics, Cup aggregation and validation. `src/career/store.ts` invokes them inside the same serialized read/write transaction as all other career actions.
- Attempts bind UUID, event/competition identity, route **and exact route version**, handling version, one lap, participant IDs, validated recipe, Cup ID and stage. Retry supersedes the prior attempt. Abandoned/superseded callbacks are rejected.
- `certifyCareerFinish` accepts a matching production `CrewRace` snapshot only after the full field is terminal and the player's checkpoint-validated finish is valid. A deeply frozen, in-process branded proof prevents ordinary object/clone payloads from becoming result commands. This is local integrity, not online anti-cheat.
- A result atomically writes attempt completion, full recipe/versioned record, receipt, wallet, unlock and Cup progression. Repeated callbacks match the existing receipt and cannot pay again. Interrupted writes leave every field unchanged and can be retried.
- Corrupt/future saves are retained, with the existing explicit export/temporary-career recovery. Denied/blocked storage uses the existing session-only store and same-origin handoff; it is labeled temporary.
- Previous handling records remain available under their recorded version. Chapter 02 records are listed by route, competition and handling version. No old ghost/time is relabeled as Sport v2.

## Runtime adapter

`openCareerRace(params)` returns `null` for free preview. In career it reads the saved active attempt; expired, completed, abandoned or foreign entry URLs return to the career hub. No URL can supply ownership or replace the saved recipe.

The returned adapter exposes `client`, `attempt`, `recipe`, `route`, `eventId`, `participants`, `laps`, `title`, `subtitle`, `returnTo`, `restart()`, `commit(snapshot)`, `abandon()` and `close()`.

`beginCareerEvent(client,event)` commits a fresh attempt before navigation. `careerRaceHref(attempt)` creates its URL. A scored solo race uses `CrewRace.custom.timeTrial` (one participant with checkpoint validation); the free-preview flag is never used for scoring. The root runtime owns driving, result UI, respawn/reset and rendering; the adapter owns persistence. Return navigation must use `adapter.client.navigate()` so denied-storage handoffs survive.

## Validation and honest limits

- `tests/p09a-career.test.ts`: migration/ordering, no-win funding, all-five ownership, snapshots, immutable proofs, duplicate rewards, retry/abandon, partial Cup reload and fixed recipes, first-win accounting, invalid options/fitment, corrupt/future recovery and fallback serialization.
- `tests/p09a-career-storage.test.mjs`: real isolated IndexedDB Cup-write interruption with byte-equivalent preserved state, successful retry, duplicate callback, concurrent purchase, corrupt retention and denied-storage fallback. Its result snapshots are **synthetic transaction fixtures**, not gameplay evidence.
- `scripts/p09a-career-ui.mjs`: actual previous earned P08A browser fixture, 720p hub, locked/free-preview comparison, scored solo entry and return/reload/abandon.
- `scripts/p09a-career-loop.mjs`: ordinary UI, actual production four-event driving with test-only pedal/steering controller, all-five ownership, Cup reload, immutable Cup equipment, removal/reinstall/reload. Controlled clock accelerates verification; it is **not native performance evidence**. No position teleports, synthetic finishes or fabricated Chapter 02 credit are used.
- Final Sport-paced integrated loop passed in `director-kit/production/evidence/P09A/career-loop-08/`, including completed Cup-leg held-R return to the hub and all five purchased parts. Earlier loops05/07 preceded the rival Sport v2 pacing fix and remain historical evidence. Earlier failures are retained: missing root start/reset permit, HMR interruption, and a controlled-clock harness that needed one final render after asynchronous receipt commit.
- Finish-before-rivals pause/resume was repaired and independently reviewed. A synthetic real-browser UI/controller regression passes. Two bounded actual control-only attempts did not finish first, so natural full-runtime proof of this specific edge remains unverified; those failures are retained.

Controller input is handled by the existing `BuildMenuInput`; invitation focus is scoped to its modal. The hub scrolls at 720p, with product cards below the event overview. Hardware controller validation and human fun/listening remain separate holds.
