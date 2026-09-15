# 03 — The SlingMods YouTube set, elevated

## The room has an identity already

Use all five reference JPEGs in references/showroom. Their whole frames are retained.
These are reduced copies of Dan's photographs, not rendered concept art and not
runtime textures. The original filename/hash mapping accompanies them.

Retain these visible relationships:
- A central light logo wall above the wood-toned bench and lower storage.
- Dark tall cabinet towers left and right, with overhead cabinets bridging the bay.
- Long bright metal handles and believable cabinet seams, depth and proportions.
- Wire-grid product display walls flanking the cabinet composition, populated with
  recognizable accessory silhouettes; do not merely put a random tool wallpaper on.
- Gray/charcoal checker floor, fine physical tile texture and a red perimeter band.
- The left-side lift as a supporting feature, not the visual center of the room.

Infer unshown walls/ceiling conservatively. These photos are not a surveyed floor
plan: record approximate design dimensions without inventing measurement claims.
Reuse suitable existing cabinet/material/prop work, but rebuild the composition and
missing defining elements. The deliverable is editable Blender construction and the
actual game runtime, not a photo on a plane or an image-generated background.

## Light for the vehicle, not just the architecture

The default is a flattering product-shoot treatment: broad neutral key reflections,
soft fill revealing black tire/underbody/interior shapes, controlled edge light and
readable contact shadows. Keep glossy dark paint distinguishable from an empty hole.
The logo wall is an anchor; surrounding product grids read as a real store/set.

Use actual game lighting/reflection methods appropriate to the current renderer.
A static, source-tracked studio environment/probe and well-positioned broad lights
are acceptable; do not claim a baked probe is a live mirror of newly selected parts.
Any expensive reflection/AO treatment must improve measured runtime views before it
is rolled out. No blanket engine migration, path-tracing requirement or WebGPU
migration is authorized. Keep browser-first compatibility and the existing stack.

Provide **Studio** and **Lights** modes. Studio is neutral enough to inspect all four
finishes. Lights dims the room but keeps the car, controls and product readable;
underglow and nearby spill should feel installed, not a bloom sticker. Going back to
Studio must restore the exact previous lighting state without changing the build.
Avoid white clipping on paint, crushed black structures and a floor covered in
mirror-like reflections unrelated to the reference tile material.

Checker scale, tile normals and camera sampling must not produce distracting moire.
Use appropriate distance detail/LOD and mipmapping rather than rendering every floor
slat geometrically. Preserve some natural roughness and clean neutral highlights;
this is an elevated workshop, not a neon nightclub or sterile black void.

## Presentation and interaction

Choose one strong three-quarter hero view similar in intent to the supplied photos,
not a steep technical top-down view. Useful orbit/zoom limits should reveal the
assembled car without passing through it, cabinets or the floor. Account for the
actual UI panel area when framing, including an installed rear wing. Give front,
rear, interior and selected-mount shortcuts. Honor reduced-motion preferences.

Vehicle first, controls second, room third: keep the 3D model dominant without
cutting off the selected accessory. The room must look composed with UI hidden too.
Accessory wall props can reuse modeled catalog pieces at a sensible display density.
Do not make unsupported Spyder/Ryker placeholder vehicles look selectable. A static
supporting lift silhouette is optional, not a new vehicle-production requirement.

## Deliverable proof

Capture matched reference-intent views showing the whole cabinet wall, floor red
band, side display grids and left lift. Also capture the default customer entry,
black/red paint under Studio light, white finish and a night-light accessory build.
Provide before/after comparisons at actual viewport sizes. Local visual review must
name the room features recovered, not just count new polygons or lights.

Lazy-load race world assets separately. Do not bring the whole waterfront kit back
into the garage to use one bench. Publish asset/load metrics for the new showroom
and check repeated UI/light/product swaps do not leak resources. Preserve source,
export settings, maps, licences and a reproducible build in the Git handoff.
