# Astra — Review16: retain the signature experience; finish braking honestly

Prepared for Dan Kinsner · 15 September 2026

## Decision

Accept the refreshed P08B implementation for continued development and local demonstration. Keep the free five-product configurator, cohesive SlingMods interface, reference-set showroom and owner refinement, four finishes, new reverse interaction, Sport profile and Harbor Express. This is a substantial expansion, not grounds for another restart or a general showroom rebuild.

Do **not** declare the complete driving brief fulfilled: acceleration and steering improved, but straight-line stopping distance increased to obtain stability. Cold entry into Express also remains conspicuously slow in the submitted native run. Final vehicle/world fidelity, G3/G4, human driving/listening, physical-controller breadth, destination-device performance and public release remain unapproved. These holds do not prevent bounded gameplay expansion.

Next assignment: **P09A — Own the Build**. Address brake confidence and startup preparation, while integrating the already modeled products into a short, meaningful earned-career extension. The free configurator remains free; no new vehicle, new destination or engine migration in this assignment. One integrated return: Review17.

## 1. Exact artifact and remote identity

- Uploaded `Astra-Review-16-Lean.zip`: **65,529,688 bytes**. Above the soft 60 MB target, below the 100 MB cap. No need to resend it.
- Runtime: `822ff5f5a9cc211775076074c7d106e8d372286a`.
- Packaging: `51f34a341200cf76bf69106bdfae300590419e88`.
- Branch: `feature/p08b-slingmods-experience` in the existing private `DanielKinsner/slingmods-three-wheel-tour-rebuild` repository.
- The connected GitHub branch ref independently resolved to the packaging commit during this review. That verifies remote identity, not every remote binary or a fresh clone by Astra.
- `main` remains the earlier handoff according to the submitted receipt; this review performs no merge, commit, push or deployment.
- The refreshed return includes the later owner-showroom refinement. The historical `6aa1dafaac03` P08B measurements are **not** relabeled as measurements of `822ff5f5a9cc`.

## 2. What the customer can now experience

The source, supplied functional reports and sampled runtime frames support the new flow: enter a recognizable SlingMods set, select one of four finishes, add any of five supported products, inspect the assembled car, compare stock, test the recipe on Express, and restore the configuration on return. Career storage and free-preview storage remain separate.

Five represented products are SM-133 underglow, SM-3223 silver DDMWorks shocks, SM-7720 Thermal Sport exhaust (2020–2024), SM-26801 NRG aluminum Swan Neck wing and SM-28919 EvolutionR lower storage bags. The free configurator is not yet proof of a fully expanded five-product earned-career catalog. Product claims remain bounded: DDM uses estimated simulation parameters; exhaust character is game audio, not a measured engine recording or horsepower addition; wing and bags are visual previews.

The UI is now a coherent branded configurator and racing interface rather than unrelated development panels. The room has the recognizable cabinet/worktop/logo arrangement, displays, checker floor/red band and left lift. The owner refinement adds vented-floor relief, a closed bay, lift surroundings, matching swingarm accents and a short skippable departure with a door sound. The departure is presentation animation, not a physics-driven drive through a fully collidable workshop.

The new input has release/re-press direction behavior near a stop and retains the explicit direction selector. This is more discoverable than the old separate-X-only interaction; source and focused tests are not a physical-controller playtest.

The supplied route definition is approximately **2.317 km**, with an **800 m main straight**, a **200 m braking zone** and wider road/runoff. It complements rather than replaces the original Harbor. The sampled film displays 105 mph on the straight; supplied earlier Express race reports reach roughly 113 mph. These are simulated speeds, not vehicle specifications or a terminal-speed measurement.

### Visual judgment

Retain this direction. The room, floor, display arrangement, interface and configurator identity are meaningfully closer to the owner's goal. Four finishes and installed products are now worth inspecting. The lift/departure refinement adds a useful sense of place.

Do not equate these improvements with final realism. Broad room walls/light still look simple; the rear body, wing supports, some surfaces and seats remain visibly approximate. Express contains sparse/repeated scenery. The named rotor/lug/rocker/storage/hoop fixes do not establish that every possible panel gap or moving intersection is gone. Repair demonstrated defects, not imagined defects or real vehicle openings. Do not hide geometry under dark lighting.

## 3. Independent archive and test verification

**872/872 manifest-listed payload files** passed exact size and SHA-256 verification. The manifest itself makes the archive's 873rd entry. This establishes consistency of the supplied package, not independent truth of every claim. All **323** content-addressed historical data records were hash-verified and restored into a separate analysis directory; original evidence was not overwritten.

**86 focused tests passed, 0 failed**, across 19 source test files. These cover input/direction, drivetrain speed arithmetic, audio pitch, career/chapter/rewards, race rules, menu/proximity behavior, configuration and award boundaries, departure cancellation/pause, door-audio state, demo isolation and actual loopback HTTP/static-publication fixtures. They do not exercise the complete GPU game or Rapier integration.

The lean archive intentionally omits some assets. Two original read-only inputs were recovered for this scoped harness: the Harbor route matched the current remote-asset manifest; the contact-layout JSON from an earlier uploaded archive matched the current Git blob after CRLF-to-LF normalization. A loader redirects only these paths. No game source or test was patched to obtain the pass. The first harness attempts failed on missing omitted input files; those logs remain included as harness limitations, not concealed product defects.

The submission reports **180 passing tests** locally and from a remote checkout, both builds, and asset recovery. Astra did not independently execute that full suite or clean-clone/build/browser process. The ordinary npm install attempt timed out; offline installation explicitly failed with `ENOTCACHED` for the pinned Vite package. The review therefore used Node's TypeScript transformation and a small read-only resolver for the selected files. These constraints are recorded, not converted into a claim that the full application cannot build.

## 4. Driving: quantify the improvement and its tradeoff

I independently recomputed the supplied fixed-step launch and matched-speed traces. These are production-model diagnostics from the local agent, **not new simulations run by Astra, human playtests, or OEM measurements**.

| Diagnostic | Retained legacy | Sport v1 | Interpretation |
|---|---:|---:|---|
| 0–60 mph | 6.00 s | 4.73 s | Faster simulated launch |
| Low-speed left-turn mean radius (~9 mph) | 6.18 m | 5.09 m | Tighter maneuvering |
| Medium left-turn mean radius (~45 mph) | 88.66 m | 61.01 m | More responsive turning in this fixture |
| ~60 mph to near stop | 36.84 m | 49.93 m | **35.5% longer stopping distance** |
| ~110 mph to near stop | 128.18 m | 158.85 m | Longer, but the legacy high-speed run also developed ~10.3° yaw |

Stopping terminates below 0.2 m/s, not exact stationary. The medium-turn test uses full input and speed maintenance; the high-speed sweep uses 55% input and must not be called full-lock. Left/right results are closely matched in the supplied flat fixture. The 22-second launch trace reaches 127.67 mph in Sport versus 112.46 mph in legacy; these are maximum **recorded** speeds, not terminal-speed certification.

Source explains the deliberate balance: Sport torque scale is 1.30, shift interval 0.18 s, stronger steering and grip, but `brakeScale` is **0.70**. At full brake, `brakeSteerRelief = 0.35` further reduces the steering allowance by 35%. The local critique connects aggressive-braking instability to contact/guard behavior; I have not independently reproduced that cause. Stability is worth keeping, but this is not evidence that stronger braking was delivered. The next pass must investigate tire/load/contact behavior rather than blindly turn the brake number up, secretly lower speed, or weaken the braking target again.

## 5. Frame pacing and preparation

Independently recalculated nearest-rank percentiles over **every running-phase sample of each complete attempt**. No active-race outliers were removed. All four cars finish in these records. Latest evidence uses Windows/RTX 4080/hardware Chromium at 1920×1080 with the audio graph enabled and host output muted; timing was collected separately from film recording.

| Runtime / configuration | Attempt | Samples | p95 ms | p99 ms | Worst racing ms |
|---|---:|---:|---:|---:|---:|
| Latest 822ff5f5 / Express equipped 1080 | 1 | 5,117 | 16.7 | 16.8 | 33.3 |
| Latest 822ff5f5 / Express equipped 1080 | 2 | 5,118 | 16.8 | 16.8 | 16.8 |
| Earlier 6aa1dafa / Harbor equipped 1080 | 1 | 8,631 | 16.7 | 16.8 | 33.4 |
| Earlier 6aa1dafa / Harbor equipped 1080 | 2 | 8,613 | 16.8 | 16.8 | 33.4 |
| Earlier 6aa1dafa / Harbor stock 720 | 1 | 8,622 | 16.8 | 16.8 | 33.4 |
| Earlier 6aa1dafa / Harbor stock 720 | 2 | 8,558 | 16.8 | 16.8 | 50.1 |
| Earlier 6aa1dafa / Express equipped 1080 | 1 | 5,116 | 16.7 | 16.8 | 33.4 |

All seven meet the working p95≤20 ms / p99≤33.4 ms / maximum≤100 ms racing criteria. **Only the first two are latest-runtime runs.** This is not universal 60 FPS, GPU-memory, physical-controller, mobile or human-fun approval.

The latest Express run reports **9,845.6 ms preparation/load time**, with an **8,266.3 ms interval in the ready phase**. The earlier Express run similarly records ~10.29 s preparation. These values remain in the report. They are not racing intervals; equally, a good racing percentile does not erase startup friction. Source/harness inspection does not establish how much is network, decoding, shader preparation, main-thread work or the measurement boundary. Do not claim a specific root cause or an 8-second unresponsive UI without measuring it.

The refined static candidate is reported as **133,016,713 bytes / 85 files**. Total output size is not the initial download size or runtime resident GPU memory. Original and rebuilt output identities remain distinct.

## 6. Film and evidence interpretation

The provided final film is **183.061 seconds**, 1280×720, 25 fps, with stereo 48 kHz AAC. Independent full decode completed without errors; numerical audio decoding confirms non-silent samples. I sampled 22 frames spanning configuration, departure, reverse, racing and return, plus the supplied stills. **I did not subjectively audition or approve sound character.**

The local capture report identifies recorded game audio and disclosed cuts/segment joins around capture markers and loading. This is useful real-speed game capture with automated control, not an uninterrupted human playtest or performance benchmark. The omitted Original Harbor film section stays omitted and disclosed; earlier Harbor runtime evidence remains separately available. Door audio was acquired under a recorded local owner instruction; this review does not authorize additional paid requests, and no credential is included.

## 7. Next direction

Keep the customer-facing improvement. Do not spend another complete assignment remaking the cabinets or redesigning the UI.

P09A combines three practical outcomes: confident braking, measured/responsive entry into the test drive, and a short earned-career extension that gives the already modeled exhaust/wing/bags meaning in play. Preview all five from the outset; earn ownership for career use. Do not invent additional hidden products, performance effects or factory paint claims.

Full direction is in `CODEX_NEXT.md` and `packets/`. Continue from the actual latest P08B descendant, preserve intervening owner work, push a recoverable feature branch and return one lean Review17. No main merge, deployment, public sharing, account change, new spending or desktop takeover is authorized by this packet.

## Evidence register

Primary uploaded artifact: `Astra-Review-16-Lean.zip`, its `MANIFEST.json`, `REMOTE-ASSETS.json`, P08B/P08B-Refinement reports and source. Remote identity and scoped source cross-checked through the connected GitHub repository at the packaging SHA. Core review records: `evidence/archive-verification.json`, `evidence/independent-measurements.json`, `evidence/independent-tests-final-02.log`, `evidence/recovered-inputs.json`, `evidence/film-probe.json`, `evidence/media-validation.json`. Earlier unsuccessful harness/install logs are preserved under `evidence/`.
