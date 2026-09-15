# Astra — Review14: accept the local demo; move toward a hosted link

## Decision

**Accept P07A — Shareable Showcase as a bounded local development-demo candidate.** Retain its entry, isolated demo profile, SlingMods branding, one-product site connection, loading/recovery work and exact garage-only dependency export. Do not repeat P06C or start another broad environment-art assignment before Dan can try this candidate.

This is not G3/G4, final environmental/vehicle fidelity, authentic engine-sound, physical-controller, mobile or release approval. No hosted deployment has been demonstrated. The next proposed assignment is **P07B — Hosted Demonstration**, with a content freeze and an explicit authorization boundary for external publication.

Reviewed upload: `Astra-Review-14-Lean.zip`, 50,815,755 bytes, SHA-256 `3fecb7e944953177b8ad116a90a7729199db1603d82d0c3ea440034c4029c234`.

- Submitted starting commit: `6f473ee7d25869c0c4c4fa2462da652150adb949`.
- Runtime: `758c2b291a9b5bd525fe9acd1425537657fadf70`.
- Packaging: `2ce4c846d294335f6f3f9d40cf7332ea88786f61`.
- Both new identities are explicitly **LOCAL_ONLY**. This review has not verified them on GitHub. An older remote handoff is not a substitute for this candidate.

## 1. What the user can see now

The supplied 211.6-second, 1280×720 movie is a captured game demonstration, not a generated promotional trailer. Its sampled beginning shows the Development Preview and entry loading; race samples show the existing four-car field and two-lap event; its end shows the garage/build panel with the result balance. The recording uses automated input and an explicitly enabled evidence context. I inspected samples and selected beginning/end frames, not every frame or an independent human drive.

The complete home checkout has a retained static output. The local agent can start it with `npm run demo:preview`; the supplied default address is `http://127.0.0.1:5188/`. The server reads `demo-current.json` on startup. This is a local address, not a shareable Internet URL. The lean upload itself is deliberately non-playable because heavy runtime dependencies are omitted and indexed.

The ordinary entry now offers Race the Harbor, Explore the Garage, Daylight Drive and Continue Career, with keyboard controls and desktop/touch limitations. The prepared demo build is separated from career storage. It owns the cosmetic kit, opens the existing crew event, and starts with zero demo credits; results then use the existing transactions. It is not a new fake economy or new rival simulation.

Sources: submission `REVIEW-ME-FIRST.md`, `RESUME.md`, `DEPLOYMENT-READINESS.md`; inspected `src/main.ts`, `src/demo/*`, `src/career/client.ts`, `src/save.ts`; selected `review-images/` and `review-media/showcase-LIVE-AUDIO.mp4` frames.

## 2. Independent verification performed here

**Archive consistency:** all **592 manifest-listed files** matched their declared sizes and SHA-256 hashes. The archive's remaining entry is the manifest itself. This establishes internal consistency, not the truth of every submitted report.

**Included build inputs:** the final output manifest declares 142 source inputs. All **123 included inputs** matched. The other 19 are intentionally omitted binary inputs, including the current vehicle, driver, world GLBs, branding, HDR and audio bank. Their omission is not a hash failure; I did not directly hash those unseen current files.

**Preservation against the actual prior upload:** I compared 115 included protected paths with the real Review13 ZIP. **100 were byte-identical and 15 were declared changed**, with no disagreement in the supplied baseline/candidate hashes for those comparable paths. The other 199 protected paths were not comparable from this lean return. The local agent's 299-unchanged / 15-authorized-seam report remains a broader local claim, not my independent 299-file comparison. A separate text-normalized diff assisted source reading; strict byte verification did not normalize away changes.

**Tests:** a read-only TypeScript transpilation loader ran **67 focused tests across 13 test files**, all passing, with zero failures or skips. Coverage includes input, signed drivetrain RPM, audio pitch coherence, career, chapter, race/rival rules and stability, menus/proximity, harbor records and the new demo-profile tests. No game source was modified or replaced with stubs to obtain this result. The loader used the analysis environment's Node 22.16.0 and globally available TypeScript.

The submission reports **134/134 tests, a successful normal build and demo build, 11 hardening cases and six native interaction steps**. Those remain local-agent evidence. I did not run the complete dependency-backed suite, rebuild the whole static output, launch the full game here, or reproduce the 4,200-tick physics parity test. The lean package lacks the complete binary closure required for that exercise.

Evidence: `evidence/independent-inspection.json`, `evidence/independent-tests.log`, and `evidence/ts-loader.mjs`.

## 3. Repeat-race performance: observed pass, cause still open

I recalculated nearest-rank percentiles from the complete supplied active-racing samples, keeping attempts separate and retaining the historical failing runs. No samples were removed to improve the result.

| Final supplied configuration | Attempt | p95 ms | p99 ms | Worst active interval ms |
|---|---:|---:|---:|---:|
| Equipped 1080 | 1 | 16.7 | 16.8 | 33.5 |
| Equipped 1080 repeat | 1 | 16.7 | 16.8 | 16.8 |
| Equipped 1080 repeat | 2 | 16.8 | 16.8 | 16.8 |
| Equipped 720 | 1 | 16.7 | 16.8 | 16.8 |
| Stock 1080 | 1 | 16.7 | 16.8 | 50.0 |
| Stock 720 | 1 | 16.7 | 16.8 | 16.8 |
| Daylight equipped 1080 solo | 1 | 16.7 | 16.8 | 16.8 |

All six final crew races and the separate daylight solo run meet the working p95 ≤20 ms, p99 ≤33.4 ms and no-active-interval-over-100 ms thresholds. The active sample sequences are contiguous, timestamps are coherent and overflow is zero. The submitted final crew records contain four finishers with two laps each.

Two new repeat contexts of the frozen **old Review13 runtime** also passed. Therefore the prior slowdown was **not reproduced in those new runs**; these records do not prove that P07A fixed a game fault. The two historical second-race failures, each p95 33.3 ms, remain in the package. Background software, GPU contention, a leak and other explanations have not been causally established. Do not describe a guessed cause as diagnosed or repaired.

The scored runs used the submitted Windows/RTX 4080/D3D11 Chromium configuration, standard quality and actual 720p/1080p render sizes at DPR 1. They used native wall-clock RAF, automated controls and no concurrent video recording. Audio graphs were enabled while host output was muted. The final matrix uses the existing career fixture on the demo build; prepared-demo isolation and ordinary entry were exercised separately. Startup/loading intervals and shader-program transitions remain in the raw data.

These are recalculated **provided measurements**, not my own hardware benchmark, a general 60 FPS certification, or evidence of subjective driving quality.

## 4. Garage loading improvement is reproducible

The garage no longer needs to load the complete waterfront kit and discard non-garage modules. I extracted the actual source kit from the previous uploaded Review13 archive and ran the supplied dependency-subsetting tool into an isolated analysis directory.

- Source kit: **28,974,372 bytes**, SHA-256 `65166c2be3ee3f0a969a836015101ea2c7558219c518e67c054295e402001f31`.
- Reproduced bay: **7,668,224 bytes**, SHA-256 `4e26ed4a951c989cbf4344e97b6c42ba13e6355b2f874e1d904ecc36e6cdd7a5`.
- The output hash exactly matches the declared Review14 bay hash.

The supplied tool preserves selected node transforms, material descriptors and binary geometry/image views, relocating dependency indices rather than recompressing artwork. Its internal exact-view checks passed. This independently reproduces the declared output using submitted code; it is not an independent implementation of that algorithm or direct access to the unseen home-machine output.

This is approximately a **73.5% reduction in that one model dependency**, not a measured 73.5% reduction in total startup time. See `evidence/bay-reproduction.json`.

## 5. Branding, site linkage and presentation

The inspected final garage and entry images show recognizable SlingMods artwork. The branding source/layout adds a gantry treatment and two service signs. The special service-sign detail captures disable fog and hide the ready interface; treat them as placement inspections, not ordinary-driving views or performance evidence.

The build panel now says Shop This Build, supplies the represented SM-133 Kit #1 product name and 2024 Slingshot R fitment disclosure, retains the appearance-only distinction and uses an intentional HTTPS product link with `noopener noreferrer`. This is a useful **one-product connection**, not a live catalog, cart, price feed or storefront API integration.

The world and vehicle remain visibly developmental: simplified forms, limited water realism, repetitive construction and dark night/cockpit areas persist. Those remain later art tasks. They do not justify another full scenery cycle before a clearly labeled desktop development demo. The current footage should be shown as a work in progress, not as a finished photorealistic racing game.

## 6. Hardening and evidence limits

Source inspection supports separate demo storage, profile-aware internal navigation, explicit corrupt-demo recovery, loading stages and timeout handling, graphics/error fallback and stopped render loops after page lifecycle shutdown. The local hardening reports describe browser-denied storage, reload/navigation and recovery scenarios; the native report uses ordinary keyboard/menu interactions. Physical controllers and phones remain untested.

Ordinary visitor URLs do not expose the test globals. Explicit `test=1&profile=1` retains diagnostic controls. That is a disclosed single-player diagnostic path, not an authentication boundary or an online competitive security guarantee.

The final movie has a video stream and stereo 48 kHz AAC audio. The submission discloses live graph capture, sync markers and a single synchronization shift. I did not audition the engine timbre or independently validate the omitted original capture streams. This does not turn synthesized sound into OEM exhaust recordings.

One small deployment seam needs correction: `scripts/serve-demo.mjs` omits `.wav` from its MIME table and serves those files as `application/octet-stream`. The current fetch/decode path worked in submitted local tests, but the deployment document requires `audio/wav`. Make the MIME mapping and deployed headers consistent and verify playback; this is not a reason for a new audio-system pass.

## 7. The remaining obstacle is publication, not another game redesign

The submitted playable payload is **49 files totaling 112,457,877 bytes**, excluding the output manifest's own metadata. I independently summed the supplied output inventory. This is not the 50.8 MB review ZIP and is not a measured browser transfer total after compression/cache.

The read-only Vercel connector returned one connected team, `daniel-kinsners-projects`, on **Hobby**. Official current documentation restricts Hobby to personal, non-commercial use and documents a 100 MB CLI source-upload limit. This SlingMods-branded retail-linked demo should not simply be assumed eligible. First deployment of a new Vercel project is also publication even without `--prod`. No account or deployment changes were made here.

**Proposed route:** a separately authorized Netlify Free development demo, using a verified, prebuilt static output and a deliberate manual CLI/file-digest deployment, not importing the entire private source/evidence repository. Netlify's published Free-plan announcement permits commercial projects; current pricing documents hard limits and no automatic charges for Free. Actual account eligibility, remaining quota, upload acceptance and visitor access still need verification. No Netlify account was connected or created in this review.

This is a small sharing route, not a launch-traffic plan. The current new-plan allowance is 300 credits/month; bandwidth uses 20 credits/GB, with other metered use consuming credits too. Free-limit exhaustion can pause projects. Do not silently use a shared team whose other production sites would be exposed to that risk; inspect the target and ask only when necessary. Do not apply old 100 GB plan figures to a new account.

A user-authorized existing commercial-capable Vercel team remains an alternative. No upgrade, subscription, domain, source upload, anonymous temporary deployment, storefront modification or public publication is authorized by this audit alone.

References and scope notes: `references/HOSTING.md`. Next action: start the retained local demo for Dan and, after the host/publication decision, execute P07B against the **same game candidate**.
