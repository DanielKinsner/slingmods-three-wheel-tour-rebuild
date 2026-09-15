# Astra — Review15: retain the expansion; redirect toward the customer
## Decision: P08A accepted for continued development, not global fidelity approval

**Retain the new Maya duel, career progression/migration, DDMWorks suspension hardware
and setup, and the stock comparison/install/remove behavior.** The evidence supports
a real bounded expansion. It does not resolve Dan's driving, bodywork, showroom or
UI requests; those were outside the previous assignment and several were explicitly
frozen. P08B now authorizes those changes rather than another campaign-only pass.

This review is read-only. No submitted gameplay code, asset, save or Git branch was
modified. The accompanying packet directs the local agent to implement the next
outcome; it is not already implemented game code.

## 1. Candidate and archive identity

- Received: `Astra-Review-15-Lean.zip`, **38,433,258 bytes** (38.43 MB decimal).
- Implementation/static runtime: `ec6876551542ec39111fbf26253c4528c2290cfc`.
- Packaging/remote branch tip: `ef592752741333faee496edff95b8abb68b76840` on
  `feature/p08a-build-matters` in the existing private rebuild repository.
- The GitHub connector independently returned that ref. This establishes the remote
  ref, not an independent complete clone or verification of every large remote blob.
- **232/232 manifest-listed members** passed byte-length and SHA-256 verification
  directly in the uploaded archive. No extra unlisted member beyond the manifest
  itself was present. The archive has 233 members including that manifest.

The lean ZIP correctly includes small source/tests and the new product .blend/.glb,
not the entire old car/world. Exact remote recovery of omitted files is documented
by the sender. I did not independently download the complete large-asset closure.

## 2. What landed

The new one-lap Maya duel connects the existing solo shakedown to the existing crew
race. The supplied UI/functional evidence shows a fresh-career reward path, suspension
purchase and setup, compare stock, remove/reload/reinstall, a crew finish, retry and
career reload. Prepared demo data remains separate in the tested sequence. These are
changes within the prior P08A assignment, not a claim that the whole tour is finished.

The DDM product is represented by separate authored silver hardware and directional
compression/rebound controls plus a modeled ride-height offset. Source keeps the
selected setup across removal and reinstallation and applies it at scene entry.
The local loop records balance 1250 after 800 solo + 750 duel − 1000 purchase + 550
first crew result + 150 retry. Those are fictional game credits, not retail prices.

Primary retailer identity was re-opened for SM-3223. Its adjustable compression,
rebound/ride-height description and silver option are consistent with the selected
product. This review did not independently inspect every installation-manual detail
or validate the authored mesh against manufacturer CAD. Damping numbers remain
explicit game estimates, not measured DDM data.

Source of product identity:
https://www.slingmods.com/polaris-slingshot-3-way-adjustable-sport-shocks-coilovers-ddmworks

The independent GLB parse found 250,364 bytes, 13 nodes, 8 meshes, 5 materials and
8,196 source triangles in the included product file. This is structural information,
not a full-scene cost, physical clearance test or proof of visual authenticity.

## 3. Independent tests and comparisons

**72 focused tests passed, zero failed**, across 14 self-contained files. The set
covers input/rearm, signed wheel-speed drivetrain behavior, pitch mapping, race and
career/duel rules, migration/ownership, demo isolation, menu handling, competition
stability and setup coefficients. The test log and read-only loader are included.

A strip-only TypeScript harness first failed on parameter-property syntax; enabling
transformation resolved that harness limitation. No game source changed. The initial
harness failure is retained. `npm test` could not start because installed `tsx` was
not available in the lean extraction. The sender's **144 passing tests**, builds,
full browser/Blender/hardware validation remain supplied local-agent evidence, not
an independent rerun by this chat.

I decompressed and parsed the four supplied 4,200-row traces: baseline, new stock,
installed street settings and removed suspension. They have identical contents and
SHA-256 `82f48f0389a9eadf9786c3820470154c5fe2a157e7bf1ec1e6eb0c65b73f862d`.
This supports exact equality of those recorded samples, not universal equivalence
or independent execution of their producer. Street-start equality is by design;
the submitted drop/preload diagnostics show different modeled responses for changed
settings, not guaranteed faster laps.

Direct comparisons against the actual Review14 ZIP show input.ts, drivetrain.ts,
hero.ts, rear.ts, Harbor route.json and the rear-rig JSON are byte-identical. The
contact-layout JSON differs only by CRLF/LF; its normalized bytes and parsed data
are identical. This is not a contact-layout change. Do not repeat a blanket claim
that every protected source file is byte-identical when text normalization differs.

## 4. Recalculated performance, not a new benchmark

I selected all supplied native profile rows with phaseCode=2 and the relevant
attempt, then recalculated nearest-rank p95/p99 and maximum. RAF timestamps are
monotone, intervals finite, and all three collectors report zero overflow.

| Supplied native run | Attempt | Samples | p95 ms | p99 ms | Max ms |
|---|---:|---:|---:|---:|---:|
| Equipped crew 1080p | 1 | 9,955 | 16.7 | 16.8 | 16.8 |
| Equipped crew 1080p | 2 | 9,950 | 16.7 | 16.8 | 33.4 |
| Stock crew 720p | 1 | 9,952 | 16.7 | 16.8 | 33.3 |
| Stock crew 720p | 2 | 9,955 | 16.7 | 16.8 | 16.8 |
| Equipped duel 720p | 1 | 4,710 | 16.7 | 16.8 | 16.8 |

All five recorded attempts meet the supplied working thresholds (p95 20 ms, p99
33.4 ms, max 100 ms). No active-race interval exceeds 100 ms. There are ready-phase
stalls of **200, 200 and 183.4 ms** in the complete runs; they remain recorded and
are not silently discarded as though every phase were smooth.

Provenance: recorded RTX4080/Windows D3D11/Chromium native RAF, automated inputs,
audio graph enabled with muted host output, measurement separate from capture.
No claim of measured GPU frame time, destination-machine performance, universal
60 FPS, human playtest or the cause of the historical repeat-race slowdown is made.

## 5. Presentation and customer-experience assessment

I inspected supplied native screenshots and sampled the 63.68-second 1280×720,
25 FPS H.264 demonstration. ffprobe confirms it has **no audio stream**. The film
is explicitly labeled automated/silent and consists of real-speed excerpts. It
supports visible UI/gameplay changes, not listening quality or an uncut complete
customer-session demonstration. Exact full-loop proof is a separate supplied record.

The existing UI is usable, but remains a functional left-column menu/form system.
The gallery shows the new silver hardware and readable stock/setup comparisons.
Hardware isolation intentionally hides the body and is labeled; floating isolated
hardware is not itself evidence that it floats outside the car in ordinary play.
However, that view should not be the main customer configurator experience.

The room is still generic compared with Dan's photographs: it does not yet reproduce
the defining paired cabinet towers, accessory display grids and checker/red floor
composition. The main vehicle remains the single blue/orange finish, with a driver
occupying the inspection view. A useful next step is a fully assembled, generously
framed car in the actual set identity, with a proper overall UI and a driver toggle.

Dan's reported accidental holes and clipping remain owner-reported defects to
reproduce and map. This lean archive does not include enough current full-vehicle
geometry for me to independently clear every surface/mechanical view. Acceptance
of P08A does not waive those issues or turn “recognizable” into finished close-up
fidelity. Real openings must be distinguished from accidental missing surfaces.

## 6. A concrete handling issue to investigate

P08A deliberately retained the old driving defaults. The source maps X to direction,
W/up to throttle, and S/down to braking. The drivetrain has near-stop reverse
engagement. That does not reproduce Dan's exact failed interaction, but it explains
why pressing the usual brake/back key alone does not request reverse. Discoverability
and production-input behavior need fixing, not a claim that reverse has no code.

Steering is limited by the speed-dependent expression quoted in the driving packet.
At 40 MPH its cap is about 2.58° (about 59 m under a simple bicycle interpretation);
at 60 MPH it is about 1.15° (about 133 m). These are calculations from source constants,
**not measured dynamic turn radii**. Brake/tire saturation, acceleration and route
length also need separate instrumentation. This is a useful candidate cause of the
owner's impression, not a complete diagnosis.

P08B authorizes a new versioned game-tuned default with preserved historical profiles,
not more exact-parity requirements on the new player experience. A separate Express
layout supplies a real place to accelerate without corrupting the original track.

## 7. Director action

Execute P08B as one integrated customer-experience pass: driving/reverse, one flowing
course, actual vehicle repair and four finishes, the reference-based showroom and
lighting, complete SlingMods UI, and five-item free configuration with correct retail
links. Retain this P08A work and its save/economy tests. No more story expansion or
engine migration in this assignment.

The attached sources/photos are enough to begin. Dan's only routine handoff is this
ZIP and KICKOFF.txt; the agent owns tooling/research/tests and internal review. Return
Review16 with an actual playable local result, audio/video proof and a verified
feature-branch handoff. Global G3/G4, real-product performance, all-vehicle readiness,
physical-controller/mobile/hardware breadth and public release remain unapproved.
