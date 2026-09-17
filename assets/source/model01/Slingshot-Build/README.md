# Slingshot — assembled 3D model

Reconstructed from the supplied `Slingshot 3D Model.rar`.

## Open it

- **Slingshot.blend** — editable Blender project, packed textures, separate vehicle and studio collections, camera and lighting.
- **Slingshot.glb** — vehicle only, with embedded textures and PBR materials. Load using Three.js GLTFLoader or import into Blender.
- **Slingshot-Preview.png / Slingshot-Rear.png** — actual renders of the assembled model.
- **source/** — original OBJ geometry and recovered Unity Avatar rest pose.
- **textures/** — recovered original textures and derived red/graphite color textures.
- **build_slingshot.py** — reproducible assembly and export script, tested with Blender 4.0.2. Run `blender -b --python build_slingshot.py` from any directory.

## Reconstruction

17 vehicle mesh objects; 61,792 triangles; approximately 1.98 m wide × 3.82 m long × 1.34 m tall. Original mesh topology and supplied custom normals are retained. The legacy OBJ V coordinate is flipped back to match the recovered texture images. Wheel translations and front steering pivots are recovered from the original Unity Avatar, accounting for the OBJ coordinate conversion. The vehicle is centered longitudinally and lowered to the original shadow-plane height. The original rest pose leaves the rear tire approximately 2 cm below that plane; suspension/contact height should be reconciled with the game's wheel physics.

The archive's legacy Unity shaders are replaced with modern PBR approximations: red coated paint, graphite body trim, machined wheels, rubber with its original normal map, textured interior, suspension, transparent glazing, and decals. Material slot assignments are reconstructed by mesh groups and appearance; they are not an exact recreation of the missing original scene. Additional rear-body, body-detail, and suspension textures were recovered from the binary assets.

The helper cube and baked shadow plane are excluded from the vehicle. Studio floor/lights/camera appear only in the Blender project, not the GLB.

## Game integration

GLB: meters, +Y up, +Z forward. Blender: +Z up, -Y forward. Vehicle root: `Slingshot`.

- `Steering_LF` and `Steering_RF`: rotate local Y in the GLB to steer. Each contains its front wheel and brake.
- `Slingshot_WheelLF`, `Slingshot_WheelRF`, `Slingshot_WheelRear`: rotate local X to spin.
- Wheel node origins lie on their axle lines; the rear axle origin retains its original lateral offset.
- `Paint | SlingMods Red` is the main body paint material. Paint color is baked into `Paint-Red.png`; changing only the material multiplier cannot turn it into arbitrary lighter colors. Use the supplied neutral `Slingshot_BodyAO.png` for a recolorable paint implementation.

This is an assembled visual asset. Game physics, collision proxies, LODs, and application integration are not included or tested. Keep the existing game and its handling intact when importing; adapt its vehicle render attachment and wheel mapping to this model.
