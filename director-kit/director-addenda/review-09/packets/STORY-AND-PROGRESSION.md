# Chapter 1 — First Night at the Harbor

This is newly authored game copy and fictional economy, not product-performance advertising. Use short text/radio cards, dismissible and readable. No voice-generation budget is authorized. Existing Rae lines/flags from the accepted kit loop stay intact; only new crew beats are added.

## Flow and unlocks

A new career retains the existing shakedown invitation and clean-lap reward. After a first valid Harbor finish, the bay offers Build and **Meet the crew**. One existing valid completion unlocks the crew race whether the player buys lights or stays stock. Existing saves with `chapters.firstCompletion` do not have to repeat that task. Already purchased kits stay owned/equipped with their colors.

The next chapter event is `harbor-crew-night-v1`, a two-lap night circuit against three Slingshots. Chapter ID `harbor-first-night-v1`. Complete the chapter with a valid podium finish (1st, 2nd or 3rd). Fourth place is a legitimate result with ordinary credits and immediate retry, not a progression wipe. After clearance show the chapter result and replay choices; do not imply Chapter 2 or the other two vehicles are implemented.

## Directed copy

**Crew invitation, first entry:**
Rae: “A clean lap tells me you know the road. Tonight, we find out how you share it.”
Rae: “Two laps. Maya, Jett, Nico. Bring it home in the top three.”

**Stock response, only if no kit is equipped:**
Rae: “Stock is welcome. The stopwatch doesn't care what you've bought.”

**Equipped response, only if kit is equipped:**
Rae: “There it is. Your build, your color. Now give them something to chase.”

**Grid, at most one short exchange:**
Jett: “Hope you saved some speed for the corners.”
Maya: “He says that right before braking too late.”

**Optional race cue, once each at most and not within 12 seconds of another line:**
Rae, final lap: “One more. Keep it clean.”
Nico, passed cleanly: “Fair move. I'm still here.”

**First podium:**
Rae: “You earned your place. Welcome to the crew.”

**First win, replaces—not duplicates—the podium line:**
Rae: “First night. First place. That's a proper introduction.”

**Valid fourth place:**
Rae: “You finished. Now we know where to find the time. Run it again.”

**Invalid result:**
Rae: “That one won't count. Reset, take a breath, and give me a clean run.”

**Replay menu after chapter clear:**
“Chapter 1 complete · Improve your finish, revisit the shakedown, or refine your build.”

Do not repeat the entire intro on every retry. Persist first-entry/first-clear acknowledgements; provide manual replay of a text beat only if simple. Avoid a mandatory tutorial interrupt in the racing line.

## Economy — explicit fictional game credits

Existing solo Harbor rewards remain EXACTLY as accepted: 800 total for the first valid unique solo completion, 100 for each later unique valid solo attempt. Existing base kit costs 600. Existing invalid/incomplete attempts pay zero. Do not move or reinterpret the historical 800 as a new crew bonus.

Crew race awards (per unique valid finished attempt):

| Place | Placement award |
|---:|---:|
| 1 | 300 |
| 2 | 200 |
| 3 | 150 |
| 4 | 100 |

Add **400 once** for the first valid crew podium that clears `harbor-first-night-v1`. A first win therefore awards 700 total; first third awards 550. Further podiums pay placement only. Invalid, unfinished, aborted or relocated attempts earn no crew credits or chapter clearance. Awards are earned in-game and are unrelated to money, discounts, store points or real purchases.

Example fixtures: a saved 300-credit equipped career finishes third for the first time → 850; receiving the same result again → still 850; a new first-place replay → 1150 (no second 400 bonus). A new career's existing clean lap → 800; purchasing kit → 200; first valid second-place crew finish → 800. These numbers are tests, not instructions to prepopulate the player's wallet.

Keep separate fields for crew event completion, best placement, chapter clearance and the old entry/firstCompletion/firstBuild flags. A solo result cannot satisfy a crew podium; a crew result cannot retroactively trigger the old first-solo reward. Support legitimate simultaneous-tab result writes and duplicate delivery through one transactional path. No reward based solely on a UI-provided unvalidated placement string.
