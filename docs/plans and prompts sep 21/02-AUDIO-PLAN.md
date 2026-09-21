# AUDIO PLAN — Three-Wheel Tour

What exists today: a synthetic engine built from 6 samples (1200/3600/6200 rpm, load + lift), road, wind, shift, and ~12 showroom UI/part cues. No music, no ambience, no voices, no impact/skid library. Audio is half of "feels fast" and most of "feels expensive."

Key: use a PERSONAL ElevenLabs key for this, not the SlingMods work account (that one is already over its quota). Everything below is generated once, saved as files in the repo, and never called at runtime, so the cost is a one-time batch.

## 1. Sound effects (ElevenLabs Sound Effects, text → SFX; generate 3–4 takes each, keep the best)
Driving
- Tire skid/squeal: light chirp, sustained slide loop, heavy lock-up, single-fat-rear-tire burnout loop
- Drift tier charge: three rising electrical/whine layers (tier 1/2/3) + tier-up "click"
- Boost: ignition whoosh, sustained jet-rush loop, tail-off
- Exhaust extras (when the exhaust product is fitted): lift-off crackles ×6, flame pop ×3, cold-start bark
- Gear whine layer, turbo-ish intake hiss layer (subtle), brake squeal
- Surface loops: smooth asphalt roar, coarse asphalt, wet road hiss + spray, rumble strip (left/right), gravel shoulder, dirt, leaf litter
- Wind: low-speed buffeting, high-speed roar, open-cockpit flutter
Contact
- Scrape along armco (loop), jersey-barrier thud (light/medium/heavy), car-to-car rub, car-to-car hit, cone hit, fence rattle, spark sizzle
World
- Pass-by whooshes for poles/banners/parked objects (short, dopplered in-engine): 6 variants
- Harbor ambience loop (gulls, halyards clinking on masts, water lapping, distant port); ridge/woods ambience (wind in leaves, birds by day, crickets + owl by night); night city hum; rain ambience
- Crowd: start cheer, finish cheer, idle murmur; PA-system garble
- Bay: roller door (exists: keep), air-tool zip, ratchet, torque-wrench click, part-seat clunk ×5, compressor hum, fluorescent buzz + light bank "clunk-clunk-clunk" for the boot sequence
Game feel
- Points pickup: a 8-note rising chime set (chain pitch ladder), multiplier-up stinger, multiplier-lost thud
- Countdown: three low beeps + high GO, false-start buzz
- Sector split: green blip, red blip, purple (best ever) shimmer
- Position gained / lost ticks, near-miss whoosh, slipstream wind-drop + pressure swell, photo-mode shutter, replay tape-style whoosh, horn ×3 (stock, air-horn, novelty)
- UI: hover tick, select, back, tab change, panel slide, error, purchase/unlock, save (match the existing cue family so old and new sit together)

## 2. Music (ElevenLabs Music, or Suno since you already live there)
- Showroom: slow, confident, minimal electronic, 90–100 bpm, loopable 2:00, plus a stripped "inspect" stem
- Race day: driving synthwave/electro-rock, 125–140 bpm, 3 tracks, each delivered as intro / loop / final-lap intensity layer / finish sting
- Night/dusk routes: darker, bassier variant; ridge route: more organic guitars
- Results: win sting (4 s), podium loop, loss sting
- Rule: duck music −6 dB under engine above 4k rpm; final-lap layer fades in automatically
- Honest note: your ear is better than mine here; you may want to write these yourself. The game deserves a Dan track.

## 3. Voices (ElevenLabs TTS, 4 distinct voices, 12–20 short lines each)
- Rae (crew chief / inviter): warm, dry. Invites, pre-race brief, radio calls: "Car behind, inside." "Clean lap. Do it again." "That's P1. Bring it home."
- Maya: competitive, clipped. Jett: cocky, late-braker. Nico: calm, amused.
- Line types per rival: intro, taunt when ahead, reaction when passed, reaction to contact, win, loss, rematch.
- Spotter radio gets a band-pass + light distortion in-engine, with a squelch click in/out.

## 4. Implementation notes for the coding model
- Buses: engine / tires+surface / world / impacts / UI / music / voice, each with its own gain; master limiter; existing mute/volume/pause rules apply to all.
- Everything loops seamlessly (zero-crossing trimmed), mono for 3D-positioned sources, stereo for ambience/music, 48 kHz, OGG Vorbis q5 for shipping with WAV masters kept out of the bundle.
- Loudness: normalize SFX by category (UI −20 LUFS-ish, impacts peak −3 dBFS, ambience −28), then mix by ear in-game.
- Randomize pitch ±4% and pick from variants so nothing machine-guns.
- Doppler and distance roll-off for rivals and pass-bys; low-pass the world slightly in cockpit cam.

## 5. Order
1) tires/skid + surfaces + wind (speed), 2) impacts/scrapes (passing), 3) drift/boost/points (new mechanics), 4) ambience, 5) UI refresh + boot sequence, 6) music, 7) voices.
