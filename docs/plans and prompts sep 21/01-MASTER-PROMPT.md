# MASTER PROMPT — Three-Wheel Tour: "Make it feel fast, look expensive, play fun"

Paste this whole file to the implementing model. It was written against `main` @ 3e986f5 (2026-09-21, "Add live mirror reflections and responsive highway steering").

---

## Who this is for and what it is

This is the owner's private pet project. It is NOT going on slingmods.com. Its job is to make two people who know these vehicles cold (the owners of SlingMods) say "damn, what else can he do for us." Three-wheelers exist in no other racing game. That is the whole angle. Everything below serves two goals: **it must feel great to drive for 90 seconds, and any frozen frame must look like a product.**

## House rules (do not break these)

- Work on `main`, one lead, no subagents, no review ZIPs, no films, no benchmark matrix, no spending, no new accounts.
- Preserve: all saves and their keys/schemas, Sport v4 and v5 handling profiles and historical profiles, the 2026 model and the owner's front/rear/pulley corrections, the five products and their fitment facts, all routes (harbor, express, ridge), the mural/tour wall, the career flow.
- Every new gameplay system gets a settings toggle or a mode flag so existing time-trial records and career results stay comparable. New arcade mechanics must NOT change the physics constants of the existing validated events unless the event opts in.
- Keep `prefers-reduced-motion` / the in-game reduced-motion setting honored by every new camera, transition and screen effect.
- Ship in the phases below, in order. Each phase ends with: typecheck, tests, one production build, a short driving smoke, and a 5-line note in `handoff/`. Do not start a phase until the previous one runs at a stable frame rate on the owner's machine (RTX 4080, 1440p). There is an existing performance HOLD (some races exceeded the max-frame limit); treat frame time as a feature.
- When something below conflicts with what you find in the code, trust the code, tell the owner in one sentence, and continue.

---

## PHASE 0 — Showroom wiring fixes (small, do first)

A read-only review of `src/signature/*` found the showroom logic sound (recipe validation, draft/undo/compare, departure restore path, BFCache reload, storage fallbacks all wired correctly). These are the real issues:

1. **The UI cannot animate, by construction.** `SignatureUI.render()` rebuilds the whole tree with a single `innerHTML` assignment whenever `JSON.stringify(state)` changes, and `ui.css`, `departure.css` and `hub.css` contain zero `transition`, `animation` or `@keyframes` rules. Every change destroys and recreates every element, so nothing can ease, slide or fade. This is why the UI "doesn't feel great." Fix in Phase 3 (below) by splitting the UI into persistent regions that are patched, not replaced.
2. **Live mirrors are expensive every frame.** `VehicleMirrors` `onBeforeRender` does a full `scene.traverse`, allocates a `Map` and new `clippingPlanes` arrays for every material, twice per frame (once per mirror), plus two extra 768×512 scene renders. Cache the material list once (invalidate on product/finish change), reuse arrays, and skip mirror rendering entirely when the mirror's screen-space size is under ~40 px or the camera is not near/cockpit view. In the showroom, render mirrors only in `interior`/`cockpit` views.
3. **Possible TDZ crash during loading.** `keyboard` is declared with `const` after the long awaited loading section, but `action()` and `restoreDeparture()` reference it. If any UI action fires while the veil is up, `keyboard.clear()` throws a ReferenceError, and the `catch` path calls `restoreDeparture`, which throws again, uncaught. Declare `keyboard` before constructing `SignatureUI`, or make the UI inert until `veil.remove()`.
4. `undo` plays no audio cue (every other build action does). Add `ui.back` or a dedicated cue.
5. Pixel ratio is set once; `resize()` never re-reads `devicePixelRatio` (moving the window between monitors leaves it soft or oversharp).
6. **SlingMods logos are too large for the wooden signs they sit on.** Find the sign meshes/decals (likely authored in the Blender scenery sources and baked into the GLB). Fit the logo to the sign face with ~12% padding on all sides, preserve aspect, center it, and make it read as painted/printed ON the wood (multiply over the wood grain, slight roughness variation) rather than a floating sticker. Fix in source and re-export; do not patch with a runtime scale hack unless the source is unavailable.

---

## PHASE 1 — Sense of speed (biggest win per hour; mostly camera + set dressing)

Today a frame at 105 mph reads like 30. Fix that before anything else.

- **Speed-reactive chase camera:** FOV eases from ~55° at rest to ~78° at top speed; camera drops lower and trails further under throttle, tucks in under braking, yaws slightly into corners (look-ahead toward the velocity vector, not the car's nose), rolls 1–2° with lateral g. Spring-damped, never snapping. Cockpit cam gets subtle head-bob and g-force lean.
- **Near-field parallax:** the straights are empty. Dress the road edge within 2–6 m of the driving line with instanced, cheap geometry: light poles at regular spacing (the rhythm sells speed), armco/jersey barriers, chain-link fence runs, sponsor banners, cones, parked trailers, distance boards before corners (150/100/50). Instanced meshes, 3 LODs, no new draw-call explosion.
- **Road surface scale:** the asphalt aggregate is scaled far too large (pebbles read like golf balls, which makes the car look like a toy and the road look slow). Re-tile to real-world scale (aggregate 5–15 mm), add a detail-normal layer, and add longitudinal features that streak under the car: lane paint with wear, expansion seams, tar snakes, tire-rubber darkening on the racing line, patches.
- **Screen-space speed cues (all scale with speed, all off under reduced-motion):** radial blur/vignette at frame edges above ~70 mph, 0.5–1.5 px camera shake above ~90, stronger shake on rumble strips and curbs, faint wind streaks at very high speed.
- **Audio carries half of speed:** wind noise and road roar should rise hard with speed; add doppler pass-bys for poles/banners at the road edge and for rivals.

## PHASE 2 — Look expensive (rendering)

There is currently **no post-processing pipeline at all**. Add one (pmndrs `postprocessing` or three's `EffectComposer`), with a quality setting (Low/Medium/High/Ultra) and dynamic resolution scaling to hold frame time.

- **Bloom** (threshold high, only emissives and speculars bloom): headlights, tail lamps, underglow, sodium lights, sun glints on water.
- **Time of day is the cheapest beauty upgrade.** Flat noon is the least flattering light there is. Add presets per route: Golden Hour, Dusk (sodium lights on, sky still lit), Night, and "After Rain" variants. Make Dusk / After Rain the default for showcase routes.
- **Wet road:** lower roughness + puddle mask (noise + vertex paint in dips), planar or SSR reflections on High/Ultra, cheap env-map fake on Medium. Underglow reflecting on wet asphalt is the signature shot of this entire game. Make it obscene.
- **Water that looks like water:** replace the current harbor water shader with: two scrolling normal maps at different scales, Fresnel reflectance of the sky/env, depth-based color (shallow turquoise → deep blue-green) and shoreline foam from depth, sun specular glitter, gentle vertex swell. Boats bob. At night it reflects harbor lights as long vertical streaks.
- **Woods / ridge route fidelity:** tree trunks with real bark PBR, alpha-tested leaf cards with translucency (backlit leaves glow at golden hour), 3 LODs + billboard imposters in the distance, wind sway in the vertex shader, ground cover (ferns, grass clumps, fallen branches, rocks) instanced near the road, leaf litter and dirt blending at the road shoulder, god-rays/volumetric light shafts through the canopy (cheap screen-space version), light fog in the hollows, dappled shadow on the road. At night: headlights catch trunks and reflective markers, eyes-off darkness between.
- **The car touches the world:** tire smoke on slides and launches, dust/leaf kick-up off-line, water spray on wet, brake-disc glow at night under hard braking, exhaust heat shimmer and pops of flame on lift (with the exhaust product fitted), headlight cones with slight volumetric fog, sparks on barrier contact, skid marks that persist for the session.
- **Contact and grounding:** SSAO/GTAO or baked contact shadows so the car never floats; soft shadow cascades tuned for the chase cam.
- **Texture pass everywhere:** every large flat-colored surface (lawns, building faces, barriers, curbs, garage floor and walls) gets a real PBR set with correct texel density and a detail layer. No surface should be a solid color.
- **Benchmark visuals:** the benchmark/test scenes must use the same post stack and quality presets as gameplay so their frames represent the shipped look. Report avg/1%-low frame time per preset.

## PHASE 3 — UI and cinematic transitions

- **Rebuild the showroom UI as persistent regions** (header, left rail, inspector, footer bar, toasts). Patch text/attributes; never blow away the tree. Then add motion: panels slide+fade 180–240 ms with a shared easing token, list items stagger 20 ms, selected state animates, numbers tick, product thumbnails crossfade. One motion token file, honored by reduced-motion.
- **Design language:** the current boxes are clean but generic. Take the HUD and menu language from the Slingshot's own instrument cluster and the SlingMods brand: condensed uppercase type, thin red rule accents, angled chamfered corners echoing the body lines, a subtle carbon/brushed texture in panels, glassy blur behind overlays. HUD elements should feel like they belong to THIS machine: a tach arc, gear big, speed secondary, shift light.
- **Cinematic transitions (each skippable, each ≤ 4 s, none blocking input longer than 1.5 s):**
  - Boot: logo sting → camera already moving through the dark bay → lights bank on in sequence → hero pose.
  - Category change in Build: camera glides to the part (already exists) PLUS a depth-of-field rack focus onto the part and a brief highlight sweep across it.
  - Part install: part flies in from off-frame on a short arc, seats with a mechanical click, a small spark/flash at the mount, underglow pulses once.
  - Garage → drive: keep the bay-door departure; add letterbox bars, engine start, door light spill, cut on the launch to the route's establishing shot.
  - Pre-race: 3 quick trackside establishing shots (drone sweep, low road-level pass-by of the grid, rival close-ups with names) → over-the-shoulder → countdown lights.
  - Finish: slow-mo across the line, freeze, position slam, then replay rolls behind the results.
  - Loading: never a static veil; show the car on a turntable silhouette with a progress rule and rotating tips.
- **Replay and photo mode:** trackside replay cameras (low, long-lens, some handheld shake) auto-cut; photo mode with orbit, FOV, DoF, time-of-day, underglow color, hide HUD, export PNG. This is the clip and the still the owner will actually show people.

## PHASE 4 — Fun systems

- **E-brake drift → boost (Mario-Kart-style, tuned for a three-wheeler).** New input: handbrake (Space / controller face button). Holding it with steering breaks the single rear tire loose into a controllable slide. A drift charges through three tiers by time × slip angle (sparks change color per tier: white → orange → SlingMods red; underglow, if fitted, pulses the tier color). Exiting the slide CLEAN (no wall, no spin, car pointed within ~12° of the road direction at release) pays out a short boost scaled by tier (0.6 / 1.0 / 1.6 s), with FOV kick, exhaust flame, and a rising audio whoosh. Hitting anything forfeits the charge. This is an **Arcade handling layer**: on by default in Quick Race and the new events, OFF in existing time trials and validated career events so records stay honest.
- **SlingMods Points pickups.** Floating brand-colored tokens placed along the racing line AND along risky alternates (inside of a curb, outside line near a wall, through a gap between barriers). Values 10/25/50; rare 100s in genuinely hard spots. Chains: collecting within 2 s of the last builds a multiplier (x2…x5) that drops on contact or off-track. Points convert to career credits at race end and feed a per-route high score. Visible on the minimap. Satisfying pickup: chime that rises in pitch with the chain, small haptic, particle burst.
- **Passing on a two-lane road must stop being annoying.** Keep real collisions, fix the situation:
  - Rival awareness: each AI tracks cars alongside/behind. If the player has overlap, the AI holds its lane and does not turn in on them. Blue-flag logic for lapped/slower rivals: they move off-line on straights.
  - Rivals pick lines with variety (some defend inside, some run wide) so a gap actually opens; they make occasional small, human mistakes under pressure (brake a touch early, run a little wide) scaled by a per-rival temperament.
  - **Slipstream:** tuck in behind a rival for >1 s to get a visible draft (streak lines, wind drops, small speed gain) that slingshots you past. Yes, the pun is the feature.
  - **Rubbing is racing:** glancing side contact at small angles gets damped lateral impulse and a scrape spark/sound instead of a spin. Big hits and wall hits stay fully physical.
  - Widen key overtaking zones slightly (braking areas before the two slowest corners) and add a run-off option rather than a wall where a failed pass currently ends the race.
  - Rubber-band lightly so the player is always in a fight: leaders ease ~3% when far ahead, tail pushes ~3% when far behind. Cap it; never visible.
- **More "one more run" hooks:**
  - Ghost of your personal best + sector splits flashing green/red.
  - Near-miss bonus for passing close at speed; clean-lap bonus; perfect-launch bonus on the countdown.
  - Speed traps and drift zones with their own leaderboards per route.
  - **Gymkhana / donut mode on the practice pad:** cones, boxes, a score attack for drift angle, donuts around a pole, figure-8s. Three-wheelers are absurdly good at this and nothing else in gaming has it.
  - Rival personalities with a line of text/voice before and after races (Rae invites, Maya blocks, Jett brakes late and overcooks it, Nico is smooth and slow to anger). Rivalry meter per rival.
  - Daily seeded challenge (one route, one condition, one build restriction).
  - Horn. People love a horn.
- **Make products felt, not listed.** Each product gets one moment where the player feels its absence before owning it: exhaust = sound + lift-off pops + boost flame; shocks = a bumpy mid-corner section that unsettles the stock car; underglow = night events, drift-tier color, wet-road reflections; wing = visual + high-speed stability cue in the arcade layer only; bags = a delivery/time-attack event where unsecured cargo costs time.

## PHASE 5 — New vehicles (after 1–4 feel right)

The owner intends to buy high-end Can-Am Ryker and Spyder models. Prepare for them: factor anything Slingshot-specific out of the vehicle/handling/product layers behind a `VehicleDefinition` (mass, track, wheelbase, CG height, drive wheel, steering ratio, tire model params, camera anchors, product mount points, engine audio set). Each platform must drive like itself: Ryker light and tail-happy, Spyder heavy, planted and hard to upset, Slingshot wide and low with a lively single rear. Rivals then run mixed platforms.

---

## Guidelines for whoever works on this next

1. Feel beats features. If a change does not make the next 90 seconds of driving more fun or the next screenshot better, it waits.
2. Every visual feature ships with a quality tier and a measured frame cost. Nothing lands that breaks the frame budget on High.
3. Juice every interaction: a sound, a motion, and a light response for every meaningful player action.
4. Arcade layers are opt-in per event; simulation truth and saved records are never silently changed.
5. Assets: real-world scale, PBR, consistent texel density (≥ 512 px/m near the road, ≥ 256 px/m mid-ground), 3 LODs for anything instanced, glTF/GLB with KTX2/Basis textures and Draco/meshopt where it helps load time.
6. Fix assets at the source (Blender) and re-export; no runtime patches over bad source unless the source is gone.
7. Leave the repo simpler than you found it. The historical handoff ceremony is not required for this work: one short note per phase.
