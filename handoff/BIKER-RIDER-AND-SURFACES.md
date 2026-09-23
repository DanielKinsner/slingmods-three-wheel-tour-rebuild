# Biker rider on every vehicle + realistic vehicle surfaces (2026-09-23)

Owner request: implement the purchased rigged biker as the rider for every vehicle, make vehicle
surfaces more realistic, patch issues found along the way, everything on main. Done by Claude.

## Commits (all on main, pushed)

| Commit | What |
|---|---|
| `7d99a51` | Codex's completed SPYDER01 working tree committed as-is (it was uncommitted; tsc clean, 457/457 before commit) |
| `f49c1a1` | Biker rider game build: `scripts/build-biker-rider.py` → `public/assets/drivers/biker/` |
| `c2c8a91` | Every vehicle rides with the biker (runtime wiring + tests) |
| `cfa9f0d` | Vehicle micro-surface maps (`scripts/build-vehicle-surface-maps.py` → `public/assets/vehicle-surfaces/`) |
| `5439486` | Realistic surfaces on every vehicle (`src/presentation/vehicle-surfaces.ts`) |
| `73cc383` | Paint flake toned down to a close-range glint |

## Rider

- Source: owner purchase in `male-biker-rigged/` (NORMAL RIG.fbx + TEXTURES.zip). **Not in Git** and
  gitignored: the repo is public and marketplace licences allow shipping the model inside the game, not
  publishing the source files. The owner keeps the download; only the game build is committed.
- Rebuild: `.tools/blender-4.5.2-windows-x64/blender.exe -b --factory-startup --python scripts/build-biker-rider.py`
  (`-- --fit spyder --render` for one vehicle plus inspection renders in `.tools/biker-rider/`).
- Output: one 1.9 MB rider GLB (33.5k tris, WebP textures) + `fit-slingshot/ryker/spyder.json`. Each fit holds
  the seated rest pose (every bone's local TRS) and the IK attachment. `DriverPresenter` applies
  `restPose` before recording its rests (`applyRestPose` in `driver.ts`), so one asset serves every seat and
  cloned rivals.
- Hands are posed around the real grip/rim tubes measured from each vehicle GLB (wide point-cloud direction,
  refined on tube-wall normals). Spyder's 96 cm bars get a torso lean/turn at full lock (`handlebarPose`).
- Materials rebuilt: the source wired leather albedo into the normal slot; leather fold normals, grain
  roughness and metal hardware maps are derived from the supplied albedo.
- Selection: `src/presentation/rider-asset.ts`. Default biker on 2026 Slingshot, Ryker, Spyder and Slingshot
  rivals. `?rider=tour` / `?rider=legacy` keep the earlier riders; josh/legacy comparison visuals keep theirs.
- Tests: `tests/biker-rider.test.ts` drives the real presenter on each vehicle's control hierarchy: wrists
  rest on their targets, hands stay on the controls through full lock (worst 3 mm, Spyder), feet stay planted.
- Verified in the running game: chase, cockpit, intro film, showroom and a 4-car race (rivals report hand gaps < 1 µm).

## Surfaces

- `finishVehicleSurfaces()` runs in `loadDrivingHero` on the hero and the rival fleet before rivals are cloned.
  Classifies materials by role/name; never touches lamps, lenses, glass, mirrors, displays, decals, recesses.
- Fixes physically wrong values (near-black 75%-metal "metals" → dielectric coatings; chrome/aluminium real
  reflectance), lacquer clear coat + orange peel on paint and gloss panels, faint metallic flake, triplanar
  micro detail on tyres, plastics, leather, metal (no UVs needed; fades with distance).
- Materials are `VehicleStandardMaterial`/`VehiclePhysicalMaterial` whose `copy()` carries the shader hook,
  so rival repaints and showroom finish clones keep the surface.
- A/B: `?vehiclesurfaces=off`. `inspect().vehicleSurfaces` reports counts in showroom and road.
- Tests: `tests/vehicle-surfaces.test.ts`.

## Checks run

tsc clean; full suite 468/468 (one run had a timing failure in `cinematic-audio-integration` under load; it
passes alone twice and the full rerun passed); `npm run demo:build` passes; browser checks on all three vehicles.

## Open / not done

- **Performance not re-measured.** Physical paint + triplanar detail add shader cost on vehicle pixels only.
  The Phase 2 performance gate remains HOLD; include vehicle surfaces in the next quiet-PC measurement.
- Rival riders all wear the same black helmet; per-rival helmet tint would help tell them apart.
- White rival decal texture carries a faint baked diagonal hatch (pre-existing, visible with surfaces off).
- Codex's `public/assets/spyder/spyder-rider.glb` and the Tour rider remain for `?rider=tour` comparison.
