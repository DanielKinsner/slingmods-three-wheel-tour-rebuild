# SlingMods: Three-Wheel Tour

Fresh local rebuild directed by the kit in `director-kit/`. No legacy game imports or deployment target.

```powershell
npm ci
npm test
npm run build
npm run dev
```

Local development: http://127.0.0.1:5186 . Open `/?scene=vehicle` for the accepted Slingshot clay inspection or `/?scene=pad` for the driving prototype. The default route retains the original calibration fixture. `/?scene=vehicle&asset=fleet` shows the three scale blockouts; these are diagnostic assets, not three finished vehicles.

Drive: W/up throttle, S/down brake, A/D or arrows steer, X request reverse (brakes before engaging), C near/far chase, hold R for one continuous second to reset, Escape pause. Changing focus pauses and clears held keys; Escape resumes. Mouse orbit/zoom operates only in the inspection view. No physical controller tests or controller implementation are claimed at this stage.

`npm run test:browser` captures Blender calibration into the G0 evidence location; accepted evidence must not be overwritten casually. To rerun without changing an accepted manifest, set `EVIDENCE_DIR` to a fresh folder and optionally `TWT_URL` to the calibration URL of a built snapshot. `npm run preview:accepted` validates G1 and G2 (including G0) before starting the built server at http://127.0.0.1:5187. G1 has its own independent validator command, `npm run gate:g1`. No public deployment is configured.

Runtime captures use a stable build served at port5187 to avoid Vite HMR changing a frame during review. After `npm run build`, the isolated commands are `npm run capture:vehicle`, `npm run capture:driving`, `npm run record:driving`, `npm run record:stress` and `npm run test:presenter`. Each records actual outcomes and provenance under `director-kit/production/evidence`. Recordings deliberately use SwiftShader and run slower than wall-clock real time; they are correctness/motion evidence, not hardware performance results. Frame-cap injection verifies fixed-step scheduling and final rendered poses; it does not claim the software renderer sustained120/144FPS.

The P02 physics model is an explicitly estimated simcade model. The main unresolved high-energy limit is the large hop/roll after hitting an18cm curb near48mph; ordinary-speed curb and incline behavior are separate reviewed traces. Current rendered geometry is clay. Finished rider contact, cabin/surface refinement, garage, audio, hardware performance, race, catalog and campaign work require their later gates.

Rebuild the actual calibration asset with `.tools/blender-4.5.2-windows-x64/blender.exe --background --factory-startup --python scripts/calibration.py`. The portable executable is a local ignored tool; editable `.blend` and GLB are versioned. See `director-kit/production/state.json` for the exact continuation point and gate reviews for limitations.
