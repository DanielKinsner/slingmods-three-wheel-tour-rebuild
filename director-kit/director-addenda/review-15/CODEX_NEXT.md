# P08B — SlingMods Signature Experience
## One substantial customer-experience implementation after Review15
Prepared by Astra for Dan Kinsner · 15 September 2026

**Outcome:** a customer opens a distinctly SlingMods game, recognizes the Slingshot
and the YouTube set, makes an appealing build without grinding, inspects real mods,
drives something responsive and quick, races on a course with room to accelerate,
and deliberately opens the corresponding product pages.

This document and the owner's latest requirements supersede older scope freezes
for the work expressly authorized here. They do not turn this into a fresh project
or grant final G3/G4, OEM accuracy, release, or public-hosting approval.

## Start from the real current work

Read this packet's AUDIT.md, OWNER-PRIORITIES.md, all six packets, the current local
HANDOFF.md/AGENTS.md/state, and P08A handoff/source. Discover the actual checkout,
remote, branch, working tree, installed tools and sources. Do not hard-code a past
Windows username or Blender path.

The reviewed return is Astra-Review-15-Lean.zip. Its implementation is
`ec6876551542ec39111fbf26253c4528c2290cfc`; its verified remote packaging tip is
`ef592752741333faee496edff95b8abb68b76840` on
`feature/p08a-build-matters` in the private
`DanielKinsner/slingmods-three-wheel-tour-rebuild` repository. Main was last observed
at `ed363b28ec6ba933dd82c576153bd73c80ea6619`, before P08A. These are checkpoints,
not permission to revert later work. Resolve newer descendants and local edits.

Accept P08A's functional expansion for continued development. Preserve Maya's duel,
save migration, rewards/receipts, installed suspension setup and comparison,
underglow, existing rivals, prepared-demo isolation and original evidence. Neither
a new clone nor a new machine requires repeating P06C, P07A, P07B or P08A.

Create/use a clear feature branch descended from the current P08A work, preferably
`feature/p08b-slingmods-experience`. Ordinary recoverable commits and a push of the
intended handoff to this same private repository are authorized. No force push,
merge to main, unrelated edits, destructive reset or history rewrite.

## The six deliverables are a single integrated release candidate

1. **Driving with intent.** Obvious reverse, useful braking and turn-in, satisfying
   acceleration and stable fast driving. A game-tuned default, not a punishment
   simulation. Retain the former calibration as a versioned reference, not a freeze
   on an unsatisfying player experience. See packets/01-DRIVING-AND-EXPRESS.md.
2. **A showroom-worthy Slingshot.** Repair actual accidental holes, intersections,
   disconnected edges and pose failures; keep genuine vents/open spaces. Supply four
   properly masked finishes. Correct appearance must survive ordinary camera moves
   and stock/installed suspension travel. See packets/02-VEHICLE-AND-FINISHES.md.
3. **The YouTube set, elevated.** Reconstruct the supplied cabinet/logo/worktop,
   product-grid walls, checker floor/red perimeter and left lift in editable 3D.
   Light the vehicle like a premium product shoot, with a separate accessory-night
   mode. See packets/03-SHOWROOM.md and the five supplied reference images.
4. **A cohesive SlingMods UI.** Rework entry, garage/configurator, catalog, event
   selection, race HUD, pause/help/settings, results and recovery states. Real
   interaction and hierarchy, not a splash-screen-only facelift or a static mockup.
   See packets/04-UI-AND-INTERACTION.md. This includes the owner's added UI request.
5. **Free configuration with real products.** Retain two existing products and add
   three named compatible items; use a reusable data/fitment/slot system. Product
   configuration and test drives must not require career credits. Real retail links
   remain deliberate and exact. See packets/05-CATALOG-AND-CONFIGURATION.md.
6. **A complete loop worth sharing.** Add Harbor Express, a faster-flowing route in
   the same waterfront vocabulary, available as a free test drive and quick race.
   Preserve the existing Harbor track/events as their own content. Integrate all
   six deliverables, prove recovery from Git, leave an actual local launch route,
   and return lean evidence. See packets/06-VALIDATION-AND-HANDOFF.md.

## Authority: what changes and what stays

| Area | New authorization | Preserved boundary |
|---|---|---|
| Input/handling | Direction UX, measured acceleration/brake/steer/traction/assist tuning, coherent camera/audio feedback | Fixed-step integrity, three tire contacts, actual collisions, honest telemetry; no invisible trajectory lock |
| Old stock parity | Keep the old profile and evidence for regression/reference | New default need not reproduce old driving constants; saves/records need tuning-version separation |
| Vehicle art | Targeted shell, normals, thickness, intersections, visual articulation, material masks and mod mounting repairs | Chosen 2024 R identity, reference scale/contact layout unless a documented correctness defect warrants a narrow repair |
| Showroom/UI | Full reconstruction of room presentation and customer-facing UI | Existing save/transaction/input safety and existing real branding assets |
| Course | One distinct Harbor Express layout/colliders and scene composition using current kit | Do not silently edit old Harbor route/checkpoint IDs; both remain playable |
| Products | Five supported products, relevant real options, editable geometry, free preview/test-drive data | No imaginary retail bundles, unsupported gains, pretend inventory/feed/cart or mandatory account |
| Deployment | Build/serve locally and prepare portable output | No publication, plan/account changes, domain changes or spending |

This explicitly supersedes P08A's instruction to keep the stock equation path
unchanged **for the new versioned player profile**, and earlier vehicle/world/UI
freezes **for these named repairs and new scenes**. Do not use historical guardrails
to avoid the core work. Do not weaken unaffected regression assertions to hide bugs.

## Local production organization

Use one integrator and at most three concurrently active, non-overlapping workers
when supported: driving/Express; art/vehicle/showroom/mod meshes; UI/configuration.
The lead owns shared data contracts, save migration, branch integration and final
acceptance. Establish configuration and mounting interfaces first so workers do not
independently rewrite src/main.ts or the same scene builder. If parallel workers are
unavailable, do the same work in distinct sequential passes and say so.

Work through these internal stages without asking Dan to approve routine choices:
- Recover and record baseline; create a concrete defect map and customer flow.
- Produce a playable steering/reverse proof, room/hero light proof and UI layout
  proof. Review them locally; choose and fix, do not return them as the final result.
- Roll the chosen construction through all screens, products, finishes and routes.
- Integrate, run ordinary-input validation, inspect the actual images and motion,
  repair failures, then capture the final candidate and verify the remote handoff.

This is intentionally broader than the previous assignments. Do not stop when the
first subtask passes, respond with a plan in place of implementation, or quietly
omit UI/showroom/driving to call a narrow change complete. Avoid unbounded polishing:
when a method repeatedly fails, change that method, retain the best candidate, and
continue other unblocked work. On a real resource/access limit, leave an explicit
resume state and incomplete outcome list; never invent a pass.

## Keep Dan out of routine QA

Use isolated browser contexts and background Blender. No active-desktop mouse or
keyboard control. The supplied photos establish room composition; missing surveyed
dimensions are not a blocker. Resolve product questions through primary pages and
available instructions before asking Dan. A genuine unresolved fitment/required
credential issue can trigger one precise question with its impact, not a homework
list. Do not ask for secrets in chat or commit them.

Final return: **Astra-Review-16-Lean.zip**, exact playable local URL/launch commands,
short actual gameplay/showroom film with game audio, and pushed feature branch,
runtime SHA, packaging SHA and HANDOFF.md. The result is not done merely because a
ZIP exists. Assess every customer outcome in packets/06-VALIDATION-AND-HANDOFF.md.
