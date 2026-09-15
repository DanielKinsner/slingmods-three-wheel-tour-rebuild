# 04 — A complete SlingMods UI pass
## Premium motorsport configurator, not a development dashboard

The owner explicitly asked for a serious overall UI attempt. Implement a coherent
system through the game, not a landing-screen concept followed by old panels.
The current UI's usable state/transaction behavior is valuable; its presentation is
not frozen. Reuse the existing TypeScript/DOM foundation and factor shared components
where useful. No front-end-framework rewrite is needed to achieve this look.

## Visual system

Use actual approved SlingMods logo artwork with its correct aspect ratio. SlingMods
red `#C91820` is the primary accent; graphite, charcoal, neutral white and brushed
metal support it. Vehicle paint colors are content, not competing UI brand colors.
Use a restrained diagonal cut or red edge as a recurring motorsport motif, rather
than dozens of arbitrary angled cards. Avoid neon cyan/purple, rainbow gradients,
constant glowing borders, cheap carbon-fiber wallpaper and bubbly mobile-game UI.

Typography: bold, compact headings; calm readable body copy; tabular numerals for
speed/timing. Use existing licensed assets or safe system fallbacks. No external
font dependency at startup or fonts copied from the director's container. Define
shared spacing/type/color/motion/focus tokens so new screens remain consistent.

Proposed layout targets: 8 px spacing grid, roughly 16–18 px body text at desktop
view, small labels not below a useful 13–14 px, and generous 44–48 px interactive
heights. Do not achieve a fit by shrinking the whole page with transform:scale.
Screens must work at 1280×720, 1920×1080 and 2560×1440, with tested zoom/focus and
reasonable narrow-desktop fallback. Mobile can honestly remain unsupported for
play in this pass; do not ship illegible controls while claiming it works on phones.

Use brief purposeful transitions, roughly 140–240 ms for controls and longer smooth
camera moves when needed. No bounce comedy, spinny opening obstacle or mandatory
logo film. Reduced-motion settings should simplify UI and camera motion. Optimize
DOM updates; do not rebuild catalog markup or layout every physics tick.

## Screen-by-screen implementation

### Entry / hub

Let the actual lit showroom/car be the background. A clean SlingMods lockup and
Three-Wheel Tour identity introduce three clear actions: **Build Your Slingshot**,
**Quick Race**, and **Continue Career**. New visitors should not be forced into story
or purchasing to see what the product does. Development Preview/desktop support is
a small readable truth, not the whole screen's visual theme. Missing WebGL/assets
must lead to useful branded recovery, not an empty canvas.

### Showroom / configurator

Keep most of the screen for the car. Use a compact category rail or tab set, a
purpose-built product detail panel and a restrained lower action strip. Do not
stack the entire catalog and every numeric setup control into one long narrow form.
Separate **Paint**, **Lighting**, **Suspension**, **Exhaust**, **Aero**, **Storage**, and
**Build Presets** where implemented; hide empty categories rather than filling them
with dead cards. Only five products are required in this pass.

The selected card needs a real name, current option, clear fitment, an actual preview
thumbnail rendered from our asset, and concise actions: **Preview / Remove**,
**Compare Stock**, **Inspect**, **View on SlingMods**. A selected-part camera move
should show the mount on the assembled vehicle before offering a cutaway. Technical
simulation/OEM limitations remain accessible in Details rather than forcing all
customers to read a paragraph of engineering caveats on every card.

Show **Preview build — does not spend career credits** in free mode. Selected is not
the same as Owned; label those states. Keep **Test This Build** prominent. Use a
confirmation only for destructive resets or explicit career spending, not every
cosmetic toggle. Provide undo/reset-to-original for the current preview and named
saved build recipes. Paint swatches include labels and selected indication, not
color alone. Inspection must reset mesh visibility correctly when closing/switching.

DDM setup should offer an easy Street start and clearly named adjustable controls,
with the detailed clicks and calculated comparison available. Make changes useful
with keyboard, mouse and controller focus; do not leave numeric inputs untunable
without a physical keyboard. Never describe a higher click as universally better.

### Event selection

Use real route thumbnails/map silhouettes, event type, lap count, approximate design
length and day/night identity. Distinguish original Harbor, Maya duel and Express
without exposing internal packet numbers. Quick Race and Test Drive are clear, while
career gates remain in the career view. Do not remove earned access or pretend
existing events are new ones. Short crew dialogue can be skipped immediately.

### Race HUD

One confident speed/gear display, a readable lap/position/timer block and a compact
route/map or next-section aid. Give Reverse a clear **R** state and direction help.
Use actual MPH and actual engine/race telemetry. Do not bury key data in tiny labels
or let the HUD obstruct the next corner. Show nearby competitors and braking
landmarks clearly; no large shopping overlays during driving.

Audio/settings and pause controls can collapse into a predictable area. Controller
hints must match actual bindings. Wrong-way/reset prompts are contextual rather
than constantly shouting. Visible restart/reverse routes must work through ordinary
input. Controller disconnect and focus loss must not leave the throttle stuck on.

### Results and return

A strong place/result heading, actual time, clean breakdown of any earned game
credits, and three obvious actions: **Race Again**, **Back to Showroom**, **Change
Event**. A product link may be available after the race, but must not hijack the
finish. In unscored preview drive/quick race, explicitly say no career reward instead
of writing fake earnings. Distinct retries must not double-claim old receipts.

### Pause / controls / settings / errors

Use the same design language. Include input help, direction/reverse behavior, camera,
audio and motion options. Keep keyboard focus visible, trap focus appropriately in
modal UI, support Escape/back consistently, and restore prior focus on close. Do
not move the car while navigating controls. Preserve busy/pending purchase and save
interlocks during any UI refactor. Recovery screens must preserve user data and
distinguish retry from an explicit reset.

## Not acceptable as a UI pass

A new logo and red button on otherwise unchanged forms; product cards with no actual
preview; giant hero copy obscuring the car; invisible focus; black-on-black content;
small unreadable labels; a beautiful static screenshot whose controls do not work;
or an animation covering every transition while it loads the entire game again.

## Local visual review and interaction acceptance

Establish entry, configurator and HUD visual proofs internally, critique them, then
implement the chosen system throughout. No Dan approval checkpoint is required.
Review screenshots at native sizes and in motion, with black/white/blue car finishes
and both room lighting modes. Include longest product names, long build names,
insufficient-credit state, one blocked fitment, loading failure, pending save,
keyboard/controller focus and safe external-link return. Fix layout clipping rather
than reducing text size indefinitely. Visual proof is essential: passing DOM tests
does not tell us this looks like a premium game.
