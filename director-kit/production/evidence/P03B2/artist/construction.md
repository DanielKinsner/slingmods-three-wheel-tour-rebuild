# P03B2 driver construction and fit checkpoints

Original, locally authored adult test driver. No scan, likeness, downloaded clothing, or vehicle geometry is embedded in the driver GLB. Source: `scripts/driver_p03b2_build.py`; editable Blender master: `assets/blender/drivers/test-driver.blend`. Authoring used Blender 4.5.2 in background mode. The build saves separate garment, glove/finger, boot, helmet, visor and collar objects before export batching.

## Fit first

Fit01 established seat/control placement but was held for detached-looking shoulders and missing neck continuity in actual Blender and browser views. Its exact GLB/source/config/script are preserved in `artist/fit01`. The first permitted correction (fit02) overlaps and remeshes shoulder volumes into the tailored jacket and sleeves, bridges the neck into the helmet, adds a protective collar and surface-tracked sewn paths, and gives restrained elbow folds. It leaves every bone, contact, eye and foot anchor unchanged. Fit02 remains neutral, awaiting browser straight/both-lock/side/cockpit review; it is not material approval.

The jacket/trousers are connected section-built garment volumes, locally voxel-unioned and decimated within the driver budget. Gloves use palm/gauntlet masses plus four curved fingers and an opposing thumb. The helmet has a shaped chin and opaque curved visor. Density is limited to these new assets. The frozen vehicle and its sixteen maps are SHA256 checked before and after every build.

## Attachment and axes

`test-driver-attachment.json` is the machine-readable contract. Root has no scale and uses vehicle runtime coordinates: +X right, +Y up, -Z forward. It attaches below the same interpolated chassis transform as the car. Blender uses x, -runtime-z, runtime-y. The rig contains semantic pelvis/spine/head, upper-arm/forearm/hand and thigh/shin/foot bones. The config includes actual exported local bind translations/quaternions, rest positions, segment lengths and pole hints; those local rotations are not identity.

Actual P03A2 source wheel center is runtime [-0.36, 0.71, -0.015]. Grip targets are local steering-control [-0.165, 0, 0.023] and [0.165, 0, 0.023]. The old hand-marker empties were 35 mm inward and are deliberately not used. Hand bone heads are contact pivots inside the gloves. Anatomical wrist positions are also recorded, 45 mm back toward each elbow. The runtime must transform grips through the displayed `steering_control` world matrix after its pose update; front-wheel steering alone is not an equivalent target.

Source rider-seat anchor is runtime [-0.36, 0.38, 0.32]. The chosen adult eye is [-0.36, 1.145, 0.405], geometrically inside the helmet. Foot anchors are [-0.49, 0.22, -0.49] and [-0.28, 0.22, -0.49], derived from source footwell markers; these are not measurements of separate modeled pedal faces. Driver proportions are selected game parameters. Only `driver_head_visual` is hidden for cockpit view; one shared body/arm rig remains visible in exterior and cockpit.

## Neutral fit02 census

28,411 rendered triangles; 4 primitives, 4 materials, 1 skin. GLB 1,192,508 bytes, SHA256 `1e45ac66fa6da521413001c72b5a428d4bae9145654bf6794f895ef1ee4b9c62`. Editable source SHA256 `7fefc32038ff189c366a5e04edab7c0530668894e180e103e293bc816432c848`. Complete hashes and preservation checks are in `fit02-export.json`. Textures are not yet authored; neutral fit colors must not be called final fabric.

Rebuild from repository root in PowerShell:

```powershell
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python 'scripts/driver_p03b2_build.py'
```

This command replaces only the separate driver master/GLB/config and its named report. Preserve checkpoints before another permitted source revision. Parent director owns presenter IK/regrip, runtime camera, actual screenshot evidence and acceptance. Source validation and bone gap math do not certify visible grip or convincing cloth.

## Material01 bank (geometry frozen after fit02 approval)

Independent runtime fit02 review cleared the shoulder/neck repair and seated reach. Fabric uses one original deterministic 1024 × 1024 basecolor/normal/packed ORM set authored by `scripts/driver_p03b2_materials.py`: charcoal twill/grain, leather grain, restrained deep-red seams and center helmet stripe, smooth helmet paint and opaque visor. No outside image or material library is used. Every atlas tile has padded bounds. Cloth is rough, leather intermediate, helmet clearcoat/gloss and visor smooth. The four material groups share the three images.

Final material01 source SHA256 `59b92afcd742abe9f9c87bc40bfeaeaff8743e592ea8fe85461ff4290df8c723`; GLB SHA256 `c9909f146ec2fd17e1205abfef3c48e1b2f0006cde83af3382000a66995d75e5` (3,717,076 bytes). Attachment SHA256 `377d12f4a02d7235dc135b1460771f7960385865640bc0d4565f4a60dc4b5d60`. Triangle count remains 28,411, 4 primitives/materials and 1 skin. Original PNGs total 2,519,689 bytes. Unique RGBA8 images cost 12,582,912 bytes without mips or 16,777,216 bytes with a full mip chain. Actual runtime texture allocation must be counted independently: Blender emitted twelve texture records that share three embedded images and one identical sampler.

`material01-validation.json` verifies expanded triangle positions, normals, joints and skin weights equal fit02 exactly; UV-only helmet stripe splits alter vertex indexing without altering geometry. All 19,541 exported UV vertices are finite in [0,1]. Bone rest/local bind TRS and seat/eye/arms/feet attachment parameters are exact matches. The source/export frozen vehicle and map SHA checks pass. Exporter shared-image sampler warnings are explained in that validation report: all image texture nodes use identical Linear interpolation/repeat sampling. No invalid mesh warning was emitted.

Reproduce the approved-fit geometry with materials:

```powershell
$env:DRIVER_FINISH='1'
& '.tools/blender-4.5.2-windows-x64/blender.exe' --background --python 'scripts/driver_p03b2_build.py'
& '.tools/blender-4.5.2-windows-x64/4.5/python/bin/python.exe' 'scripts/driver_p03b2_validate.py'
```

For neutral construction omit `DRIVER_FINISH` or set it to `0`. The rebuild replaces the current separate driver output; historical `artist/fit01` and `artist/fit02` retain exact reviewed source bytes. Blender source file hashes include serialization state; compare exported geometry and manifests when reproducing. Material01 currently awaits actual runtime finish review. Small-scale procedural cloth and selected adult proportions are game assets, not a scanned human or certified production clothing. No hardware FPS, full character animation library or photorealistic likeness claim is made.

## Final artist handoff

Independent material01 runtime review clears the bounded driver source/fit/finish candidate: cloth weave/red trim, helmet/visor/leather separation, retained shoulder/neck joins and cockpit glove visibility are supported by actual screenshots. Artist also inspected `material01-runtime/straight.png` and `cockpit.png`. Source, GLB and all maps are frozen. Only attachment `fitStatus` and authoring script's matching metadata string were updated after review; runtime transform values did not change. `driver-final-manifest.json` is the authoritative current file/hash list; `material01-export.json` preserves the earlier capture's attachment hash. Final motion, contact/regrip under telemetry and hardware claims remain separate.

Stage the five `scripts/driver_p03b2_*.py` files, `assets/blender/drivers/test-driver.blend`, `public/assets/drivers/test-driver.glb`, attachment JSON, the three `public/assets/drivers/textures/*.png`, and `director-kit/production/evidence/P03B2/artist/**`. Do not stage `assets/blender/drivers/test-driver.blend1`: that automatic Blender backup duplicates the preserved fit02 source in evidence. No source dependency is external to this repository's existing Blender runtime and bundled numpy. The frozen car source/GLB and all sixteen car maps remain unchanged.
