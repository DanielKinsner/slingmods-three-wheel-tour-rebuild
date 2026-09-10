# Fresh workbench boundary

New absolute project and Git root: `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`.
Source kit: `C:\Users\SM - Dan\Documents\GitHub\slingmods game\SlingMods-Three-Wheel-Tour-Fresh-Start-Kit`.
Created an empty sibling directory and ran `git init -b main`; no clone or worktree. Only the supplied kit was copied into `director-kit/`. No prior game implementation was opened, imported, edited, or used as a build input. The supplied kit remains unchanged. No remote is configured.

New code: `src/`, `tests/`, `scripts/`, TypeScript/Vite configuration. New authored assets: `assets/blender/calibration.blend` and `public/assets/calibration.glb`. Evidence paths are relative to the copied kit. Runtime save access is restricted to `slingmods-twt-rebuild-v1`; no migration or calls to storage.clear. Unit and real browser storage tests retain synthetic legacy/unrelated sentinel keys. No existing browser profile or its saves was opened.

Automation uses background Blender and a separate Playwright headless Chromium process/context. No OS input or desktop screenshots. Local Vite binds only 127.0.0.1:5186. Browser evidence uses explicit SwiftShader: correctness evidence, not physical GPU performance. Physical controller/mobile testing is unavailable in this pass.

Only new local project files and standard tool download caches were written. Dependencies installed from npm, pinned by exact version and lockfile. No credentials, remote creation, storefront writes, deployment, purchase, or paid generation. Public redistribution rights remain a later unresolved release gate.

Development is intentionally ungated for repair. `npm run preview:accepted` checks G0 integrity before starting the local built preview; package scripts contain no deploy command. Downstream integration must use `python director-kit/tools/check_gate.py --gate Gx` for the relevant dependency. A passing validator does not substitute for independent artifact review.

The initial browser assertion used exact equality for exported float32 roughness and rejected 0.8700000047683716 versus 0.87. Preserved failure log: capture-float-assertion.log. Fixed the harness to a 1e-6 serialization tolerance; no visual/physics acceptance threshold changed. Successful browser report includes the original measured value.
