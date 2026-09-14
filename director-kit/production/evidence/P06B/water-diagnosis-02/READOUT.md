# Overview water/depth diagnosis

Same current kit/foundation/layout hashes before and after all six diagnostic captures. No page or console errors. Source bundles are retained. The first attempt at water-diagnosis-01 failed before capture because the Vite diagnostic injection ran after TypeScript stripping; enforce:pre fixed this harness setup error. No production source was changed by this diagnosis.

## Controlled comparisons

- Shader enabled, camera near0.06m: opposite-shore island surface disappears behind water; service-yard overlap severe.
- Shader disabled, camera near0.06m, original authored water material: the same missing island and yard overlap persist. This excludes the new ripple/color shader as the cause of vanished land.
- Shader enabled, camera near0.5m, identical pose and assets: the complete island becomes visible, and most yard overlap recedes. Some adjacent/apron edges still conflict.
- Water hidden, camera near0.06m: the complete island also becomes visible. The island geometry is present; the water occludes it at insufficient depth precision.

The two interventions establish a depth/occlusion issue rather than an absent island mesh or custom-fragment deformation. Actual water bounds are x[-6000,-28], y-0.280000001, z[-6000,6000]. The fixture uses a24-bit depth buffer, far1600m, near0.06m. EXT_clip_control is supported in the actual headless ANGLE context; reversedDepthBuffer was false. Root can test installed Three's reversedDepthBuffer path without changing accepted cockpit near-plane framing. Presentation geometry must still eliminate real millimetre-separated overlapping ground/apron surfaces.

Large angular sky/fog gaps remain in the0.5m overview. That symptom is separate from the island occlusion, consistent with uncovered finite ground/far-plane composition; this diagnosis does not establish its exact construction cause. Do not claim the depth intervention repairs the complete environment.

No driving, frame-rate or performance claim is made from these diagnostic fixture runs. No G3/G4 approval.
