# P07A independent integration review

## Bounded verdict

Accept the repaired integration for final performance and media validation. No unresolved integration blocker was found in the reviewed source, stationary images, or completed hardening evidence. This is not a SHARE-READY decision, deployment approval, whole-game visual approval, or G3/G4 advancement. Final native timing and delivered-film review were pending when this report was written.

## Identity and inspection scope

Frozen runtime: `758c2b291a9b5bd525fe9acd1425537657fadf70`, build reference `758c2b291a9b`. Final output: `demo-dist/2026-09-15T04-11-59-668Z-758c2b291a9b`.

I independently read the P07A packet, profile/storage/navigation/loading/recovery implementation and relevant presentation changes; reviewed the initial UI set and repaired representatives; and read `HARDENING-REVIEW.md`, all eleven case outcomes in `hardening-repaired/report.json`, `preservation.json`, and the final output/build manifests. I compared recorded inventories: all 142 input hashes in each repaired UI, repaired sign and hardening build match the frozen build's input inventory exactly. Those captures identify their earlier dirty build honestly; they are not relabeled as captures made after the freeze. This pass used small-file reads and saved images, without rerunning browsers, tests, builds, or bulk asset hashes during timing.

The final manifest lists 49 files totaling 112,457,877 bytes; its per-file sizes sum to that total. It contains the audio provenance manifest and all nine required WAVs. Listed output paths contain no parent traversal, Blender sources, source maps, scripts, TypeScript sources, or ZIP archives. The documented cache policy permits immutable hashed bundles and requires revalidation for mutable HTML/build metadata/public assets. The static-output size is separate from the lean review ZIP budget.

## Source and failure-path review

Demo career state is selected before opening the ordinary career store and uses separate per-tab sessionStorage keys. Demo settings are also namespaced. Explicit `play` routing remains distinct from the `profile=1` diagnostic flag. Ordinary staged visitors do not receive the historical evidence globals/selectors. Window-name transfer is restricted by profile, origin and destination; reset removes only the two demo keys. I found no remaining cross-profile write path in the reviewed seams.

Two defects identified in independent review were repaired: a newer memory fallback now survives stale persisted demo state after denied writes, and the recovery dialog makes the background inert and contains keyboard focus. Visible loading exit, bounded boot failure, stopped RAF after recovery, and fresh-page restoration address the examined failure seams. These are scoped observations, not proof against every browser/storage failure combination.

The completed hardening report records 11/11 passing cases on isolated Chromium with RTX 4080 D3D11: ordinary entry/selectors, five required dependency failures, audio-manifest failure/retry, slow-load exit, disabled WebGL, actual context loss, and back/restoration. I checked the detailed audio/context/restoration records: sound retry retains one live context and one audio UI; after context loss ticks stay at 218, race/audio are paused, Tab stays in the dialog, and reload returns one fresh ready canvas with sound requiring deliberate enable. Native Back creates one scene. The persisted=true branch was separately simulated and does not establish a native BFCache hit. Earlier failed attempts remain documented. These runs used muted browser output and establish no listening or timing result.

## Visual and provenance review

The repaired 390x844 entry puts its desktop keyboard/WebGL2 and unsupported-touch disclosure above the drive actions. The repaired crew-ready view no longer covers the gear/RPM area with the preview link. The 720p context-loss image presents legible recovery text and two clear actions. Initial garage, shop, stock comparison and ready views showed coherent demo labels and installed-versus-stock product presentation. Full keyboard/scroll reachability at every responsive size is outside this screenshot review.

I viewed all six repaired day/night sign images. The two service signs are now visible beside existing facade text and clear of the canopy in the selected cameras; the start/finish logo is readable and proportionate. These deliberately controlled stationary reference cameras hide the ready modal and disable fog, so they do not prove ordinary chase-view visibility or motion stability. Service world X/Z corners agree with the current layout; their unchanged Y center3.47 explains bottom3.1833/top3.7567. My initial suspicion that those vertical bounds were stale was checked and withdrawn.

The original first-party logo PNG size/hash was independently checked earlier. Its source record preserves artwork proportions and documents trademark authority separately from CC0 material provenance. Product verification records the exact first-party SM-133 product and compatibility; I reviewed that evidence and catalog wiring, without independently repeating the live website request. No invented price or runtime catalog dependency is introduced.

## Preservation and remaining limits

The preservation report records 299 exact baseline files and 15 authorized changed seams, retains the unrelated kickoff file, and reports exact 4,200-row simulation parity. Bay extraction records exact retained descriptors/binary views with reference relocation only: 28,974,372-byte full kit to 7,668,224-byte bay dependency subset. I reviewed these records and relevant source seams, not a fresh whole-repository binary audit. The report's precommit candidate identity must be read with the matching final input inventory above.

Remaining polish: some inherited night facades are very dark, scenery remains visibly repeated, and the unchanged audio retry string contains mojibake (`U+00E2 U+20AC U+201D`) where a dash was intended. The retry action itself passes. None justifies disrupting the frozen timing candidate. Final per-attempt performance, ordinary result/reload movie evidence, continuous motion inspection, human listening, physical controller use, broad browser coverage, and external hosting remain outside this verdict.

## Frozen validation follow-through, before movie review

The completed frozen matrix and ordinary native-input checks now resolve several pending items above. I independently recalculated the raw crew and daylight frame statistics, checked recorded raw SHA256 values, finite monotone RAF timestamps, contiguous active spans, absence of collector overflow, and exact recorded provenance: 142 input hashes and 28 served public-asset hashes agree with frozen758c. Each crew active span runs from countdown into a complete valid two-lap result; result UUIDs match attempt-final records and all four participants finish validly. Each race passes separately, with no pooling:

| Configuration | p95 / p99 / maximum, ms |
| --- | --- |
| Stock720 | 16.7 / 16.8 / 16.8 |
| Equipped720 | 16.7 / 16.8 / 16.8 |
| Stock1080 | 16.7 / 16.8 / 50.0 |
| Equipped1080 | 16.7 / 16.8 / 33.5 |
| Warm equipped1080, race1 | 16.7 / 16.8 / 16.8 |
| Same document/context, race2 | 16.8 / 16.8 / 16.8 |
| Equipped daylight1080 | 16.7 / 16.8 / 16.8 |

All active intervals are below 100ms. The warm case includes two prior audio-active crew/garage/crew navigation cycles in one isolated browser context, followed by the two scored races in one final document. Daylight includes 4,705 active frames and a valid 78,402.5393ms lap. The method uses actual native RAF and production physics with virtual player input, DPR1, standard quality, enabled live graph, D3D11, no recording/readback in the scored loop, and no OS/driver cache clearing. CPU wall durations are not GPU timing. Approximately two-second host observations are aggregate context, not proof that a particular unrelated process caused prior failures. P06C's original repeat and follow-up raw files and failing summaries remain present; current passing runs do not erase or causally explain them.

I also reviewed `native-final-02/report.json` (six completed stages, no page errors) and `hardening-final/report.json` (11/11) on the actual frozen output. The native test uses ordinary demo URLs without evidence hooks, real browser keyboard events and DOM/storage observations. It demonstrates throttle, pause, held-input neutral gating, camera change, held-R restart, garage return, actual unequip/equip, reload and fresh sound-enable boundary. Its three720p screenshots independently show readable expanded controls, an installed shop and a keyboard-focused product link reached by scrolling the shop panel. The actual first-party SM-133 popup resolves with null opener and preserves the garage document/state. The initial native harness polling failure is retained; this report does not promote the corrected harness to a runtime repair or a full keyboard-driven lap.

The refreshed field report includes all five configurations. Retained one-second traces show one early player/Nico order change in the repeat case and none after3s in the other configurations; they do not establish sustained passing contests. The blocked-line test uses matching production simulation/controller inputs and shows an actual lead crossing on the initial straight at tick375, lateral separation2.52995m. Its67.81059m maximum is now correctly labeled absolute worldX across the curving course, not passing clearance.

No new integration blocker emerged. Delivered movie continuity/result/reload and audio synchronization review remain pending. Human listening, physical-controller validation, broad browser support and external hosting are still outside the evidence.
