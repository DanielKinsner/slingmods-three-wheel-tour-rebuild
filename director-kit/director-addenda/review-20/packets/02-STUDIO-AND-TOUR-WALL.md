# Studio and Tour Wall / P10B

## 1. Room decision — not optional
Dan clarified twice that the artwork belongs on **one of the two current blank white walls**. The cabinet/workbench/logo wall is not either of those alternatives. Survey the loaded room and corresponding Blender source, identify both blank surfaces, their world coordinates/normals, the moving bay door, lift and camera path. Choose the blank wall that provides the better three-quarter hero view without obstructing the exit or requiring rearrangement. Record the chosen mesh/name, approximate dimensions and placement in `WALL-PLACEMENT.json` with a before/after room view.

Preserve the existing envelope and set identity: dark cabinet towers with vertical bright handles, central logo above the wood-toned worktop, product-grid racks, left lift, vented checker-tile floor, red boundary, actual door/aperture and departure path. Do not add a new wing to the building, rotate the set to fake compliance, replace the floor with glossy marble, or cover the animated curtain with a static mural.

The game source currently describes the room dimensions as inferred. Do not restate them as surveyed dimensions of the real set.

## 2. Chosen design — The SlingMods Tour Wall
One wide matte-graphite panoramic panel, with charcoal/steel monochrome artwork moving from open coast into wooded ridge roads. One slender red route motif connects the composition. Keep it sophisticated and relatively quiet, with tonal depth rather than a dense collage of logos.

Separate, precisely authored main lettering:
**BUILT TO BE YOURS.**

A single smaller line is permitted:
**Coast to ridge. Build to drive.**

No additional random motivational labels from the generated concept. No faux factory credentials, unlicensed logos, real-world navigation claims, or large duplicated SlingMods logos competing with the actual set logo.

Finish the feature as a physical printed/art panel or directly mounted mural on the selected existing wall. A shallow metal surround and dimensional lettering are preferred to an emissive video screen. Keep a modest wall margin and a base trim. Letter depth and panel offset must be scaled from the actual scene and should be subtle, not giant floating blocks. A top wash and a soft rear edge glow give it presence. A restrained illuminated red route is optional; the whole photograph must not emit light.

The generated `art/GENERATED-TOUR-WALL-DEMONSTRATION.png` shows the desired quality of composition and lighting. It does NOT define the room floorplan or a ready-to-use rectangular texture. Do not map that full perspective showroom, car, UI, plants, couches, already-lit text or glossy floor onto a wall.

## 3. Produce actual editable art assets
Create a front-on panoramic artwork plate at approximately 3:1, adjusting to the chosen wall's measured game aspect ratio without stretching a road. Suggested master 6144×2048, runtime 3072×1024 or a measured appropriate tier. These are proposals; do not upscale a tiny blurry crop and call it new detail.

Keep the image text-free. Author the slogan as real 3D lettering or a crisp separately maintained vector layer; build the red road motif independently where useful. This makes spelling, scale and lighting controllable. Provide the original plate, a runtime derivative, separate text/route sources, packed Blender scene or mesh/decal source, repeatable export script and asset manifest.

No additional user artwork is required to begin. Use the existing generated demonstration as the look reference, with one of these practical construction routes:
- Available authorized image-generation tooling may create a clean text-free plate using `art/WALL-TEXTURE-BRIEF.txt`, only within already permitted no-spend limits.
- Otherwise author the coast-to-ridge art in Blender/compositing from existing owned route assets and retained licensed textures. Use a deliberately composed graphic/photo-like mural, not a screenshot of a race with HUD.

Do not make image-generator access an excuse to stop all implementation, and do not silently obtain paid credits. All new sources need provenance; inherited supplied art is for this game only as authorized. The packet itself includes a demonstration, not a newly generated flat print plate.

## 4. Lighting — light the actual car, not just the wall
Create three coherent, saved showroom looks: **Studio** (default flattering inspection), **Tour Wall** (alternate camera/presentation view using the same lighting family), and the existing **Lights** mode (dimmer accessory inspection). A view name may select framing without inventing another simulation scene.

The existing source uses a broad environment, hemisphere plus directional key/fill/rim and disables room mesh shadow casting. Inspect these mechanisms before tuning. Large exposure shifts or a stronger rim alone are not sufficient. Aim for:
- a broad neutral key that describes hood and fender shapes with long smooth highlights;
- softer controlled fill so black trim, tires, grille and seats remain distinct;
- a restrained edge highlight without washing the body into white plastic;
- contact/occlusion under cabinets, around the lift, under the car and at wall joints;
- warm wall/ceiling practicals with believable soft influence, while paint colors remain legible and neutral enough to compare.

Use existing WebGL rendering and an authored reflection environment/light-card arrangement. Prefer baked static indirect/occlusion where appropriate, with dynamic vehicle/accessory light response kept live. If environment probes are updated, keep expensive work out of the frame loop and avoid baking a specific car/finish into a room reflection that persists after configuration changes. Provide a stable fallback for weaker devices.

Keep effects scoped to the showroom. Do not raise shadows, add full-scene transmission or introduce expensive postprocessing across all race scenes as a side effect of an art pass. The measured budget decides whether optional reflection/post effects remain enabled; matching a generated wet floor is not a requirement.

## 5. Materials and finish correctness
Retain existing paint masks/atlas details, all four finish identities, black trim/seat/rubber separation and working material ownership. The source's `SignatureFinishPresenter` changes material roughness on finish changes; modifying a loaded material once is not sufficient if this presenter overwrites it later.

Gloss paint may use a bounded clearcoat treatment and purposeful environment highlights, while satin graphite must remain visibly more diffuse. Brushed hardware, painted cabinets, tire rubber, seat fabric and glass must not share the same shiny-black response. Do not make dielectric paint solid metal merely for more reflection. Correct color-vs-data texture handling before artistic compensation. The official renderer references in `SOURCES.md` describe the mechanisms, not a guaranteed appearance.

Keep the checker/vented tile character. Give it real scale, restrained roughness detail and readable light pools; retain red borders. It is not a mirror. Replace no vehicle geometry solely to imitate the generated car: approved front/lenses/grille/hoops/rear and mounting nodes survive. Report exposed mesh problems precisely; only minimal isolated shading-normal repairs proven not to alter mounting behavior fit this pass.

## 6. Camera composition and proof
Primary entry: flattering three-quarter angle, roughly 35–45 degree perspective starting range, whole car including wheels/splitter visible, headroom balanced, expected feature centered within the open canvas area. Match framing to UI safe area, not to full canvas while ignoring an inspector overlay. Fit equipped wing/exhaust/bags as part of the real bounds.

Keep a familiar cabinet-wall view and add a second Tour Wall view. Orbit must genuinely reveal both walls, prove that the cabinet wall remains, and avoid clipping through walls/lift. Moving to an inspection camera or returning from a drive must restore correct view state. Door opening, thermal clip synchronization, vehicle movement, driver appearance and skip/pause remain the existing behavior.

Deliver matched before/after views for blue/orange and black/red, plus all-four-finish proof, Studio/Lights views, room overview locating the mural, and an orbit/departure showing it is a real room asset. Do not submit a generated illustration as the implementation proof.
