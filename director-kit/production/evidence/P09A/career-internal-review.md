# P09A career and integration review

Scope: bounded career implementer reviewed its own state/UI, then independently read root Express, entry preparation and crash-recovery integration. Physics tuning is reviewed separately. Current source hashes are in `career-source-review.json`; final runtime/remote identity is owned by the integrator.

## Defects found and repaired

1. Career workshop initially passed showroom `SM-133`/`SM-3223` IDs to the older purchase commands. Those commands correctly rejected them. The hub now translates to the existing canonical legacy product IDs; the shared catalog remains the displayed product identity. Full all-five ownership tests and ordinary UI purchase passed.
2. New schema migration required updating historical future-version fixtures and exact expected neutral fields. Original credit, receipt, appearance and crew assertions were retained. Future schema 5 remains rejected; current schema 4 is valid.
3. Root async start initially set `rewardPending` before calling reset, causing its own reset gate to reject first start. Actual integrated entry remained on ready. `resetPermit` now precedes the pending guard. The retained failed capture makes the prior failure explicit.
4. Root ready/result UI initially retained free-preview labels and lacked automatic result commit. Source review and actual screenshot identified both. Root repaired labels and commits; the subsequent four-event run earned actual chapter receipts.
5. Root career return used direct navigation, bypassing session-only career transfer. It now uses `career.client.navigate`.
6. Root completed Cup-leg reset could prepare the next stage while retaining the previous route scene. The result-reset path now returns to the hub after its receipt commits. The final controlled loop includes a held-R regression after the Harbor Cup result.
7. Root result departure could leave before the full field/result transaction finished. Departure and reset now wait for a committed result, with an explicit discard route only after a write failure.
8. The invitation controller initially searched background inert choices. Its `BuildMenuInput` now targets only the dialog; header/content are inert and keyboard Tab remains trapped.
9. Chapter proof payloads are deeply frozen. Validation now rejects malformed/dangling Cup references, duplicate records, invalid route/tune/recipe metadata and missing record-receipt pairs. Real IndexedDB interruption testing confirms no partial wallet/unlock/Cup commit.
10. The controlled-clock evidence harness stopped rendering immediately when the asynchronous receipt completed, leaving an earlier pending UI visible. One final production `normalFrame` after the receipt fixes this harness issue; it is not a gameplay change.

## Evidence interpretation

`career-loop-05` passed the complete actual driving/purchase loop: solo Express, Jett duel, Harbor Cup and Express Cup, followed by ownership of all five existing products and remove/equip/reload. Its controller supplies pedal and steering input to the production simulation, not positions or outcomes. Jett finished ahead of the player; the player finished fourth in both Cup legs. The 2400 first-completion credits still funded every new item, confirming no win/grind gate.

CPU and real IndexedDB tests use clearly synthetic result fixtures to test malformed commands and transactional faults. They do not substitute for the captured driving loop. Controlled-clock proof is not native frame-time evidence. Historical failed/HMR/harness runs remain available, rather than being relabeled as successful runs.

Remaining approval holds: final hardware/controller breadth, human fun/listening, G3/G4, world/vehicle fidelity and publication. No new art, real-product performance claim, paid audio or external service was introduced by the career work.

## Final candidate verification

`career-loop-07/verification.json` passed after the final integration repairs. It adds the completed Harbor Cup leg held-R regression: the UI returned to the hub with exactly one saved Cup leg, then loaded Express with the fixed Cup recipe. All four valid finishes, all five owned/installed parts, final 1250-credit balance and remove/equip/reload passed. The loop uses the neutral virtual controller continuously while adding keyboard R; the prior loop06 removed the controller and correctly triggered production disconnect-pause. That harness failure is preserved. Browser is closed. Native timing and final static/remote-clone proof remain the integrator's separate lanes.

## Sport-paced final candidate

`career-loop-08/verification.json` supersedes loop07 after the root corrected Sport v2 rival planning to use the same Sport pace branch as v1. All four events and the full ownership/reload/Cup-held-R loop passed: 77.548s solo, 79.170s Jett duel (second), 77.073s Harbor Cup (fourth), 86.090s Express Cup (fourth). The final balance remains 1250 after purchasing all five products from the real P08A fixture. No one-second trace sample had the player finished while rivals were still racing; waiting-field pause/resume is therefore an explicitly synthetic UI fixture test, not claimed as exercised by these natural finishes.

## Bounded finish-wait/resume closure — 049c1cd

Two isolated control-only driving attempts were run against the frozen static build at port5202; no production state or physics code changed. Both failures are retained. `finish-wait-resume-01` achieved a valid **second-place** player finish (78.898s versus Jett77.741s), so the required finish-ahead waiting state was not reached. `finish-wait-resume-02` used the one permitted adjusted input planner; it entered physical recovery and requested reverse, which the existing evidence adapter deliberately rejects. The attempt stopped. Their exact planner settings and limitations are in each folder's `CONTROL-PLAN.json`.

**Actual finish-ahead → pause waiting field → Resume → reward remains unverified by this targeted browser proof.** No runtime defect is inferred merely because these evidence drivers failed to finish first. Source inspection establishes that Resume is allowed and its paused primary button remains enabled. `tests/p09a-career-ui-state.test.mjs` separately **passed** a clearly synthetic UI fixture: finished player plus still-running Jett, real pause-button click, enabled Resume action and controller activation. The synthetic UI test does not certify the full runtime/award path.

The complete ordinary gameplay loop `career-loop-08` remains passing on the Sport-paced candidate. All worker browsers are closed; there will be no further tuning attempts for this scenario in this assignment. Existing performance and approval holds remain unchanged.
