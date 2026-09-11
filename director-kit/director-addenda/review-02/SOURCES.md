# Source and evidence register

## User-provided, inspected directly

`Astra-Review-02.zip`, SHA256 `7b8b50e7a37306db066362970376a04bb872acc7e75e4fe8f2bfc79217d0ba47`.

Runtime source under `src/`, Blender construction under `scripts/vehicle_p03a_build.py` and `scripts/vehicle_p03a_materials.py`, GLBs under `public/assets/vehicles/`, final stills/movies under `director-kit/production/evidence/P03A/final-02/`, local review/statistics and the G2 addendum. Prior `Astra-Review.zip` was used for byte comparisons of the original pad/contact/model/test files.

The independent numerical inspection and five-test run are included under `evidence/`. Captured runtime draw calls and the full 29-test build results are reported by the submitted package, not rerun here. No live local-machine access, Blender execution, target-GPU performance measurement or manual control-feel test is claimed.

## Public visual references checked September 11, 2026

The following are the same dealer-origin photographs named in the project's existing reference dossier, viewed through the listing's image links. They establish observable shapes, not licensed runtime assets or physical dimensions. Photos retain their respective owners' rights; this kit does not redistribute them.

Listing: https://motohunt.com/l/7720867/2024-Polaris-Slingshot-Slingshot-R-AutoDrive-Radar-Blue-Fade

- Front: https://storage.googleapis.com/mhimg/p/0867/7720867/fae0_l.jpg
- Front three-quarter: https://storage.googleapis.com/mhimg/p/0867/7720867/d2cd_l.jpg
- Rear three-quarter: https://storage.googleapis.com/mhimg/p/0867/7720867/bd31_l.jpg
- Rear: https://storage.googleapis.com/mhimg/p/0867/7720867/7d1d_l.jpg
- Wheel: https://storage.googleapis.com/mhimg/p/0867/7720867/3f60_l.jpg
- Rear drive: https://storage.googleapis.com/mhimg/p/0867/7720867/5a83_l.jpg
- Cabin: https://storage.googleapis.com/mhimg/p/0867/7720867/95c0_l.jpg
- Steering wheel: https://storage.googleapis.com/mhimg/p/0867/7720867/deda_l.jpg

The official MY24 PNG URL recorded by the original dossier could not be opened in this review. I used the retrieved dealer-origin multiview set above; I do not claim a fresh manufacturer-image inspection.

## Technical primary reference checked

Three.js RoomEnvironment documentation: https://threejs.org/docs/pages/RoomEnvironment.html

This explains the basic room-scene/PMREM image-based-lighting technique used in the supplied runtime. Using it is not intrinsically wrong; the requested next step is deliberate scene-specific art direction, not an alleged library defect. Verify installed-version APIs locally before implementation changes.
