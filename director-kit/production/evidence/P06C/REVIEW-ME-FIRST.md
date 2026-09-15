# Astra Review13 — P06C Built Waterfront

**Review package prepared. Performance HOLD; G3/G4 and final environmental art remain pending. Last accepted director review: Review12.**

## Runtime and entry

Existing standalone project: `slingmods-three-wheel-tour-rebuild`, private repository `DanielKinsner/slingmods-three-wheel-tour-rebuild`, branch `main`. Starting checkout: `9780d62e4ea032dafc414dd838b040ed05565da5`. Frozen runtime: `b4eef3c7dab3eb77b131a5100c3be0fd1110b095`. PACKAGE-MANIFEST.json identifies the separate packaging commit and every included file hash. No remote writes were performed.

From the extracted project root, run `npm ci`, `npx playwright install chromium`, `npm test`, `npm run build`, then `npm run preview`. Open `http://127.0.0.1:5187/`. Node 24 was used with pinned dependencies. Blender is needed only to reauthor models; playing requires no originating-machine path or Blender installation. Authoring used official Blender 4.5.2, Python 3.13, Pillow and NumPy. Editable sources and provenance are included; the downloaded tool installation is local-only.

Ordinary player entry: start at the garage, choose Continue for the first harbor lap, earn credits, open Build and purchase the existing SM-133 kit, then Continue into the crew event. Existing earned saves can enter the crew race directly. Time trial exposes day/night. Camera cycling and held rearward view remain available. Sound starts through the explicit game button.

## What changed

Eighteen composed marine workshop/storehouse ensembles connect the service bands and their yards. Three low additions repair the formerly empty arrival and return views. Roofs, recessed loading fronts, canopies, service ends, contained planting and actual cut/union ground surfaces provide depth. Existing marina, water, terminal and compact garage remain.

Asphalt uses aligned photographic channels from one intact crop at 0.75 m, periodic edge correction and active broad road-tone vertex color. Original authored pinnae are baked onto folded palm fronds; all three LODs retain their crown directions and use double-sided MASK 0.35. Actual runtime uploads verify trilinear mipmap filtering. Changed Blender files preserve editable meshes, source polygons, assembly instances and locked route/collider guides.

See CHANGE-MAP.md, COMPOSITION.md, CRITIQUE.md, editable-source-manifest.json and the source/license manifests. Representative rejected sample methods and the rejected first full rollout remain for comparison.

## Verified implementation

- Frozen production build and all 121 installed tests passed; exact 4,200-row simulation parity is retained. Runtime/build inputs were rechecked by hash before packaging.
- All 58 protected starting files are unchanged. All 296 physical foundation meshes preserve positions, topology and transforms. 3,080 road/runoff rays have zero unexpected ground hits; conservative ensemble boundary minimum is 13.279 m.
- Nine functional reports cover fresh chapter/purchase/podium/reward/reload, four complete simulated races and three retries, scene transitions, product comparisons, audio lifecycle, focus/device/camera/input and both UIs. Controlled functional checks are separate from native timing.
- Independent stationary review accepted the bounded M3 checkpoint for validation. All eight original district camera anchors match baseline exactly. Final 37-view assets match the frozen build; 40 final foliage views cover 720/1080, day/night, 15/40/80 m and actual 45/100 m LOD transitions.

## Performance HOLD

The required five configurations/six complete crew races and a daylight lap ran. Standalone configurations, the first warm-context race and daylight passed. The second warm-context race failed the 20 ms p95 target at **33.3 ms**. A fresh two-race diagnostic repeated second-race p95 **33.3 ms**. No active interval exceeded 100 ms. All failed runs remain included.

The first quick interpretation pooled repeated races and hid the failed second attempt. The corrected scorer requires every complete sampled attempt to pass and validates attempt identities/counts. PERFORMANCE-REVIEW.md and the independent final-performance-review.md are authoritative.

Global CPU spikes and separate unrelated audit-job activity make shared-host contention plausible, but do not prove the cause or exclude a renderer issue. No unrelated job was stopped or modified. The next causal measurement requires the same frozen build on a naturally quiet host, with per-attempt scoring and time-aligned process/global CPU observations. Rendering quality and physics were not reduced to mask the uncertainty. Historical ready/shader events remain unresolved.

Only scripts/summarize-review13.py and scripts/package-astra-review13.py changed after the frozen build. post-build-tool-amendments.json records their before/after hashes; the packager permits exactly those two amendments. Runtime/assets/capture harness/tests remain unchanged.

## Final media

- `director-kit/production/evidence/P06C/day-final/complete-race-LIVE-AUDIO.mp4`: complete valid daylight lap, actual live player audio, three sync markers, maximum residual about 55 ms.
- `director-kit/production/evidence/P06C/video-final/complete-race-LIVE-AUDIO.mp4`: complete valid two-lap crew race through result and garage return/reload, actual player and nearest-two-rival audio, maximum sync residual 40 ms.

Source audio, capture receipts, delivered hashes, signal checks and sampled-frame contact sheets are included. Both decoded source recordings have zero clipped/nonfinite samples. Bay/loading outside the recorded audio graph is silent. Evidence-only sync flashes/chirps are retained; one constant audio shift was used, with no engine dubbing or time stretching. Recording overhead is excluded from scored native runs. Day is solo: inherited generic rival-bus prose in its original sync receipt does not describe active rivals.

Independent final-media-review.md records the exact review scope. Sampled frames and numerical signal checks do not constitute every-frame temporal review or human listening approval. Immediate mute/pause snapshots prove zero target gains, not settled silence. Bay comparison metadata rows use camera target [0,0,0]; the inherited method caption mentioning y=0.6 is inaccurate, and the actual paired rows are authoritative.

## Remaining limits and next step

Workshop details still repeat; distant blocks and promenade lawns remain sparse; nighttime architecture and unlit foliage are subdued. The service bands are substantially more built, but **the overall visual target is not met**. G3/G4 remain pending. No new feature work or automatic repeat of P06C is authorized after this handoff; review the director's next decision and preserve the failed timing evidence.

Hardware: Windows, i9-13900K, RTX4080; actual ANGLE/D3D11 identity is recorded. Browser tests use isolated virtual input through the normal game path, actual physics and production rivals. No desktop takeover, physical-controller test, human driving/fun approval or human listening approval is claimed.
