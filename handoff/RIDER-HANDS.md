# Rider hand repair

The owner reported visibly broken hands in the merged game. The earlier hand-contact checks were insufficient: they checked bone positions, not the visible finger surfaces or the orientation of the grip.

The old finger generator independently projected a fixed axis at every bend. That axis reversed through the curl (adjacent section dot product -0.413), folding the faces into sharp, overlapping shapes. The Tour rider now has rebuilt palms, opposed thumbs and rounded fingers with continuous transported sections. All eight fingers retain stable frames and rigid hand weights; the historical rider and source asset remain unchanged.

The current gloves opt into `gripPoseVersion: 1`. Their orientation follows the actual steering control frame, including the Slingshot's 19.5-degree wheel tilt and the Ryker's horizontal grips. A measured 20 mm Ryker pivot compensation places the authored curl centre on the bar. Existing skeleton/bind transforms, vehicle attachments, steering inputs, foot contact, breathing, regrip timing and historical rider behavior are retained. There is no physics, career, audio or vehicle asset change.

The corrected rider is 44,515 triangles, four draw surfaces and three materials, within its existing 45,000-triangle budget. The atlas images and texture budget are unchanged. The editable Blender source and reproducible generator are committed with the runtime GLB.

Verification is recorded in `RIDER-HANDS-VALIDATION.json` and `rider-hands/`:

- Geometry regression failed on all eight old fingers and passes on the rebuilt fingers.
- Tests against the shipped GLB joints and both control hierarchies failed on the old grip orientation; the Ryker fit assertion also caught and then verified the 20 mm correction.
- The complete suite passes 431/431; TypeScript and the curated production build pass.
- Both legacy and Tour riders pass the complete steering, full-lock, braking, regrip, gesture and cockpit visibility checks, including intermediate hand/foot contact gaps.
- Paired close-up views cover both vehicles through six poses. Inspect these images in addition to the numeric contact results.
- Packaged driving, showroom rider animation and reduced-motion checks are run on the final assets.

Reproduce the geometry check with the existing Blender executable in background:

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' -b -t 4 --python-exit-code 1 --python scripts/check-rider-hands.py
npx tsx --test tests/rider-grip.test.ts tests/rider-motion.test.ts tests/driver.test.ts
# With the local development server on 5253:
$env:BASE_URL='http://127.0.0.1:5253'
node scripts/verify-rider-hands.mjs
```

The existing performance HOLD remains. Local work only; no push or deployment. Owner file `P06C-HOME-KICKOFF.md` is unchanged.
