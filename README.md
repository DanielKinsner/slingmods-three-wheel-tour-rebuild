# SlingMods: Three-Wheel Tour

Fresh local rebuild directed by the kit in `director-kit/`. No legacy game imports or deployment target.

```powershell
npm ci
npm test
npm run build
npm run dev
```

Local development: http://127.0.0.1:5186 . `npm run test:browser` captures the Blender calibration in an isolated headless browser while the dev server runs. `npm run preview:accepted` validates G0 before opening a built local server. No public deployment is configured.

Rebuild the actual calibration asset with `.tools/blender-4.5.2-windows-x64/blender.exe --background --factory-startup --python scripts/calibration.py`. The portable executable is a local ignored tool; editable `.blend` and GLB are versioned. See `director-kit/production/state.json` for the exact continuation point and gate reviews for limitations.
