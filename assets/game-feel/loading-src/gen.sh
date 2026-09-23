#!/bin/bash
# Loading-screen key art, v2 (owner: vehicles must match the real machines). One job per line of jobs.tsv:
#   name<TAB>course capture (public/assets/p10b/previews/, or -)<TAB>scene
# Every job attaches real photographs of the actual vehicles from the SlingMods shop (director-kit review-20 set
# references) and asks for a faithful photographic match. Run from this folder:  ./gen.sh "$(sed -n 1p jobs.tsv)"
IFS=$'\t' read -r name ref scene <<< "$1"
KIT=../../../director-kit/director-addenda/review-20/references/03-wall-and-set
if [[ "$name" == garage-ryker ]]; then
 IMGS=(-i "$KIT/S02-set-ryker.jpg")
 VEH="the real Can-Am Ryker in the attached photograph (two wheels at the FRONT under separate front fenders, ONE wheel at the rear, rider seat and handlebars, matte black bodywork with carbon headlight cowl). Reproduce its exact body panels, headlights, fenders, wheels and proportions"
else
 IMGS=(-i "$KIT/S05-set-three-quarter.jpg" -i "$KIT/S01-set-red-slingshot.jpg")
 VEH="the real Polaris Slingshot in the attached photographs: use the FIRST photo (gloss blue and black Slingshot) for colour and livery, the second for extra detail of the same body. Reproduce its exact body: two front wheels under wing-like front fenders with the slim headlights and amber markers, the long pointed hood with the 'V' nose, low tinted wind deflector, two black bucket seats side by side, two black roll hoops behind the seats, black multi-spoke wheels, and ONE wide rear wheel on a swingarm. Correct real-world proportions"
fi
REFTXT="";POSE="Place the vehicle right of centre, three-quarter front view, driving toward the camera, with a helmeted driver where a driver is visible."
[[ "$name" == garage* ]] && POSE="Place the vehicle right of centre, parked, three-quarter front view, no rider."
if [[ "$ref" != "-" ]]; then IMGS+=(-i "../../../public/assets/p10b/previews/$ref"); REFTXT="The LAST attached image is an in-game capture of this course: match its road, barriers, buildings and scenery so it reads as the same place."; fi
PROMPT="Use your image generation tool to create ONE landscape image and save it in the current directory as ${name}.png (at least 1600x900, 16:9). It is the loading-screen key art for a racing video game. Scene: ${scene}. The vehicle is ${VEH}. ACCURACY IS THE TOP PRIORITY: the vehicle must look exactly like the real production vehicle in the photographs, as if photographed in real life. Do not redesign, stylise, exaggerate or add parts that are not in the photos; no invented vents, no exposed coloured springs, no extra wheels, no concept-car shapes. Style: photorealistic automotive photography / high-end racing game key art, natural lighting, realistic reflections and motion blur. ${POSE} Keep the LEFT THIRD of the frame darker and calmer (loading text is overlaid there). No text, no logos, no badges readable, no watermarks, no UI. ${REFTXT} After saving, reply only with the filename."
printf "%s" "$PROMPT" | timeout 1500 codex exec --skip-git-repo-check --sandbox workspace-write "${IMGS[@]}" > "${name}.log" 2>&1
echo "$name done $(ls -la ${name}.png 2>/dev/null | awk '{print $5}')"
