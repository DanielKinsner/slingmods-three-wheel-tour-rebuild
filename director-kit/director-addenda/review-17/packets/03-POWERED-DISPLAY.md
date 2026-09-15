# 03 — The physical RIDE COMMAND display comes alive

## User request

Show the recognizable home/Driver screen on the vehicle's infotainment display when the vehicle is on. This is a cockpit/showroom visual feature, not an integration with a real Polaris account, radio, CarPlay, phone, live maps or firmware.

## Reference direction

Use the relevant2020–2024-generation Slingshot layout, not a later display or a generic glowing speedometer. The official guide's Driver section describes startup on customizable split-screen Driver views and ignition-dependent display power. Its Vehicle Statistics illustration shows a vehicle thumbnail/left information area, a narrower right widget area and a top status strip. Study the links in SOURCES. Independently author a game rendition using our vehicle art and drawn type/icons; do not ship the manual screenshot, copied firmware or a scraped map. The guide is reference-only and its illustrations are not included in this packet.

An exact owner's straight-on screen photo would help match their selected theme/widgets, but it is OPTIONAL. Do not block on a new photo request: produce a clearly documented, reference-based home/Driver approximation with existing research.

## In-world implementation

Identify the current screen surface/UV/material inside the latest accepted cabin mesh. Make a bounded screen material/geometry change without replacing the surrounding cockpit, steering wheel, seats or latest car export. No floating DOM window pretending to be the physical display; no z-fighting plane outside its bezel. Match aspect/orientation and fit within its actual visible opening. Use emissive screen color with controlled brightness, readable in cockpit/interior showroom views but not a white floodlight at night. Preserve bezel/reflections and plausible powered-off glass.

A small CanvasTexture/render-target or baked home layer with dynamic data is sufficient. Cache the thumbnail of the current game vehicle/build on relevant changes rather than rendering another full scene every frame. Share immutable resources across cars, avoid full-resolution animated displays for distant rivals and don't upload unchanged textures every render tick. Benchmark the chosen resolution/update rate on actual cockpit views; a512-wide starting point is a budget hypothesis, not a hard fit guarantee.

## State

Introduce or use a clear presentation ignition state. In showroom, make power on/off obvious through a compact labeled control; on state displays home, off state is dark glass. Entering an active drive powers it on. Muting sound, disabling the underglow or hiding the driver must NOT power off the screen. UI may show a short restrained startup reveal but should settle promptly; no long fake firmware boot or mandatory warning modal.

Home should resemble a vehicle overview with the actual rendered vehicle/selected finish. Functional values must come from game state. A small trip/speed/RPM/gear widget is allowed, but don't replace the reference home with the racing HUD. For unsimulated fuel/voltage/temperature/phone/GPS features use neutral/unavailable indications or explicitly presentation-only static decor—not fake live telemetry or false connected services. Do not add a battery/fuel simulation merely to populate a screenshot.

At standstill show the game's actual stationary/idle state. In motion, use authoritative speed/RPM/gear/selected units; no independent invented numbers. During the authored departure do not mistake presentation motion for physics; the home view can remain on without fake driving data. Verify reset, pause/resume, reverse, scene change, muted sound, reduced motion and saved build/finish changes. Keep useful text legible in night and day.

## Proof

Matched close-up powered-off/on, driver/cockpit view in motion with telemetry comparison, muted-on case, and a brief actual in-game reveal in the integrated review film. Distinguish original authored resemblance from exact OEM reproduction. No full RIDE COMMAND interaction suite is required.
