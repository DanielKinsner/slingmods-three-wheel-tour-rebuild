# Astra — Review19: retain Sport v3; authorize the first mountain destination

**Decision:** accept P09C Freedom to Drive for continued development. Keep its new current-profile behavior and the Review18 presentation. Authorize **P10A — Ridge Run**, a substantial, integrated new-destination assignment. This does not grant final OEM fidelity, G3/G4, human enjoyment/listening, physical-controller, or broad hardware approval. This chat has not modified the game repository or deployed code.

## 1. Exactly what was reviewed

- Uploaded `Astra-Review-19-Lean.zip`: 91,459,368 bytes; SHA256 `5505b9fb557a0ce576fa79805e1220d1ddd81964bb2511f18934fe1a97bf792c`.
- Frozen game runtime: `5b2c99af2c567c04b5ea9d896765e7a6ddeec25e`.
- Archive packaging commit: `5157f08966efddb9557b4068f530539c67e0bd85`.
- GitHub main read during this review: `63da7a0202a0216cea5e9a70bd55f63f5283cba4`.
- The remote `handoff/P09C-PACKET.json` matches the uploaded archive's size and checksum. Main, not an old feature branch, is the current continuation authority. Repository visibility is currently public; do not change it.

I read the submission summary, critique, performance/film notes, source changes and relevant tests, unpacked and verified the numerical evidence, inspected the supplied screenshots and sampled the actual film. The film is 198.272 seconds, H.264 1280x720 with a stereo AAC audio stream. It depicts diagnostic matched turns followed by current driving/racing and return to the showroom. The input automation, flat diagnostic pad, edits and explicitly initiated restart are disclosed. A filmed restart is not proof of a filmed rollover.

## 2. The steering fix is substantive, but describe its benefit accurately

Sport v3 retains v2 power, grip, braking allocation and underlying three-contact force model. It adds a small speed-dependent steering reserve, uses a 0.10-second first-order steering response with the existing rate limit, and removes the v3 brake multiplier from the steering request. The reserve is still bounded; this is not unlimited lock or an invisible body-rotation assist.

The code's previous no-slip geometric angle was a command ceiling even though its tire model requires slip angle to generate cornering force. That explains why granting some steering reserve is different from increasing tire grip. Inspection of `src/simulation/index.ts` confirms that the existing v2 guard/floor and brake allocation paths now also cover v3; other substantive force equations are retained. The diff is included.

I independently recomputed radial path error from world positions and the recorded pre-turn position, not just the precomputed `error` column. Both left and right turns agree to small floating-point tolerance. There are four seconds of settling and eight scored seconds, 480 scored samples per case.

| Matched case | v2 RMS path error | v3 RMS path error | v2 mean steering demand | v3 mean steering demand |
|---|---:|---:|---:|---:|
| 50 mph / 90 m radius | 0.934 m | 0.963 m | 82.0% | 66.4% |
| 65 mph / 150 m radius | 5.573 m | 1.105 m | 96.6% | 71.6% |

At 65 mph, the old profile saturates the command during approximately 91.5% of the scored interval; v3 does not. Its maximum radial error is 1.316 m, versus 7.246 m for v2. No brake input is used in these cases, all three contacts remain supported, and the recorded tire force vectors remain within their grip bounds.

**Do not claim the 50 mph circle was impossible before.** It already passed. V3 provides additional control reserve there rather than a lower measured path error. Neither this test nor my review establishes that every real player will like the feel or that arbitrary fast corners require no braking.

The supplied approximately 60 mph near-stop traces remain identical in distance: **36.031974 m** for v2 and v3. Summing all supplied position segments in the nominal 110 mph case gives 116.369587 m for both; the local summary reports about 116.366 m, a sub-4 mm difference in calculation/selection, not a meaningful behavior change. These tests enter slightly below the nominal target speed and end below 0.2 m/s; they are not manufacturer stopping-distance claims. The submitted launch/equivalence tests report unchanged 0–60 time of 4.733333 seconds; I did not execute Rapier independently here.

## 3. The profile mismatch is addressed

New ordinary entries now resolve shared `CURRENT_HANDLING_PROFILE` to Sport v3: fresh recipes/presets, direct Harbor/crew entries, free preview routes and new Chapter02 attempts. Player, field, metadata and input resolve the same selected profile.

Explicit historical v1/v2 recipes remain historical. **Build Presets → Use current driving → Save build** creates a current version while preserving the original. Existing attempts and Cup legs retain their frozen recipe across retry/migration. Stock comparison removes products but keeps the finish and driving version. Earlier records are not silently repurposed as directly comparable current-tune best times.

The six submitted P09C profile/save tests were among the tests I actually executed. Do not remove this versioning merely to simplify the new destination.

## 4. Verification performed here and its limits

### Archive and source

- **268 manifest-listed payload files** match size/SHA256; the outer archive has 269 members including its manifest.
- **424 logical nested evidence members** match the complete data index. Safe streaming extraction checked ordinary files and backward TAR hardlinks against already hashed targets. Approximately 1.38 GB of logical evidence is represented after decoding and deduplication; no rows were removed by this review.
- Compared the uploaded Review18 and Review19 source trees: 106 current source files, **92 byte-identical and 14 changed**, no new source files in that comparison. The source change is concentrated in version/entry integration and steering rather than a new art or audio pass. This is not independent rehashing of the 128 heavy runtime/editable assets omitted from the lean ZIP.

### Executed tests

- **83 submitted focused tests passed**, zero failed in the final selected run, across 15 test files: input, drivetrain angular speed, audio pitch mapping, menu rearming, career/chapters, crew menu/proximity, demo separation, time-trial rules/save, configurator, departure state, Chapter02 economics and P09C profile/version migration.
- **Three additional reviewer tests passed** against the actual profile module: original profile definitions/envelopes unchanged; brake-independent v3 command symmetry; continuous finite speed response through 50 mph and bounded high-speed reserve.
- Node 22.16.0 with built-in TypeScript transformation and a read-only local import resolver was used. Source code was not patched to obtain these passes.
- An initial selected run included `audio.test.ts`, which could not import the absent Rapier package. Its failure is retained. The final 15-file selection excludes that dependency-requiring file; it is not presented as a repaired game failure.
- The package install attempt timed out, and direct diagnostics showed DNS failures for npm and raw GitHub. Accordingly **I did not independently execute the complete 250-test suite, build the playable game, run Rapier motion cases, launch the browser, or benchmark hardware**. Those remain explicit local-agent evidence. There was no downgraded dependency substitute and no mocked physics.

### Recalculated native performance

I recalculated nearest-rank p95/p99/max from every running-phase row in each required attempt, checked finite values, monotonic timestamps, zero overflow and consistency with supplied summaries.

**All 16 standard matrix attempts plus two cockpit attempts pass**: p95 16.7–16.8 ms, p99 16.8 ms, maximum active interval 33.4 ms; zero active intervals above 100 ms. Startup/ready rows, including slower intervals, remain in the evidence and were not hidden. The source tests/physics simulation do not establish those timings; these timings come from the provided Windows/i9-12900K/RTX4080 native-RAF captures with no concurrent recording. They do not explain every historical spike or certify another computer.

## 5. Appearance, sound, hosting

The sampled film and stills retain the existing showroom/configurator, physical dashboard, equipped vehicle and Express/Harbor identity. They remain visibly developmental: simplified surfaces, relatively repetitive waterfront scenery and the existing audio-source limitations remain. A driving-only review is not a reason to relaunch another global art/GUI redesign.

The film has a real encoded audio stream and the package includes detailed capture/synchronization records. I have not auditioned the engine timbre or awarded human listening approval. No new audio generation or replacement OEM recording is demonstrated in this assignment.

The submission records actual hosted-root and full hosted gameplay verification at its identified build; the current remote handoff documents those results. I read that evidence but did not personally run a new hosted browser playthrough. Source runtime, packaging/receipt commits, and Vercel's provider-side `-working` label remain separately identified. Do not turn a deployment READY status into a claim of human playtesting.

## 6. Director decision — expansion rather than another tuning loop

The measured fix is sufficient to retain Sport v3 and move the project forward. User driving feedback remains valuable, not a request to make Dan operate a regression department. A specifically reproduced new handling bug can be repaired locally; no speculative retune is authorized.

The next build is **P10A — Ridge Run**: a genuinely new, Smokies-inspired mountain destination with real elevation, connected scenery, destination selection, immediate free build test drives and three earned events. Harbor/Express and the current Slingshot showroom stay. This is a new environment family, not Harbor with different trees.

The next vehicle priority remains a proper Spyder, not a second unfinished vehicle inside this terrain assignment. A destination designed around the retained driving behavior expands the tour and establishes height-aware route tooling useful to subsequent locations.

Read `CODEX_NEXT.md` and the three implementation packets. One substantial internally reviewed return: `Astra-Review-20-Lean.zip`, the current playable hosted root, and a continuous new-route gameplay film with actual game audio. Full source/editable/runtime assets and the completed archive remain recoverable from main.
