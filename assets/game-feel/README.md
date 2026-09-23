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

## Loading-screen key art (`loading-src/*.png` → `public/assets/game-feel/loading/*.jpg`)

One illustration per course and light (Harbor day/night, Express day/dusk-rain/night-rain, Ridge golden hour/blue
hour) plus the garage for each ride. Generated with the image-generation tool in the owner's Codex CLI
(owner-authorized) by `loading-src/gen.sh`, one job per line of `loading-src/jobs.tsv` (name, reference, scene). Course
jobs attached the game's own capture of that course (`public/assets/p10b/previews/<ref>`) so the art reads as the same
place; the garages had no reference. Shared direction: cinematic racing-game key art, a Slingshot-style roadster in the
default radar-blue/orange finish, left third kept dark for the loading text, no text or logos.

Runtime copies are the native-size PNGs as JPEG (`ffmpeg -i X.png -q:v 4 X.jpg`, about 200-270 KB each). They are
original illustrations, not photographs; the vehicles are stylised and imply no OEM endorsement. Lookup and wiring:
`src/game/loading-art.ts` (drive and showroom veils, page-change curtain) and the inline boot script in `index.html`.

## UI and HUD cues (`public/assets/audio/game-cues-v1`)

Synthesized from scratch by `scripts/game-feel/synth-cues.py` (numpy/scipy, seeded and deterministic). Rerun the script
to regenerate identical files and the bank manifest.

## Time Attack medal targets

`scripts/game-feel/ai-lap-times.ts` runs the production rival AI around each course, alone, in the real physics world.
The measured standing-lap times ground the medal table in `src/game/time-attack.ts`.
