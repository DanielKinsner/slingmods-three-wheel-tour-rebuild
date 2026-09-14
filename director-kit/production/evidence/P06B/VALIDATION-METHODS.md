# P06B verification lanes

Frozen runtime source: 9348fa90311c5fbdfd74529feb50548582cdca17. The exact build-inputs-verified.json hashes identify all source, tests, authoring/capture scripts and selected active runtime files. Package/report scripts are explicitly excluded from build inputs. Report-only edits after freeze do not change the served runtime. G3/G4 remain pending.

## What the evidence proves

- final-tests.log and final-build.log: 119 automated tests, TypeScript and Vite production build. These include real Rapier behavior, save/economy rules, PBR export inspection, outdoor lighting/water and shared-resource disposal.
- preservation-final.json: original raw hashes for 36 physical/game inputs, verified CC0 source/derived hashes for 33 records and real active GLB channel bindings. protected-git-comparison.json adds 56 Git-filtered baseline comparisons. artist/foundation-preservation.json and ground reports distinguish presentation replacement from immutable course/colliders.
- parity.json: exactly 4,200 solo simulation telemetry rows equal the retained P05 fixture, including braking, turns, reverse and reset.
- fresh-final: new isolated career, ordinary visible navigation, earned 800 credits, 600-credit product purchase, actual third-place crew podium and total750 credits after the one-time400 podium bonus. Saved equipment/cyan color and cleared chapter survive reload. Controlled simulation time is used only after confirming ordinary navigation; this is not frame-rate proof.
- lifecycle-final: four complete actual race simulations, three immediate retries, three garage/crew transitions. Logical GPU geometry/texture counts stay272/72; audio has two bounded rival slots. Controlled time, no hardware timing claim.
- transitions-final: three audio-active native-clock crew-to-bay document transitions in one isolated context. Resource ownership is also checked by actual disposal events in unit tests; logical counts are not VRAM bytes.
- controller-final and crew-ui-final: virtual standard controller/native keyboard and buttons through the production input and menu path. Focus-loss/held-key/disconnect rearming, camera cycle, held rear glance, pause, result, retry and saved return. Not a physical-controller or foreground responsiveness certification.
- solo-ui-final: retained solo native-button/key and denied-storage regressions under SwiftShader software rendering. Functional fallback coverage, not performance evidence.
- interface-final: 720p and1080p native UI screenshots, scrolling/focus, chapter/build/product-link and race menus/HUD. The real shop link is deliberate and does not purchase anything.
- final-visual-02: stationary near-chase district pairs, normal near/far/cockpit checks, material/detail and overview views. SHOWCASE=full is required and asserted in the final evidence audit. Exact fixture/source and asset hashes, FOV, presets and1280x720 DPR1 are recorded. These poses never claim physics or driving proof.
- bay-final: actual saved-build interface, stock-versus-installed previews and day/night room settings with matched inspection framing.
- video-final: one continuous native-wall-clock two-lap crew race, ordinary virtual player controls, untouched production rivals/shared physics, result and saved garage return. Live player/nearest-two-rival game graph captured with MediaRecorder. Three disclosed diagnostic chirps/flashes establish one constant synchronization shift; no time stretching or dubbed engine audio. Video capture and screenshots are unscored overhead.
- day-final-02: complete ordinary daylight time trial with virtual input and real camera switches/held rearward look. Explicitly SILENT; no live audio claim.
- verified-scored-*: clean native RAF on RTX4080/ANGLE D3D11, stock/equipped720p/1080p and equipped1080 repeat after three audio-active garage/race transitions. Whole racing phase, all four finishers. No recorder, readback or full scene inspection inside scored racing. Raw startup/outliers remain; hardware, renderer, buffer size, DPR and provenance are recorded. No unrelated user application was stopped.

## Reproduction

Run from the repository root. Keep the production preview at127.0.0.1:5187. Each EVIDENCE_DIR must be fresh; never overwrite historical outputs.

```powershell
npm ci
node scripts/build-review12.mjs
npm run preview
# In a separate terminal at the same root:
npm test
npx tsx scripts/parity-p06b.ts
python scripts/validate-review12.py
$env:EVIDENCE_DIR='director-kit/production/evidence/P06B/new-full-visual'
$env:SHOWCASE='full'; $env:COMPACT='1'; $env:DETAILS='1'
node scripts/capture-review12-matched.mjs
$env:EVIDENCE_DIR='director-kit/production/evidence/P06B/new-native-stock720'
$env:RECORD='0'; $env:WIDTH='1280'; $env:EQUIPPED='0'; $env:RACES='1'; $env:WARM_TRANSITIONS='0'
node scripts/profile-review12.mjs
```

Use1920 for1080p, EQUIPPED=1 for the saved cyan kit, RACES=2 and WARM_TRANSITIONS=3 for the repeat. Recording uses RECORD=1 and a separate evidence directory, followed by sync-review12.py. Never describe those recorded rows as clean performance. Full commands and implementation remain in the packaged scripts.

The main film's numerical signal/alignment checks are not a human listening or fun verdict. Untested devices, browsers, mobile and physical-controller feel remain unverified. Historical P05/P06 outliers are not erased by cleaner current measurements.

Capture-only amendment: capture-review12-day-ordinary.mjs adds the isolated-input token after confirming ordinary UI navigation. Its separate SHA is in capture-tooling-amendment.json and capture.json; all frozen runtime inputs remain unchanged. The original omitted-token attempt is rejected and retained locally.
