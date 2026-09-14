# Technical references and authority boundaries

Accessed 14 September 2026. Primary documentation below informs implementation options. The shipped pinned versions and their installed typings/source are authoritative for actual call signatures; current documentation is not permission to migrate dependencies.

1. Three.js WebGLRenderer: https://threejs.org/docs/pages/WebGLRenderer.html
   `compile`/`compileAsync` require scene lighting/environment preparation; `initTexture` prepares first use. `info` is draw/resource/program statistics, not GPU timing. Supports the preparation approach, not the submitted numerical benchmark by itself.
2. Rapier JavaScript rigid bodies: https://rapier.rs/docs/user_guides/javascript/rigid_bodies/
   World-created dynamic bodies receive forces/contact response; mass/dominance/CCD settings matter. Supports choosing equal dynamic bodies for racing rather than kinematic opponents.
3. Rapier JavaScript getting started: https://rapier.rs/docs/user_guides/javascript/getting_started_js/
   Shows world-owned bodies and a world simulation step. The P05 all-vehicle force/one-world-step arrangement is our proposed architecture, not copied sample code.
4. Rapier scene queries: https://rapier.rs/docs/user_guides/javascript/scene_queries/
   Queries consider colliders in the world and support filtering. Verify installed 0.20.0 overloads before excluding vehicle/sensor support hits; do not copy a version-mismatched positional call.
5. Rapier collision groups: https://rapier.rs/docs/user_guides/javascript/collider_collision_groups/
   Distinguish collision response filtering from suspension query filtering. The visual car/driver is not a dynamic triangle-mesh physics collider.

Project evidence is primary for project-specific claims: Review09 raw performance JSON, source, manifests, original test logs and our separately executed subset. No current product price, new fitment claim, new real performance promise or external service availability is asserted by this packet. Retain the existing verified catalog reference and deliberate outbound URL; no live storefront write is authorized.
