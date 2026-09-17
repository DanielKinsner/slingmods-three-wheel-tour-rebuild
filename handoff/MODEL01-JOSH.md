# MODEL01 — Josh donor integration

Status: **playable adaptation candidate, not the default**. The normal site retains
the prior shared vehicle. `?visual=josh` selects this model across showroom,
departure, driving, rivals and results in that tab. `?visual=legacy` restores the
default. The candidate carries a visible 2015-derived / 2024-adaptation label.
Only the selected vehicle is fetched. This is a visual selector, not a new saved
vehicle, catalog or handling profile.

Owner direction: supplied `SlingMods-Josh-Model-Integration-Kit.zip`, read
START-HERE then CODEX_NEXT; no subagents, film, review ZIP or benchmark campaign.
Owner explicitly confirmed permission to serve the adapted model on the existing
game URL during this task. Provenance remains owner-supplied, owner-identified
2015, not authenticated OEM CAD and not an unrestricted redistribution license.

## Regional decisions

| Region | Decision | Reason / reference | Implementation |
|---|---|---|---|
| Hood, fenders, painted side/rear shoulders | Keep | Josh's strong broad contours; kit priority | Original Body_01 topology, UVs and supplied normals; rigid coordinate conversion only |
| Side rails / frame | Keep | Useful exposed structure, similar visible layout | Donor frame geometry retained; no physical frame/handling claims |
| Fascia / upper and diagonal lamps | Adapt | Exact-year manufacturer three-quarter, owner front photos | Old separate front optics removed; new upper/diagonal LED lenses, amber markers and center LED unit |
| Gap-fillers / grille / splitter | Adapt | Owner's named front correction | Fitted dark returns, local splitter returns and open hex grille; not a retail product |
| Rear body / storage | Replace locally | Later-generation lower compartments and existing organizer fit | Current target compartments and doors shifted 150 mm forward under donor shoulders; donor rear cover removed |
| Rear lamps | Adapt | 2024 rear reference, donor trailing-edge measurements | Separate emissive ribbons and dark beds along retained shoulder edge |
| Roll hoops / upper rear fin | Keep | Owner-approved square style, usable wing mounting | Donor square hoops; no added diagonal braces; wing moved 40 mm forward |
| Windshield / mirrors | Keep | Useful original mesh detail | Old round front optical glass removed separately; original windshield and mirrors retained |
| Cockpit / AutoDrive / steering | Replace locally | Polaris redesign and current target controls | Manual instruments/phone mount removed; current dash, display surround, controls and steering/driver bindings transplanted |
| Seats | Adapt | Keep good donor upholstery geometry, reconcile driver | Local back/cushion position adjustment; only red upholstery texture pixels neutralized |
| Wheels / brakes | Adapt | Game's verified 225/45R18 and 305/30R20 contact basis | Donor tire detail resized locally; existing R-style rims/rotors/fixed calipers; no body scaling |
| Suspension / rear drive | Transplant functioning target | Existing contact layout and product replacement semantics | Current rear articulation; explicit front link endpoints; stock shocks hidden for DDM, no duplicate DDM carriers |
| Paint / trim | Adapt | Four finishes require neutral maps | Donor neutral body AO with finish multipliers; black trim/seat/rubber/glass separate; current console/rear-arm finish behavior retained |
| Five products | Adapt mounts, keep identity | Existing catalog IDs/options and recipe semantics | SM-133 unchanged; SM-3223 bindings; SM-7720 moved 140 mm forward with local hanger adjustment; SM-26801 40 mm forward; SM-28919 150 mm forward with compartments |

Research: [Polaris 2020 redesign](https://www.polaris.com/en-us/news/product/polaris-takes-slingshot-to-the-next-level-with-dynamic-redesign-all-new-powertrain-and-autodrive-transmission/)
identifies cockpit, controls, frame/suspension and exterior changes. Exact target
images remain in `director-kit/references/slingshot-2024/`; the kit's owner photos
are appearance references with unverified individual model years. No 2025/26 parts
were intentionally substituted. Hidden engine internals and simulation are unchanged.

## Concrete promotion limits

1. The front gap returns and optical housings are implemented, but their surface
   transitions into the donor fenders remain visibly too planar. This needs local
   contour/edge refinement before default promotion.
2. The later-generation rear compartments enclose the bags, but their joins under
   the donor shoulder and around the seat access opening remain coarse. The
   candidate does not certify exact retail accessory fit on an unchanged 2015 car.
3. Donor hood/cowl, seat and upper rear contours remain a selective game adaptation,
   not exact 2024 OEM geometry; close cockpit views expose the remaining cowl join.

These are visual/model-year limits; keep this labeled candidate until repaired.
The original default remains available and unchanged.

## Editable/runtime inputs and recovery

- `assets/source/model01/Slingshot-Build/`: all 43 supplied source-kit files,
  byte-preserved; original Blend, GLB, OBJ, textures, build script and previews.
- `assets/blender/model01/slingshot-josh-adapted.blend` and
  `josh-mounted-products.blend`: packed editable derived sources.
- `public/assets/model01/`: vehicle-only and accessory runtime GLBs.
- `scripts/build-model01.py`: localized conversion using Blender 4.5.2 and the
  existing tracked hoop-refined vehicle/accessory sources. Run from this checkout:
  `blender -b --python scripts/build-model01.py`.
- `assets/blender/model01/build-notes.json`: original source hashes and transplanted
  object inventory. Donor source is hash-checked unchanged during export.

Verification uses focused model/driver/rear/finish/save/product checks and
`scripts/smoke-model01.mjs`, an isolated browser flow with real keyboard input.
Focused local production-build results are recorded in `MODEL01-VALIDATION.json`.
The live `/review-build.json` reports the currently served commit and input hashes.
No personal browser save data or tool installs are committed.
