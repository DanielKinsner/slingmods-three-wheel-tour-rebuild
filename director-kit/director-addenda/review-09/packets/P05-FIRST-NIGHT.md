# P05 — First Night at the Harbor: directed experience

## Finish line

A playable first chapter, not the full release: one car choice, the existing compact garage and base kit, one existing course, three rivals, a two-lap night race, clear results/progression, and a reliable return/retry. The player should see another racer in a braking zone, choose a line, pass or lose a position, finish, and want another attempt.

No net-new bodywork, environment generation campaign, brand research sweep or asset purchase. The selected Slingshot is the only vehicle in this chapter. Rival Slingshots are intentional same-class machines, not mislabeled Spyders/Rykers. Those two distinct vehicles remain later work.

## Experience and presentation

The ordinary root opens the existing bay with **Continue chapter**, **Time trial**, and **Build** as clear choices. Use a compact chapter card, not a new full-screen management application. Continue routes to the next relevant beat based on the current save: shakedown for a new player, workshop invitation after first clean completion, crew grid after acknowledgement, or replay/summary after chapter clearance. Buying the underglow is never mandatory to enter the crew race; a stock player may compete. Existing valid careers skip already completed shakedown/reward beats without paying them again.

Preserve the existing day/night solo time-trial path, personal bests, keyboard/controller mappings and settings. Crew competition has separate timing/rule IDs; a traffic-assisted two-lap crew result must not overwrite a solo personal best.

For the crew grid, use the current harbor geometry and the nighttime preset. Four vehicles, two safe staggered rows behind the line, player in fourth. Fit actual collider/tire extents inside the road and enforce clearance rather than guessing grid coordinates. A short **skippable** 5–8 second grid/vehicle introduction may use the existing cameras/assets. No animated cinematic cutscene production. Start the countdown only after all physics participants, audio readiness state and render preparation are ready. No hidden motion during loading or intro.

During racing show position **1/4**, lap **1/2**, a small nearby-rival list, race time, speed/gear/RPM and existing camera/mute controls. Keep labels out of the road-reading area. A simple proximity indicator is useful when a rival is alongside; an elaborate minimap is not required. Preserve held quick look-back and near/far/cockpit selection. Menu/controller navigation and neutral-rearm rules must work at every transition.

At the player's valid finish, their placement is final: only already-finished valid rivals can be ahead. Show immediate player result and credits; still-running rivals remain labeled as such until they finish or the bounded postfinish timeout. Never assign fabricated finish times. Do not make Dan wait for a stranded AI before returning to the bay. Results offer **Retry race** and **Return to bay** with transaction-safe behavior.

## Rivals — fixed creative direction

| Rival | Visual identifier using existing assets | Driving character |
|---|---|---|
| Maya | Pearl/silver paint with a restrained teal identifier | Smooth corner entries, predictable lines, fewer steering corrections |
| Jett | Dark red paint with dark trim | Later braking within the same tire limits; opportunistic but not a ramming bot |
| Nico | Graphite paint with a warm yellow identifier | Patient following and clean exits; waits for an actual passing opportunity |

Names identify newly authored fictional crew characters. Rae remains the organizer, not a fourth opponent. Clone the existing driver with restrained helmet/suit identifiers; do not create separate faces or voice clones. Use distinct material instances only where needed; share immutable geometry/textures safely. Do not mutate the player's paint, kit or driver through a shared reference. No new cosmetic purchase system.

Rivals use the **same stock vehicle configuration and physical constraints** as the player. Underbody lighting is cosmetic. Different pace comes from reaction, braking margins and line choice—not hidden mass, torque, grip, speed multipliers, teleporting or rubber-banding. No scripted sinusoidal lane weaving. Initial tuning may target somewhat slower laps than the existing clean reference agent, but collision-aware finished behavior must be measured; the old 78.4-second solo agent is not a human-skill or fun benchmark.

## The AI must participate in a race

Use the existing route projection/lookahead helper as a starting point, not as a finished opponent. Read the engineering contract before changing the simulation. Add curvature-aware braking, occupancy/headway awareness, bounded lateral line choices, held overtake intent, avoidance and recovery. An opponent must slow when blocked, avoid driving directly through a car, and continue after light contact where possible.

Start with the simplest competent driver. Improve the demonstrated failure cases locally. Do not invent a machine-learning/training system, an all-purpose traffic framework or a new physics engine. The player input remains their actual input; the evidence-only controller must not become a concealed autopilot in normal play.

## Sound and presentation integration

Retain the existing telemetry-driven player audio. Reuse decoded engine buffers for distance-attenuated opponent sound; allow at most two nearest opponents to contribute at once, with bounded gain so player cues remain clear. Drive RPM/load from each actual rival's telemetry. Mute, volume, paused-state behavior and audio activation apply to all buses. No extra API generation or outsourced voice acting. Add a modest countdown/result cue through the existing audio machinery if useful; no musical score is required. Short Rae/rival lines may be text only; label them as such.

Keep the existing stable night lighting configuration. Player lighting retains actual light spill; rival lamps can use emissive lenses without extra projected lights/shadow maps in this milestone. Disclose that approximation. Do not add two area lights and two shadowed headlights per rival by cloning the entire player's presentation hierarchy indiscriminately. Prewarm all four participants/material variants before countdown.

Polish only the interfaces, clarity, sound mix, camera transitions and rival identification necessary for this chapter. The sparse harbor and unfinished high-end art remain known debt, not another prerequisite for building racing. Do not reopen the earlier cosmetic loops.

## Internal milestones — continue locally

**I0 — Preserve baseline.** Record exact commit/dependencies and current regression outputs. Capture enough clean solo input/telemetry to compare before/after the shared-world refactor. Keep asset hashes and the known good build recoverable.

**I1 — Shared-world parity.** Keep one-car behavior and time-trial API intact. Add dynamic peers to one world; prove symmetric contact, isolation of drivetrain/wheel state and exactly one world step per fixed tick. Gate AI integration on this local result, not on Dan's response.

**I2 — Four-car competition.** Run real two-lap events, start/rank/finish rules, race-aware controllers and recovery. Repair routine AI corner/blocking problems. Do not substitute moving ghosts when a controller needs work.

**I3 — Chapter loop and safe economy.** Connect all chapter beats, existing kit, crew rewards, migration, menu/keyboard/controller navigation, reload and retry. Keep old solo economy unchanged.

**I4 — Cohesive runtime presentation.** Rival identity, positional engine sound, clear HUD and results, load/intro/camera transitions. View an ordinary complete lap, not only static screenshots.

**I5 — Integrated QA, repair, delivery.** Run the acceptance matrix against the final integrated build, conduct a separate reviewer pass, resolve critical regressions and profile the four-car grid without a recorder. Package once. Do not stop after I1/I2/I3 to return another ZIP.
