#!/bin/bash
IFS=$'\t' read -r name ref scene <<< "$1"
VEH="a Polaris Slingshot style three-wheel open roadster (two wheels at the front, one fat rear wheel, low wedge body, twin roll hoops) in radar blue with orange accents"
[[ "$name" == "garage-ryker" ]] && VEH="the Ryker described in the scene"
REFTXT=""; ARGS=()
if [[ "$ref" != "-" ]]; then ref="../../../public/assets/p10b/previews/$ref"; REFTXT="The attached image is an in-game capture of this exact course: match its road layout, barriers, buildings and palms so the art reads as the same place, but render it as polished key art."; ARGS=(-i "$ref"); fi
PROMPT="Use your image generation tool to create ONE landscape image and save it in the current directory as ${name}.png (at least 1600x900, 16:9). It is the loading-screen key art for a racing video game called SlingMods Three-Wheel Tour. Scene: ${scene}. Hero vehicle: ${VEH}, driving toward the camera or three-quarter front view, slightly right of centre, with motion and energy. Style: premium cinematic racing-game key art like Forza Horizon / Gran Turismo loading screens, semi-realistic digital painting, dramatic lighting, rich contrast, shallow atmospheric depth. Keep the LEFT THIRD of the frame darker and calmer (loading text is overlaid there). No text, no logos, no watermarks, no UI. ${REFTXT} After saving, reply only with the filename."
printf "%s" "$PROMPT" | timeout 1200 codex exec --skip-git-repo-check --sandbox workspace-write "${ARGS[@]}" > "${name}.log" 2>&1
echo "$name done $(ls -la ${name}.png 2>/dev/null | awk '{print $5}')"
