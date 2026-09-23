# Delivery checkpoint — implementation complete

- Runtime committed locally: 7b5018570ed0bb40f83e25e9c6bba96b435aca9e on main. No push/deploy/publication.
- Final packaged build and ordinary paint/retry/return/vehicle switching pass at 7b5018570ed0-working. Complete four-product poses/lighting/removal and a Slingshot Sport v5 ordinary-keyboard drive pass on that build.
- Corrected the last mounted lighting defect: source grille strips hidden with Panther, restored on removal, both area emitters move with their arms. Added meaningful regression test. Final source unchanged after implementation commit; later changes are evidence script/docs/receipts only.
- Two real native-clock High/1440p Harbor dusk-rain four-car races pass: 9463 samples/157.794s,59.97FPS,p99=16.8ms,worst1%=17.67ms,max=33.4ms,CPUaverage7.81ms. Existing High/Ultra performance gate remains HOLD. No heavy authoring/builds during scoring.
- Packaged fresh career clean76.408s Harbor lap,800credits once, frozen resume, white paint, earned Panther and return/reload pass. Details and failures retained.
- Read handoff/RYKER-COMPLETE.md and RYKER-VALIDATION.json for the acceptance matrix, estimates, exact references and portable commands. No unresolved scoped implementation blocker. OEM width/certified fitment, human feel/listening and physical hardware breadth are explicitly not claimed.
- Static loopback server owned PID23704 on5199, exec session99935. Owner P06C-HOME-KICKOFF.md remains untouched and untracked. Historical checkpoint notes follow; their next-action lists are superseded.

---

# Ryker complete vehicle checkpoint

Active owner assignment: finish the purchased Ryker as a playable second vehicle, including career, physics, articulated stock/products, paint and save flows; create a showroom wall asset. One lead, local commits only. No push, publication, spending or deployment. Preserve Slingshot and performance HOLD.

## Recovery
- Starting branch main, HEAD 7b041acea01be9f13ba0da6007158ebbd7191525 (audit baseline).
- Only pre-existing untracked owner file: P06C-HOME-KICKOFF.md. Leave untouched.
- Read root AGENTS/HANDOFF, assets/ryker README/MODS and full audit/goal from Ryker_Review_and_Agent_Packet.zip, extracted to handoff/ryker-audit.
- Purchased ZIP, runtime GLBs and editable masters exist locally. Preserve originals.
- Local Blender: .tools/blender-4.5.2-windows-x64/blender.exe. Node/npm/Python and node_modules present; Playwright is a project dependency.
- No relevant memory registry entries for this repository.

## Confirmed defects
- Global Slingshot physical layout, mass and five-speed drivetrain under Ryker.
- Road finish binding precedes stock/accessory assembly.
- Three Elka coilovers merged together; stock masks depend on enumeration IDs.
- Build identity is Slingshot even in Ryker storage; career selector leaves career mode.

## Implemented, not yet final acceptance
- Simulation per-instance definition, Ryker 380 kg/own collider/mesh contacts/CVT. Slingshot constants preserved. New profile ryker-road-v1; four focused physics/snapshot tests pass; tsc passes.
- Explicit version 2 Ryker recipe + definition ID; legacy Slingshot stays version 1. Ryker namespace migration strips foreign products. New snapshots deeply frozen.
- Road products now precede finish binding. Fleet asset loads only when rivals requested.
- Exact source part map bound to original master SHA, with islands/bounds/materials; partition builder preserves all corners. See partition-reconstruction.json. Zero normals on degenerate surfaces excluded from directional error metric (must document).
- New parts exported to public/assets/ryker/complete; original GLBs and Blender masters untouched. Editable new Ryker-Complete-Parts.blend.
- Black dual-rate Elka coils, billet heads/piggyback reservoirs, red adjusters (actual current reference, unlike old red coils). Independent upper/shaft/spring channels. Refined Panther hood, scoop, paired gills and triangular grille. Source stock shocks/linkage split; RykerLinkage poses them.
- TricLED arm mounts separate. Stock grille light pair omitted with Panther (retail combination unverified), original headlight/arm strips retained.
- Initial stock front/side/rear and UI renderer captures inspected. No browser errors. Need thorough mounted/moving inspection and repair.

## Next work (do not stop)
1. Finish career identity/owned Ryker workshop/new transactions/switching while preserving historical records. Career is not wired yet; only types accept new tune.
2. Correct all UI labels, CVT D/R instrument/audio path, returns and explicit asset identity on links/resume.
3. Inspect mounted products and articulation with independent travel channels, paint parity, stock reconstruction color masks. Add actual physical overlay/bump tests and full race/reward proof.
4. Create Blender showroom wall asset and inspect in room.
5. Consolidate duplicate base/partition buffers if practical, meaningful bounded performance, focused regressions then production build. Update root handoff, local implementation commits only.

## Evidence / next action
BRP 2025 official reference opened: 280 kg dry, 1709 mm wheelbase, 61.1 kW at 8000 rpm, 79.1 Nm at 6500 rpm, CVT/reverse, 136/145 mm wheel travel, 1522 mm overall width. Mesh year unknown; contacts match measured mesh rather than stretching body. Primary Elka/SlingMods product references checked and photos inspected. Treal matching SlingMods SKU SM-6916; manufacturer TRP-RKR-SES, no optional silencer; listing closed-course-only. Elka Stage 3 rear solo rider. Photos/HTML are private local research in .tools/ryker-refs; do not commit those.

Dev server running hidden, owned PID 51648 at http://127.0.0.1:5198 . Logs .tools/ryker-vite*. Playwright Chromium 153 works with D3D11/GPU headless. New browser script scripts/ryker/inspect-complete.mjs produces assets/ryker/evidence/complete images (currently overwrites baseline capture names: keep future captures separately). tools finished processes, no Blender still running.

Important cleanup: Python Path.write_text used Windows newline translation; several diffs show spurious line-ending changes. Restore each touched tracked file's original EOL style without reverting content before commit. Always use encoding=utf8 for further edits. No commits yet. Owner P06C-HOME-KICKOFF.md remains untouched. No relevant memory was used, so no memory citation is needed.

## Integration checkpoint (same assignment, continuing)
- Complete assembled GLB now merges the source and exact partitions, prunes duplicate hidden buffers, and binds finishes after composition. Originals untouched. New assembly 16.7 MB.
- Career workshop now owns Ryker paint and four independent purchases through serialized transactions; explicit vehicle switches preserve Slingshot ownership. Ownership receipts validated. Chapter 01 now persists immutable entries through reload/retry and stores build identity on reward receipts. Existing later chapter/Cup snapshot path retained. Focused 11 tests and tsc pass after async adapter test updates.
- CVT D/R HUD/instrument path, original three-cylinder synthesis, no shift events, correct contact COM, own departure radius, Ryker tire mark widths and Treal heat outlet implemented. No invented exhaust flames for Treal.
- Original Blender FIND YOUR LINE route relief created for blank right wall; mounted in shared showroom. Must inspect actual wall render.
- Latest mounted Panther screenshot inspected: scoop and gills now visible, front brow closes prior gap. Black-coil Elkas, Treal and lighting visible. Need complete motion/stock A/B quantification.
- Browser acceptance script scripts/ryker/check-career.mjs currently running, process session 52642. It uses a fresh isolated career, white finish, immutable reload and actual input-driven lap; records failures as well as success. Do not fabricate credits/finishes. Vite PID 51648 on 5198 still owned.
- Remaining: repair browser findings, prove complete race and career reward/return, preview departure/retry/switch flows, contact/bump/motion and original-stock A/B, GLB validation, scoped Slingshot regression, meaningful performance capture, full unit checks once integrated, production build and local commits/root handoff. Performance HOLD stays.
- Fixed invalid UTF-8 byte in modified config; other touched tracked text is UTF-8. Still normalize tracked-file line endings against baseline before commit.

## Latest verified state (02:10 UTC Sep 23; continue without restarting)
- Fresh career browser PASS: all 15 Harbor checkpoints, 76.496 s valid lap, 800 credits, receipt stores immutable Ryker build, white finish, resume retains entry ID; earned Panther purchase and return/reload pass. Evidence complete/career. This was before the small official wheel-travel correction; final current build needs new actual race (performance script is doing it).
- Preview browser PASS: all 4 parts + graphite finish, departure, real keyboard throttle, hold-R restart, return and Slingshot/Ryker switch restores distinct recipes. First failed harness tried a nonexistent retry button in free drive; preserved attempt-01-failure.json, corrected to real hold-R. Latest code adds coherent Ryker departure steering/grip pose and must get final smoke.
- Wall relief moved clear of lift to front right pier [5.79,2.30,-2.70], uniformly .6 scale. Actual screenshot inspected, named Route relief camera added in both UIs.
- Eight-view stock PBR A/B + color ID mask inspected: mean 8-bit absolute difference <0.00047; at most 0.0015% pixels differ >3. Exact source corner reconstruction remains, normal error <0.001; source UVs now copied; source images=0. Final assembly built with local Blender and original inputs unchanged. Rerendered after UV copy; recompute pixel report before final.
- Ryker suspension travel now .136 m front/.145 m rear (rest .091/.100 + .045). Engine coast braking 45 N (Ryker estimate). Current dynamics report PASS: both stock and Elka single-wheel bump/ramp, peak roll ~.089 rad, finite forces and stop; Slingshot v1/v4/v5 1200 ticks each strict exact equality against 7b041ac simulator.
- Full suite run: 407 total, 399 pass initially. Six historical digest failures were added telemetry identity fields; corrected by keeping Slingshot telemetry shape byte-identical and exposing identity only on Ryker. One old Ryker namespace expectation updated for explicit v2 migration. One temporary-career redirect repaired by redirecting only a real visual/selection mismatch. All 20 targeted repair tests pass, including all prior failures. 13 new/integration tests also pass (incl two assembly tests, total now 409). No need another entire suite absent a relevant change.
- Production local demo build PASS: demo-dist/2026-09-23T02-07-13-416Z-7b041acea01b-working, 289 files/407024516 bytes. New runtime assets added to demo-assets allowlist; Chapter01 entry UUID preserved by visitor query filter. tsc passes.
- Production static server running via exec session 94717, owned PID 23700, port5199. Vite remains PID51648 port5198. First combined Start-Process + performance launch got generic blocked-by-policy; safe direct foreground loopback server launch succeeded (no permission bypass).
- Current sustained packaged performance run in exec session15704: high/native/harbor dusk-rain, 2560x1440, real 4-car races, runtime audio enabled/output muted, no controlledclock/readback. Script scripts/ryker/check-performance.mjs writes complete/performance-high-harbor. Wait for result. Do not run heavy builds/captures concurrently with scored performance.
- No commits yet, no pushes. Owner P06C-HOME-KICKOFF.md untouched. Need remaining contact overlay/both curb sides/narrow clearance, moving hardware/rider/mirrors/instrument/audio and career/route smoke on current production, final docs+references+validation/root HANDOFF and explicit local commits.
- Width policy: reread audit RYK-07 and exit condition: preserve chosen modeled geometry and align physics; do not blindly widen to one OEM year. Source year unresolved, MY21 1509 vs MY25 1522 overall are NOT track. Ortho masks/A-B document chosen 1.198m body width/1.059m track. Explain deliberate preservation rather than inventing unsupported assembly dimensions. Physical footprint mismatch is resolved with measured mesh layout; OEM dimensional fidelity remains explicitly unclaimed.


## Packaged acceptance follow-through (02:30 UTC Sep 23)
- Production final build after rider repair: demo-dist/2026-09-23T02-26-54-917Z-7b041acea01b-working, 290 files, 407028967 bytes. Static server now owned PID27600 on5199 (exec session62454); old23724 stopped. Vite51648 remains on5198.
- Hardware-final PASS on packaged game: three contact centers align below1e-12m, stock acceleration9.29m/s then trail braking7.19m/s, stopped, reverse-5.41m/s; D/R, live mirrors2, actual SIM screen, rider hands/feet and Express/Ridge driving smoke. Original engine audio captured from graph (output muted) as engine-runtime.webm.
- Found outside-hand reach gap7cm at large low-speed steering. Added Ryker-only upper-body lean/twist; no Slingshot pose change. Mounted-final proves both±.62 lock + independent travel with gaps<2cm and27movinggroups. Inspected actual mounted rear render.
- Hardware barrier attempt intentionally/full-lock ran into Harbor barrier and tipped; kept under hardware-barrier-attempt, recovery prompt visible. Subsequent moderate steering/brake test isolates reverse without a crash. The first hardware run also records the actual rider defect under hardware; retained.
- New career unit boundary tests cover frozen Cup stages, vehicle changes, reload/retry and every Ridge event with unchanged4300credits; Chapter01 frozen build/preset as well. Final focused15 tests pass; tsc/production passes after complete typed fixture.
- Existing sustained harness had a finish counter bug if player finished before field. Repaired original scripts/perf/sustained.mjs and Ryker copy to count by unique attempt ID only when allFinished. Failed first run retained performance-high-harbor/run.json. Need rerun fresh directory after browsers finish.
- Current exec91167 runs packaged hardware-final (PASS), preview-final (currently departure), then career-final. Check it; no other browser jobs. Pixel comparison regenerated from latest actual source/complete captures.
- Mixed historical EOLs now preserved per unchanged line by diff mapping; no blanket CRLF rewrite. No runtime content changed by that step.
- Remaining: inspect final screenshots and paint material equality, run corrected sustained High Harbor race measurement alone, focused driver/shared regressions, final source diff, docs/validation/rootHANDOFF+AGENTS and local commits. Preserve owner untrackedP06C file. No push.
