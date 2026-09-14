# P06B Environment Quality Lock — final validation underway

Root: C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild. Use this explicit workdir for every command. Do not use the old game.
Packet: director-kit/director-addenda/review-11/CODEX_NEXT.md. No remote changes, spending, deployment or desktop takeover. Local commits permitted. G3/G4 pending.

Baseline d9acdf23816562ea1edba2cf230648f0ec3f6aae. Current changes preserve 36 raw protected file hashes and 56 Git blobs; 118 tests pass and the 4200-row solo replay is exact. These are engineering checks, not art approval.

Implemented: new packed Blender scenery/material library, metre-scaled road UVs, connected paving/ground/quay, palms with real LOD, compact garage finishes, selected CC0 outdoor HDR, water response, resource pruning and depth precision repair. Depth diagnosis established that the old near-plane precision hid shore geometry; separate coverage rays established real missing mainland, now repaired. Failed intermediate evidence remains local.

Current task: finish the bounded planting-bed and hull repair, then commit and freeze stable runtime inputs. Run final full-chapter, lifecycle, controller, audio, UI and performance checks. Capture matched district/detail/bay evidence, a complete ordinary two-lap crew film with live audio and one silent daylight lap. Use native wall-clock performance with no video/readback in scored runs: stock/equipped 720p/1080p plus equipped1080 repeat after three scene transitions. Do not confuse controlled functional tests or stationary fixture screenshots with performance/driving evidence.

Review12 tools exist under scripts/. Build freezing: node scripts/build-review12.mjs. Evidence: director-kit/production/evidence/P06B. Final package script requires frozen input manifest and final media/reports. Create Astra-Review-12.zip (number instead of overwrite), verify complete manifest/CRC and isolated extracted build/tests. Finish with exact path/size and candid art limits.

Current local art verdict: improved materials and construction; realistic target not fully met because distant architecture and broad outer lawns remain sparse/repetitive. No G3/G4 advancement. Preserve unrelated initial untracked material-lab Blender source and two review05 helper files. No remotes have been changed.
