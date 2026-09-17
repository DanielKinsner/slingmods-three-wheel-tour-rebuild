# MODEL03 — finished 2026 bindings

Authority: owner-supplied Finish Kit and direct main/push/Vercel authorization.
Baseline: `9e3f6ac4792333d19af8c8cdfd7b5fd6e138b2cc`. One lead; no new vehicle,
physics tune, review archive, film, benchmark campaign or spending.

## Implementation

- Authoring now exports explicit paint/accent/decal, headlamp, running/brake,
  brake-only, clear-cover, passive-reflector, interior, metal and rubber roles.
  Player finishes and rival colors touch only intended slots and decal pixels.
  Clear lenses/reflectors do not emit; center brake cells are off while cruising.
  Historical model adapters remain available.
- Original eight-triangle red needles move around their original cap centers.
  Native speed is marked MPH; RPM is marked x1000. The source face's upper
  100–220 numerals are irregular, so the speed mapping is piecewise against its
  literal marks. Original face, clear lens and UVs remain. There was no painted
  needle to erase. Digital MPH/gear uses actual VehicleTelemetry; no invented
  fuel or temperature. Ignition, mute, pause/reset and display disposal remain
  distinct. Central powered display stays.
- Native pedal inspection exposed feet stopping short. Optional 2026 two-bone
  leg targets reuse the existing driver rig without editing its shared source.
  Driver/steering/calipers, belts and suspension retain their current animation.
  The chassis input pulley now also turns during the existing departure.
- Storage seats/doors restore through build/shop/destination navigation, category,
  compare, removal and departure. Storage inspection hides an enabled driver so
  the bags can be seen. `stock_exhaust` is an empty compatibility anchor in this
  model. Assembled side/rear inspection found no duplicate visible stock rear
  exhaust. Only a real stock mesh group is hidden when the accessory is installed.
- Presentation context is 2026 R, selected visual and square hoops; save IDs
  remain `slingshot-r-2024`. Per-product researched retail support is separate
  from preview/ownership validation in showroom, shopping, copy summary and
  career. Base underglow, silver DDM set and lower bags are supported; NRG wing is
  conditional on factory square hoops. Thermal SM-7720 is experimental on 2026,
  separate from compatible shopping with its 2020–2024 reference label before
  outbound clicks. It retains ownership, geometry, previews and provided sound.
- `src/signature/fitment-seed.json` preserves the supplied September17 research.
  Its primary product tables and Thermal Q&A were checked in this pass. Consumer
  labels describe the exact option rather than copying implementation notes.
- Five current thumbnails were inspected: they show the products alone and remain
  applicable. No route thumbnail regeneration or UI rebuild was needed.

## Sources and limits

All 81 supplied source files remain byte-identical (targeted hash regression).
Packed editable `assets/blender/model02/slingshot-2026.blend`, runtime GLB,
`driver-attachment.json`, build notes and `scripts/build-model02.py` agree.
Josh tread UV reuse, mirrored-front winding, corrected rear covers/atlas/light
curves, standalone pulley, and original source shell are retained.

This is an R Manual configurator reconstruction with the existing automatic game
console adaptation, not verified OEM AutoDrive CAD. The upper speed dial artwork
is intrinsically irregular. Product mounts are visual estimates, not measured
mechanical fit certification; no 2026-compatible Thermal replacement is claimed.
Steering/input, contacts, physics, Sport v4 and race/save schemas are unchanged.

## Validation

43 targeted tests pass: MODEL02 source hashes/winding/rig/tread regression,
MODEL03 native pivots/calibration/power/pause/reverse and pedal targets,
semantic finish/optics isolation, retail/save separation, actual-vs-empty stock
exhaust, product restoration, career ownership and recipe/departure regressions.
Assembled front, side, rear, cockpit, pedal and normal-travel inspection completed.
Final production build, gameplay smoke and hosted identity verification pending.
