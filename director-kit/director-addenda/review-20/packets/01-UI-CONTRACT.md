# UI contract / P10B
All sizes below are proposed CSS-pixel starting targets for desktop, not measurements of the references or an accessibility certification. Match composition in the actual viewport; do not scale a fixed screenshot with `transform: scale()`.

## 1. Resolve the reference conflicts first
- **C01–C04 + W01:** the ambition for type, instrument graphics, restrained framing, composition and atmosphere.
- **U01–U03:** what existing game screen each control belongs to. Their larger black cards are not mandatory styling.
- **S01–S05 + current room:** the physical set to preserve.
- **Real state:** product facts, supported options, route distances, participants, lap counts, times, profile name and unlock status.

No eight-car race, factory paint label, extra vehicle, account system, fictitious coastal map or replay button merely because one appears in generated art. Future Spyder/Ryker are omitted from the active selector in this pass; do not tease empty clickable tabs. Retain 2024 Slingshot R identity and existing finish names.

## 2. Typography and common dimensions
Use a true condensed heavy display face for selected hero headings and race numerals, a quiet legible sans-serif for body/control text, and tabular numbers for changing metrics. Do not imitate a condensed font by squeezing an element horizontally.

Inspect existing font assets/licenses first. Barlow Condensed is a candidate visual direction, not a bundled font or verified project dependency. Acquire a licensed distributable webfont only through an approved free source, record its license and self-host the needed weights in the game. If unavailable, use the best existing legal face and disclose the limitation; do not take fonts from the assistant container or invent a font-loading PASS. Test the shipped font at cold start and on Linux-hosted build, not only your development computer.

At 1920×1080:
| Role | Starting size / treatment |
|---|---|
| Hero heading | 76–96 px, condensed 700/800, line height .94–1.02, at most 2–3 intentional lines |
| Product / destination title | 38–48 px, condensed bold, full official title available below |
| Body / control label | 16–18 px, line height 1.4–1.55 |
| Eyebrow / nav | 13–15 px, medium, .14–.20em tracking |
| Secondary metadata | 13–14 px; readable, not decorative dust |
| HUD speed / major position | 66–78 px, tabular bold; supporting denominator 26–32 px |
| HUD timer | 38–46 px tabular; format from real timing |
| Primary action | 50–56 px visual height, 16–18 px label |
| Slim row | 46–52 px visual height; quiet separators |
| Circular finish swatch | 38–44 px circle inside at least a 44 px hit area |
| Default margin | 40–48 px; reduce intelligently at 1280×720 |

Use an 8 px spacing rhythm with 4 px subdivisions. Four visual radii are enough: 3 px action, 6 px utility, 10 px inspector, circular swatch. Do not put every datum into a rounded rectangle. Use outlines for focus, not permanent thick frames.

Brand starting values: red `#C91820`, hover red `#E0232C`, ink `#F5F4F1`, muted `#B9BDC1`, charcoal `#111416`, elevated charcoal `#202529`. Thin separators use white at roughly 12–18% opacity. Use green only for a true successful/install state, with text/icon as well as color. Dim inactive controls enough to establish hierarchy, not enough to disappear.

The shared source seed is `reference-code/cinematic.tokens.css`. It is intentionally opt-in and unintegrated; fold the useful tokens into the project's real system, do not add another late cascade of global `!important` overrides.

## 3. Navigation and shell
Use the actual logo asset and THREE-WHEEL TOUR wordmark at left; **BUILD / DESTINATIONS / SHOP THIS BUILD** as the canonical navigation labels. These match implemented functions better than inventing a separate Products/account system. Top bar approximately 76–84 px tall with a modest dark gradient, not a heavy black header consuming the whole view. Active tab: white type, 2–3 px red underline. Inactive: muted, no button slabs.

One compact sound control, not simultaneous permanent Enable / Mute / Mix blocks. Before browser audio unlock, show Enable sound; after unlock, show state and a small mix-menu control. Preserve successful gesture handling, existing saved mix levels, mute state and a reachable full settings panel. Keep pause clear in a race without turning utility buttons into giant tiles.

## 4. Entry and garage overview — C01 + W01
Make the entry an actual product reveal using the live scene. Left editorial area is approximately 360–420 px; hero vehicle occupies the unobstructed center/right. One decisive heading, one useful sentence and one red primary CTA. Retain Build, Quick Race and Continue Career as the real paths. Subtitle can use **Your signature build.** or **Make it yours. Then make it move.**; choose one hierarchy, not both giant messages.

Compose a flattering three-quarter car view rather than simply enlarging the existing frontal camera. Keep tires/splitter in frame, avoid excessive wide-angle distortion, and reserve space for the cabinet wall or side mural as appropriate. Render the existing car, current finish and equipped parts. The background should not be a generic concept screenshot.

## 5. Active build / configurator — U03 structure, C01 styling
- Collapse the large overview headline when detailed building starts. Do not put a giant editorial title, huge right panel and huge bottom bar on screen simultaneously.
- Left: slim numbered category rail, roughly 210–250 px. Preserve **Paint, Lighting, Suspension, Exhaust, Aero, Storage, Build Presets**. Use small coherent icons where useful, label and subtle chevron. A selected row gets a narrow red marker/soft gradient, not a giant filled tile. Inactive rows stay mostly unboxed.
- Right: content-sized inspector, about 350–390 px at 1080p, at most roughly 25% width. It need not extend all the way down when content is short. Long suspension content scrolls inside a clear bounded panel; actions remain reachable.
- Center: keep the configured vehicle framed within the remaining area. An inspector change cannot mask the front wheel or resize/teleport the car into a corner. Camera fitting should use current safe bounds, not one hard-coded offset.
- Bottom: a slim 66–76 px action strip. Quiet preview/career context at left; compare/save/undo grouped rather than distributed into many equal buttons; **TEST THIS BUILD** as the one primary action at right. Keep destinations and shop reachable without duplicate primary actions.
- Camera: one compact Full / Front / Rear / Interior strip; a secondary View menu can hold Tour Wall, Studio/Lights, driver, ignition and motion settings. Do not lose actual features behind undocumented gestures.

Product hierarchy: small brand/part/fitment → strong short product heading → actual option and clear preview-installed status → relevant controls → inspect/shop/remove → expandable exact details. Keep the full official name and caveats, but they need not occupy the entire first viewport. Distinguish **Installed in preview** from **Owned in career**.

Finish swatches are circles with a visible selected ring and accessible names. Preserve all four existing combinations and material boundaries. Lighting colors remain the entire currently supported set, not only the four colors pictured in U03. Brightness and damping controls keep limits, keyboard operation and feedback. Suspension controls retain actual units/meaning. Do not invent a real price or horsepower benefit.

## 6. Destinations — U02 structure, C03 composition
Replace the equal-card grid with a destination rail and one dominant selected preview. Left column about 280–340 px; preview/data/actions occupy the rest. Heading approximately 64–80 px, never so large it forces all three destinations below the fold.

List **Original Harbor, Harbor Express, Smoky Ridge** with actual route-derived lengths and silhouettes. One selected row uses a red accent and gentle gradient. On selection, update the preview, title, course facts, controls and launch data together. Use a captured actual scene or lightweight view of the real route; no fabricated satellite map. Honor that the current scenic landscape is simpler than C03 without compromising UI quality.

Smoky Ridge keeps Late afternoon / Blue hour. Do not show unsupported lighting options on another route. Free Quick Race and Test Drive remain available independently of career unlocks. Keep the currently equipped recipe exact across the transition. Continue Career is secondary and does not masquerade as a free drive.

If using a camera/preview animation, keep it restrained and cancel stale asynchronous results when selection changes quickly. A nice still is preferable to a costly second live renderer. Do not start race preparation on every hover.

## 7. Race HUD — C02 graphic standard, U01 field placement
Use instrument graphics over the road, not an opaque tiled dashboard.
- Upper left: current position/field size and lap/total; large numerator, smaller denominator, red slash. Show only real participants.
- Upper center: small tracked route/event title between quiet rules; let it recede after start when appropriate.
- Upper right: actual lap/race timing with the right label; best time only when it exists and is comparable under the current profile/event key. Audio/pause controls compact and separate.
- Lower left: actual route polyline and live markers, an open or softly shaded circular map rather than a full card with repeated route facts. Preserve metric/world aspect ratio. Ridge's elevation is not an excuse to draw a different plan-view course.
- Lower right: curved or swept segmented tachometer, prominent speed, clear MPH label and gear R/N/number based on actual telemetry. Derive tach fill/redline from the driving model, not an arbitrary generated-art scale. Avoid false leading zeros that look like a diagnostic field unless intentional.
- Leaderboard: default to a compact nearest-rival or small standings presentation, not four huge permanent rectangles. Keep full standings reachable and preserve access to required race information.

The central road and vehicle remain clear. State changes do not cause the whole HUD to reflow every tick. Use SVG/DOM/components, update data without rebuilding all layout on every frame, and retain stable timed numeric widths. Pointer events only on actual controls; visible overlays should not steal steering input or block the road viewport. Pause/resume, race-ready, wrong-way, countdown, finish-wait and recovery must stay coherent.

## 8. Results and career — C04
Show actual final position, race/total time, valid best lap, standings/gaps and correctly issued reward. A loss/DNF/invalid result gets truthful text, not the generated FIRST PLACE headline. Keep already committed result/reward state independent of presentation animation.

Use a live existing-scene hero camera or a captured current equipped car for the result backdrop. No fabricated vehicle render or already-unlocked future track. Rendering a result backdrop must not resume a paused simulation, move the player through a gate, change the result, or create another expensive world unnecessarily.

Cinematic elements: large outlined placement numeral behind the hero (subtle); a strong condensed result title; quiet table rows; one main next action appropriate to the real state. Retry, Continue Tour/Career, return to build and required early-finish waiting behavior remain accessible. No Watch Replay button without a working replay feature.

Apply the shared hierarchy/components to the career hub, parts ownership/shop screens, settings and recovery. Preserve all current chapters and true unlock paths; do not create a new campaign as part of a visual screen rewrite.

## 9. Motion, state and responsive behavior
Use 120–180 ms selection feedback, roughly 220–320 ms screen reveals, and a controlled 0.6–1.0 s hero camera settle as starting proposals. Respect saved reduced motion and system preference. Pending transactions must disable duplicate actions without hiding why the UI is waiting. No perpetual pulsing, excessive slide/bounce, constant hover sound or UI motion during driving.

Test 1280×720, 1366×768, 1920×1080 and 2560×1440, plus a narrow layout smoke test. No clipping, invisible buttons or accidental canvas shrinkage; keep body copy readable. At narrow widths, use a real drawer/stacked layout rather than shrinking every label. Changing viewport must not erase build state. Visible focus, accessible labels, tab/controller navigation, escape/back behavior and native audio gesture unlock survive every redesigned screen.

**A beautiful static image is a reference. The deliverable is a beautiful functional state machine over the actual game.**
