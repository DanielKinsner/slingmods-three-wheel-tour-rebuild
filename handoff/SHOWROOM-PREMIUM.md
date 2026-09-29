# Showroom premium finish (2026-09-28)

Owner request: make the showroom look higher end; it is where players spend the most time and it felt inconsistent
with the rest of the game. The owner chose to **keep the room recreated from their shop photos** (checker floor, red
perimeter, four-post lift, roller bay door, pale walls, cabinets) and give it a premium finish, rather than replace it.
No geometry in the owner-referenced GLB was edited; everything below is runtime presentation in the showroom only.

## What changed

- **Lighting** (`src/signature/scene.ts`, `src/signature/studio-look.ts`). Key, fill and rim were directional lights,
  which lit walls, cabinets and floor as strongly as the vehicle, so the room read flat. They are now soft-edged spots
  aimed at the vehicle; each look value is the illuminance the spot delivers at the vehicle (the old directional
  intensity), so the vehicle stays lit while the room outside the cones falls off. Hemisphere/fill are lower in the
  studio looks. The Lights (lights-down) look keeps its own values.
- **Ceiling and light frame** (`src/presentation/showroom-premium.ts`). The room had no ceiling: the softbox panels
  floated in the open top. A matte graphite ceiling closes the room; a linear LED light frame (with two inner lines)
  replaces the softbox panels in the same footprint over the vehicle, and four downlights pool light on it.
- **Epoxy floor coat.** A clear coat on the owner's checker tile: slight wet-look darkening, a little more gloss, and
  a planar reflection of the vehicle and light frame. It reuses the race's `WetReflection` pass (the surface type was
  widened, race behaviour unchanged) and follows the same tier rule: planar reflection on High/Ultra only. The coat
  chains onto the shared surface-finish shader hook instead of replacing it.
- **Lift ramps and hardware.** The raised lift's access ramps rendered as bright white floating planks (smooth 85%
  metal catching the key light). Brushed hardware now has a satin galvanized finish.
- **Backlit brand sign.** Both SlingMods wall signs glow as lightboxes driven by their own artwork.
- **Consistent UI edge.** Showroom screens get a top/bottom cinematic scrim, so the header and vehicle tabs never sit
  directly on bright scenery (the wall art read as a UI glitch behind the Shop tabs).
- **Phone layout fix (pre-existing).** On phones the vehicle tabs sat on the wrapped navigation row on every screen
  except Home, and the Shop panel then covered them. Tabs now sit below the navigation on every screen and the Shop
  panel lines up with the Garage panel (`src/game/menu.css`, `src/game/screens.css`).

## Validation

- `npm test`: 548 passed (new `tests/showroom-premium.test.ts`: softboxes hidden/restored, coat chains the surface
  hook and touches only the floor, backlit sign, lights-down look, full restore on dispose). `tsc` and
  `npm run deploy:build` pass.
- Visual checks on every showroom screen and vehicle, the front/rear/side/interior/Tour Wall/route-relief presets,
  lights-down mode and phone portrait, with zero page errors. Before/after images: `showroom-premium-evidence/`.
- Uncapped frame time at 2560x1440, production builds on the owner's RTX 4080, two runs each:
  High 2.3 ms before vs 3.1-3.4 ms after; Medium 2.2 vs 2.6-2.7 ms. Well inside a 60 fps budget; this is a quick
  comparison, not a sustained performance qualification.

## Not done / next options

- The owner-referenced props (lift, pegboard, cabinets, bay door) are unchanged in geometry. A Blender pass could
  lower the lift or add a turntable plinth, but that changes the photo-referenced room and should be the owner's call.
