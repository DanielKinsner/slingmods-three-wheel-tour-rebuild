# Current work - Phase 2 performance fixes

- Render CPU fixes committed (d2f57e7, 19473ad, 1f6a596, 602fc6c); see `handoff/PHASE-2-PERF-FIX.md`.
- NEXT: quiet-PC gate run, High then Ultra uncapped harbor (`PHASE-2-CLOSING-GATE.md` commands).
  If worst-1% is still over 16.6 ms, reduce the wet-reflection frame (vehicle draws every other frame).
- Performance HOLD stays until both attempts pass; Phase 3 still blocked.

---
# Current work - UX, career and showroom repair

- All 15 audit findings fixed + UI pass; see `handoff/UX-REPAIR.md` (hand-test steps inside).
- NEXT: owner hand test (garage camera, workshop Done, Continue -> Chapter 02, Return to career,
  Test button destination). Live on the hosted game (5486206), pushed by the owner.
- Known limit: with browser storage blocked, the browser's own Back/Reload still reset a temporary
  career (in-game navigation carries it). Physical controllers/touch devices and non-Chromium
  browsers untested. Performance HOLD unchanged.

---
# Current work - Phase 2 closing gate

- Benchmark/test pipeline parity and sustained reporting complete.
- Performance remains HOLD; see `handoff/PHASE-2-CLOSING-GATE.md`.
- Next: bounded performance diagnosis. Phase 3 remains blocked by this gate.

---
# Current work - Phase 2H surface textures

- Shared scenery and garage texture pass complete; see `handoff/PHASE-2H-SURFACES.md`.
- Next: benchmark/test scene pipeline parity and the Phase 2 sustained-performance gate.
- The sustained performance HOLD remains; Phase 3 follows that gate.

---
# Current work - Phase 2G Ridge forest

- Shared Ridge forest integrated; see `handoff/PHASE-2G-FOREST.md`.
- Next: 2H surface textures, then the final Phase 2 performance criterion.
- The sustained performance HOLD remains; short samples do not clear it.

---
# Current work - Phase 2F shadows

- Shared road contact shadows and stable chase shadows implemented; see `handoff/PHASE-2F-SHADOWS.md`.
- Next: 2G Ridge forest, then 2H surface textures.
- The phase-wide sustained performance HOLD remains; short samples do not clear it.

---
# Current work - Phase 2E vehicle effects

- Implemented across story, quick races and test runs; see `handoff/PHASE-2E-VEHICLE-EFFECTS.md`.
- Next roadmap slice: 2F contact shadows / AO and chase-camera shadows.
- Keep Sport v5 physics, input, earned equipment, saves and historical records unchanged.

---
# Current work — mirrors and steering

- Implemented: live reflections on the player's 2026 mirrors in showroom and all
  three current routes; Sport v5 adds high-speed steering range with v4 stability.
- Existing builds: Build -> Use responsive steering keeps the original and
  creates a v5 copy; no purchase or reset. Historical recipes/records retain v4.
- Validate/deploy: `handoff/MIRRORS-STEERING.md` and its validation receipt.
- Next: owner plays the mirror and highway-turning changes on the existing game.

---
# Previous completed pass

# Current work

- NOW: Loading/drive-flow polish is implemented and packaged checks pass. See
  `handoff/FLOW-POLISH.md`; the live `/review-build.json` identifies deployment.
- NEXT: Dan plays the updated loading, destination and drive-return flow.
  A playable Spyder still requires a usable source asset and a separate assignment.
- LATER: Measured product mounts and a sourced 2026-compatible exhaust replacement
  if desired. No invented SKU or fit claim.
- DONE THIS PASS: Branded loading stages and responsive retry dialog; completed
  downloads retained on retry; independent sky/vehicle and showroom loads overlap;
  last-driven destination restored; clearer entry and pending copy; duplicate
  development exit removed from current showroom/drive loading.
- DONE: 2026 semantic finish/rival/optics bindings; live original analog needles
  and native LCD; original dashboard face/glass/UVs; local pedal/leg pose; storage
  navigation restoration; departure pulley rotation; per-product fitment and
  reference-only Thermal shopping/summary. All five previews remain available.
- PRESERVED: All 81 original source files, Josh tread normal, prior owner fixes,
  Sport v4 handling/input, UI/showroom/mural, routes, careers/credits/history/saves,
  four finishes, five products, powered center display and Thermal departure.
- LIMITS: Source MPH dial has irregular upper numerals; needles follow those marks
  and digital MPH is exact. Source remains R Manual with game automatic controls.
  Product mounts are visual adaptations, not measured CAD fit verification.
- COMPARISONS: `?visual=josh` and `?visual=legacy` remain optional; 2026 is default.
