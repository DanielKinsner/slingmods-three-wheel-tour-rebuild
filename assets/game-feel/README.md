# Game-feel assets

Original assets created for the GX game front end (September 2026).

## Crew portraits (`portraits-src/*.png` → `public/assets/game-feel/crew/*.jpg`)

Rae, Maya, Jett and Nico are fictional characters from the game's own story. Their portraits were generated with the
image-generation tool in the owner's Codex CLI (owner-authorized), using one shared art direction so the set is
consistent: semi-realistic racing-game character-select painting, head and shoulders, dark charcoal studio background
with a single light streak in each character's livery colour (Rae red, Maya teal #57bab7, Jett crimson, Nico gold
#e9b454). Maya, Jett and Nico were generated with Rae's portrait as the style reference.

Runtime copies are 512×512 JPEGs:

    ffmpeg -i assets/game-feel/portraits-src/rae.png -vf "scale=512:512:flags=lanczos" -q:v 3 public/assets/game-feel/crew/rae.jpg

They are illustrations of fictional characters, not photographs or likenesses of real people.

## UI and HUD cues (`public/assets/audio/game-cues-v1`)

Synthesized from scratch by `scripts/game-feel/synth-cues.py` (numpy/scipy, seeded and deterministic). Rerun the script
to regenerate identical files and the bank manifest.

## Time Attack medal targets

`scripts/game-feel/ai-lap-times.ts` runs the production rival AI around each course, alone, in the real physics world.
The measured standing-lap times ground the medal table in `src/game/time-attack.ts`.
