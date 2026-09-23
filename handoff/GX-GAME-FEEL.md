# GX game-feel overhaul (2026-09-22/23)

Owner request: take the project over, make it truly feel like a video game, make the UI slicker and more fun than the
Gran-Turismo-style pass, generate assets where needed, and leave everything on `main` and pushed.

Everything here is presentation and meta-game. Sport v5 / Ryker physics, routes, race rules, reward certification,
career save schema (v4) and every historical record are unchanged. New local keys are listed at the end.

## What changed for the player

**Shell (every page)** — `src/game/shell.ts`, `shell.css`, inline boot in `index.html`
- No more unstyled HTML flash: an inline boot screen paints first; every same-origin page change wipes to a loading
  curtain (Navigation API) that hands off to the same look; scene loading veils show destination art and rotating tips.
- Button-prompt bar with keyboard or controller glyphs (switches with the last device used).
- Q/E (LB/RB) cycle any visible tab strip; quiet focus ticks when navigating with keys/pad.
- 17 original UI/HUD cues synthesized by `scripts/game-feel/synth-cues.py` (bank `public/assets/audio/game-cues-v1`).

**Front end** — `src/interface/entry.ts`, `src/game/menu.css`, `src/game/title.ts`, `src/signature/header.ts`
- Title screen ("press any key", once per tab session) over a slow turntable; the key press also unlocks sound.
- Main menu of raked tiles: Career (with chapter progress), Quick Race, Garage, Shop, Tour Log; ride card with stats.
- Game top bar: HOME / GARAGE / RACE / SHOP / CAREER tabs, Tour Rep level + credits card, Tour Log (trophy) and
  Options (gear) buttons.
- Garage, Race and Shop screens restyled (`src/game/screens.css`).

**Career** — `src/game/career.css`, `src/game/garage.css`
- Hub: art-backed event cards with NEXT / completed / locked states, reward chips, events meter, wallet, next-up hero.
- Chapter 01 garage panel is a mission ladder; workshop panel restyled; data-recovery panel restyled.

**Racing** — `src/game/race-fx.ts`, `src/game/race.css`
- Broadcast-style HUD; three-light start sequence; position gained/lost call-outs; checkpoint splits against your best
  (cosmetic local key); lap / final-lap banners; finish slam with flash.
- Results: ordinal with medal colour, staggered standings, top speed, animated credits + Tour Rep tally, level-up.
- Crew radio with portraits (grid, overtakes, final lap, finish); rival lineup on the ready screen; floating rival
  nameplates with gaps.

**Time Attack** — `src/game/time-attack.ts` (Race screen button, URL `?trial=1`)
- Solo validated standing-start lap, instant retry, no films, medal ladder HUD (SlingMods / Gold / Silver / Bronze).
- Medal targets come from the production AI lapping each course (`scripts/game-feel/ai-lap-times.ts`).
- Holographic ghost of your best run (single draw, fresnel additive), stored locally per course and ride.

**Quick Race difficulty** — `src/game/difficulty.ts`; `RivalController` gained an optional `paceScale` (default 1).
Easy 0.90 / Normal 1 / Hard 1.08, benchmarked headless (all rivals finish). Career events always use scale 1.

**Characters** — `src/game/crew.ts`, portraits in `public/assets/game-feel/crew` (sources + provenance in
`assets/game-feel/`). Portraits appear in radio, career invitations, Chapter 01 crew invite and race lineups.

**Meta** — `src/game/progress.ts` (Tour Rep, derived read-only from award receipts), `achievements.ts` (16 goals),
`toast.ts` (unlock toasts), `options.ts` (shared modal: OPTIONS and TOUR LOG).
- Options: audio mix (drives the existing mixer inputs), quality, Quick Race difficulty, camera motion, race films,
  title screen, full controls reference. Opens with the gear, O key, controller View, or race menus.
- Tour Log: achievements with progress, Time Attack records per course and ride, career and driving stats.

**Later additions (same pass)**
- Photo mode from the race pause menu (`src/game/photo-mode.ts`): free orbit, lens, PNG capture of the rendered frame.
- Pause menu Restart; WRONG WAY / OFF TRACK warnings; rival nameplates with gaps; top speed on results.
- Daily Run (`src/game/daily.ts`): one Time Attack course per day with a target medal and a streak; menu card, Race
  screen tag, two achievements.
- Career hub cards show your best place/time from the career's own records.
- Main menu: slow cinematic camera sway; Tour Log and Options tiles; phone-width header fixes.
- Sound stays on across pages once enabled in the tab (first key/click re-arms audio).
- Fixes from an independent code review (curtain fail-safe, observer cleanup, single gamepad loop, modal inert, etc.).
- Time Attack live delta to your ghost under the lap timer (time-at-distance on the course centreline).
- Garage stamps (INSTALLED / REMOVED / NEW FINISH / PRESET LOADED); PART UNLOCKED toast in the career hub.
- Options: speed units (MPH / KM/H). Title screen hands focus and prompts back to the menu. Hub prompt bar.
- Second independent review fixed: Esc out of photo mode no longer unpauses the race (drive input ignores keys while a
  GX modal is open), prompt restore, capture/listener cleanup.
- Production visitor flow re-verified on the demo build (no test hooks): title > menu > Options > Tour Log > Race >
  Hard rivals > Quick Race > drive > pause > photo mode > back > continue.
- End-to-end new-player run verified: Start Career > garage > shakedown briefing > lap > +800 CR, +950 Rep, level-up.

**Second batch (owner: "keep going, the big-picture stuff")**
- Instant replay (`src/game/replay.ts`): every run is recorded in memory; Watch replay on results; broadcast camera
  director (trackside TV posts, chase, helicopter, low tracking), scrub bar, skip, 0.5x/0.25x slow motion.
- Tour Series (`series.ts`, `series-run.ts`): three-race points championship Harbor > Express > Ridge from the Race
  screen; standings between races, champion screen, Series Champion achievement. Local only, never touches career.
- Crew ghosts: Jett's recorded laps (`public/assets/game-feel/ghosts`, `scripts/game-feel/record-crew-ghosts.ts`) as a
  Time Attack ghost option; new players race Jett by default.
- Story scenes (`scenes.ts`): multi-beat crew conversations before every career event and the Chapter 01 crew race.
- Career milestones (`milestones.ts`): Chapter 02/03 unlock cards and the Tour Complete finale with credits
  (dev preview: `?milestone=chapter-02|chapter-03|tour-complete`).
- Driving coach (`coach.ts`, `corner-profile.ts`): BRAKE cue before corners, first-drive hints; calibrated to AI speeds.
- Skill chains (`skills.ts`): drift / air / speed / near-miss points with multiplier; off in Time Attack.
- Share cards (`share.ts`), controller rumble (`rumble.ts`), Tour Log shows Jett's times.
- Texture detail (`texture-detail.ts`, `scripts/game-feel/ktx2-half.py`): Balanced tier uses half-resolution KTX2
  variants (top mip dropped, lower mips bit-identical); Ridge race textures 108 MB -> 34 MB. Auto on Low/Medium.
- Hosting: `vercel.json` now caches hashed bundles immutably and game assets for an hour (HTML stays no-cache).
- Three independent code reviews in total; every real finding was fixed.

**Third batch**
- Loading-screen key art (`src/game/loading-art.ts`, `public/assets/game-feel/loading`): nine original illustrations
  generated with Codex (one per course and light, plus the Slingshot and Ryker garages; provenance in
  `assets/game-feel/README.md`). Used by the drive and showroom loading veils, the page-change curtain (art for the
  destination) and the inline boot screen in `index.html` (same lookup, before any module loads).
- Attract mode (`src/game/attract.ts`): leave the title screen idle for 40 s and a demo Quick Race loads, with the
  production rival AI driving your ride, filmed live by the replay broadcast director, behind a PRESS ANY KEY card. It
  rotates through six course/light reels, returns to the title after the finish, and any key/click/pad button goes to
  the main menu. Demo runs never write stats, splits, skills or achievements (`attract-flag.ts` guard); reduced-motion
  players are never sent into it. Check quickly with `?title=1&idle=4`.
- Touch driving (`src/game/touch-drive.ts`): phones and tablets get a floating steering stick (left thumb), GAS and
  BRAKE pedals and CAM / RESET / pause buttons. The overlay publishes a virtual standard gamepad, so the unchanged input
  resolver drives it exactly like a controller (no physics or input-rule change). On automatically for coarse pointers,
  `?touch=1` forces it (mouse accepted), `?touch=0` disables it. Gauges move to bottom centre, phone-height HUD is
  compacted, coach hints show touch glyphs, portrait shows a turn-sideways hint. Verified with real multi-touch in a
  headless touch context (simultaneous gas + steer) at 1600x900 and 844x390.
- Challenges (`src/game/challenges.ts` judge + table, `challenge-run.ts` HUD/markers/result): nine medal tests, three
  per course (Sprint, Speed Trap just after a corner, Brake Test into a marked box). Race screen > course card >
  CHALLENGES. They run as a test drive with the car placed at the challenge line (`?mode=test&challenge=<id>`); the judge
  only reads telemetry. Targets are measured with `scripts/game-feel/challenge-targets.ts` (crew AI, Jett at 1.1-1.3x
  pace, AI steering at full throttle; best clean run = SlingMods) and `challenge-brake-limits.ts`. Results in
  `slingmods-gx-challenges-v1`; Tour Log records table; achievements Challenger and Top of the Class.
- Loading art v2: the owner found the first pass's vehicles inaccurate. All nine images were regenerated with real
  photographs of the actual Slingshot and Ryker attached as references and checked against them (see
  `assets/game-feel/README.md`).

## Developer notes
- `?title=1` forces the title screen (skipped automatically under WebDriver).
- `?autopilot=1` (only where evidence hooks are enabled, i.e. dev or `test=1&profile=1`) lets the production rival AI
  drive the player car. Used for unattended captures of full races, results and Time Attack.
- `.claude/launch.json` has `tour-dev` (vite) and `tour-demo` (serves the latest `npm run demo:build` on 5188).
- New public assets must be added to `demo-assets.json`; use `python scripts/game-feel/allowlist.py <dir>` (keeps the
  file's mixed line endings byte-for-byte).
- `main.ts` now logs the load error to the console before showing the recovery screen.

## Local storage keys added (all cosmetic / convenience, never part of the career save)
`slingmods-gx-title-seen` (session), `slingmods-gx-splits-v1`, `slingmods-gx-time-attack-v1`,
`slingmods-gx-difficulty`, `slingmods-gx-achievements-v1`, `slingmods-gx-stats-v1`, `slingmods-gx-daily-v1`, `slingmods-gx-units`,
`slingmods-gx-seen-unlocks`, `slingmods-gx-series`, `slingmods-gx-series-wins`, `slingmods-gx-ghost`,
`slingmods-gx-rumble`, `slingmods-gx-coach`, `slingmods-gx-skills-v1`, `slingmods-gx-skills-on`, `slingmods-gx-milestones-v1`,
`slingmods-gx-texture-detail`, `slingmods-gx-challenges-v1`; session only: `slingmods-gx-attract-i` (demo reel cursor).

## Verification
- `npm test` (444 pass, including `tests/game-feel.test.ts`), `npx tsc --noEmit`, `npm run demo:build`,
  `npm run deploy:build`.
- Visual checks by headless Chromium (`--use-angle=d3d11`) at 1280x720, 1600x900 and 1920x1080 of title, menu, all
  showroom screens, career hub (fresh and seeded), garage, workshop, race ready/countdown/running/pause/results, Time
  Attack with ghost, Options and Tour Log; the production demo build was exercised through menu > Race > Time Attack.
- Not verified: physical controllers, physical touch devices (touch is verified by emulated multi-touch only), non-Chromium browsers, human listening of the synthesized cues.
- The sustained performance gate remains HOLD (unchanged). The ghost adds one draw call in Time Attack only; rival
  nameplates are DOM overlays.
