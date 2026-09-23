#!/bin/bash
# Race-select course maps (owner request 2026-09-23: "a generated image of the map in the style of the second
# reference image"). One job per line of jobs.tsv:  name<TAB>course capture (public/assets/p10b/previews/)<TAB>place
# Attaches: the owner's style reference, the course's real outline (outline-<name>.png, drawn from the game's own
# centreline by outline-png.mjs) and the in-game capture of that course. Run from this folder:
#   ./gen.sh "$(sed -n 1p jobs.tsv)"
# CODEX may point at a newer CLI (e.g. the one bundled with the Codex desktop app) if the PATH one is too old.
IFS=$'\t' read -r name ref place <<< "$1"
IMGS=(-i style-reference.webp -i "outline-${name}.png" -i "../../../public/assets/p10b/previews/$ref")
PROMPT="Use your image generation tool to create ONE landscape image, 3:2 (1536x1024), and save it in the current directory as map-${name}.png. It is the course-select map for a racing video game.
STYLE: match the FIRST attached image (the style reference): a photorealistic, cinematic aerial view looking down at roughly 45 degrees, golden-hour sunlight from the right, rich teal water, warm highlights, soft atmospheric haze, high detail. The painted route is a glowing bright red line (#ff3b2f) with a soft red glow, drawn ON the roads.
PLACE: ${place}. The LAST attached image is an in-game capture of this course: keep its character (road surface, barriers, buildings, vegetation).
ROUTE SHAPE (most important): the SECOND attached image is the real layout of this course. The red route in your image must follow exactly that closed-loop shape and proportions, in the same orientation and in the same position inside the frame (inside the dashed box, which you must NOT draw). The black dot is the start/finish line: put a small checkered flag pin there. The whole loop must be visible and continuous, on real roads.
COMPOSITION: the right third of the frame is scenery only (a menu panel covers it) and the bottom quarter should be calmer and slightly darker (a title is overlaid there). No text, no labels, no numbers, no logos, no compass, no UI, no watermark, no vehicles large enough to read.
After saving, reply only with the filename."
printf "%s" "$PROMPT" | timeout 1500 "${CODEX:-codex}" exec --skip-git-repo-check --sandbox workspace-write "${IMGS[@]}" > "map-${name}.log" 2>&1
echo "$name done $(ls -la map-${name}.png 2>/dev/null | awk '{print $5}')"
