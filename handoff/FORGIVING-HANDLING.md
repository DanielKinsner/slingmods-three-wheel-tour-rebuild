# Forgiving stock handling — Sport v4

## Diagnosis and scope
The current fresh player entry was Sport v3, stock products, no optional suspension override; the street shock setup maps to stock damping. A saved build/session/URL recipe can retain v1–v3 and an equipped shock setup can override damping/ride height. No game tab was open in Dan's connected browser, so his personal active save could not be confirmed; it was not read or rewritten.

Short clean-asphalt keyboard holds/corrections/brake-turns did not reproduce a v3 rollover. They do expose combined rear drive/brake/cornering demand and lateral roll leverage. Road-edge rigid impacts are a different path: the existing high-speed 18 cm curb scenario reproduces a >5 m launch and overturn in v3. V4 deliberately still overturns in this severe case. The ordinary one-wheel 13 cm contact stays upright with small travel/pitch in both; do not claim every curb launch is fixed or a measured reduction in rollover frequency.

## One versioned stock tuning change
- Keep v3 steering lock, rate, response, speed envelope, engine power and finite tire friction.
- Progressively reserve up to 35% of rear traction-control drive demand as tire slip builds. Combined longitudinal/lateral forces remain inside each tire's friction circle.
- Preserve 1g total requested pedal braking, with normalized front/rear load weights of 1.2/0.8 to retain rear cornering reserve.
- Game-only lateral force application 18 cm above contact reduces rollover leverage; longitudinal tire forces stay at contact so road-following/braking pitch remains physical.
- Grounded yaw/roll support torques each capped at 650 Nm, requiring two loaded contacts; fade with tipping and turn off in the air. No pose/rotation locks, direct velocity writes or infinite grip.
- Cap each suspension channel including bump-stop kick at three static wheel weights. Physical chassis and guard collisions remain enabled.

All apply to stock and equipped vehicles in v4. No purchase required. Historical equations, records, builds, in-progress events and Cups remain versioned. A prominent **Use forgiving driving** button in Build creates a v4 draft and preserves the original named or unsaved recipe. Save that copy normally. New events use v4; an already prepared historical event keeps its version.

## Focused verification
- Existing suite: 268 passed initially; one historical test accidentally followed CURRENT instead of its named v3 contract. Pinned that test to v3. All 26 focused handling/save tests then passed, including two new checks for stock/street equivalence, <40 m 60 mph stop, ramp pitch, suspension travel and severe impact behavior.
- `npx tsx scripts/smoke-forgiving-handling.ts`: actual keyboard InputResolver through 60 Hz Rapier, held turn, 300 ms corrections, turn/brake, minor one-wheel curb, hard barrier. All upright, finite bounded tire forces, recoverable slip, full stops. Peak ordinary turn/correction roll reduced 35–41% versus v3 (2.28→1.48°, 0.91→0.59°, brake-turn 2.64→1.55°). These are body-roll measurements, not human fun approval or rollover-frequency statistics.
- One local `npm run deploy:build`: TypeScript, curated Vite output and existing allowlisted deployment stage passed. Final small historical-profile selector fix is checked by TypeScript and the hosted build.
- `node scripts/smoke-forgiving-browser.mjs`: isolated browser, native RAF and real W/A/D/S key events; stock v4 entry, v3-to-v4 visible save-preserving action, quick opposing corrections and braking while turning passed. Reached 19.6 m/s, stayed upright, stopped. No browser errors. Initial harness runs were corrected for same-document hash navigation and page focus; no game thresholds were relaxed.

Production uses the existing main-linked Vercel project: https://slingmods-three-wheel-tour-rebuild.vercel.app/ . No ZIP, film or benchmark matrix.
