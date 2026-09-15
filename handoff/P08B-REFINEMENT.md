# Review16 owner refinement — showroom, departure and swingarm

Runtime: `822ff5f5a9cc211775076074c7d106e8d372286a`, on the existing private `feature/p08b-slingmods-experience` branch. Earlier Review16 runtime `6aa1dafaac03168525a1f7e69a6831ea886f45d2` and packaging `904f929a84dffb0cc7b9c3a44d3911d03be8108b` are preserved. The refreshed ZIP's MANIFEST.json records the exact new packaging SHA. Main is outside this assignment.

## Owner changes

- Replaced smooth checker-floor appearance with original, reference-guided vented plastic tile materials: diagonal ribs, drainage/support detail, rounded normal relief, roughness and restrained gray/charcoal/red tones. Explored a built-in image-generation candidate, then chose more accurate procedural construction. Both the candidate and final editable material source are retained.
- Added the closed roll-up bay beside the lift, a wall opening/frame, reference-style stripe, four-post lift hardware, utility chest and compressor. New packed source/GLB versions preserve the former room. Measurements remain inferred.
- Test This Build now plays a 5.8-second real-scene departure: the existing driver appears, the curtain opens, the camera follows the car through the bay, and the existing drive loads. Pause, Escape/button/controller skip, focus loss and reduced-motion bypass work. This is presentation animation; it does not advance or modify race physics or telemetry. Quick Race still enters directly.
- Painted rear swingarm now follows all four finish accents. White/graphite's incorrectly red accent was corrected in both the UI palette and its original paint-atlas accent mask. Springs, brakes, trim, metals and other cars retain their materials. Original blue/orange restores exactly.
- Added one owner-authorized ElevenLabs door cue, processed for headroom and routed through the actual game mix. Mute, volume, pause/resume position, cancellation and sound-retry context replacement are handled. Successful generation used 35 provider credits; two overlength requests failed before generation. No voice/music, purchase or account change was necessary. No credential is stored or needed to play.

## Critique and verification

180 tests pass. New tests use the actual exported material roles, verify shared-material isolation and asynchronous finish changes, and cover departure geometry/modal cleanup and audio pause/late-decode cancellation. The independent review is under `director-kit/production/evidence/P08B-Refinement/`.

The first floor appeared like bright square outlines; a matched-view repair softened its rib profile and albedo contrast and corrected diagonal orientation. The first departure camera cropped the nose; target tracking and FOV were repaired. Driver visibility, apron clearance, context-recreated audio ownership, navigation failure restoration and stale stopped-node AudioParam telemetry were reviewed and repaired or explicitly distinguished.

Six integrated drive navigations verify complete departure, Pause/blur/resume, Escape/button/controller skip, reduced-motion bypass, delayed sound loading while paused, exact return recipe, saved builds and an unchanged career sentinel. The door restores closed and the driver's showroom preference restores. The final static build and new exact-runtime evidence are indexed in `P08B-REFINEMENT-VALIDATION.json`. Earlier working-tree proof has source hashes because the long-running Vite process retained its old build label; it is not mislabeled as the committed static candidate.

Native race timing and film recording are separate. Original P08B comparisons, historical failures and the prior film remain in Git. The updated packet distinguishes earlier calibration evidence from fresh refinement tests. It is a review packet, not a standalone executable.

## Launch / source recovery

From a clean checkout of the feature branch:

```powershell
npm ci
npm test
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open http://127.0.0.1:5197/ . Prepared career-independent demo remains `/?scene=crew&play=demo`. No API key is required. For a new machine, install the pinned browser only when running tests: `npx playwright install chromium`.

Required source/assets and hashes: `handoff/P08B-REFINEMENT-ASSETS.json`. New editable room: `assets/blender/p08b/showroom-refinement/signature-showroom-refined.blend`; material generation and door transforms: its adjacent README. The README authoring exit target is x=9; the integrated, clearance-tested presentation ends at x=7.8. Exact background commands:

```powershell
& <BlenderExe> --background --python scripts/build-p08b-showroom-refinement.py
& <BlenderExe> --background --python scripts/build-refined-finish.py
node scripts/verify-p08b-showroom-refinement.mjs
```

Use new EVIDENCE_DIR values and BASE_URL=http://127.0.0.1:5197 for `scripts/p08b-departure-proof.mjs`, `scripts/p08b-refinement-finish-proof.mjs`, `scripts/verify-p08b-transfers.mjs`, and `scripts/validate-p08b-preservation.mjs`. Run capture and native timing separately. `scripts/record-p08b-refinement.mjs` records actual game video/audio. `scripts/assemble-p08b-refinement-film.py <CAPTURE_DIRECTORY> --exclude=04-original-harbor --omit-sync-group=6` measures captured synchronization before assembling.

## Limits / next action

Floor depth is texture/normal relief, not individual colliding slots. Door slats gather by a presentation transform, not a winding mechanism. The small exterior apron serves the transition only. Fine vehicle/retail CAD fidelity, inferred dimensions, rear articulation, human fun/listening, physical controllers/devices, G3/G4 and release approval remain held. Hosting is pending separately. Browser saves and preferences do not transfer through Git.

Give the refreshed **Astra-Review-16-Lean.zip** to Astra. No main merge, publication or new assignment is authorized by this refinement.

Final film: 183.061 seconds; SHA-256 `98808dd47d0901cc0fb9632bcbaa412ebd210a01e724ab17583317232165eb2f`. Four verified synchronized segments retain the complete updated showroom/departure, reverse/launch, Express race and return. The optional Original Harbor excerpt is omitted because its opening flash was absent; the visible ending group 6 is identified in `film-final-02/sync-6.png`. Full original footage/audio and failed assembly attempts are retained. These exclusion flags describe this exact capture only; inspect marker labels/counts before assembling a new recording.
