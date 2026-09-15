# P06C composition and baseline

Starting main: 9780d62e4ea032dafc414dd838b040ed05565da5, identical to read-only origin/main lookup. Only pre-existing untracked work: P06C-HOME-KICKOFF.md, left untouched. Review12 packet verified against all 23 manifest hashes. No P06C implementation existed. 709 transfer files/366 frozen inputs verified with documented line-ending differences only. Baseline build and 119 installed tests pass; first test attempt lacked Playwright browser, retained in setup/tests.log; installed-browser rerun is setup/tests-installed.log.

Windows, i9-13900K, RTX4080, driver 32.0.16.1088; Node24.15.0/npm11.12.1/Python3.13.5. Blender4.5.2 downloaded from download.blender.org, ZIP SHA256 a24ec8dc2ee097294624f90e210c3528da5624320460f03270a387ca22a33734. Tools stay ignored. No old-machine performance claim carries forward.

## Actual map and construction

Route is a loop, so bands use route-local tangent/normal, never a blanket world left/right. All ensembles remain beyond the existing barrier line and at least 12.5m from every centerline segment (road half-width5.5 + runoff3 + barrier/camera margin). Locked original route and collider guides are saved in the Blender source. New building mass stays behind existing barriers; no new colliders.

- 300–510m: route east along z=-260 then turns northeast. Connected repair sheds on the inland/south side, loading canopies and a concrete yard edge. Keep the marina departure opening.
- 510–735m: technical S corner through x203–253,z-194–0. First sample 590–750m: stepped marine-workshop frontage outside the west edge and a separate eastern warehouse court; articulated ends leave corner exits visible. Buildings use a few connected long roofs, recessed doors, structural bays, yard walls and contained planted returns.
- 735–935m: east edge to north return. Lower storehouses taper to bounded planting, retaining an open view toward the promenade. Existing six collidable warehouses remain visibly on their exact envelopes.

Preserve terminal, marina docks, water/sky/probe, garage, vehicles, physics/race/save contracts. New source is additive built-waterfront.blend; existing quality-kit.blend stays the reproducible P06B input. Runtime library names retain kit_<module>__<material>. Full runtime sample is captured with SHOWCASE=full, never the terminal-only historical sample selector.

## Method changes

Palm fronds: original authored pinna polygons baked into an RGBA map on folded, curved parent fronds. All three LODs retain the same crown directions and envelope. The actual exported glTF material uses MASK cutoff0.35 and double-sided rendering; no transparent sorting. Both rejected opaque methods remain in sample evidence. Useful curved sourced-bark trunks retained.

Road: one aligned intact crop of the photographic source channels, no mirrored quarter. Physical tile0.75m. Remove coarse illumination/color patches from diffuse while retaining fine aggregate; coordinate normal/roughness/AO from the same crop. Subtle authored vertex color varies road scale independently, without decals or physics changes.

G3/G4 and final environmental art stay pending. Sample criticism and repair precede rollout.
