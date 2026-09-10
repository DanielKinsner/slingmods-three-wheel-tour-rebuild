# Straight-ramp landing repair

The rejected revision01 source, source hashes, reports, logs and ramp trace are preserved in `../revision01/`. The new heading/lateral regression failed against that source before the fix (`dynamics-ramp-bound-before.log`). It requires every tick to stay within3degrees yaw and0.5m lateral displacement for centered and symmetrically offset ramp lanes, while actually climbing, landing and continuing past the ramp. Bounds were not relaxed.

## Observed cause and controlled isolation

The original centered ramp run is symmetric through takeoff. At tick352 (5.8667s), the front-right passive cylindrical guard contacts the flat700m-wide convex ground slab. The recorded manifold normal is(0.195561,0.075188,0.977805), almost horizontal despite the road being horizontal. Its contact impulse is4005.86Ns. Yaw velocity changes from+0.1495 to-3.6415rad/s in that tick; the custom front tire forces subsequently oppose the resulting yaw. This is an unintended collision impulse, not a zero-steer tire command and not evidence that wheelspin itself caused the turn.

The diagnostic script records every tire ray/hit normal/point, every suspension/tire force application, wheel load/slip/drive torque and every chassis/guard collision manifold around landing. Its controlled variations retained the same input and vehicle tune:

| Variation to rejected revision01 | Max yaw | Max lateral error |
|---|---:|---:|
| Centered original |51.8166degrees|24.6300m|
| Start0.1m left |0.0104degrees|0.00044m|
| Start0.1m right |0.0202degrees|0.01571m|
| Chassis made sensor |51.8166degrees|24.6300m|
| Chassis friction zero |51.8166degrees|24.6300m|
| Guards made sensors |0.000004degrees|0.00000004m|
| Guard friction zero/Min combine |0.0115degrees|0.00829m|
| Finite triangle ground, original guard friction |0.0184degrees|0.00886m|
| Small local convex ground box |0.0104degrees|0.00926m|

These changes localize the failure to the large convex-slab/small-cylinder shallow-contact interaction and its resulting impulse. The engine's internal numerical algorithm was not separately debugged; no general Rapier defect claim is made. Replacing guard cylinders with polygonal guards was also probed and left1.43m drift, so that alternative was rejected.

## Production repair

`src/simulation/index.ts` now builds the same finite700×700m road top as two explicit upward-facing triangles. Its position and extent still derive from PAD.ground, so the authored Blender pad remains aligned. Obstacles/ramp geometry are unchanged. This replaces the problematic large convex face contact calculation with explicit planar surface normals.

Passive guard friction is now zero with the Min combine rule. The guards are rigidly attached collision proxies, not freely rotating wheels; giving them friction can add unintended locked-wheel tangential force when suspension compresses. They retain collision-normal response, while the existing custom tire law retains ownership of tire traction/braking. Chassis friction remains unchanged. No suspension, torque, steering, mass, yaw/pose assignment, recovery assist or broad stability torque was added or retuned.

## After repair

Actual instrumented final runs:

| Start lane | Max yaw | Max lateral error | Final forward positionZ |
|---|---:|---:|---:|
|x=-40.1|0.01402degrees|0.00921m|-9.3163m|
|x=-40.0|0.01934degrees|0.01360m|-9.3171m|
|x=-39.9|0.02958degrees|0.01844m|-9.3158m|

All three climb the actual ramp, land, regain three contacts and continue without the spurious turn. Maximum yaw and lateral error are measured over the full11s run, not just at the endpoint. `dynamics-ramp-fixed-*.json` record these final runs.

The complete driving suite now passes13/13 tests, including the new tighter ramp test and unchanged collision/curb/braking/circle/frame-cap limits. The21 scenario traces and final source hashes were regenerated. Runtime motion recapture and independent gate judgment remain separate from this engineering regression evidence.
