# Independent career/integration review — P05

Reviewer: p05_career worker. This worker authored the career migration/component/tests; its inspection of the lead-owned crew/workbench integration is a separate reviewer pass, not independent authorship of the career implementation.

## Final source inspected

Repository: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.
HEAD verified read-only: `7414ebfa6e462c897b3bbc604c39aaa26c9956c4`. Tracked working tree was clean at inspection. No browser, GPU, tests, source edits, or commits were performed during this final read-only pass; the lead's final performance matrix was active.

The three previously reported integration findings are corrected in this source:

- **Ready-screen focus loss:** `src/crew.ts` ready-phase resume now clears input pause/arming, race pause and intro timer instead of returning while leaving the menu permanently paused. This resolves the specific reviewed deadlock by inspection.
- **Focused native Enter:** `src/crew-ui.ts` excludes held keyboard Enter when a native button/link/input/select owns focus. `src/crew.ts` also returns before adding menu edges or keyboard state for Enter/Backspace on buttons/links. Native activation does not also request the default crew action through that reviewed path.
- **Time-trial controller handoff:** `src/harbor-entry.ts` tracks card visibility, disarms on becoming visible, and requires release of its menu buttons before accepting a new edge. The activation that reveals the menu cannot immediately also launch the shakedown. `src/workbench.ts` hides the legacy card initially and manages chapter/Build visibility explicitly.

The final source obtains crew rewards from the competition manager's cached opaque proof; a retry reuses the same attempt-bound result. The pending flag is cleared in `finally`, and a failed save offers retry/return. The store retains serialized IndexedDB read-modify-write, event-specific receipts and exact solo 800/100, kit600, crew300/200/150/100 plus once-only podium400 rules. Migration remains schema1-to2 in the same database, preserving old fields and rejecting unknown/corrupt records without replacement. The v2 database upgrade closes older connected writers. Direct crew navigation is now gated by first valid solo completion, not by purchase/equipment.

## Newly identified unresolved defect at this inspected commit

**Session-only crew navigation is missing from the handoff whitelist.** `src/career/client.ts` permits `bay`, `pad`, `vehicle`, and `harbor`, but omits `crew`. If IndexedDB is unavailable, accepted session progress is therefore not transferred by bay-to-crew navigation. The crew entry then receives a fresh fallback career and redirects to the bay because firstCompletion is false. The existing temporary-career promises require this narrow repair and a no-WebGL isolated navigation regression. Reported immediately to the lead; no source edited during this read-only pass. This is a fallback-flow defect, not a performance result or broad gate judgment.

## Earlier actually executed checks

The worker ran `npx tsx --test tests/career.test.ts tests/chapter.test.ts tests/career-browser.test.mjs`: **13/13 passed** on the earlier P05 integration candidate. This covered old economy, v1 fresh/earned/equipped/unequipped migration, proof validation, exact crew amounts, idempotence, real isolated IndexedDB old-connection closure and two-tab concurrency, injected write failure with unchanged state and same-proof retry, corrupt-record retention, and store-level denied-storage fallback. The store-level fallback check did **not** exercise bay-to-crew page navigation, explaining the coverage gap identified above.

The worker also executed two headless Playwright Chromium browser sessions at `http://127.0.0.1:5187` with a 1280x720 viewport and explicit SwiftShader flags. These used fresh isolated contexts or a copied `director-kit/production/evidence/P04B2/fixtures/review08-earned.json`, with `equipped=false` solely in the isolated stock fixture. Native buttons were used; no desktop mouse, personal profile, or GPU performance test was used.

Observed outcomes:

- Fresh bay: schema2, zero credits, shakedown entry; Build hid the chapter and Close restored it; Time trial revealed the separate solo selection.
- Copied earned stock fixture: invitation displayed stock eligibility; dismiss then reload did not claim the invitation. Accept opened the actual four-participant crew ready screen with zero event time.
- Crew retained stock presentation: no attached kit or emitting kit lights; the two reserved slots remained allocated at zero intensity.
- Bay return preserved 300 credits, original receipt IDs/timestamps, cyan color/.7 brightness, unequipped state, and solo PB/settings JSON byte-for-byte. Only migration plus invitation acknowledgment was expected; revision6 became7. No browser page errors were observed.

**Provenance limit:** these earlier checks ran against the lead's then-current P05 integration working candidate served on5187, before final freeze and before the three integration repairs. The ad-hoc browser outputs captured state but did not retain a source/served-build hash or commit field. An exact immutable commit for those browser runs therefore cannot be verified or retroactively claimed; they are reported candidate observations, not final-build certification. The integration was subsequently committed in the P05 history, but that does not establish byte identity for those prior runs. The 13 test results likewise predate final freeze. This final note certifies only the specifically inspected source paths at7414ebf; use the lead's hash-bound final evidence for final runtime behavior.

G3/G4 remain pending. No broad gate approval is given.


## Lead resolution after review

The reported crew handoff omission is repaired in runtime76d3668. The worker added tests/career-handoff.test.mjs and executed its real isolated, non-WebGL browser check: denied-IDB bay to crew to bay preserves the full session state and real session-only warning, while unsupported scenes/origins receive no transfer. The lead read the one-line whitelist diff and regression. This closes that source finding; physical-controller and human listening limitations remain.
