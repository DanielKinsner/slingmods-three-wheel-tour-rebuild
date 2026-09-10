# 01 · Game design and creative direction

**Working title:** SlingMods: Three-Wheel Tour  
**Tagline:** Built to Be Yours.  
**Experience:** An owner-focused, story-led racing game in which your vehicle becomes more personal, better understood, and more capable through racing and fitting real products.

Everything labeled a target or proposal in this document is a design decision, not a statement that the current game already implements it.

## The central promise

Pick a Slingshot, Spyder, or Ryker. Enter a traveling three-wheel invitational, earn credits and reputation, make meaningful changes in a premium workshop, and feel or see those changes on the next race. A player should remember their machine, a rival, and a corner—not a wall of upgrade icons.

The first minute: a restrained camera move through a dark, clean workshop; daylight enters through a raised service door; your vehicle is already the center of attention. Select Drive and the camera settles behind it in the paddock. Within a few seconds, you accelerate, hear load build, feel the first braking zone, and see the front suspension work. No obligatory account, shop pop-up, or long introductory monologue.

## Platform and positioning

Choose **browser-first, desktop/controller-led** for the initial build. This keeps the path from a SlingMods page to driving short. Build the application and content anew; no previous implementation is a foundation. It is a creative/product decision, not a claim that a web game can automatically equal a large console studio's output. A separate mobile quality profile follows the proven desktop slice; mobile convenience must not dictate the first hero's art quality.

The driving target is **simcade**: physical braking, traction, weight, and line choice, with approachable assists and responsive controls. Not a rail racer. Not an OEM-certified training simulator. No compulsory clutch management or punitive mechanical failures.

The complete first-release design is three accurately represented vehicles, five compact destination environments, eight core story chapters, roughly 24 events including optional challenges, one persistent garage, local time trials/ghosts, photo mode, day/night variants, and an initial curated set of approximately 18 fitment-verified products. Those counts are scope targets, not an invitation to generate them before the slice passes.

## Vehicle roster: exact references, not generic badges

| Reference vehicle | Intended player character | Essential distinctions |
| --- | --- | --- |
| 2024 Polaris Slingshot R AutoDrive | Low, wide, exposed two-seat roadster; the first visual hero | Steering wheel, separate front fenders, open cockpit, single rear drive wheel; five-speed automated-manual behavior |
| 2024 Can-Am Spyder F3-T | Muscular touring machine with an assured, substantial feel | 1330 inline-three, six-speed SE6, windshield and side luggage, handlebars, seated rider posture |
| 2024 Can-Am Ryker Rally 900 | Compact, playful, rough-surface-friendly machine | CVT power delivery, shorter body, Rally-specific wheels/suspension, proper rider posture; no fake six-gear soundtrack |

Manufacturer references are in `data/vehicles.reference.json` and `docs/SOURCES.md`. F3-T is deliberately selected rather than F3-S: the researched Thermal product explicitly excludes F3 base/F3-S. Ryker Rally's stock Akrapovič must not be presented as an aftermarket purchase.

All three choices are available at the beginning of the **finished campaign**. Each gets an equivalent *in-game opportunity*, not identical physical numbers. A loaner-test system lets players try the other machines without abandoning their career. Frame the opening choice as "your first build," not an irreversible class.

Stock specifications must stay credible. Do not equalize top speeds secretly so a stock Ryker can beat a much more powerful roadster on every straight. Default events use same-platform or compatible performance brackets. Mixed-platform invitationals use declared class scoring or start handicaps, not invisible horsepower or impossible AI grip. Vehicle-specific records and ghosts remain separate.

## Story: a traveling builder-racer invitational

You arrive with a stock machine and a place in a small SlingMods-backed touring crew. The tour celebrates owners and builders who race as well as show their vehicles. The arc is earning respect through consistency, thoughtful setup, and showing up for the crew—not stopping an apocalypse or becoming a police fugitive.

Use Rae, Maya, and Jett as freshly written characters in this new game: Rae organizes the tour, Maya is the technically sharp workshop ally, and Jett is the rival who gradually becomes a respected peer. These names are a creative choice, not a dependency on old scripts or roles. Write distinct people, not three tutorial narrators.

**Tone:** warm competence, friendly friction, a little competitive bite. Garage conversations are short and skippable. Race radio is sparse and context-sensitive. No constant shouting, fake influencer hype, or walls of product marketing. Any new dialogue below is a proposal, not recovered canon.

Example garage beat: Maya notices you charging into a bumpy corner too quickly. "You bought more noise. Next time, buy yourself a clean exit." The next optional setup test compares rebound behavior. The game demonstrates the effect instead of claiming a universal lap-time gain.

### Campaign shape

The following are new environment briefs. Author new layouts, event IDs, assets, and progression; there is no old-track or old-save compatibility requirement.

| Destination | Driving identity and visual target | Story purpose |
| --- | --- | --- |
| Smokies Switchbacks | Elevation, late-apex corners, layered forest, clean morning light | Arrival; learn braking and consistency |
| Ozark Afterglow | Undulating road, faster linked bends, warm late-day rock and trees | Earn trust; setup matters on uneven surfaces |
| Black Hills Outlaw | Exposed rock, stronger sightlines, wind and high-speed commitment | Rival pressure; balancing confidence with control |
| Atlantic Afterglow | Coastal boulevard, floodlit paddock, harder braking zones | Crew showcase; nighttime identity and precision |
| Biscayne Street Circuit | Concrete, waterfront barriers, overpass shadows, reflective city accents | Explicitly new invitational/epilogue in the campaign |

Eight core chapter beats: Arrival, First Build, Road Manners, Hold Your Line, Rival Territory, After Hours, Crew Colors, and The Invitational. Create fresh chapter IDs, dialogue, event links, completion records, and reward rules. Integrate Biscayne directly into this new campaign, without retrofitting old scripts or saves.

Use short circuits and point-to-point routes on reusable location kits. Do not build an enormous open world, traffic simulation, pedestrians, police pursuit, multiplayer netcode, or a destructible city before this campaign is good.

## Events and progression

The core loop is **drive → learn → earn → install → compare → race again**. Standard races target roughly 3–5 minutes. Mix circuit races, sprints, duels, sector challenges, and build-specific exhibitions. Clean lines and good racing earn optional bonuses; intentional crashing is not the optimal economy.

The opening story race grants a workshop voucher. A player can see an interesting customization immediately, and earn a meaningful handling choice within the opening few successful events. Balance from actual event results rather than expensive grinding. Losses still reward completion enough to avoid progression traps. Replayable rewards and one-time chapter bonuses are distinct and cannot double-pay.

A part is owned after purchase with game credits; uninstalling does not destroy it. Keep multiple saved configurations per vehicle and an undoable installation preview. Stock cars can complete the main campaign at the appropriate difficulty. No real purchase is necessary for racing success. Game credits never masquerade as real dollars, and real-money orders do not grant competitive advantages.

## The garage: a destination, not a menu background

Create a premium working showroom: charcoal structure, restrained SlingMods red, brushed metal, soft overhead light, realistic concrete, organized tools, one center presentation bay and two supporting vehicle bays. Use the approved project logo, not an AI approximation. Red is an accent; it does not tint the whole world. Do not replace current approved brand assets with invented colors.

Choose one seamless interaction model: orbit the vehicle, select a category, isolate the mounting area, preview a compatible part, install, then drive. The interface is calm and fast. The vehicle stays visible; no nested e-commerce modal maze.

Required garage experiences:
- A **lighting mode** dims the main fixtures so headlights, accents, and underglow can be evaluated on real surfaces. Day/night exposure must not conceal bad paint or geometry.
- A **workshop view** raises or isolates the right area. Show real attachment locations, brackets, wheels, and suspension. Internal parts get a respectful cutaway/inspection camera rather than floating outside the vehicle during racing.
- An **A/B build toggle** restores the stock appearance and setup temporarily. Sound A/B is level-matched so louder is not automatically presented as better.
- A **test-loop exit** loads the already-warm driving pad with one action and returns to the same build.
- **Shop this build** displays an exact, fitment-aware parts list and deliberate outbound links. It is separate from fictional credit spending.

Keep the player driver/rider visible and convincingly attached to the machine. Helmets, hands, feet, steering/handlebar contact, seat contact, and a modest amount of body reaction matter more than elaborate face animation. No ghost cars with an empty seat in the hero shot.

## Cameras, input, and feedback

Near chase is the default; far chase gives more road visibility. Add cockpit/rider, low front/nose, look-back, and replay/photo cameras. Use a spring-damped chase rig with measured yaw lag, modest speed-dependent field of view, camera collision, and a stable horizon option. Do not switch cameras involuntarily while racing. Cockpit gauges and gear displays read the same telemetry as physics and audio.

Default controller: left stick steer; right trigger throttle; left trigger brake; bumpers shift when the vehicle/mode supports it; Y/triangle camera; right stick free look; deliberate hold for reset. Keyboard: WASD/arrows, Q/E shift, C camera, V look-back, hold R reset, Escape pause. All remappable. Touch comes later with progressive steering, separate brake, optional auto-throttle, landscape layout, and tested Safari audio unlock. CVT vehicles do not show invented discrete forward gear shifts.

Default assists are mild traction/stability help, optional braking/line guidance, and automatic shifting where appropriate. Assists modify control or forces transparently; they do not move the car onto a rail. No stock nitrous or universal handbrake-drift mechanic. There is no legacy boost mode or inherited binding compatibility to preserve.

## Audio and presentation

Make the vehicle the hero of the mix. Derive engine layers from actual simulated RPM/load, shifts from actual gear events, and tire audio from slip and surface. Slingshot, SE6 Spyder, and CVT Ryker must sound mechanically different. Add wind, suspension/curb impacts, garage reverberation, and sparse positional rivals. A generic pitch-shifted loop is a prototype, not a completed powertrain.

Use owned/licensed source recordings where available. Create or license new audio for this project; do not import the old game's audio bundle. Generated audio is not proof of exact OEM sound. Do not extract other creators' recordings or clone real people without permission. Asset generation is a bounded production task, not a live paid API dependency for every race.

Music supports the setting without burying braking/traction feedback. Use owned/licensed tracks or original composition. Provide sliders for music, engine/effects, and voice; captions and reduced camera shake; optional bloom/motion blur off. HUD: speed, gear/CVT state, lap, position, small sector delta and clean event objective. Put debugging panels behind a development flag.

## The first complete slice: Biscayne Harbor

A newly authored proposed 1.4 km Biscayne Harbor closed circuit: approximately 8 useful corners, a straight, a braking hairpin, an uneven medium-speed section, a short overpass shadow, and a waterfront return. Aim for a roughly 75–100 second lap after tuning; neither distance nor lap time is a real-world claim. Every meter should teach us something about visuals, handling, or passing.

One complete Slingshot hero, three rivals sharing the same authored platform with different liveries, the garage, one brief story scene, and three verified parts: TricLED base underglow, DDMWorks shocks, and a Thermal 2020–2024 sport exhaust. Support daytime and nighttime sessions on the same geometry. The slice proves start → race → valid result → reward once → fit part → hear/see/feel the change → save/reload → return to race.

The exhaust's mesh and sound are mandatory. A numerical power increase is NOT mandatory without evidence. It remains meaningful customization; explicitly fictional performance tuning can be added separately and labeled, never dressed up as a vendor's measured result.

**Expansion rule:** if this loop does not look convincingly like a Slingshot and behave like a racing game, building two more vehicles and four more places is prohibited. Fix the thing the player will spend the game looking at and controlling.
