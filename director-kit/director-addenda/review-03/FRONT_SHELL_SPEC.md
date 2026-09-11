# P03A2 — boundary-controlled outer-brow proof

This is a local replacement, not a whole-car revision. Read the diagnosis in `AUDIT.md` and the scope/stop conditions in `CODEX_NEXT.md` first.

## Freeze

Keep P03A1's cockpit, seats, wheels/tires, graphics, main rear/cabin structure, shared contacts, mounting hierarchy, and bay. Preserve the old candidate and all historical source files. Any interface correction must be confined to where the replacement brow actually meets the neighboring hood or lamp housing.

## The local construction to replace

The existing `sectional()` approach closes a whole transverse loop at the same longitudinal station with a planar polygon cap. Its high longitudinal sample count does not create the missing shape across that cap. A single flat cap normal and automatic feature-index splits cannot represent a shaped return merely by adding samples.

Do **not** apply global smooth shading or generic subdivision to the complete front. The source references contain real sharp feature lines. The task is controlled curvature between genuine breaks, not an inflated/rounded hood.

## Author one master with independent boundaries

Create one editable outer-brow/wing master. Define its leading boundary, trailing boundary, inner hood/lamp interface, and outer silhouette separately from the reference views. The leading boundary must be allowed to vary in depth across its width; do not require every leading-edge point to share one longitudinal plane because that is convenient for the old loft helper.

Use a connected quadrilateral surface with low-density, explicitly placed cross-loops. A boundary-constrained patch or carefully supported quad cage is acceptable; choose the method that actually preserves the measured silhouette and reflection behavior. If using subdivision, use support placement that protects the intended section rather than uniformly shrinking the form. Subdivision level is not the success condition.

Build the visible leading lip and underside return as explicit connected strips with appropriate local radii. Do not terminate the visible compound return in one broad fan/n-gon or add a disconnected dark sheet to disguise it. Keep thickness believable in front, three-quarter and side views. The innermost hidden closure can be simple where it does not affect silhouette or reflection.

Separate true design creases from smooth joins. Check exported vertex/corner normals and tangent behavior, not just Blender's viewport appearance. Material seams do not automatically require geometric creases. Do not introduce holes, reversed normals, overlapping faces or a new panel gap to 'solve' the reflection.

## Compare before expanding

Use the same locked reference cameras and neutral rig as Review03. First show the master in context with a neutral nonmetal material; then use a moderately glossy neutral material and one broad moving highlight. Inspect at least front, three-quarter and side/outer-edge close view. A wireframe view of this local source cage is useful; it is not a substitute for the runtime views.

The pass condition is visible elimination of the specific broad artificial cap/segmented transition while retaining the recognizable lamp/brow silhouette and real sharp lines. A useful front-edge shape must survive two views; a single flattering view is not enough. The local reviewer must say what improved and what still does not match.

Only after this proof succeeds, mirror/adapt to the other side, integrate without changing wheel contacts, reuse the current maps with a restrained UV adjustment, and capture the complete car. Do not start a new tire, cockpit, lighting, decal or micro-detail task.

## Stop condition

Maximum two materially distinct evaluated local candidates in this packet. If the second still fails, keep the current best full vehicle; return the isolated Blender master, the diagnostic views, and the unresolved surface problem. Do not award fidelity PASS, introduce another same-method variant, or block the independently authorized controls work.

This is an attempt with explicit success/failure evidence, not a guarantee that a prescribed surface algorithm will automatically produce a finished automotive asset.
