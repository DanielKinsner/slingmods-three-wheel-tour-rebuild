# Current pointer — P08A Build Matters / Review15

Read HANDOFF.md and handoff/P08A-VALIDATION.json. The current private feature branch is `feature/p08a-build-matters`, with tested game implementation `ec6876551542ec39111fbf26253c4528c2290cfc`. Use `python handoff/verify-p08a.py` for current inputs. P08A is complete for director review; no merge into main or publication is approved. P07B preflight/recovery below is historical and already complete. Hosting remains pending and does not block P08A. Preserve all current work and held G3/G4, fidelity, hardware and release gates.

---

# Historical record below

# P07B publication preflight - local only

Review14 accepts the current bounded local demo. P07B changes static delivery only; the owner authorizes Git main handoff but has NOT authorized website publication/account linking. No hosted URL, provider project, plan, quota or public visibility has been verified. The only pending external prerequisite is owner authorization for a separate eligible no-cost demo target plus access. Git handoff proceeds independently.

Run npm ci; npm run demo:build; npm run demo:stage. The versioned output in publish-current.json is the ONLY future upload directory. npm run demo:stage:preview serves that stage locally at http://127.0.0.1:5189/. The normal demo remains at5188. Original Review14 output is retained unchanged on this host; fresh clones produce newly identified output from transferred inputs. See handoff/P07B-VALIDATION.json for exact tested commit/output receipts.

Stage transformations are explicit: keep all game bundles/runtime binaries/notices unchanged; omit internal .vite/manifest.json; reduce review-build.json to public asset hashes/build identity; add noindex meta, robots.txt, custom404.html and _headers. Project-relative source relationships in legitimate license/asset metadata remain attribution, not exposed source bytes. No machine username, credentials, source maps, private evidence or original authoring binaries enter the stage. Generic secret-pattern scanning is only one part of the reviewed explicit allowlist, not proof against all possible secrets.

Headers follow [Netlify custom-header syntax](https://docs.netlify.com/manage/routing/headers/) checked2026-09-15: one global security/noindex block, exact per-file MIME/cache entries so mutable and immutable directives do not concatenate. No redirects/SPA fallback. Root/query navigation preserved at base /. WAV audio/wav; GLB model/gltf-binary; JS/CSS/JSON correct; no-cache mutable names, immutable only actual hash-named JS/CSS. noindex discourages indexing and is NOT privacy. Local server models intended headers; it does not prove provider application of _headers or public access.

Later authorized publication must inspect current provider docs/CLI, eligible commercial-use account plan and shared quotas without changing plans/existing sites. Use a separate provider origin, manual prebuilt deployment only, no repository import, no storefront domain, no auto-deploy webhooks, no paid add-ons. The stage is about112.45MB; inspect its actual receipt and upload acceptance. Do not assume the review ZIP size is the upload payload. Original brand provenance grants local use only; explicit owner publication approval must cover this branded demo before upload.

After authorization/upload: record returned exact project/deploy IDs and actual HTTPS URL; independently fetch/hash every payload and check MIME/cache/security headers, true404, all4entryactions, ordinary visitor race/retry/garage, audio, demo/career separation, product link/return, recovery and one native1080two-race repeat. A custom HTML404 with status404 is permitted;200HTML missing-asset fallback is not. No public or hosted PASS may be inferred from local tests.

Rollback/recovery: retain each stage's receipt plus original demo output manifest; rebuild any missing output from its tested source commit using documented commands, recognizing new build identity. For a future dedicated hosted demo only, record the previous deploy ID before replacement and use the provider's verified rollback control if needed. There is no existing deployment to roll back now. Never alter existing unrelated sites.

G3/G4, final art, human playtesting/listening and physical devices remain held.

---

# Historical Review14 readiness record

# P07A local static candidate

No public deployment has been performed. This document proposes a later authorized hosting operation. A localhost URL is not a hosted share link.

## Exact retained candidate

Runtime: `758c2b291a9b5bd525fe9acd1425537657fadf70`.
Output: `demo-dist/2026-09-15T04-11-59-668Z-758c2b291a9b`.
Output inventory: `director-kit/production/evidence/P07A/final-output-manifest.json` (every payload file and SHA256; the inventory excludes its own self-hash). Payload49 files,112,457,877bytes; the on-disk manifest itself is additional metadata. This is the playable runtime budget, separate from the60MB review ZIP target.

Locally tested environment: Windows, Node24.15.0, npm11.12.0, pinned package-lock. Desktop Chromium153, WebGL2 via RTX4080/D3D11, keyboard and isolated virtual-pad tests. No physical-controller/mobile certification. Static hosting needs no Node process, backend, credentials or environment variables after building. Rebuilding requires Node compatible with the pinned toolchain; Node24.15.0 is the verified version.

From a complete checkout with the indexed binaries available:

```text
npm ci
npm run demo:build
npm run demo:preview
```

Open `http://127.0.0.1:5188/`. On this machine the exact retained candidate can be launched with only `npm run demo:preview`; `demo-current.json` names it. The server reads that pointer at startup, so restart the owned server after a new build. A rebuild creates a new versioned output and retains previous outputs. Normal `npm run build` remains separate and intentionally includes the development public tree. Do not publish normal `dist` as the lean demo.

## Routes and closure

Base-path assumption: `/` at an isolated origin. Asset paths are root-relative; a subdirectory mount has not been validated. Root entry links to `?scene=crew&play=demo`, `?scene=bay&play=demo`, `?scene=harbor&play=demo&preset=day` and `?scene=bay&play=career`. Product results route adds `shop=build`. No rewrite of missing assets to HTML: return404. No external request is required for gameplay. The real product listing opens only by deliberate HTTPS link.

`demo-assets.json` explicitly lists current geometry, scene data, sky, official branding and the complete original audio bank. Legacy harbor GLB remains because it supplies physical collision. All GLB images/buffers are embedded and checked; physics WASM is embedded in the shared runtime JavaScript. Exact-output fetch hashes/cache policies are in `output-fetch-verification.json`; browser fetches and deliberate404 tests are in hardening and capture reports. Initial omitted audio bank was caught and repaired before the freeze. No geometry/texture downscale was used to meet delivery budgets.

Cache only hash-versioned bundled JS/CSS as immutable. HTML, JSON and unversioned GLB/HDR/PNG/WAV revalidate (`no-cache`). Use the correct MIME types, including `audio/wav`, `model/gltf-binary`, `application/wasm` where separate, and JS/CSS types. Keep `nosniff` and a restrictive referrer policy. Deploy the entire same-build allowlisted output atomically. Keep its notices. No source maps, authoring assets, private research/evidence, tool binaries or credentials are in the output.

## Proposed isolated hosting target — requires later authorization

Use a dedicated static demo project/origin, separate from the production storefront and existing production domains. No `.vercel/project.json` linkage exists in this checkout; no project/account/domain identifiers are guessed. The user must identify or authorize the intended target and access policy before publication. Do not infer account-linking, spending or upload permission from this plan.

Vercel's current documentation states that a new project's first deployment is production even without `--prod`; running the CLI would therefore publish, not merely prepare a preview. Verified2026-09-15 in [Vercel’s environment documentation](https://vercel.com/docs/deployments/environments#first-deployment). No Vercel CLI/link/project/upload action was performed. A later authorized operation should inspect the target, configure isolated access and cache/base-path rules, upload only the exact output, then externally smoke-test loading, all four entry actions, audio, race/retry/garage, product return and missing assets. Record the actual generated URL and deployment identity only after that happens.

Global G3/G4, environmental art, human playtesting and subjective listening remain held independently from the local demo validation verdict in REVIEW-ME-FIRST.md.
