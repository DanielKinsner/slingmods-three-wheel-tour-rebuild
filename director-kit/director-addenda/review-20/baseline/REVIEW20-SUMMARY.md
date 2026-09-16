# Review20 — Ridge Run

## What became playable

Smoky Ridge adds an original 3.2 km closed-course mountain destination with 84 m physical elevation, a 12 m road, 3 m shoulders, a wooded climb, rock-cut/overlook, open descent and timber paddock. Late afternoon and blue hour are selectable in the existing destination UI. The actual 3D road length is3,205.469 m and measured maximum grade is6.72%. The initial acceleration corridor is about653 m, slightly above the packet's suggested650 m target.

All five current products remain freely previewable. Test drives keep the existing departure and exact build on return; Quick Race is available before career unlock. Chapter 03 unlocks from completed Coastline Cup records and adds Find the Ridge (solo, day, 1 lap), Nico Ridge Duel (day, 1 lap), and Summit Invitational (three rivals,blue hour, 2 laps). Completion advances the chapter; wins are recorded separately. First/repeat rewards are 400/75,600/125 and900/175 game credits.

Sport v3 steering, brake allocation, tire force law and engine curves are retained. New physics support is an additive height channel and fixed triangle support; gravity and local contact normals create the slope behavior. Existing vehicle/front/rear/hoops, showroom, UI, sounds, Thermal departure, dashboard, finishes, products, ownership and old saves remain.

## Evidence to review

- `geometry-final-02`: derived dimensions, grades, all 24 gates/four grids and 2,240 actual support queries. No hidden flat plane; rendered road and support use the same mesh arrays.
- `road-proof-04`: climb, crest, descending bends, a complete physical four-car lap and elevated recovery traces.
- `grade-maneuvers-final-02`: downhill stop, stop/reverse on both grades and ordinary rail contact recovery. `rival-rail-brush-final` verifies each named rival and the actual contacted rail/guard IDs.
- `flat-equivalence-final`: Harbor/Express complete telemetry is bitwise equal to the preserved baseline for 1,800 matched ticks each. `sport-v3-regression` retains the v3 measured turn response. No goldens were rewritten.
- `career-loop-02`: all three actual events, rewards once, retry, pause/reload and abandonment; old ownership/receipts unchanged. `finish-wait-03`: genuine first finisher pauses the unfinished field, resumes and receives exactly 125 repeat credits.
- `preparation-final-01`, `ui-final-01`, `signature-final-01`, `product-links-final-01`: free previews, six route transitions, cancel/503 retry, four viewport layouts, real image bounds, display/audio/Thermal lifecycle and all five links.
- `partial-load-final-02`: injected asset failure waits for all decodes and disposes 43 geometry, 6 material and 9 texture objects; zero attached scene children. These are disposal counts, not measured VRAM.
- `native-matrix.json` and `PERFORMANCE.md`: all 22 native races pass p95<=20ms, p99<=33.4ms, max-active<=100ms with 1e-6 ms numeric tolerance. Worst p95=16.8ms, p99=33.4ms, max=66.7ms. RTX4080/i9-12900K Windows host; real 60 Hz RAF and audio graph, no capture/tracing/compression/Blender during measurement. All camera epochs confirm full cockpit racing. Raw frame rows are retained.

Career correctness uses controlled clock/input automation; native performance is a separate real-time lane. Scene resource counts are not GPU-memory measurements. Existing cached OS/driver data was not purged.

## Internal critique and boundaries

Read `P10A-AUDIT.md` and `handoff/P10A-ART-REVIEW.md` for the initial backward-facing road, height interpolation, bank seams, AI approach-speed, thumbnail overflow, input-harness and partial-load repairs. Material failed runs remain included or indexed to exact Git bytes.

A sustained deliberate throttle shove into a rail can still wedge/retire AI. The ordinary brush proof releases forced approach at first measured impact and then uses unchanged production controls. Do not interpret that as universal crash recovery. Player recovery/restart remains available; scored recovery starts a new attempt.

The forest, rocks and distant layered hills are stylized; LOD has no crossfade, and distant scenery beyond 60 m banks is visual only. Decorative off-road props may clip the camera. No photorealism, surveyed-road accuracy, hardware/controller qualification, subjective fun/listening approval, G3/G4 or global OEM-fidelity approval is claimed.

## Delivery identities

Frozen gameplay/native candidate: `28daf3a4dfb702e2b4829ffda683cffeb117c858`. All 289 runtime inputs match its tested static candidate exactly in the authoring checkout. Documentation, evidence, portability attributes and archive receipts are separate commits. Final film, hosted gameplay, remote recovery and archive identities are in `handoff/P10A-VALIDATION.json`, `P10A-PACKET.json` and `P10A-DELIVERY.json`.

The existing canonical site is https://slingmods-three-wheel-tour-rebuild.vercel.app/ . Only its curated asset output is deployed. The lean ZIP is a review transfer, not a standalone game; runtime/editable assets and every full/raw evidence file remain in Git. Follow HANDOFF.md for local launch and another-machine recovery.
