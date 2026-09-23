# Tour Rider v1 — isolated integration candidate

Owner requested a higher-fidelity, more realistic, quietly styled rider with subtle animation, isolated from the other agent's work. Implemented on **codex/rider-redesign**, initially based on **7b041acea01be9f13ba0da6007158ebbd7191525**. After the other agent finished and committed its work, main **35cadcf** was merged INTO THIS FEATURE BRANCH and four integration overlaps were resolved here. Main itself was not changed; nothing was pushed or deployed. The new complete Ryker, its physics/career work and steering-reach repair are retained unchanged.

Worktree on this PC: `C:\\Users\\Daniel Kinsner\\.codex\\worktrees\\rider-redesign\\slingmods-three-wheel-tour-rebuild`.

## Result

- Sage textile riding jacket with fitted chest yoke, pocket welts, zipper/pull, double stitching, compression folds and a small reflective back tab. Torso/sleeve skin weights repaired so reaching elbows do not pull the abdomen out of shape.
- Dark riding trousers, gloves with knuckle protection, boot soles/welts and instep stitching.
- Porcelain-coloured full-face shell with shaped chin, smoke shield, rubber gasket, hinges and crown/chin vents. Opaque shield avoids another transparency pass. Helmet details hide as one unit in cockpit view.
- Original semantic skeleton, bind transforms, bone names, contact pivots, eye position and vehicle attachment JSON remain compatible. Original rider files are unchanged.
- Additive runtime animation, not baked GLB clips: 4.6-second breathing loop; occasional stationary left/right looks; smoothed turn anticipation, mild body lean/tuck and braking settle. Driver visibility in the showroom triggers a short acknowledgement. Road input still controls the original regrip/pedal system. No hand-waving while driving.
- Nearby instances have different idle phases. Gestures fade when leaving a stop; resets and pauses are deterministic. Optional showroom motion respects its existing reduced-motion preference and focus/visibility.

## Files and contract

- `public/assets/drivers/tour-rider/tour-rider.glb`: self-contained runtime model, 4,057,916 bytes, 42,491 triangles, four draw surfaces, three opaque materials. SHA-256 in adjacent `manifest.json`.
- `assets/blender/drivers/tour-rider.blend`: editable garment/helmet components, skin weights and packed texture images.
- `scripts/build-tour-rider.py`: reproducible Blender authoring script using the existing owned `test-driver.blend`. All new artwork and textures are authored locally; no new third-party model, add-on, dependency or paid asset.
- `src/presentation/rider-motion.ts`: standalone animation layer. Construct once, restore the original bone pose, apply existing vehicle-specific torso pose, call `update(telemetry, dt, reset)`, THEN solve hand/foot IK. It never changes vehicle transforms, physics, saves or controls.
- Opt-in asset metadata: `driver_root.userData.riderMotionVersion === 1`. The historical asset is unaffected by the motion layer.
- `DriverPresenter.triggerGesture('acknowledge' | 'look-left' | 'look-right')` returns whether a stationary cue was accepted. The showroom supplies the acknowledgement trigger. Ambient looks trigger themselves.
- `rider-asset.ts` supplies the default URL. `?rider=legacy` is a read-only, per-page comparison switch; it writes no preference or save.
- Hero loader, legacy workbench and drive preloader use the same URL helper. The demo asset allowlist includes the embedded GLB; raw texture PNGs and authoring source are not necessary at runtime.

Triangle count rose from 28,411 to 42,491. Four draw surfaces are unchanged. The three unique 1024-square atlas images estimate 16 MiB RGBA8 including mipmaps, equal to the original unique-image budget. This is an image estimate, not measured GPU memory or a performance certification.

## Preview and reproduce

Use the worktree above, not the active main checkout. Existing installed dependencies were reused on this PC via a local node_modules junction; a fresh machine can use `npm ci`. Blender used the existing portable 4.5.2 installation in the original checkout, background mode with four threads.

```powershell
# Development comparison viewer, independent port:
npm run dev -- --port 5223
# Open http://127.0.0.1:5223/rider-lab.html

npx tsx --test tests/rider-motion.test.ts tests/driver.test.ts
npm test
node scripts/verify-rider-redesign.mjs
npm run demo:build
$env:PORT='5224'; npm run demo:preview
# In a second terminal:
node scripts/smoke-rider-game.mjs
```

The currently running development server uses a worktree-local Vite cache (`.tools/rider-vite.config.ts`) because this PC shares installed packages. When using the junction, launch with `npx vite --config .tools/rider-vite.config.ts --port 5223` to retain that cache isolation. A normal independent dependency installation needs no special config.

`rider-lab.html` is a development-only orbitable comparison viewer with original/new assets, both vehicles, idle/cruise/turn/brake poses, gesture buttons, pause and detail view. It is not added to the hosted game or its demo allowlist. Both verification scripts accept `BASE_URL` and `EVIDENCE_DIR` overrides.

## Verification and limits

- 419 tests pass, including seven new rider tests (ten with the existing driver tests). Bind transforms, asset budget, legacy opt-out, 30/60/144 Hz timing, idle cue cadence, driving rejection/fade, reset, pause and background gaps are covered.
- TypeScript and the curated production demo build pass. The build's existing large-chunk warning remains.
- Isolated Chromium comparison covers both models, two vehicle attachments, idle/turn/cruise/brake transitions, +/-0.62 rad full locks, acknowledgement and cockpit hiding. Every intermediate frame is checked for hand/foot contact. Final Slingshot maximum hand gap is below 0.000001 m; foot gaps are below 0.000001 m.
- Packaged smoke: actual input and fixed-step physics in short Slingshot and Ryker drives (Slingshot 18.62 m/s, Ryker 19.47 m/s), new asset loaded, motion active, no career touched, no console/asset errors. Real showroom UI acknowledgement/breathing and reduced-motion suppression verified.
- The initial base-commit Ryker had a 47.45 mm reach deficit at the +/-0.4 rad fixture (candidate 46.10 mm). The completed main steering-lean repair is now retained, and the COMBINED branch passes the strict 1 mm absolute hand/foot contact limit through both +/-0.62 rad full locks for original and redesigned riders. This replaces the initial baseline-only Ryker comparison.
- No sustained frame-rate gate, physical-controller test, full career campaign or photorealistic-human fidelity claim. Phase 2 performance HOLD is unchanged. Added geometry still requires the combined quiet-PC performance check before release.

Final combined evidence: `rider-redesign-evidence/integrated/browser-validation.json`, `integrated/game-smoke.json`, matched original/new images, helmet/back closeups and actual game captures. The initial contact-regression receipt is retained separately: positive braking lean briefly produced a 1.06 mm gap, then the additional motion was reduced and rerun. A first showroom harness attempt omitted opening the View menu; its selector failure is also retained separately. Final checks above use the corrected code and harness. The initial branch receipts remain outside the integrated/ directory as history.

## Integrating later

Main **35cadcf** is already incorporated into this feature branch. Its four overlaps in `driver.ts`, `hero.ts`, `drive-preparation.ts` and `signature/scene.ts` are resolved, preserving main's new vehicle selection, optional rival loading, complete Ryker preload, torso lean/twist, departure telemetry and career logic. RiderMotion runs after the retained torso pose and before hand/foot IK. The viewer uses the complete current Ryker asset.

1. Merge the entire `codex/rider-redesign` branch when the owner is ready; do not cherry-pick only the first design commit `28a8b8b`, because the later integration commit carries these resolutions. If main is still at 35cadcf, it is an ancestor and no merge conflict remains.
2. If main advances again, keep its vehicle-specific attachment/pose logic and reapply only the small rider URL/motion/showroom hooks if needed. Both old and new assets remain available; no attachment JSON was changed by the rider work.
3. Run the focused rider tests and full tests, then the comparison and packaged smoke on the final combined checkout. Perform the existing quiet-PC performance gate separately; this branch does not clear it.

The rider change relative to main modifies no physics tune, vehicle source, route, products, saves, rewards or historical assets. Those files were explicitly compared to 35cadcf and have no differences. The original preliminary receipts used the old base; the final integrated/ receipts use the complete new Ryker with its own physics. The active main checkout and its untracked owner file were left alone.
