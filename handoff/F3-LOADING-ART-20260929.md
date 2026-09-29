# F3 loading artwork replacement — local only

Owner requested replacement images for the F3 loading screen while another agent works in this checkout.

The only existing file changed by this task is `public/assets/game-feel/loading/garage-spyder.jpg`. It now shows the orange/white Spyder in a dark premium workshop with open space on the left for the existing text. No code, loading timing, vehicle model, physics, save, CSS, lookup, or packaging changes.

- JPEG: 1672 x 941, 308,964 bytes; SHA-256 `A5B2F7E660F92FC1344BA62D1CD725D152406B62E3E868F34F7DE7E41032521E`.
- Built-in image_gen, with the previous garage-spyder.jpg as vehicle identity reference; generated art, not a showroom screenshot. Native PNG encoded as JPEG quality 90 without resizing.
- Both PNG originals, optimized JPEGs, a mountain-dusk alternate, exact prompts, previous runtime image, and loading screenshots are in `C:/Users/SM - Dan/Documents/GitHub/slingmods game/output/f3-loading-art/`.
- Existing shared lookup, inline boot script and demo asset allowlist already use this exact path.
- Real showroom loading veil checked at 1920 x 1080 and 2048 x 1019 with candidate image request substitution and GLB requests held; no page errors. This checks the loading presentation, not completed showroom/gameplay startup.
- Existing `tests/game-feel.test.ts`: 13/13 pass, including all loading-art mappings and shipped allowlisted files. No full build or performance claim for this image-only change.

The previous asset was checked against Git blob `ceae3a279b6fd53d9767a75850c21704260cc624` immediately before replacement. Other agent edits in `src/express.ts` and `src/rally/presentation.ts` and unrelated untracked files were left intact. No staging, commit, push, or deployment performed.

Copied 2026-09-29 (owner request) into `handoff/f3-loading-art/` so the originals, alternate and prompts survive a machine change; the `slingmods game` folder is not a Git repository.
