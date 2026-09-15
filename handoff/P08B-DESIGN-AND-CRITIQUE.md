# P08B integration decisions and critique

## Customer loop

The default entry is the new SlingMods showroom. A new user can configure all five products without credits, save named recipes, compare stock, inspect mounting, select a route and drive. The established Harbor time trial, Maya duel and First Night crew chapter remain earned-career content. Express and Original Harbor quick races use an immutable preview recipe and award no career credits. Free test drive has no finish requirement.

`src/signature/catalog.ts` is the product/option/fitment/slot registry. Only the researched base RGB kit, silver DDM shocks, included brushed-silver Sport exhaust inserts, black aluminum 59-inch Swan Neck wing and lower organizer pair are supported. Three presets are explicitly game builds, not retail bundles. External links are individual deliberate actions. Exhaust audio is an original game treatment; exhaust/wing/bags add no invented physical performance gains.

Named recipes, session drafts, preview drive snapshots, preview sound settings, prepared demo state and earned career data have separate storage keys/contracts. Validated URL fragments preserve a temporary preview across navigation when storage is denied; fragments stay off server requests and retail links. Changes synchronize the fragment so reload cannot resurrect an older returned build. Missing/future recipes fail validation; purchased parts survive removal in the established career database.

## Driving and world

`slingmods-sport-v1` explicitly selects the new game tune. `legacy-p08a` stays the default simulation reference for existing regression tests. Four complete 4,200-tick traces match historical P08A SHA-256 values exactly. Sport changes bounded engine torque, shift interruption, speed-sensitive steering, tire response, brake demand and camera response. There is no yaw injection, route lock or invisible repositioning. DDM street setup uses the same damping baseline; adjusted clicks change documented estimated damping independently, with a bounded modeled ride-height offset.

The high-speed braking investigation retained its failures. Maximum demand initially triggered asymmetric guard contact and yaw; reducing only Sport brake demand and adding bounded brake relief under steering produced a stable 110 mph stop within the 200 m planned braking section. This is a stopping-distance/stability tradeoff, not an OEM braking claim. Controllers plan braking using the actual profile; tighter Original Harbor uses a more conservative corner target than Express. A seeded contact excursion recovered physically and remains reported.

Express is a distinct 2,317 m route with an 800 m acceleration straight, waterfront sweepers and service-road return. The road, collision rails and checkpoints consume the same layout. The original Harbor route, checkpoint IDs and collision source bytes are retained. The first Express proof exposed downward triangle winding; upward normals and nearer warehouse/dock/palm composition repaired the visible bare-ground failure.

## Art and UI critique

Three new editable Blender sources retain the original car identity and reference layout. The targeted defect map covers rotor thickness, lug end caps, rocker winding, compartment access and hoop material. All 704 original source objects remain. Finish masks affect painted regions; seats, tires, glass, lamps and logos remain separate. Storage inspection explicitly opens doors and hides seats, then restores them. The room's rear aisle was extended to keep ordinary orbit cameras inside its walls. Dimensions and product mounts remain measured/reference-informed approximations, not CAD.

UI review repaired low entry contrast, horizontal body overflow, selected-category hover contrast, cropped product thumbnails, excessive panel transparency, small legacy workshop typography and keyboard focus escaping to sibling audio controls. The actual UI was checked at 1280×720, 1920×1080 and 2560×1440. Product panels, controls, maps, results, recovery and pause help share the same red/graphite styling. Motion controls honor reduced-motion preference and can disable showroom damping.

The independent source review found temporary-storage navigation loss, stale fragment restoration, missing Change Event transport, a dead motion setting, focus-loss audio resumption and a race/audio focus-trap boundary. Those were repaired with focused storage/navigation, audio lifecycle and focus tests. The initial career integration incorrectly treated profile metadata as a custom event and suppressed certification; profile-only metadata now retains certification while explicit preview events stay uncertified.

## Verification interpretation

Controlled-clock browser runs prove input, simulation, rewards and persistence behavior, not frame rate. Native wall-clock runs use the actual production input bridge and physical rivals with a disclosed automated player. Their result placing is retained. Recording runs are separate from scored performance and use the live game WebAudio mix, with recorded chirps and visible flashes for measured synchronization. Source, failures and raw measurements accompany the lean director return.

The final receipt supplies exact build identity and results. G3/G4, human assessment of driving fun and listening, physical-controller hardware, global OEM fidelity and release approval remain separate. This work grants no public hosting or main-branch merge.
