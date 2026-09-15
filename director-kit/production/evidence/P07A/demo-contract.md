# P07A demo and lifecycle seams

## Profile contract

- `play=demo` selects a prepared **Development Preview** profile. `play=career` or an absent/unknown `play` value selects the existing career. The existing `profile=1` parameter retains its independent timing meaning.
- Demo career data uses **per-tab sessionStorage** key `slingmods-twt-demo-v1:career`. Demo camera/audio preferences and lap records use `slingmods-twt-demo-v1:settings`. Demo code does not open the career IndexedDB database or read/write the normal localStorage save key.
- The prepared state owns/equips the existing SM-133 kit and opens the existing crew event, with zero credits and no fabricated award/purchase receipts. This is explicitly disclosed as prepared availability. Subsequent commands use the original `transition` implementation, valid-result certification and reward rules unchanged.
- Reload and same-tab scene navigation retain the demo state. A separately opened tab has its own demo session. Reset removes only the two exact demo keys in the current tab. No career deletion, replacement, migration or merge occurs.
- If browser persistence is denied, the existing memory-store path remains usable. Same-origin `window.name` navigation envelopes carry profile, exact origin and destination. If demo writes fail while old storage remains readable, a validated newer same-profile handoff revision wins over the stale stored revision. Demo envelopes are accepted only by demo destinations; career envelopes only by career destinations. Historical untagged envelopes remain accepted **only as legacy career transfers**, preserving the original denied-storage contract; a demo never accepts them.
- Corrupt demo session bytes remain intact until the visitor deliberately resets the demo. The recovery screen links back to that action. Corrupt/future career data continues through the original export/temporary-play dialog.

## Entry and navigation

The no-scene root is Development Preview, except historical `test` fixtures and explicit career entry. Its native links lead to Race the Harbor, Explore the Garage, Daylight Drive and Continue Career. All demo navigation preserves `play=demo`, including product links back into the game and result-to-garage actions. `shop=build` opens the actual garage product panel. External product navigation remains a deliberate normal HTTPS link, with no state in its URL.

Keyboard bindings are taken from the unchanged input resolver: W/S pedals, A/D steering, C camera, held B look back, Esc pause, held R for one second to restart, X direction. Root controls are visible; ready-grid controls are open for deep-link visitors. Desktop-first/touch limitations and physical-controller evidence limits are explicit.

## Staged demo surface

The `demo` Vite mode allowlists scene bay/crew/harbor, play demo/career, preset day/night, quality standard/low and shop=build. Historical assets, neutral/diagnostic variants and old scene selectors are removed before scene import. No ordinary visitor menu links to fixture URLs or diagnostics, and ordinary visitor pages do not expose the scene testing globals.

The exact staged candidate permits the explicit pair `test=1&profile=1` solely for isolated validation, with bounded clock/captureBuffer/seed parameters. That pair enables the existing guarded scene hooks and native profiler so final candidate timing and functional tests need no alternate runtime. These URLs are absent from visitor UI.

## Loading and lifecycle

Dynamic scene-import/required-load failures produce a path-free readable retry panel. A visible exit is present before scene import, and a 120-second import/load bound leads to recovery. WebGL creation failures show a graphics-support panel. Context loss dispatches the existing blur/suspend path, stops owned animation loops and offers a full reload. Recovery makes background content inert and contains keyboard focus in its actions. No placeholder asset replaces a missing model or map.

`pagehide` stops all owned scene/menu RAF loops; existing scene handlers dispose renderer, audio and simulation resources. A persisted BFCache return reloads the page instead of resuming disposed graphs or creating another loop in the same document. Scene transition remains full navigation. Physics, route, rival/race semantics, personal career schema and product representation are not changed by these seams.

## Validation status

- `npx tsx --test tests/demo-profile.test.ts`: 8/8 focused isolation regressions passed.
- `npx tsc --noEmit`: passed.
- `npx tsx --test tests/demo-browser.test.mjs tests/career-handoff.test.mjs`: 3/3 real-browser regressions passed, including canonicalized staged-mode denied-storage handoff, read-success/write-failure navigation, second tab/reset, mode switch, legacy career handoff and existing corrupt-career recovery. Full log: `setup/demo-browser-initial.log`.
- Tests ran only after the lead completed the frozen baseline benchmark phase. The small fixture browser tests used their own routed origin; they did not rebuild or navigate the frozen game server.
- Repaired static candidate hardening passed 11/11 checks; see `HARDENING-REVIEW.md` and `hardening-repaired/report.json` for exact identity, retained failures, asset/audio retries, context loss, focus containment and navigation evidence. Complete motion, performance and final-suite evidence remains separate; these focused checks do not certify those broader outcomes.
