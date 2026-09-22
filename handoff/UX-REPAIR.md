# UX, career and showroom repair (2026-09-22)

**Bottom line:** all 15 audit findings (UX-01 … UX-15) are fixed and verified in a real browser, plus a UI pass. The career garage now runs on the same showroom as the free configurator, the camera can no longer leave the room, Continue follows the career instead of looping, and every screen shares one header with a persistent Career item and an explicit "Return to career". One narrow limitation remains (browser Back button with storage disabled, below).

**Push/deploy status (corrected):** this session never ran `git push` or a deploy, but another client using this checkout (the Codex app or GitHub Desktop were running; no git hooks exist) auto-pushed each commit to `origin/main` within seconds to minutes (remote-tracking reflog: `5486206` 11:08:55, `c82e549` 11:18:37, `c5ee83d` 11:22:27 -07:00). The existing Vercel Git integration then deployed it: at 11:23 the hosted `/review-build.json` reported commit `5486206` (identical game source to the final). No rollback was attempted; that is the owner's call.

- Branch `main`, 7 commits on top of the audited `5803a6b`: `8159e8f`, `6a4de54`, `0248efa`, `a61de0c`, `00423ff`, `5486206`, `c82e549` (then the handoff commits). Auto-pushed by another client, see above.
- Game source is identical at `5486206` and `c82e549`; the packaged build and full-career regression ran on `5486206`.
- Audit packet copied to `handoff/ux-audit-packet/`; evidence in `handoff/ux-repair-evidence/` (before/after images + result JSON).

## The simple version

Before, the game had two different garages, like two edit timelines of the same scene that had drifted apart: the career garage had older lighting, no Tour Wall, its own camera (which could fly 1.6 million metres into the sky or under the floor) and its own menus. Now there is one showroom "master" with two export presets: **free preview** (edit anything, nothing is spent) and **career** (only what you own, real purchases). Switching mode changes permissions and labels, never the room or the camera.

Around that:

- **Career is always one click away.** A CAREER item sits in the header everywhere. If you opened the showroom from your career, it becomes **← RETURN TO CAREER**, the footer says "Your earned career build", and parts you own show **Owned in your career**. Preview edits never touch the career.
- **Continue means "next thing in the story".** Once Chapter 01 is done it goes to Chapter 02 (and on through the Ridge), not back to the shop or a rematch. The suspension shop is labelled optional.
- **Test drives say where they go.** The Test button reads e.g. "Smoky Ridge · Blue hour" and launches exactly that. Waterfront drives now have an explicit time-of-day picker (they used to say "daylight" but actually loaded "Dusk, after rain").
- **Home means home, Back means back.** Each screen has its own URL; browser Back/Forward and reload work inside the showroom.
- **Temporary careers** (when the browser blocks storage) now survive a trip through the showroom and free test drives.

## Audit disposition

Every finding was reproduced on the current checkout before any change (`before-*` evidence), then re-verified after.

| ID | Status | What was wrong (reproduced) | What changed | Evidence |
|---|---|---|---|---|
| UX-01 | **Fixed** (1 limitation) | Storage denied: 1,500 credits, crew podium and kit → **0 / none** after Career → free showroom → Continue Career. | Shared tab transfer (`career/transfer.ts`) now allowlists the showroom; a read-only career context (`career/context.ts`) lets the showroom and free drives see and hand back a temporary career, never creating, migrating or writing a save. Recovery "Play temporary career" keeps carried progress. | Credits, flags, ownership, revision **and a pending race entry** survive hub → showroom → free test drive → showroom → career. Fresh players: no career DB is created. Demo stays `play=demo`, real DB untouched. `before-07`, `after-07`. |
| UX-02 | **Fixed** | Career garage used its own lights, reflection rig, camera and UI; no Tour Wall. Matched cameras differed on **56–70 %** of pixels. | Player garage (`?scene=bay`) renders through the signature scene in career mode (`showroom/garage.ts`) with the existing Chapter 01 panel, workshop and shakedown card. Workbench bay kept as a developer tool (`?workbench=1` or its fixture params). | Matched views now **0.00** mean difference (identical renders). `before-02-*`, `after-01`. |
| UX-03 | **Fixed** | Garage orbit had no limits: camera reached **y = 1,584,851 m**, **3.5 × 10¹¹ m** sideways, and **y = −6.4 m** (black void under the floor). | One measured safe volume + ray-preserving containment + room-aware orbit limits (`presentation/showroom-camera.ts`), shared by both modes; the developer workbench is contained too. | Real mouse/wheel sweeps stay inside; `before-04-*`, `after-04`. |
| UX-04 | **Fixed** | Storage view + orbit up + zoom out → **y = 9.82 m** (walls are 4.2 m, no ceiling), matching the audit's arithmetic. | Vertical bound under the softbox (3.5 m) and walls, applied before and after every orbit update, during transitions and on resize. | Capped at 3.5 m inside; resize sweep 1920/1440/1280/1024/760 px; phone-size touch orbit + pinch. Unit test reproduces the 9.82 m counterexample and proves containment. `before-03`, `after-03`, `after-13`. |
| UX-05 | **Fixed** | Chapter 01 complete, 1,500 credits → **"Continue · Suspension shop"**. | `nextCareerStep()` in `career-experience/model.ts` is the single resolver for garage, hub and header: shakedown → duel → crew → next unfinished Chapter 02/03 event (saved entry and Cup first). Workshop labelled optional. | "Continue · Chapter 02" → hub **Next up: Open It Up**, no purchase. `before-05`, `after-05-*`. |
| UX-06 | **Fixed** | Previewed cyan kit → "Drive at night" launched a **scored career shakedown without the kit**. | Workshop now offers **Test this preview at night** (free, unscored, drives the displayed kit and colour, returns to the workshop) and a separately labelled **Night shakedown · earned build** (scored, owned parts only). | Drive: preview, career untouched, SM-133 cyan, Night look; back in the workshop with credits unchanged. `after-08-*`. |
| UX-07 | **Fixed** | No Career in the header; career-originated previews had no return path. | Shared header (`signature/header.ts`) on showroom, garage and hub; `from=career|bay` return context; hub chapter tabs. | Career reachable in one action from Build/Shop; Tab + Enter works; Return lands in the hub with credits unchanged. `after-06`. |
| UX-08 | **Fixed** | Done after the workshop snapped to the workshop framing instead of the prior view. | Workshop saves the full view (position, target, lens, safe-region offset, preset/manual) on open and restores it exactly on Done; fitting only on open. Deep-linked workshops open after the first framing. | Orbit → workshop → Inspect rear → Done: identical position/target/FOV/offset. |
| UX-09 | **Fixed** | Storage close-up pushed from 2.26 m to **3.00 m**; underglow Inspect mount = full vehicle. | Per-view distance limits; new low sill preset for the underglow strip. | Storage 2.2565 m kept; underglow view frames the lit strip. `after-10-*`. |
| UX-10 | **Fixed** | Ridge + Blue hour chosen, Build → Test → **Express**. | Scene-owned destination/lighting; Test button names them ("Smoky Ridge · Blue hour") with a Change link; waterfront time-of-day picker passes `look=` explicitly. | Launched `route=ridge&lighting=night`; Harbor + Night launched Harbor at night. `after-09`. |
| UX-11 | **Fixed** | "SlingMods home" button toggled Build/entry. | Brand = Home (always the opening screen). Back/Esc/controller B: leave an inspection first, then retrace one screen, then go up a level. | All four screens → entry; Esc from Shop → Build; Esc in storage inspection → Full vehicle. |
| UX-12 | **Fixed** | `?screen=shop` opened entry; URL stuck on `?screen=build`; browser Back left the page. | Small screen router: every screen has a URL, navigation pushes one entry, recipe edits only replace, popstate restores. | Deep link, Back ×2, Forward, reload all agree; build hash kept. |
| UX-13 | **Fixed** | `ownedProductIds` always `[]`. | Read-only ownership from the career context (durable, temporary or demo profile); preview toggles stay independent. | "Owned in your career" on the owned kit (panel and shop). |
| UX-14 | **Fixed** | Rear stayed pressed after returning to Build with the camera on Full vehicle. | Current view is scene state; pressed state renders from it; a manual orbit clears the pressed preset (view stays put, even on resize). | Pressed = rendered view; manual orbit → none pressed. |
| UX-15 | **Fixed** | 2026 car labelled "2024 Slingshot R · Radar Blue Fade". | Garage name plate derives model and finish ("2026 Slingshot R · Gloss black / red"); workbench labels derive from the shown vehicle; neutral fallback text in `index.html`. Saved vehicle IDs untouched. | Garage identity checked for a black/red career. |

### Audit follow-up risks (not promoted to findings)

- **Harbor/Express chase camera without an obstruction callback:** not changed, not reproduced (out of scope; driving untouched).
- **Old bay fixed 370-px layout offset:** superseded — the garage measures its panels for framing; 1440/1280/1100/760 px checked.
- **Performance, memory, audio continuity, loading/cancellation, full progression:** full 10-event career regression passed on the packaged build (below). Performance was *not* measured; the Phase 2 sustained-performance **HOLD still stands**. The garage now draws the same scene as the free showroom.
- **Deployed vs local:** verification ran on local dev and a local packaged build. The hosted game later received `5486206` via auto-push + Vercel (see top); the hosted build itself was not re-tested beyond reading its build identity.

## UI pass

Kept the existing P10B identity (tokens, Barlow display type, SlingMods red) and fixed inconsistencies rather than restyling:

- One header everywhere (showroom, garage, hub), with the return-to-career pill.
- Garage: shared camera rail (Full vehicle / Front / Rear / Interior / Tour Wall / Lights / Driver) and a centred build name plate; career panels restored to their intended width (they had silently depended on a retired global stylesheet); narrow layout clears the two-row header.
- Test button shows its destination and look; entry actions are two-line and aligned.
- Shop is a side sheet so the car stays visible, with product thumbnails, owned badges, part counts and a real empty state.
- Hub: shared header, chapter tabs, one Next-up action, button-style Chapter 01 call to action.
- Workshop: "Career workshop" (no longer shares the "Shop This Build" name with the real-products list); the two night actions are full-width with their consequences stated.

## Changed files

New: `src/career/transfer.ts`, `src/career/context.ts`, `src/presentation/showroom-camera.ts`, `src/showroom/garage.ts`, `src/showroom/garage.css`, `src/signature/header.ts`, `tests/ux-repair.test.ts`, `scripts/verify-ux-repair.mjs`.
Changed: `src/signature/scene.ts`, `src/signature/ui.ts`, `src/signature/ui.css`, `src/career/client.ts`, `src/career/chapter-ui.ts`, `src/career/build-ui.ts`, `src/career/build.css`, `src/career-experience/model.ts`, `src/career-experience/hub.ts`, `src/career-experience/hub.css`, `src/express.ts`, `src/main.ts`, `src/demo/profile.ts`, `src/workbench.ts`, `index.html`, `tests/p08b-ui.test.mjs` (its fake scene now stores the chosen destination, as the real scene does).
Untouched on purpose: physics/handling (Sport v5), routes, vehicle assets and bindings, products, reward/receipt certification, save schema, historical records.

## Verification performed

| Check | Result |
|---|---|
| `npm test` | **388 / 388** (380 existing + 8 new); new tests negative-controlled (breaking the ceiling or re-adding the shop detour makes them fail). |
| `npm run build` (typecheck + production bundle) | Pass. Bundle **+32,570 bytes (+0.7 %)** vs `5803a6b`; the 3.2 MB chunk is the pre-existing physics WebAssembly. |
| `scripts/verify-ux-repair.mjs`, dev server, isolated Chromium | **31 / 31**, 0 page/console errors. Real mouse drags + wheel, keyboard (Tab/Enter/Esc), virtual standard gamepad (D-pad/A/B in showroom and garage), phone-size touch orbit + pinch, resize sweep, storage-denied career, demo profile. |
| `scripts/verify-story-parity.mjs` on the **packaged** demo-mode build `5486206` | **PASS**: fresh career, 10 events with real physics and pedal/steering input, every reward saved once, 5 parts bought, garage revisit shows the same earned build, preview drives leave the career untouched, 0 errors / 0 failed requests. |
| Packaged visitor smoke (no test hooks, clicks only) | Pass: entry → build → destinations → shop → Home → Career → garage → workshop; seeded Chapter 01 → Continue → hub → Inspect → Return. 0 errors. |
| Matched views (same camera/viewport/quality/vehicle) | Garage vs showroom: before 56–70 % of pixels differ, after **0.00**. |
| Room measurement | Raycast of the shipped `signature-showroom-refined.glb` inner faces (walls ±5.91 m, back 6.78 m / cabinets 6.11 m, floor 0, 4.2 m walls with no ceiling, softbox 3.825 m, open front). |

All browser runs used fresh headless Chromium contexts with synthetic careers; the real saved career and personal browser profile were never opened.

## Limitations and what was not tested

- **Browser Back/Reload with storage blocked.** In-game navigation carries a temporary career everywhere (verified), but the browser's own Back or Reload buttons still reset it, as before this pass. Chromium records the tab name when a navigation starts and restores it per history entry (instrumented), so nothing written on the way out survives, and the hub was not restored from the back/forward cache. Keeping a per-history-entry copy was rejected: it would restore an *older* career when backing out of a race and could allow a finished race to be replayed for a second reward. Normal saved careers are unaffected.
- **Physical controllers** were not used; only a virtual standard gamepad. **Real touch devices** were not used; touch was emulated in Chromium.
- **Only Chromium** was exercised (Playwright, ANGLE/D3D11, RTX 4080). Firefox/Safari untested.
- **Performance** not measured; Phase 2 HOLD unchanged.
- Before-state garage matched images carry the retired bay's 370-px panel offset (its test hook did not clear it); the missing Tour Wall and lighting differences are visible regardless.
- The canvas-inspector skill was not used: the game has no `__THREE_GAME_DIAGNOSTICS__` hook; its own `__SIGNATURE` / `__CAREER_HUB` / `__EXPRESS` hooks were used instead (`__TWT` is kept as a compatible alias in the garage).

## Hand test (about 10 minutes)

Use a private window so your real career is not touched, or your normal browser if you are happy to play your own career.

1. Open the game. The header shows **BUILD · DESTINATIONS · SHOP THIS BUILD · CAREER**. Click **CAREER** → you land in the Chapter 01 garage in the *same* showroom (Tour Wall on the left wall; camera buttons at the bottom).
2. In the garage, drag the car up and scroll out as far as you can, then drag down hard. The camera should stop inside the room every time (no top-down view into an open box, no black screen).
3. Click **Front**, drag a little, open **Workshop**, click **Inspect rear**, then **Done**. You should be back exactly where you left the camera.
4. Click the SlingMods logo → the opening screen. Choose **Choose a drive** → **Smoky Ridge** → **Blue hour** → **BUILD**. The red button reads **TEST THIS BUILD** with **Smoky Ridge · Blue hour** underneath; clicking it goes to the Ridge at blue hour.
5. From Build, press **Esc** / browser Back: you retrace screens one at a time; the URL changes with each screen.
6. If you have a Chapter 01-complete career: **Continue** should say **Continue · Chapter 02** and take you to the hub's **Next up**. From the hub, **Inspect this build in free showroom** → header shows **← RETURN TO CAREER** and owned parts say **Owned in your career**.
7. In the workshop (without the underglow kit): **Preview kit**, pick a colour → **Test this preview at night** drives that kit, unscored, and **Back to career garage** returns with credits unchanged.

## Re-run the checks

```powershell
npm ci; npm test; npm run build
npx vite --port 5186 --host 127.0.0.1 --strictPort   # separate terminal
$env:BASE_URL='http://127.0.0.1:5186'; $env:EVIDENCE_DIR='.tools/ux-repair/after'; node scripts/verify-ux-repair.mjs
npm run demo:build; $env:PORT='5209'; npm run demo:preview   # separate terminal
$env:BASE_URL='http://127.0.0.1:5209'; $env:EVIDENCE_DIR='.tools/story-parity'; node scripts/verify-story-parity.mjs
```

Next: owner hand test of the garage, camera and Continue flow on the hosted game (already live) or locally; decide whether to keep or roll back the live deployment. Phase 3 remains blocked by the Phase 2 performance HOLD.
