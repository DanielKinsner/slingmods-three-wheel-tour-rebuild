# Ryker equipment and switching

The shared showroom header now has persistent Slingshot R / Can-Am Ryker 900 choices, including Build, Destinations and Shop. Switching preserves the screen and restores that vehicle's draft. Ryker drafts, named recipes and drive snapshots use a separate `-ryker` storage namespace. Existing Slingshot keys and career transactions are unchanged. The default remains Adrenaline Red panels with a black seat.

The Ryker free-build menu contains Paint, Lighting, Suspension, Exhaust, Body Kit and Build Presets. There is no Ryker Aero or Storage category. Selections support removal, undo, stock comparison, named saves, shopping links and actual showroom departure into a drive. These are free preview parts, not new career purchases or performance upgrades. The existing career vehicle appearance still works; its progression and earned Slingshot catalog are unchanged.

## Research checked September 22, 2026

| Preview | Product and source | Relevant limits |
|---|---|---|
| Lighting | [TricLED Ryker Kit #1, SM-7227](https://www.slingmods.com/canam-ryker-chaser-led-underglow-lighting-kit-1) | Headlamp housings, grille and A-arms. Listing includes 2019–2026 Ryker/Rally/Sport. Steady RGB preview; the physical remote's chaser patterns and optional kits #2/#3 are not simulated. |
| Suspension | [Elka front pair, SM-5475](https://www.slingmods.com/canam-ryker-front-shocks-coilovers-elka-suspension) and [rear, SM-8178](https://www.slingmods.com/canam-ryker-rear-shock-coilover-elka-suspension) | Stage 3 front and rear visual set. Base 2019+, Rally 2019–2021, Sport 2022+. Rear Stage 3 is listed for solo riders. No borrowed DDMWorks tuning or Elka dyno claims. |
| Exhaust | [Treal Street, TRP-RKR-SES](https://trealperformance.com/products/treal-performance-can-am-ryker-600-rally-900-exhaust-system) | Polished oval stainless silencer and standard slash-cut tip, without optional insert. Manufacturer lists 2019–2026 600/900/Rally and Sport. Visual change only; no power gain or claimed recording of its real sound. |
| Body Kit | [Panther Customs, SM-8167](https://www.slingmods.com/canam-ryker-front-end-body-kit-panther-customs), [manufacturer design reference](https://panthercustoms.com/) | Two-piece front fascia and hood. Standard Ryker 2019–2026, Rally 2019–2021, Sport 2022–2026; excludes 2022+ Rally. |

The purchased model does not establish a model year. Listing support is conditional on the actual owner's year/trim; the UI includes these limits. No price, checkout, stock promise, purchase or remote publication is part of the game.

## Asset method

`Ryker-Accessories.blend` is editable; `scripts/ryker/build-mods.py` rebuilds it from the existing game master. Accessory shapes are original game approximations made against product references, not manufacturer CAD or dimensional fitment certification. The Panther geometry replaces the original front fascia/hood; it is not an aero wing. Treal replaces the stock right-side silencer. Elka replaces all three stock damper/spring bodies while retaining mounting hardware and suspension links.

The base Ryker GLB is unchanged. The accessory GLB carries lossless mesh partitions of three original static nodes. Tests compare triangle totals against the actual base asset. Original normals are retained, and mutually exclusive stock/mod groups are toggled atomically. Authored rigid geometry is joined by material to keep the complete accessory file to 29 primitives; underglow adds two. The duplicate stock partitions add approximately 5.5 MB of decoded/downloaded asset data, traded for preserving the accepted base asset and reproducible reversible swaps.

Two small downward area emitters provide the Ryker kit's local ground glow through the existing light controls. No extra shadow maps are allocated. Sport v5 equations, steering/input, collision contacts, rewards, routes and saves are unchanged. Existing Ryker width/collision-footprint limitations and the project's sustained-performance HOLD still apply.

## Verification

The full Node suite passed 401 tests; the three Ryker equipment tests were repeated after final geometry refinement. TypeScript/Vite production build passed. Both accessory GLBs passed Khronos validation with zero errors and warnings. `scripts/ryker/mods-check.mjs` verifies all four installations, stock comparison, Slingshot/Ryker switching and separate finishes, four shopping listings, a 390×844 layout, and the actual showroom-to-drive flow with all four parts retained. Actual renderer captures accompany the browser report; no generated marketing image is used as evidence.

The local branch remains the merge source. No main-checkout files, remote branch or deployed site were changed.
