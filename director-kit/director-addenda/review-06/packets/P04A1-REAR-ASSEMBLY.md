# P04A1 — Rear Assembly Integrity

## Deliverable

One structurally credible rear assembly on the existing Slingshot: the centered driven tire, hub, swingarm, shock, belt region and left/right rear storage/body enclosures fit together at rest and through the supported visual suspension travel. It must look correct in the bay, pad and Harbor event, not only a diagnostic export.

This is a fault repair, not another full-car beauty pass. Preserve the accepted front, cockpit, driver, paint and control feel. Do not add upgrade products in this packet.

## Known reproducible defect

In Review06's GLB, the source object's `rear_firewall` geometry is batched into `body_static__Textured_Polymer`. The closed component occupies roughly X ±0.24, Y 0.33–0.87, Z 1.04–1.17 m. The actual tire surface passes inside it at rest. The rear-spin pivot is already `(0, .3455, 1.3335)` and agrees with the contact JSON.

Astra checked actual exported surface containment, not only AABB intersection. The current `suspension_rear` mesh group is chassis-static while rear_spin and the caliper follow travel. The rear axle therefore detaches from the moving wheel in the rendered system. The day recording reaches approximately 26 mm vertical hub/static-axle mismatch. Do not assume a Blender-only appearance proves runtime clearance.

## Step 1 — matched rear packaging study

Use the existing exact-year references and the primary targets in REFERENCES.md. Obtain rear, side and rear-quarter views of the 2024 R, plus behind-seat compartment/access illustrations. Label any different-year supporting detail; do not use it to override exact-year body dimensions.

Define vehicle-local landmarks: left/right seats and storage envelopes, rear axle/contact center, swingarm chassis pivot, arm-side hub, upper/lower shock mounts, belt/pulley path, central clearance tunnel and tail body. Verify handedness (vehicle left/right, not screenshot left/right). Do not guess that every component belongs on the current side merely because the model put it there.

Keep published wheelbase/tire nominal dimensions and the working contact contract. A pivot matching internal data is not proof of complete authenticity, but the demonstrated collision has a body repair path without moving the axle. Record reference-based body changes. If primary reference genuinely requires a contact change, isolate it as a separate proposed mechanics change and return that hold rather than silently retuning physics.

## Step 2 — repair surfaces and attachment spaces

Open the CURRENT editable .blend and work in a versioned rear-repair file. Do not regenerate the entire old authoring chain and accidentally discard accepted local surface work. Make an idempotent local authoring script or a documented current-source process.

Replace the inappropriate solid rear-firewall block with the correctly shaped rear bulkhead/central wheel-clearance structure. Form recognizable left/right storage enclosures behind the seats, with sensible wall thickness and separation from the suspension/tire region. The enclosures must be physically believable; a black cover that conceals the overlap is not a repair. Detailed usable luggage interiors or animated doors are not necessary; diagnostic volumes plus credible closed/access surfaces are.

Keep a proper central wheel/suspension opening and realistic visible components. Do not delete an important support or shrink the rear tire to pass a screenshot. Check wheel rim/tire width, axle direction and spin origin against exported geometry. Existing coordinates suggest no gross rear-spin translation/axis mismatch, so local evidence must justify any such claim.

Export semantic attachment nodes for rear_arm_pivot, rear_hub, shock_upper and shock_lower, with mesh groups appropriate to their motion. Naming may follow the current project convention. Keep a single current vehicle-asset reference for bay/pad/Harbor; prevent one mode from loading the uncorrected model. Record new exports/version names and retain historical assets in the repository.

## Step 3 — common runtime rear presentation

Use one shared rear presenter for both workbench and Harbor (or otherwise prove identical behavior without copy/paste drift). The visible tire center must follow telemetry; wheel rotation uses the correct axle and never spins the shock/arm.

Make the hub/axle connection follow the wheel. The arm points from a fixed chassis pivot to the hub; the shock upper mount stays chassis-fixed and the lower mount follows the appropriate arm point; piston/spring presentation reflects that changing length. Keep the brake caliper non-spinning and aligned with the disc. Check belt/pulley presentation is coherent enough for ordinary rear views.

**Kinematic approximation warning:** the simulation's wheel follows a vertical-raycast center, not an exact fixed-length swingarm arc. Do not demand both incompatible paths without a solution. Use a small documented visual-only compromise (for example bounded link-length adjustment along its own axis while preserving the pivot and hub) and measure the maximum deformation/error. The wheel-to-telemetry alignment is non-negotiable; this packet does not authorize a suspension-physics rewrite. Any approximation must be visually imperceptible over normal motion and plainly disclosed in the review.

## Acceptance evidence

- Known old rest-pose collision is reproduced in the old diagnostic and absent in the corrected export. Use actual mesh tests/BVH/containment or conservative signed envelopes that avoid false negatives, not only broad object bounds or a single flattering view.
- Test all supported bump/droop extremes and sampled intermediate travel, plus actual recorded day-lap wheel positions. Record states/tolerances. Include dynamic rest-to-motion transitions and wheel spins at 0, 90, 180, 270 degrees.
- Tire center and axle alignment remain within 1 mm of the intended telemetry in ordinary runtime; no new wheel physics/contact-layout changes. Treat 1 mm as a project acceptance tolerance, not an OEM specification.
- No tire/suspension penetration into the defined storage enclosures/body surfaces over supported normal motion. Aim for at least 5 mm conservative geometric clearance where references permit; label it as a game asset tolerance, not a measured real-vehicle gap. Report genuine unavoidable reference uncertainty instead of hiding it.
- Shock/arm attachments stay connected, no floating rear axle, no body-attached brake caliper left behind, no accidental spinning suspension. Record maximum link-length approximation/error.
- Verify bay, pad and Harbor use the same corrected asset and rig; neutral/daylight rear views required. Night lighting cannot conceal rejection cases.
- Preserve the 1,230.867 m route and all gate/collision/tire/drivetrain equations. Existing tests/build pass, then a full valid lap and result/retry check pass. Do not require an identical lap time when a new control capture differs; compare mechanics on matched inputs when asserting equivalence.
- Preserve exact prior source/asset evidence and compare evaluated front/cockpit components to the baseline. Whole-GLB hashes will change because the rear changed; protect unaffected geometry by component/attributes, not an impossible whole-file-equality demand.

Maximum two locally evaluated geometry revisions before an honest bounded HOLD/report. Once the structural checks pass, stop polishing the car. The next gameplay packet can then introduce the first real upgrade.
