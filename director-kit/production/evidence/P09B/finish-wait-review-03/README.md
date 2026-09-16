# Actual early-player-finish pause/resume regression

Final PASS: `finish-wait-review-03/verification.json`.

The player physically completed every production gate in 74.9725636 seconds, P1, while Jett was still running at gate16/progress2263.56. The real Pause button froze elapsed race time at75000ms, left credits1250 and wrote no receipt. The real Resume button resumed the field; Jett completed at77.7714174 seconds. One200-credit receipt raised credits to1450.

This uses a controlled clock and an evidence-only player control planner; it is functional proof, not native performance or human driving. No teleport, injected finish, disabled collision, altered production rival trait, game physics change or reward mutation was used. Only the player's evidence planner parameters changed: pace56, lateral6, braking4.3, lane-2.3. That planner deliberately ignores traffic-following calculations; actual production collision handling remains active. Full planner state, race trace, career state and source build identity are retained in the verification JSON.

Trials01 and02 are retained failed attempts at reaching the requested early-finish state: both physically completed valid P2 without recovery, at78.9808953 and78.8750247 seconds versus Jett77.7413904. Their failure JSONs include traces and planner settings. Earlier `finish-wait-final-01` retains the more aggressive planner's recovery/reverse failure. None is presented as a passing regression.

Reproduce against the identified static candidate and a fresh evidence directory:

```powershell
$env:BASE_URL='http://127.0.0.1:5202'
$env:EVIDENCE_DIR='director-kit/production/evidence/P09B/finish-wait-next'
$env:FINISH_PLAN='{"pace":56,"lateral":6,"braking":4.3,"headway":0.75,"line":-2.3,"initialLane":-2.3,"ignoreTraffic":true}'
node scripts/p09b-finish-wait-resume.mjs
```

The script opens an isolated browser and copies only the explicitly named historical earned-career fixture into its temporary browser context. It does not touch the owner's browser saves.
