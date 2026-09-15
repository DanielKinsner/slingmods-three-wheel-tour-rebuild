# P08A independent review — repaired implementation

2026-09-15. Reviewed implementation commit `ec68765` against pre-P08A baseline `ed363b28ec6ba933dd82c576153bd73c80ea6619`. Bounded read-only source/evidence review; no browser, benchmark or Blender was launched by this reviewer during the final pass. Initial findings remain recorded in `independent-review-initial.md`.

## Decision

**No outstanding correctness blocker found in the reviewed P08A implementation scope.** All four initial findings are resolved in source, with focused test or captured runtime evidence. This permits the lead to finish exact-candidate repeat/performance validation and review packaging. It does not certify those unfinished delivery steps or grant release approval.

## Initial finding closure

| Finding | Repair and evidence | Result |
| --- | --- | --- |
| Controller cannot tune number fields | Each field has named decrease/increase buttons using the same saved setup command. `tests/p08a-ui.test.mjs` arms a standard controller sample and confirms the front compression increment and persisted client state. | Resolved |
| Navigation during suspension save | New shared busy callback sets `BuildUI.pending`; close/drive click capture and controls block until success/failure settles. The focused UI test delays and rejects purchase, verifies parent remains open and URL unchanged, then purchases successfully without losing credits. | Resolved |
| Unsupported 19-position interpretation | Setup bounds now accept 0–19 and explain clicks from full soft. The game-only ±20mm ride-height range and estimated damping remain disclosed. | Resolved |
| Spring ends leave their seats | Authoring coil now spans .0855–.378m; presenter subtracts the lower anchor before scaling and fits between lower and moving upper seat planes. `tests/p08a-hardware.test.ts` checks both endpoint planes through ±.15m rear motion under translated/rotated chassis transforms. | Resolved |

## Evidence examined

- `tests-final-preflight.log`: 144 tests, 144 passes, zero failures. This log was examined rather than rerunning the full suite during the lead's benchmark window. The earlier schema-2 migration expectation has been deliberately updated for schema 3; original field retention and corrupt/future-save protection remain tested.
- `loop-03/verification.json` and `scripts/validate-p08a-loop.mjs`: actual menu navigation and existing physical control path with a controlled test clock. Fresh career completed the existing solo lap, new Maya duel, suspension purchase/setup, stock comparison, remove/reload/reinstall, existing crew event, retry, chapter reload and prepared-demo isolation. Final earned balance is 1250: 800 solo + 750 duel − 1000 suspension + 550 first crew podium + 150 repeat. Distinct retry attempt IDs and zero second podium bonus are asserted. This is functional proof, not wall-clock performance proof.
- `tests/p08a.test.ts`: duplicate certified duel submissions pay once; changed result binding/copying is rejected; first-duel bonus cannot repeat; wrong fitment and invalid setup are rejected; removal preserves ownership/setup; v1/v2 migration retains established credits/receipts and legacy crew access without inventing duel completion.
- `physics-final/physics-verification.json` and its producer: baseline physics source is loaded from the explicit pre-P08A Git commit. Import-path rebasing changes no equations. Baseline dependencies protected below are unchanged.
- Independently decompressed and hashed all four full telemetry files (`baseline`, `stock`, `street`, `removed`): **4200 rows each**, all SHA-256 **82f48f0389a9eadf9786c3820470154c5fe2a157e7bf1ec1e6eb0c65b73f862d**. Thus the evidence supports exact sampled stock equivalence, including after configure/remove. It is stronger than comparing two configurations from only the new implementation.
- Response evidence distinguishes modeled damping and preload effects: settled +20mm/−20mm offsets are measured; soft and firm drop response differs. These are game simulation observations, not manufacturer handling or lap-time claims.

## Protected source verification

Independently compared Git object hashes to `ed363b28ec6ba933dd82c576153bd73c80ea6619`; every checked file matches:

- `assets/blender/vehicles/slingshot-p04a1.blend`
- `public/assets/vehicles/slingshot-p04a1.glb`
- `public/assets/vehicles/slingshot-p04a1-rear-rig.json`
- `public/assets/slingshot-contact-layout.json`
- `public/assets/harbor/route.json`
- `src/presentation/hero.ts`
- `src/presentation/rear.ts`
- `src/simulation/drivetrain.ts`

The baseline-to-current change list adds the product .blend/.glb separately and contains no edit to existing vehicle, driver or Harbor geometry/collision assets. Physics is the bounded optional damping/preload seam already reviewed. Historical evidence was not replaced by this reviewer.

## Visual critique

Viewed actual `hardware-views-02/front-installed.png`, `front-stock.png`, `rear-installed.png` and `rear-stock.png`. The silver product is readable and visibly distinct from the orange stock spring; lower adjusters and threaded body are identifiable. Same-view stock comparison is useful. Both inspection views clearly state that the body is hidden temporarily; Full vehicle restores it. Source preserves/restores previous mesh visibility, and the unit test covers isolation reversal. These images show an explicitly isolated hardware inspection, not an assertion that unsupported hardware floats outside the vehicle while racing.

The hardware is an authored approximation, not OEM CAD or measured manufacturer geometry. The retained front carrier and rear linkage limitations remain explicit; global mechanical/art fidelity is not newly approved.

## Remaining delivery boundaries

The lead still needs exact-candidate repeated wall-clock race performance evidence, final film/ZIP review and remote branch/SHA recovery verification. Do not use controlled-clock loop duration as performance evidence. Public hosting is pending and not a development blocker. G3/G4, physical hardware testing, final vehicle/world fidelity, manufacturer dynamics fidelity and release/publication approval remain held.
