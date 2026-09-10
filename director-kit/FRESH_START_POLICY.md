# Fresh-start decision · authoritative project scope

**Revision 2 · September 10, 2026. This kit supersedes the earlier continuation/remaster handoff.**

This is a NEW game implementation, not an upgrade of yesterday's prototype. Use a fresh directory named `slingmods-three-wheel-tour-rebuild` and a new local Git repository. Do not use an old repository's branch or worktree as the starting point. If that directory already contains unrelated work, choose a non-conflicting sibling name; never clear or overwrite it.

If this kit is accidentally opened inside the old game's workspace, do not modify that project. Create a separate project outside its Git root when local permissions allow, copy only this kit into the new project, and work there. If sandbox permissions prevent that, report the precise access limitation rather than modifying the old game anyway. No remote repository creation or deployment is implied by local initialization.

## Carry forward
- The new creative direction and quality gates in this kit.
- Brand guidance, vehicle/product reference research, and lessons about failed approaches. The references are source leads to verify, not implemented content.
- Authorized original brand resources obtained from their proper source, with provenance and permission recorded.
- The Three-Wheel Tour title and the cast/destination concepts explicitly selected in the new design. Rebuild their content from this design rather than preserving old scripts, track layouts, or IDs.

## Do not carry forward
Old application code, vehicle or environment meshes, textures/material setups, audio bundles, physics/controller code, UI, track geometry, story scripts, saved progression, asset packaging, or deployment configuration. There is no save migration or backward-compatibility obligation to yesterday's game. Never copy a bundled asset merely because the old project used it.

Author new Blender assets and new game systems. Use standard libraries and tools as foundations; starting fresh does not require rewriting Three.js or Rapier. Initial stack: TypeScript, Vite, Three.js, Rapier, Web Audio, and a lightweight DOM/CSS interface. There is no inherited Vue requirement.

New saves use their own namespace, initially `slingmods-twt-rebuild-v1`, and a versioned schema. Leave all old storage keys untouched, including during development on a shared browser origin. Any later save migrations concern only this new game's versions.

## Safe boundaries
Leave yesterday's code, uncommitted changes, source files, browser saves, and deployments untouched. Historical URLs/IDs are not build inputs, deployment targets, or permission to access unrelated work. New local assets and tests must not load resources from the old game. The new project has its own build commands, checkpoints, and acceptance evidence.

## First execution
Read P00 and establish a fresh toolchain/calibration scene. Then prove a recognizable Slingshot and independent three-contact test-pad dynamics through G1/G2. Add the complete slice only after those foundations pass. Do not spend the first packet auditing or salvaging the old application.
