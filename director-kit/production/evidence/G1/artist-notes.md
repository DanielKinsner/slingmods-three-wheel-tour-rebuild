# P01 artist delivery

The first diagnostic clay export is ready for an independent runtime recognition review. This file does **not** pass G1.

- Editable source: `assets/blender/vehicles/slingshot-p01.blend`.
- Actual exported mesh: `public/assets/vehicles/slingshot.glb`.
- Three cheap scale silhouettes: `assets/blender/vehicles/vehicles-scale-blockouts.blend` and `public/assets/vehicles/scale-blockouts.glb`. Secondary heroes remain deliberately rough.
- Rebuild command: `.tools/blender-4.5.2-windows-x64/blender.exe -b --python scripts/vehicle_build.py`.
- Blender diagnostic views: `blender-diagnostic-*.png`. They are **Blender renders, not runtime proof**. The lead supplies actual game comparisons.
- Dimensions, mounts, estimated hardpoints and geometry totals: `asset-manifest.json`.
- References, selected US market, uncertainty/rights record: `director-kit/references/README.md`.

Primary forms are bespoke mesh surfaces: crowned narrow hood with broad swept free-edge fenders, pinched central prow, upper/diagonal lamp recesses, stepped splitter, deep boarding cutouts, elevated rear shoulder panels, shaped twin buckets, double roll hoops, full floor/firewall, instrument cluster, center display and AutoDrive R/N/D control layout. Wheels use radial tire cross-sections and machined-style swept spokes; suspension is exposed. No legacy geometry or generated image is used.

The 34,688-triangle hero is substantially below the eventual racing detail ceiling. P01 clay has no UV/bake quality claim, no tire tread finishing claim, no final lighting/material claim, and no rider/LOD/collision readiness claim. Runtime pivot animation and contact grounding still require independent capture verification. The initial pose has no driver model; G3 owns rider contact rig.

Exported bounds compared with manufacturer dimensions: width 1.996 m vs 1.980 (+0.81%), length 3.799 m vs 3.800 (-0.03%), height 1.313 m vs 1.318 (-0.40%), all within the proposed 1% whole-vehicle tolerance. Measured bounds include sidewall bulge/splitter edge radius; no global rescaling was used to distort the exact shared axle centers. Runtime origin is ground midpoint between the axles. All five animation pivots and `vehicle_root` export with identity base rotations/scales. Front wheel centers are ±0.8775, 0.32985, -1.3335 m and rear center is 0, 0.3455, 1.3335 m in runtime axes. Steering rotates local Y and wheel spin local X.

Review priorities: the unflattering side view must show the correct boarding dip, fore/aft axle spacing and height; rear view must show the single wheel and distinct tail hoop/lamp silhouette; front must retain the 2024 wing/prow/lamp arrangement. If these are judged generic or weak, G1 fails regardless of dimension checks.

