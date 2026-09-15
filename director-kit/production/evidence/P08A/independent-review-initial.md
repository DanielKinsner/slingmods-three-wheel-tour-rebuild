# P08A independent review — initial implementation

2026-09-15. Bounded reviewer; implementation files read only. No browser, Blender, benchmarks or desktop interaction used. This records the implementation observed before repair and is not final acceptance.

## Actionable findings

1. **P2 — Controller users cannot adjust suspension values.** `src/career/suspension-ui.ts` creates five number inputs. `src/career/menu.ts` only focuses fields and sends `.click()` on confirm; directional controls move focus. No action changes an input value. Add keyboard/controller reachable minus/plus buttons or a deliberate controller adjustment mode. Verify the same saved values reach the simulation after navigation.

2. **P2 — Suspension save pending state does not block parent navigation.** `SuspensionUI.mutate` has its own private pending flag; `BuildUI.close`, its click capture, and the drive-night link only check `BuildUI.pending` and `client.stale`. While the new purchase/setup transaction is waiting, those remain false. A user can leave the page before completion, and session-only handoff can serialize the pre-purchase state. Share busy state and block parent close/drive until the transaction settles. Exercise with a delayed transaction, including rejection.

3. **P2 — Product adjustment count is presented as verified more strongly than the source supports.** The manufacturer instructions say 19 clicks of adjustment and list settings as clicks from full soft. Code/UI assert 19 positions including full soft (0–18). That interpretation is not established by the source. Either support 0–19 clicks, or explicitly say this game's intentionally limited range is 0–18 without asserting the hardware has only those positions.

4. **P2 — Spring visual scaling does not remain anchored to both seats.** `SuspensionPresenter.update` scales the entire spring group by shock length / .45 about the lower eye, while its lower collar is fixed and upper seat translates with the upper eye. The authored coil runs from .09 to .375; upper seat is .382. Thus the lower coil end is .2L and upper coil end is .8333L, while seats remain near .081 and L−.068. At L=.56m this creates about 31mm lower and 25mm upper separation before coil thickness. Fit the coil between actual seat locations by translating and scaling only its span; retain rigid housing/piston and exact eye endpoints. Validate normal movement and the supported rear range.

## Tests performed

Command: `npx tsx --test tests/chapter.test.ts tests/career.test.ts tests/competition-rules.test.ts`

Result: 20 tests, 19 passed, 1 failed. `tests/chapter.test.ts:11` expects migration version 2; actual is new version 3 (`3 !== 2`). Update migration fixtures/assertions deliberately and preserve checks of all original fields and unknown/corrupt-save rejection. This failure is an old expectation after the authorized schema expansion, not evidence of lost progress.

## Contracts inspected

- v1/v2 migration derives `legacyCrewAccess` from previous first clean completion; existing earned crew access is retained, including underglow ownership, credits and receipts. New saves require duel completion at scene entry. Existing crew rules/rewards remain distinct from the new one-lap Maya duel.
- Duel results use separate event identity, one-lap proof, UUID attempt key, result-bound duplicate checks, and one-time first-completion bonus. Removed suspension leaves ownership and setup intact. Existing time-trial and crew receipts remain valid.
- Demo preparation and sessionStorage are separate from IndexedDB career. The demo retains its existing immediate crew entry. New version acceptance was added to temporary scene handoff.
- Stock force expression remains untouched before an optional suspension branch. Damping/preload estimates do not modify tire friction, engine torque, mass, aero, anti-roll, collision or contact layout. Stock byte-for-byte trace equivalence to the pre-P08A implementation still needs independent evidence; comparing two configurations of only the new implementation is insufficient.
- New hardware source leaves the accepted car .blend unchanged. Front carrier copy excludes only original damper/spring objects because exported stock front geometry is merged. Rear originals are hidden separately; original rear linkage remains authoritative. Exact carrier equivalence and moving-seat geometry need final evidence.

## Other validation needed before final acceptance

Complete fresh and migrated career loops, repeated duel/crew races, real durable reload, delayed/rejected save and denied-storage handoff, duplicate awards, removal/reinstallation without a second charge, source-equivalent stock simulation trace, bounded suspension extremes, authentic performance evidence and final screenshots/film. None of G3/G4, hardware, release, hosting or manufacturer handling fidelity is approved here.
