# Tour Rider v1 — isolated integration candidate

Owner requested a higher-fidelity, more realistic, quietly styled rider with subtle animation, isolated from the other agent's work. Implemented on **codex/rider-redesign**, based on **7b041acea01be9f13ba0da6007158ebbd7191525**. Nothing merged, pushed or deployed. The other checkout remains on main and its uncommitted Ryker/vehicle work was not imported.

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

- 408 tests pass, including seven new rider tests (ten with the existing driver tests). Bind transforms, asset budget, legacy opt-out, 30/60/144 Hz timing, idle cue cadence, driving rejection/fade, reset, pause and background gaps are covered.
- TypeScript and the curated production demo build pass. The build's existing large-chunk warning remains.
- Isolated Chromium comparison covers both models, two vehicle attachments, idle/turn/cruise/brake transitions, acknowledgement and cockpit hiding. Every intermediate frame is checked for hand/foot contact. Final Slingshot maximum hand gap is below 0.000001 m; foot gaps are below 0.000001 m.
- Packaged smoke: actual input and fixed-step physics in short Slingshot and Ryker drives (18.62 m/s reached), new asset loaded, motion active, no career touched, no console/asset errors. Real showroom UI acknowledgement/breathing and reduced-motion suppression verified.
- **Known base-commit Ryker reach limitation:** at the test's +/-0.4 rad steering fixture, one arm is already short by up to 47.45 mm with the original rider; the candidate measured 46.10 mm. The supporting hand remains attached. Idle/straight road smoke fits pass. This is explicitly a baseline comparison, not a passing absolute Ryker full-steering fit claim. The other agent's newer attachment/torso repair is outside this branch and must be retained and rechecked during integration.
- No sustained frame-rate gate, physical-controller test, full career campaign or photorealistic-human fidelity claim. Phase 2 performance HOLD is unchanged. Added geometry still requires the combined quiet-PC performance check before release.

Evidence: `rider-redesign-evidence/browser-validation.json`, `game-smoke.json`, matched original/new images, helmet/back closeups and actual game captures. The initial contact-regression receipt is retained separately: positive braking lean briefly produced a 1.06 mm gap, then the additional motion was reduced and rerun. A first showroom harness attempt omitted opening the View menu; its selector failure is also retained separately. Final checks above use the corrected code and harness.

## Integrating after the other agent finishes

1. Finish/commit the other agent's main work first. Do not switch, stash, reset or overwrite that active checkout to inspect this candidate; use this separate worktree now.
2. Merge `codex/rider-redesign` into an integration checkout when ready. This branch was intentionally NOT rebased onto uncommitted changes.
3. Expect small textual overlaps in `driver.ts`, `hero.ts`, `drive-preparation.ts` and `signature/scene.ts`. Keep main's new vehicle selection, handlebar axes, steering lean, attachment choices and career logic. Add only this branch's URL helper, motion construction/update/report/trigger calls and the three showroom hook additions. In particular **do not replace main's newer DriverPresenter torso/handlebar pose with this branch's older base line**. Apply RiderMotion after that retained torso pose and before IK.
4. Keep both old rider and new asset. Use the existing vehicle-specific attachment selected by the integrated game; this branch changes no attachment JSON. Retain the new GLB in the packaging allowlist.
5. Run the rider tests, full tests, comparison viewer, final attachment/steering checks and packaged smoke on the combined result. Reconfirm cockpit/mirror visibility and current Ryker reach. Then perform the existing quiet-PC performance gate separately; this branch does not clear it.

No physics tune, vehicle source, route, products, save schema, reward history, old evidence or deployed site was changed here. The packaged smoke reflects the committed base's vehicle behaviour, not the other agent's uncommitted physics work.
