# Astra Review16 — SlingMods Signature Experience

**P08B is implemented and ready for director review.** Runtime: `6aa1dafaac03168525a1f7e69a6831ea886f45d2`. Private branch: `feature/p08b-slingmods-experience` in `DanielKinsner/slingmods-three-wheel-tour-rebuild`, descended from the reviewed P08A tip. The ZIP's MANIFEST.json identifies the separately pushed packaging commit. No merge, publication or spending occurred.

## Play

On the producing machine, open **http://127.0.0.1:5197/**. For another session/machine, use the exact commands in `handoff/P08B-COMMANDS.md`: npm ci, npm test, npm run demo:build, PORT=5197, npm run demo:preview. The ZIP is a review packet; clone Git for the full playable project.

## What became playable

- A new SlingMods entry and editable 3D showroom based on the supplied YouTube set: cabinets/logo/worktop, product grids, checker floor/red perimeter and left lift. Studio and accessory-night lighting, bounded orbit and driver visibility work.
- Targeted Slingshot repairs and four masked finishes. All five products mount in the same free configuration: existing TricLED base RGB and DDMWorks silver shocks, plus Thermal R&D Sport 2020–2024 exhaust with included silver inserts, NRG 59-inch aluminum Swan Neck wing and EvolutionR lower organizer pair. Each has the exact researched option, fitting slot and deliberate retail link. Storage inspection temporarily opens doors/hides seats and restores them afterward.
- Free recipes, three named game presets, product setup, stock comparison, undo/reset, named save/reload and an immutable test-drive snapshot. Free configuration/test drives do not debit or reward the career. Returning from a drive restores the build, including when browser storage is denied.
- A versioned SlingMods Sport handling profile: clearer brake/release/reverse, stronger acceleration, useful braking and turn-in. Former stock dynamics remain available as the legacy reference. No path lock, fake telemetry, horsepower or unmeasured aero bonuses.
- Harbor Express: a new 2.317 km physical course with 800 m straight, braking boards, continuous colliders/checkpoints, free test drive and a quick race against Maya, Jett and Nico. Original Harbor, Maya's P08A duel, time trial, crew race, earned saves and prepared demo remain playable.
- A full UI pass across entry, configuration, product categories, events/maps, shop summary, race HUD, pause/help/audio, results and recovery. Keyboard focus, controller ownership/neutral arming, focus loss and error recovery are covered.

## Evidence and assessment

| Outcome | Result and proof |
|---|---|
| Build / regression | 172 tests pass; TypeScript and static build pass. Full four-trace legacy dynamics digest exactly matches historical P08A: `82f48f0389a9eadf9786c3820470154c5fe2a157e7bf1ec1e6eb0c65b73f862d`. |
| Driving | Stock Sport 0–60 mph 4.73 s vs legacy 6.00 s; 60 mph stop 49.93 m; 110 mph stop 158.85 m. These are game simulation measurements, not vehicle/manufacturer claims. Matched keyboard/analog and perturbed tests retain three tire contacts and finite dynamics. |
| Full loops | Fresh earned career → time trial → Maya duel → purchase/setup → remove/reload/reinstall → crew result → distinct retry → reload; duplicate reward protection. Existing P08A earned save and prepared-demo isolation pass. Free preview, quick race/retry, original Harbor and four-finish drive/return/reload pass. Automated player finishes 4th honestly; no forced win. |
| UI / recovery | Final showroom/category checks and HUD/pause/results at 1280×720, 1920×1080 and 2560×1440 pass. 20 finish changes retain stable resources after cache warm-up. Save/storage denial, missing asset/retry, WebGL/context loss and input/audio focus tested. A deliberate live underglow product page returned HTTP 200; returning preserved the recipe. |
| Native performance | Isolated RTX4080 D3D11 native RAF: equipped 1080p two-race and stock 720p two-race, plus daylight Express with four cars. All active-race p95 <=16.8 ms and p99 <=16.8 ms; worst active frame 50.1 ms. Complete phase-labeled samples retained. No capture during these runs. |
| Loading limits | Ready/loading stalls remain: 483.3 ms equipped, 266.7 ms stock, and an 8849.7 ms initial ready interval on cold Express (10.286 s load). This is not an all-menu 60 fps claim. Cold/warm transfer records and fetched bytes are included separately. |
| Art portability | Three packed editable Blender sources; 151 required source/runtime files, 244,497,546 bytes, verified against fresh remote clone. Background Blender opens packed sources; all 704 original objects retained. Clone npm ci, 172 tests, static build, UI smoke and blocked-storage preview recovery pass on the same host. |
| Film | `director-kit/production/evidence/P08B/film-01/P08B-Signature-Experience.mp4`: 171.434 s, 720p H.264/AAC, actual live game audio. Real-speed edited demonstration, four sections, max measured endpoint drift 49.3 ms. Original video/all five audio recordings recoverable from Git. Optional Original Harbor clip omitted because its video sync markers were absent; its gameplay is independently verified. |

## Critique, repair and remaining limits

Independent review and local image/motion critique preceded acceptance. Repairs include physical art defects, mounting/room framing, brake tuning, road winding, reverse/neutral arming, career proof eligibility, preview audio separation, storage-denied navigation and race/audio focus. Initial failed diagnostics and capture/test harness failures remain indexed with explanations; no historical evidence was replaced. See `handoff/P08B-DESIGN-AND-CRITIQUE.md` and the independent review.

Fine OEM silhouette, exact retail CAD details, rear linkage approximation, simplified waterfront scenery and inferred showroom dimensions remain provisional. The rear/material presentation is still subdued in some views. Sound is original synthesis/treatment, not an authentic exhaust recording. Human driving fun/listening, physical controller/device coverage, global fidelity, G3/G4 and release approval remain held. The earlier historical repeated-race slowdown cause remains unresolved; current measurements do not retroactively resolve it. Hosting remains pending separately and did not block development.

## Packet structure / recovery

The 14 selected images include a labeled four-finish contact sheet and a temporary storage cutaway. Art inspection images use stronger neutral lighting than the integrated showroom. Screens/controlled-clock tests are not wall-clock performance proof.

The ZIP includes complete native timing, final handling/setup comparisons, relevant failed handling trials, final loop data, all compact summaries/failure reports, focused source/tests and a clear runtime diff. `complete-data/INDEX.json` maps every included original path to a lossless gzip payload; run `python scripts/restore-p08b-data.py <NEW_DIRECTORY>` after extracting. `REMOTE-EVIDENCE-INDEX.json` names exact remote paths/hashes for large deterministic per-tick race traces and redundant intermediates omitted from this lean ZIP. The full index/blobs and original film media are committed. `REMOTE-ASSETS.json` and `handoff/P08B-ASSET-MANIFEST.json` identify required full assets in Git. MANIFEST.json verifies every ZIP payload.

**Next action: give Astra-Review-16-Lean.zip to Astra.** Await the director's review before new scope, main merge or publication.
