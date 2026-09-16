# Astra — Review18: retain Signature Finish; address steering next

## Director decision

Accept P09B's interface, action-audio, powered-display and Thermal departure integration for continued development. Retain the current showroom, vehicle refinements, five free product previews, earned progression, improved braking and sounds. Do not equate this with finished vehicle/environment fidelity, authentic engine timbre, physical-device testing or G3/G4/release certification.

**Next assignment: P09C — Freedom to Drive.** The owner's reported loss of useful steering around 50 mph has not been fixed by this presentation-only pass. Resolve the actual input/steering response and inconsistent active handling profiles, preserve good braking, and return a current playable build with evidence that ordinary broad turns are enjoyable without excessive braking. Do not start another showroom/UI rewrite or a new vehicle to avoid the driving issue.

This packet is direction and independent review evidence. It does not patch the user's game or perform a deployment.

## 1. Identity and current publication state

- Submitted archive: `Astra-Review-18-Lean.zip`, 40,182,845 bytes.
- SHA-256: `fa522a10442e2a0b9107d0fce1c39239cc26f9139582d7e0c3ca98e136d36886`.
- Frozen game runtime: `bf1297c9770357cf5a331288b14cae82d5510d86`.
- Archive packaging commit: `59535e43381149c31741713bb84ca8589aed17a4`.
- Remote main observed during this review: `52c234cb8757cc2cfb387738f800a4056c221237`.
- The current Git handoff records owner authorization to merge and continue on main. That supersedes earlier feature-only/no-main restrictions. It also requires the actual lean review ZIP to be tracked for cross-machine delivery.

Vercel's canonical rebuild URL now resolves in the connector to READY deployment `dpl_EGpBTgZDM4XgFptxSMztVhSN2uCf`, production/main at `52c234c`. Its build log says `npm run build`, not the curated demo publication pipeline. This resolves the earlier obsolete-main diagnosis at the deployment-metadata level. It is **not** an independent hosted browser/playthrough test. The next delivery must verify the actual root entry, source identity, selected runtime files and interaction flow.

GitHub's current repository metadata reports `private:false` / `visibility:public`. Historical handoff text still says private. I did not change visibility, inspect any secret store, or establish when/who changed it. Do not promise a private handoff, silently change account settings, or treat public accessibility as blanket third-party asset clearance.

## 2. What landed

### Interface

The supplied matched 720p images show a meaningful composition change: lighter category navigation, a shorter paint/product inspector, smaller swatches, consolidated view controls and a slimmer bottom action strip. The earned chapter, workshop, pause and results follow the same visual language. The vehicle has more breathing room. This is more than a border-radius change.

I inspected all 12 selected screenshots and nine samples from the current film. Some typography remains compact in the 1080p framing and the game still uses dark panels; this is not a claim of final UI or accessibility approval. Retain the new direction. Fix specific clipping, focus or readability regressions when demonstrated; do not reopen every visual decision next turn.

### Action feedback

Source implements 18 local authored cues, including distinct product-install classes, preset/save/navigation/unlock and race events. Dispatch is tied to successful changed actions, with deduplication, cooldowns, bounded voices and persistent Master/Interface/Engine mix levels. Reviewer unit probes confirm the cue selection/gating logic, not the subjective sound.

**No ElevenLabs generation occurred.** The submitted record says a secure available key and verified prepaid cap were unavailable; local synthesis and the owner's supplied recording were used, with zero external calls/spend. These are not recorded product installation sounds or an externally generated bank. The next driving assignment requires no new generation key.

### Powered display

A physical display is attached to the existing cockpit lens, rather than a floating overlay. It uses an originally authored Driver-home interpretation, selected-build thumbnail and actual speed/RPM/gear. Unsimulated telemetry is unavailable, not fabricated. Display power and audio mute are separate. Visibility/changed-value throttling limits texture updates. This is not OEM software, navigation, CarPlay or exact pixel-perfect RIDE COMMAND certification.

### Departure and engine

The Thermal-equipped departure uses the supplied recording, a 5.8-second excerpt from source 0.2–6.0 seconds. The implementation coordinates the clip with cinematic time and handles pause/resume/skip/mute, with synthetic-engine ducking and the existing door sound retained. The selected envelope rise is a synchronization choice, not an independently identified real ignition event. Stock departure does not receive the Thermal clip.

The driving-engine attempt adds seven nearby RPM anchors, adjacent crossfades and load/lift/shift mapping, with a limited, disclosed Thermal texture made from the owner recording. Engine response remains tied to telemetry. It is still a synthesized/estimated sound treatment, not measured stock-versus-Thermal multi-RPM recordings.

The supplied 35-second A/B alternates OLD then NEW for idle, steady, acceleration, lift and shifts. I independently read its PCM and recalculated segment levels: largest old/new pair RMS difference 0.01449 dB, with no full-scale sample values. This is RMS matching, not perceptual loudness matching, and does not prove that B sounds better. By-ear engine-quality approval remains open.

## 3. Independent verification performed here

**Archive integrity:** all 259 manifest-listed payload files passed size and SHA-256 verification. The manifest itself is the additional 260th ZIP entry. The nested numerical-evidence archive was extracted for analysis; its parent hash was verified. File hashes establish consistency, not truth of every recorded claim.

**Source preservation:** compared 27 relevant text paths with the actual uploaded Review17, allowing CRLF/LF normalization only. Twenty-two are identical: simulation, drivetrain, profiles, driving input/recovery, race/AI and core career modules. Five changes are UI-related. Full omitted binary preservation was not independently reverified in this lean copy.

**Tests:** 71 submitted tests passed across 13 self-contained files using a read-only TypeScript loader, plus seven separately authored reviewer checks passed. The latter cover cue logic/gating, pitch bounds, a mocked departure-clock lifecycle and the actual steering-limit function. A mocked audio clock is not a real AudioContext/browser test. No submitted game logic was changed to obtain these passes.

Four other test files could not load because the lean copy omits route/helper assets or because `three` was unavailable. Those import failures are preserved and are not declared production regressions. A fresh dependency install could not complete; the npm registry's DNS could not be resolved. I did not independently rerun the full build, full suite, Rapier driving, browser, physical controller or GPU benchmark.

The supplied local/remote-clone record reports 226 tests, both builds, 128 required-asset hashes, UI/audio/display lifecycle and earned-career/Cup flows. Those remain local-agent evidence. The early-player-finish/pause/resume record now includes an actual simulated first-place finish followed by remaining rivals finishing; that is controlled functional evidence, not human driving or timing certification.

## 4. Performance: independent recalculation of supplied runs

Recomputed all running-phase samples, separately by attempt, with nearest-rank percentiles. All 88,462 scored rows across 18 attempts were retained. Source timing was finite and monotonic; overflow was zero and recalculated values matched submitted summaries.

- Main matrix: 16 attempts, covering Harbor/Express, stock/equipped, 720p low/1080p standard, first race/retry.
- Additional cockpit evidence: two native attempts.
- **18/18 meet the existing targets**: p95 <=20 ms, p99 <=33.4 ms, maximum running interval <=100 ms.
- p95 range: 16.7–16.8 ms. Worst p99: 33.3 ms. Worst running interval: 66.8 ms.
- Zero scored running intervals above 100 ms.
- Non-racing intervals remain in the files, including intervals up to 350 ms in the reviewed runs. Do not describe the whole application as stall-free.

These are supplied Windows/i9-12900K/RTX4080/Chromium153 D3D11 measurements, with audio enabled and host output muted, without simultaneous movie recording. I did not perform those hardware tests. They are not phone/controller/broad-GPU certification.

The two newly supplied current-art P09A baseline races also pass. Reduced allocation and cached/throttled HUD writes are credible specific changes; this does **not** establish the root cause of every earlier spike or prove permanent elimination. Preserve the failures and that uncertainty.

## 5. Steering: the complaint has a concrete code-level basis

The unchanged `src/simulation/profile.ts` clamps the center-equivalent front-road-wheel request to the smaller of:

```
steerLock / (1 + abs(speed) * steerFalloff)
atan(lateralSteerLimit * wheelbase / speed²)
```

For Sport v2, the second term uses 8.2 m/s² and 2.667 m. `src/simulation/index.ts` then reduces available steering by up to another 15% with brake input. Sport v1 has the same speed ceiling but up to 35% brake reduction and the older 0.7 brake-strength scale.

Executing the actual submitted limit function gives:

| Speed | Sport v2 maximum equivalent road-wheel angle | At full brake | Ideal no-slip radius, unbraked |
|---|---:|---:|---:|
| 30 mph | 6.93° | 5.89° | 21.93 m |
| 50 mph | 2.51° | 2.13° | 60.93 m |
| 70 mph | 1.28° | 1.09° | 119.42 m |
| 100 mph | 0.63° | 0.53° | 243.71 m |

These are **center-equivalent road-wheel command angles**, not steering-wheel rotation. Radii are ideal geometric estimates, not measured vehicle trajectories. Individual front wheels use Ackermann geometry. Tire slip/load/traction can change the actual path substantially. Small road-wheel angles at speed are not inherently unrealistic.

There is no discrete 50 mph lock or rollback threshold in this function. It is a progressively restrictive speed-squared cap, independent of actual measured rollover risk. Braking immediately tightens the cap at a fixed speed before slowing eventually expands it. Tire combined-force limits are then enforced separately. This is a strong diagnostic lead for the owner's experience—not proof that all understeer comes from one line, and not a warrant to give full parking-lot lock at 100 mph.

The visual hand wheel also follows the limited telemetry angle with the existing presentation ratio. Rotating it farther cosmetically would not fix the vehicle. Review the complete input → road wheels → tire slip → yaw/path chain.

**Entry inconsistency:** original Harbor/crew paths hard-code Sport v1, while fresh configurator/Chapter02 recipes use Sport v2. Historical saved recipes can also select v1. The same apparent vehicle can therefore have different braking and brake-turn behavior depending on entry. Record the actual profile in every test; do not diagnose only one route/profile and declare the whole game repaired.

P09C must deliver a versioned, consistent current driving tune, useful medium/high-speed steering headroom, stable predictable braking and repeatable actual road-following proof. Retain historic behavior for explicit references/in-progress records, not as an invisible default trap.

## 6. Next delivery and boundaries

Continue the existing main checkout with current owner authority. Preserve the exact Review18 archive and historical evidence. Produce one meaningful end-to-end steering/handling result, not another chain of proof-only handoffs. Finish with `Astra-Review-19-Lean.zip` (target 60 MB, hard cap 100 MB), tracked on main, required editable/runtime assets recoverable, and actual local/hosted source identities.

Publication to the already authorized personal rebuild Vercel project may occur through its existing main integration; record and verify it. No new site, plan, spending, visibility changes or unrelated deployment is authorized. Metadata READY and a current SHA alone are not a hosted playthrough.

See the accompanying `CODEX_NEXT.md` and implementation packets for exact scope, migration and evidence requirements.
