# P01 reference dossier · 2026-09-10

Target hero: **2024 Polaris Slingshot R AutoDrive, US market**, Radar Blue Fade exterior used to study geometry. P01 exports neutral diagnostic clay, not the finished paint. US exterior was chosen by the production director because the game/fitment target is US. The seed V1 Canadian page supplies dimensions only; its projector-light wording is not asserted as US equipment. No later-model nose is used.

## Slingshot visual board

The following downloaded photographs are the same advertised 2024 R AutoDrive at Moto Member Purcellville, preserved by [MotoHunt listing 7720867](https://motohunt.com/l/7720867/2024-Polaris-Slingshot-Slingshot-R-AutoDrive-Radar-Blue-Fade). The original listing HTML is retained as `slingshot-2024/motohunt-page.html`. The AutoDrive console is visibly confirmed by its R/N/D buttons and paddle shifters. These are perspective photographs, not orthographic scans; their images cannot establish millimeter-accurate body vertices.

| View | Local reference | Important geometry observed |
|---|---|---|
| Front | `slingshot-2024/fae0_l.jpg` | Wide raised eyebrow wings; pinched central prow; upper LED strips, diagonal lower lamps; broad stepped splitter |
| Side | `slingshot-2024/4f06_l.jpg` | Long front overhang; open front wheel; low boarding cutout; short high rear deck; exposed single rear wheel |
| Rear | `slingshot-2024/7d1d_l.jpg` | Twin trapezoidal hoops; broad undertray around central tire; narrow center fin; hook-shaped outboard lamps |
| Rear three-quarter | `slingshot-2024/bd31_l.jpg` | Rear shoulder wedge, tail overhang, rear wheel and swingarm exposure |
| Front three-quarter | `slingshot-2024/d2cd_l.jpg` | Relative bonnet/wing/cockpit massing |
| Cockpit | `slingshot-2024/95c0_l.jpg`, `deda_l.jpg` | Left steering wheel, twin instruments, center screen, switch bank, three AutoDrive buttons |
| Tail lens | `slingshot-2024/e17c_l.jpg` | Horizontal lamp shoulder transitions to a downturned hook |
| Rear drive | `slingshot-2024/5a83_l.jpg` | Exposed single-sided swingarm and belt |
| Wheel | `slingshot-2024/3f60_l.jpg` | Ten swept machined spokes, deep dark rim channel |

Each dealer JPEG source follows `https://storage.googleapis.com/mhimg/p/0867/7720867/<local filename>` and was downloaded September 10, 2026. `5b16_l.jpg` and `e43f_l.jpg` are supplementary rear pod/fin details.

Official MY24 R front three-quarter: `slingshot-2024/manufacturer-threequarter.png`, from [Polaris MY24 R image](https://cdn1.polaris.com/globalassets/slingshot/2024/model/vehicle-cards/r/slingshot-r-us-my24-uj29-radar-blue-fade-m-t24aargbac.png). The `-m-` image is the manual R exterior, used **only** for shared exterior fascia/hoop/wing proportions, never AutoDrive controls. The dealer cockpit supplies the actual automatic reference.

## Dimension cards

All figures below are published manufacturer dimensions, not independently measured vehicle data. CAD surfaces, suspension hardpoints, seat locations, mirrors, lamp vertices and ride-loaded tire deformation remain photo estimates. Wheelbase/track/nominal wheel radii are shared with physics through `public/assets/slingshot-contact-layout.json`; the artist does not maintain a second contact tune.

| 2024 vehicle | Wheelbase | Width | Length | Height | Stage |
|---|---:|---:|---:|---:|---|
| Slingshot R AutoDrive | 2.667 m | 1.980 m | 3.800 m | 1.318 m | Clay hero + cheap scale blockout |
| Spyder F3-T SE6 | 1.709 m | 1.497 m | 2.596 m | 1.241 m | Scale silhouette only |
| Ryker Rally 900 CVT | 1.709 m | 1.522 m | **2.35204 m provisional** | 1.090 m | Scale silhouette only; source length conflict unresolved |

Slingshot [Polaris exact-year R AutoDrive V1](https://slingshot.polaris.com/en-ca/2024/slingshot-r/slingshot-r/auto-slingshot-r-radar-blue-fade-2024-slg/) direct GET is blocked (403); current search-index text exposed the dimensions, 1.755 m track and tire sizes. These are also consistent with the exact-year [Polaris Xchange dealer listing](https://polarisxchange.com/autocycles/new-2024-polaris-slingshot-r-VkeaWvj0O), whose dated photo CDN could not be retrieved. Tire labels 225/45R18 and 305/30R20 give unloaded nominal radii **0.32985 m** and **0.3455 m**. Nominal tire section width is not a measured actual section width.

F3-T [official 2024 F3 family page, F3-T section](https://can-am.brp.com/on-road/us/en/models/previous-models/2024/spyder-f3.html) retrieved successfully and retained as `spyder-2024.html`. `spyder-f3t-2024.png` is its official [F3-T Petrol Metallic studio reference](https://can-am.brp.com/content/dam/global/en/can-am-on-road/my24/photos/3-wheel-lineup/spyder-f3/3-4/png/ONRD-SPY-MY24-F3-T-PetrolMetallic-000H6RB00-Studio-34FR-NA.png). Its windshield, touring fairing and hard side luggage guide the cheap blockout. The blockout is not a finished F3-T and has no claimed exact front track: centers are width minus nominal tire width, explicitly an estimate.

Ryker [official 2024 Ryker page, Rally section](https://can-am.brp.com/on-road/us/en/models/previous-models/2024/ryker.html) retrieved successfully and retained as `ryker-2024.html`. `ryker-rally-2024.png` is its official [Rally studio reference](https://can-am.brp.com/content/dam/global/en/can-am-on-road/my24/photos/3-wheel-lineup/ryker/ryker-3-4/png/ONRD-SPY-MY24-Ryker-Rally-000F3RA00-Studio-34FR-NA.png). The current page and [official exact-year Rally sheet](https://can-am.brp.com/content/dam/global/en/can-am-on-road/my24/documents/specs-sheets/en-updated/ONRD-MY24-RYK-RALLY-SPEC-ENNA-Page-PDFx.pdf) still conflict: **92.6 in converts to 2352.04 mm, not 2532 mm**. Blockout uses the imperial conversion provisionally; final Ryker dimension approval remains blocked on a resolved source. Compact saddle, open handlebars, low broad nose and separate fenders distinguish it from F3-T; no false CVT gears are modeled. Full multiview secondary-hero boards remain part of their later finishing packet.

## Rights and package separation

All downloaded images and HTML are **research-only reference material**, with rights retained by the manufacturers/dealers/photographers. Public accessibility is not a redistribution license. No claim of licensed game imagery, logo texture or endorsement is made. No downloaded photo is included in `public/`, a material node, a GLB, or a game texture. The mesh is newly authored in Blender by `scripts/vehicle_build.py`, with editable `.blend` source. Do not publish the research folder as game assets.

`slingshot-2024/dealer-page.html` and `johnny-page.html` are failed/empty-inventory source attempts, not evidence for geometry. They are retained only as retrieval traces. No access-control bypass was attempted.
