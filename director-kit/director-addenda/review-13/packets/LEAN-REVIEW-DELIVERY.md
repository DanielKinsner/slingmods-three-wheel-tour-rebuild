# Lean Review14 delivery contract

## Purpose and size

Return ONE `Astra-Review-14-Lean.zip`. Target **60,000,000 bytes or less**, hard delivery budget **100,000,000 bytes** (decimal MB). These are this project's review budgets, not claims about ChatGPT's upload limit. Measure the actual final ZIP. If above the cap, fix its selection before handing it to Dan; do not split a redundant archive into several uploads.

This is a **review-only package**, NOT a self-contained playable build, full backup or self-contained Blender reproduction. Put that distinction on its first page. The complete editable project, assets, original captures, unsuccessful trials and historical evidence must remain intact locally. A smaller review ZIP must not mean a lower-quality runtime, erased evidence or missing source history.

Do not assume the reviewer can fetch a local-only commit from GitHub. A prior authenticated repository read does not establish that a subsequent local runtime/assets have been pushed. Remote writes, new cloud uploads, account linking and deployment are not authorized by this delivery contract.

## Required root files and small source

Include these paths at the archive root, without an extra wrapper directory:

- `REVIEW-ME-FIRST.md`: verdict, what changed, actual runtime commit, packaging commit, dirty/untracked exceptions, last baseline, exact locally tested launch instructions, readiness versus held gates, critical failures and a short evidence map. State review-only/non-playable explicitly.
- `RESUME.md`: actual checkout-relative resume point, commands and precise remaining work. Record discovered machine paths only as provenance, never as mandatory paths for the next agent.
- `SOURCE-SNAPSHOT.json`: schemaVersion=1; repository identity; baseline and candidate commit; packaging commit; tree/patch identity; source path/size/SHA-256 inventory; uncommitted included/excluded work; retained complete snapshot location; remote availability with an explicit verification result. A committed but unpushed SHA is LOCAL_ONLY, not a downloadable source.
- `BULK-ASSET-INDEX.json`: schemaVersion=1; every omitted required binary's project-relative path, role, byte count, SHA-256, changed/unchanged status versus the actual baseline, baseline hash where relevant, current source/export relationship, and exact recovery locator. Record locators as LOCAL_ONLY or VERIFIED_REMOTE. Include notices/licenses and original-versus-derived identity. A stale branch URL without a verified exact commit is not a recovery locator.
- `EVIDENCE-INDEX.json`: schemaVersion=1; included review files and how they relate to retained raw originals, with hashes, capture/build identities, media transformations, commands, timestamp/phase meanings and omissions. Identify deliberately selected excerpts as excerpts, never complete runs.
- `REVIEW-MANIFEST.json`: schemaVersion=1 and a `files` array with `{ "path": "...", "bytes": 123, "sha256": "64 lowercase hex characters", "category": "source|report|timing|image|video|metadata|other" }` for EVERY other file in the ZIP. Exclude only the manifest's own self-hash. No duplicate, missing or unlisted entries.

Include the complete small `src/`, relevant `scripts/`, `tests/`, `package.json`, exact lockfile, TypeScript/Vite/demo configuration, HTML/CSS, relevant current instruction/state files, authored asset/export scripts, and new regression tests. These are inexpensive and much more useful than resending old meshes. Include a readable change map or text patch in addition to the current small source when helpful; a patch alone is not sufficient when its baseline is unavailable.

Changed small runtime data, layout JSON, catalog data, scene metadata and relevant asset/material manifests belong in the upload. Include a changed small binary only when it directly resolves an otherwise unreviewable question and fits the budget. Do not automatically bundle every new texture or GLB just because it changed. Provide exported node/material/LOD/clearance measurements and the exact omitted artifact hash for a heavy changed asset. Structural reports are not a substitute for visual evidence, and neither substitutes for access to the actual binary when a later technical question requires it.

## What the reviewer needs to see

Normally include **8–12 final stills**, at most about 16 when a failure or important comparison requires it: demo entry/controls, branded garage, product panel, readable grid/chase view, daylight world, night world, results, plus a few matched before/after or bug-specific details. Prefer well-compressed, legible JPEGs for ordinary scenery; keep a lossless crop when pixel-level text, alpha or a defect actually requires it. Avoid a full screenshot from every camera at every station in every intermediate revision.

Include **one continuous ordinary-path gameplay movie**, normally 720p, about 3–4 minutes, with the genuine game audio: entry/controls → actual crew race → results → retry or garage. Preserve actual time and declared frame rate; a source at 25 fps does not need fabricated 30 fps. Keep full-resolution originals locally. An optional 20–30 second daylight excerpt is justified when the main movie is night or fails to show a specific improvement. Do not bundle duplicate silent/audio-muxed versions or separate raw audio unless an audio defect requires them.

Compression is allowed; manufactured evidence is not. No cut around a hitch inside a claimed continuous race, speed-up, frame interpolation, replacement soundtrack or selected clean replay presented as the benchmark. State codec, dimensions, frame rate, duration, audio presence, source/master and upload hashes, any resampling/transcoding, capture overhead and virtual versus physical input. Label sync chirps and artificial diagnostic sounds. Media recording is separate from the unrecorded performance run.

## Raw evidence that MUST survive in the upload

Include complete relevant per-attempt native timing series and lifecycle events for the required final performance matrix, repeat runs, decisive baseline and failed/repair comparisons. Retain all phases, intervals, outliers and sample identities—not only a percentile summary or a good interval. Supply the exact read-only scorer and its thresholds/tolerance. Report every complete race separately; pooled percentiles cannot pass a failed second race.

Use lossless compressed text/JSON/CSV in the ZIP. Repeated static geometry/material metadata may be factored into a hashed canonical sidecar instead of serialized thousands of times. This is allowed only if every dynamic sample, field, ordering, timestamp and event remains reconstructable and a round-trip comparison proves equivalence. Do not use lossy rounding, drop fields silently, delete outliers or exclude unsuccessful attempts to hit the size budget. Do not rerun historical source-writing validators over old evidence merely to read it.

Include the full final build/test logs, focused regression outputs, preservation comparison, actual asset-fetch/error results, demo/career isolation results, final independent critique and appropriate clearance/parity results for any changed seam. Keep source/host/browser/render-buffer/DPR/audio/capture metadata explicit. Local-agent evidence, independent review, physical controller tests, subjective sound review and human playtesting are different claims.

A useful budget allocation is approximately 2 MB small source, 10 MB reports/timing, 8 MB stills, 35 MB video and 5 MB indexes/contingency. These are planning allocations, not reasons to discard essential failures. Repeated complete frame timing is usually far cheaper than repeated rendered imagery or GLBs.

## Keep OUT of this upload, retain in the project

Do not bundle the entire `public/` tree, unchanged/historical vehicle and environment GLBs, old `.blend` files, original source HDRs/scans, full-resolution texture masters, texture files already embedded in included GLBs, previous review ZIPs, every before/intermediate screenshot, raw-video duplicates, old generated bundles or unchanged previous test evidence.

Always exclude `.git`, `node_modules`, `.tools`, browser profiles/caches, backups, tool executables, unrelated projects, credentials, `.env` files and deploy secrets. Do not include `dist`/full deploy output in the review ZIP: give its exact manifest, construction command and retained location. Deployment output is a different artifact with a different asset closure.

Do not delete these assets/evidence from their legitimate source locations merely to shrink the package. Stage an allowlisted review directory outside the project output/history, build the ZIP from that selection, then validate it. The upload's exclusions must be transparent. A future reviewer can request one named asset or original capture where necessary rather than the whole harbor again.

## Retained complete recovery and delivery check

Retain a complete local candidate snapshot or an exact Git tree plus all required binaries and immutable evidence. List the actual location and verify existence/hashes. Also retain raw originals of any recompressed review media. Ensure the new game build can still load its normal assets independently of this lean ZIP. Do not claim the lean ZIP is self-contained simply because it contains source code.

Run `tools/verify_lean_review.py Astra-Review-14-Lean.zip` from this director packet or a copied equivalent. It validates size, safe paths, required root files and all listed bytes/hashes; it does not evaluate gameplay, evidence truth, source recovery or visual quality. Perform the semantic review separately. Report actual ZIP bytes/MB, verdict, one meaningful local-demo launch instruction and any blocker in the completion message.

No request for Dan to run these validators. Packaging and QA belong to the local agent.
