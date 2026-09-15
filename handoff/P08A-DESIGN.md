# P08A — Build Matters

Authority: Dan's 2026-09-15 director assignment authorizes this bounded development expansion and ordinary commit/push to a feature branch in the existing private rebuild repository. Public hosting is pending and does not block development. No merge, release, deployment, spending, desktop takeover, G3/G4 or final fidelity approval.

## Playable chapter

The existing time trial is the shakedown: first clean lap 800 game credits, repeats 100. **New:** Maya / Find your line, one lap against the existing Maya controller/livery/identity, with the same course checks and shared vehicle simulation. First clean duel pays 500 workshop-fund credits plus 150 for second or 250 for first. Repeats pay placement only. A finish opens the existing four-car, two-lap night crew race. Its established 100/150/200/300 placement rewards and first-podium 400 bonus remain unchanged.

DDMWorks suspension costs 1000 fictional game credits. A fresh lap plus a clean duel covers it. Players who bought the existing 600-credit cosmetic first can repeat the duel to fund suspension. The crew race remains available with stock suspension after the duel; purchasing is a choice, not a mandatory handling advantage. Dialogue is short and skippable. Retry uses a fresh attempt ID; duplicates never pay again. Podium rewards and past progress retain their original meaning.

Career schema 3 migrates versions 1/2 without resetting old credits, receipts, cosmetic ownership, appearance or crew results. Previously earned crew access is retained as `legacyCrewAccess`; no duel win or product ownership is fabricated. Future/corrupt data keeps the existing explicit recovery flow. The IndexedDB name remains unchanged. Prepared demo data remains separately scoped to sessionStorage, retains easy-entry crew access and has no new suspension ownership.

## Verified suspension product

Checked 2026-09-15 by the independent reviewer against primary pages:

- [SlingMods SM-3223](https://www.slingmods.com/polaris-slingshot-3-way-adjustable-sport-shocks-coilovers-ddmworks): DDMWorks 3-Way Adjustable Sport Shocks, set of three. Fitment explicitly includes 2024 Slingshot R. Selected **Silver (Standard)**, silver housing/silver springs; retailer option value 3916, ogvalue 12707. No turbo-color option is selected.
- [DDMWorks manufacturer page](https://www.ddmworks.com/Polaris-Slingshot-3-Way-Adjustable-Coilovers-by-DDMWorks_p_823.html): DDM-18-2, twin-tube construction, independent compression/rebound adjustments and ride height, all Slingshot years.
- [Manufacturer installation instructions](https://www.slingmods.com/pdf/ddmworks-adjustable-shocks-install-instructions.pdf): lower-end adjusters (pages 3/6), 19 clicks, street starting settings front compression 2/rebound 6, rear compression 1/rebound 3, from full soft (page 7).

The UI counts clicks from full soft 0 through 19. Retailer and manufacturer lowering ranges disagree; the game uses a conservative **±20 mm modeled offset**, not an exact product travel claim. Spring rates and measured damping curves are unknown. No real price, dyno, grip or lap-time improvement is asserted. The model is original authored approximation, not manufacturer CAD or an installation tutorial.

## Bounded simulation seam

Stock still evaluates the original load equation without entering the optional product branch. Mass, tire friction/forces, spring rates, anti-roll, drivetrain, contact geometry, wheel guards, Harbor geometry and collision remain unchanged. Suspension setup is captured on scene entry and applies to the player only; it cannot be retuned mid-race. Rivals retain stock parameters and established controls.

For an installed product, load before the existing bump-stop/anti-roll processing is:

`clamp(k * (restLength - length + heightOffset) - directionalDamper * verticalPointVelocity, 0, wheelStaticWeight * 4.5)`

Positive vertical point velocity selects rebound, negative selects compression. The same linear law remains an approximation, not measured damper dyno data. Spring rates remain 28000 N/m front, 48000 N/m rear. Height changes spring-perch preload force, not hardpoints or tire grip.

For each front/rear compression/rebound channel: `damper = stockDamper * (1 + 0.035 * (selectedClick - streetStartingClick))`, in N·s/m. Stock dampers are 3800 front and 6500 rear. The 3.5% mapping is explicitly a simulation estimate. Street starts have identical coefficients to stock; a stronger setting resists motion more and can worsen compliance. There is no universal handling bonus. The saved setup comparison reports these actual coefficients and offset.

## Hardware and preservation

The accepted car/rear/driver/world binary files are unchanged. New editable source: `assets/blender/products/ddmworks-sm3223-silver.blend`; runtime: `public/assets/products/ddmworks-sm3223-silver.glb`. The independent asset contains lower compression/rebound knobs, silver body/threads/collars/coil, eyelets and piston.

The old export merged the front damper/spring with carrier meshes. The replacement contains the same non-shock authored carrier objects, matrices and materials from the accepted source, excluding only the two stock dampers/springs. Installing hides the corresponding original groups; removing restores them. Existing rear `shock_upper`/`shock_lower` nodes drive the new rear hardware, preserving the accepted vertical-raycast linkage approximation. Spring ends follow both seats. Product inspection intentionally hides body meshes and is labeled; ordinary driving/full-vehicle mode restores them. No car/world remodel or global art pass.

## Verification interpretation

Functional browser runs use isolated contexts and the existing virtual player controller, producing ordinary input and actual physical results. Controlled-clock runs prove game state/loop, **not performance**. Performance runs use native RAF, enabled audio graph with muted host output, no concurrent recording and separate complete attempt scoring against retained p95 20 ms / p99 33.4 ms / max 100 ms thresholds. Full raw results and limitations accompany the review. G3/G4, human fun/listening, physical controllers/mobile, broad GPU/browser testing and publication remain unapproved.
