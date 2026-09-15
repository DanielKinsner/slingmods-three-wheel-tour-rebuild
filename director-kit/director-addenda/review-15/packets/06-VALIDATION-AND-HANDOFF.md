# 06 — Prove the customer experience, keep the handoff small

## Outcome checklist: no one green badge substitutes for these

| Outcome | Required proof |
|---|---|
| Obvious reverse / responsive driving | Native keyboard-event sequence and emulated controller sequence; actual reverse displacement, braking, sharper intended cornering, launch/shift/speed measurements, no stuck controls |
| Faster-flowing course | Express route length/map, continuous aligned colliders/checkpoints, acceleration section and braking room, complete quick race and free preview return |
| Vehicle / four finishes | Named before/after defect map, neutral full orbit, moving suspension/steering and full-mod view; all finishes persist through drive/return |
| Set-based room / lighting | Reference-aligned views showing the defining cabinets, logo, display grids, floor and lift; Studio/Lights switch and good dark/light paint presentation |
| Complete branded UI | Actual entry, configurator, event, HUD, pause/settings, results and recovery screenshots and interaction at target desktop sizes |
| Five functional products / free preview | Each real item visibly changes the right slot; exact valid option/link; all-five clearance; new user freely configures and tests without mutating career |
| Preserved career | P08A migration, duel and crew rewards, retry and duplicate rejection; install/remove/reload and saved credits/receipts remain correct |
| Runtime quality | Build/full tests plus native repeated race/performance and repeated showroom swaps, separate from recording |
| Portable project | Runtime/editable assets, dependencies, references, current packet/state and reproducible commands recoverable from verified pushed feature branch |

Audit the source of any failing test. Update tests intentionally bound to the old
profile by keeping the old case and adding the new profile expectation. Do not
rewrite a failure as a broader tolerance without explaining the changed contract.
New defaults must still be deterministic under their version, finite, and stable
through reset/pause/disconnect. Do not erase old performance failures.

## Behavioral proof

Start fresh and from an existing earned P08A save in isolated contexts. Verify
migration without loss of credits, appearance, products or receipts. Test showroom
preview, build save, alternate finish, all five product previews, compare/reset,
Studio/Lights, named preset, unowned test drive, Express quick race, retry, return,
reload and deliberate product-page opening. Show that this does not buy parts or
award career credits. Then separately repeat a genuine earned-career event and
purchase/remove/reinstall with correct transaction behavior.

Test mode-entry/back navigation, pending and failed saves, unavailable assets,
WebGL failure, lost focus, held keys across transitions, gamepad disconnect,
keyboard/controller ownership, audio gesture/mute/volume, physical inspection
visibility restoration, and loss/retry after a stuck/collided vehicle. Do not
manually alter the browser's saved JSON to manufacture a successful customer path.
Use actual UI actions; label automated inputs honestly.

## Native performance, not accelerated-clock footage

On the available host, report OS, CPU/GPU/browser, renderer path, buffer dimensions,
DPR, quality profile, audio state, handling/route IDs and build SHA. Existing thresholds
remain useful for that host: active-race p95 <=20 ms, p99 <=33.4 ms, maximum <=100 ms.
Do not silently lower visual settings, exclude bad intervals, claim GPU time from
CPU timings, or extrapolate an RTX4080 pass to every laptop.

Run a final equipped 1080p two-race repeat, stock 720p repeat and the new Express
configuration with actual rivals. Include a bright/daylight Express run so darkness
cannot hide scene/vehicle defects. Use a telemetry collector large enough for the
whole task, with overflow detection and complete raw samples for each attempt. Keep
loading/ready/menu intervals with separate phase labels, including stalls. Recording
is separate; no captures during scored performance runs.

Test at least 20 product/finish/lighting/scene changes to find resource growth.
Measure cold/warm garage and race transfers separately, including bytes fetched.
Lazy-loading separate garage/catalog/route data is allowed; stale build recipes or
missing visible accessories are not an acceptable optimization. Provide honest
large-asset limits and current source closure.

## Visual judgment must happen locally

Review real native-resolution screens and normal-speed motion, not only automated
checks or an image montage too small to read. Critique the whole customer route.
Ask whether the car reads correctly close up, whether black surfaces remain legible,
whether the room is actually Dan's set, whether selected parts appear where expected,
and whether the UI looks like one deliberate design. Repair before packaging.
Separate human approval of driving fun/listening from automated evidence; Dan is
not required to be the QA operator before a candidate can be reviewed.

## Film and screenshots

Return one roughly 2–4 minute 720p H.264 clip with the actual synchronized game audio:
new entry and showroom, finish/part/preset preview, reverse and a forceful launch,
Express speed/braking/sweeper, some real rival racing, and return to unchanged build.
If edited for length, label it a real-speed edited demonstration and provide cut
locations. Keep the full original capture recoverable separately. Do not overlay
fake HUD values or use a prerendered/car-photo hero as runtime proof. A silent clip
is not audio approval; the previous Review15's 63.68s silent excerpts do not fulfill
this new sound-and-experience requirement.

Normally 10–14 well-selected screenshots: defining room/reference views, four-finish
sheet, corrected defect views, new product full-build view, main UI screens and both
lighting conditions. Label composite contact sheets, matched cameras and temporary
cutaways. Use lossless only for small technical details that need it; good JPEGs at
useful size are sufficient for overview. Do not upload every intermediate shot.

## Git recovery and branch safety

All required implementation and editable sources belong in the established private
Git remote, not only the lean review. Commit normal intended work on the P08B feature
branch; no merge to main until director review. Do not lose P08A by creating the
branch from old main. Preserve personal/unrelated edits and original evidence.

Update the current authority header, HANDOFF.md, production state and input/asset
manifest with runtime/build identity, branch, exact build/test/demo commands, current
Blender sources, known limitations, handling/route versions and a fresh-session
resume prompt. Resolve new asset dependencies to packed or repository-relative paths.
Never depend on ignored files or one machine's username. Credentials, tools, personal
browser saves, node_modules and redundant archives remain excluded.

Verify the final pushed ref and required source/asset blobs. In an isolated fresh
remote clone or appropriately documented clean remote recovery, install pinned
dependencies, build and smoke-test the new preview path without copying local ignored
assets. This is a final portability check, not another handoff-only milestone. Record
the tested implementation SHA and separate documentation/packaging follow-up SHA.
Do not claim destination-machine testing when the clone was on the original host.

## One lean return

Name: **Astra-Review-16-Lean.zip**. Target **60,000,000 bytes**, hard cap
**100,000,000 bytes**. Complete editable/runtime project stays in Git. The ZIP is not
a self-contained executable or backup.

Include:
- REVIEW-ME-FIRST.md: actual outcomes, partials, known limits, exact runtime/branch.
- Current small source/config/lockfile, relevant scripts and tests; a clear diff.
- A manifest with SHA-256/bytes for each file, and an omitted-asset index identifying
  exact remotely retrievable commits/paths/hashes. Do not claim ignored files are on
  GitHub; verify their bytes are available.
- Final build/test logs, complete relevant raw timing and setup/handling comparisons,
  save/configuration checks, failed comparison runs relevant to claims and the local
  independent review. Gzip repetitive JSON losslessly if useful.
- Selected screenshots and the one real-audio film. Include changed compact models
  only where directly necessary for review; large GLBs/.blend/maps stay in verified Git.

Exclude unchanged hero/world binaries, texture masters, duplicate channels,
node_modules, generated dist, tools, old ZIPs and every intermediate capture. Preserve
them where appropriate; do not delete useful source/evidence to achieve the cap.
Budget video first and adjust encoding/duplicate image count before dropping source
or raw failed measurements. If still large, link exact verified remote evidence and
report a precise retrieval route, not an unverifiable local-only pointer.

## Final agent message

Return the ZIP path, film path, exact launch URL/commands, feature branch, remote
runtime/packaging SHAs, what genuinely became playable, and any remaining blockers.
Explicitly tell Dan that Review16 is the return to give Astra. Do not conclude merely
with “pushed successfully” or require him to discover a running server's port.

No public deployment, spending, storefront mutation or plan change is authorized.
The work can be demonstrated locally now; hosting remains a separate permission.
