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
