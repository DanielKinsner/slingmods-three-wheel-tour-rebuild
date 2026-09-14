# P06B validation and delivery

## Acceptance is visual and integrated, not just numerical

Inspect actual runtime images at the normal camera before claiming the art target is met. At least:

1. Road/ground/sky occupy most of a race view and now contain coherent, correctly scaled detail, not smooth strips and a flat lawn/sky.
2. The four districts read as connected harbor construction, with convincing silhouettes and depth. The strongest sample's standard reaches the rest of the route.
3. Palms read as fronds with negative space rather than broad painted polygons. They and near architecture contact the ground convincingly.
4. Day is fully readable and exposes the work honestly. Night preserves the same material identities, reasonable headlight paint response and visible cyan/red underglow.
5. The compact garage looks like a deliberately built room, not a black void around an asset viewer. The saved-product controls still work.
6. A complete race, result, retry and garage return remain functional on the same build and visual preset shown in captures.

Do not mark G3/G4 passed. Give a candid local art verdict with specific remaining defects; passing tests or finding a map/GLB is not artistic acceptance.

## Protect the game

Record original and final hashes/semantic comparisons for the vehicle and rear rig, driver, product attachments, route/colliders, simulation/controls, AI/rules, credits/ownership and save data. Distinguish physical assets from render-only replacements; it is expected that scenery/UV/material hashes change.

Run the full current unit/build suite, targeted environment/material/lifecycle tests, the retained solo parity fixture and the four-car complete-chapter cases. Do not rewrite assertions just to satisfy a changed screenshot. Prove a fresh valid reward/purchase/save/reload path and existing-save migration compatibility (no schema change preferred). Inspect road seams, collisions, reset locations and checkpoints; do not let render decorations introduce invisible collision contradictions.

## Runtime and visual evidence

- Paired before/final day and night near-chase views at the existing four district fixture positions; use matching poses/FOV and show both full frames. State lighting changes rather than darkening the baseline. Keep readable 1280x720 or 1920x1080 originals.
- A day overview/side view proving terrain, shoreline and architecture connect rather than a single beautified camera wedge. This supports but does not replace actual driving views.
- Near details of asphalt/curb, terminal wall/glass, dock, palm and garage, with material source and runtime binding provenance.
- One continuous final normal-path two-lap crew race through result and saved garage with actual game audio. Use isolated input tooling; label virtual inputs and fixture state. Do not splice unrelated beauty renders or replace live audio with offline sounds. Verify the media footer describes the stream accurately.
- A shorter ordinary daylight lap/drive demonstrating the same environment outside night lighting. Label any silent footage.
- Normal near/far/cockpit checks to ensure the good scenery is not visible only in a diagnostic view.
- Source commit, asset hashes, preset/resolution and capture-clock method with every group. No unknown-provenance older captures presented as current.

## Performance without capture contamination

Use the installed native wall-clock collector, no MediaRecorder/readback/full scene inspections during scored racing. Score the whole two-lap race rather than an easy starting segment. Include equipped and stock at720p/1080p and one repeat after garage/race transitions. Separate cold preparation/loading from racing and preserve every outlier. Follow the existing working budget definitions; compare comparable hardware/presets and record any deliberate preset change.

Retain shader/light preparation stability, bounded memory/resource counts and frustum behavior. Investigate stutters before guessing at a cause. Report device/driver/renderer information and whether real hardware or software rendering was used. A video is not a hardware benchmark. Do not stop or kill the user's unrelated applications to make a score look clean.

## Reproducibility and source rights

Include edited Blender sources and authoring scripts, texture/material manifests, valid relative paths, runtime exports and acquisition/derivation records. Verify packed maps and dependencies. Original and game-resolution versions should have hashes, channel conventions, physical scale and license/source URLs. CC0 rights for assets do not automatically extend to a library's site logo or every preview image; retrieve asset downloads, not rendered site thumbnails as game textures. Store downloaded assets locally; gameplay must not contact external asset hosts.

Budget review size: include the working runtime assets, changed editable sources and curated evidence, not every failed intermediate movie. Retain complete history locally. Unchanged very large Blender sources can be identified by path/hash when already present in prior packages and the local project; never omit a newly required source silently.

## Return one package

Create `Astra-Review-12.zip` in the rebuild root (number a suffix rather than overwrite an existing archive). Include:

- `REVIEW-ME-FIRST.md`: what visibly changed, current art verdict, what's still weak, playable flow, exact run commands, source commit, verification limits, and internal milestone/resume status.
- Source/config/lockfile/tests/scripts; current runtime exports/textures; changed editable Blender sources; source/license manifest.
- Compact final and matched-before evidence; current test/build/preservation/performance logs and raw scored measurements; current production-state excerpt and scoped internal reviews.
- `PACKAGE-MANIFEST.json` of every other packaged file with bytes and SHA-256.

Exclude secrets/.env, .git, node_modules, tools/Blender downloads, dist, caches, .blend1 backups and huge redundant intermediate evidence. Do not add another new project or change remotes. Leave a clear next-session resume file if tooling/time expires. Finish with the ZIP's full path, size, important completed outcome and honest remaining blocker. **Do not stop at the first small subtask or ask Dan to choose the next one.**
