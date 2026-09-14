# P06B outdoor illumination — implementation and calibration record

Local authored change, pending integrated runtime art review. No gate approval.

## Day

The runtime loads only the locally shipped Poly Haven `kloofendal_48d_partly_cloudy_puresky` 2048 x 1024 Radiance HDR through installed Three r186 `HDRLoader`. The source/acquisition/license SHA records live in `public/assets/showcase-quality/source-manifest.json`. No external runtime requests are introduced.

The original photograph is the visible equirectangular sky. Its brightest source pixel (1218, 239) supplies the world-space directional sunlight, using the same equirectangular convention as the installed Three shader and HDRLoader flipY upload. Scene background/environment rotations are both zero. The brightest source luminance is 72843.3446, versus sampled upper-hemisphere p95 1.11621. A separate linear-light probe retains color/direction but caps luminance at two times p95 before normalizing p95 to 0.9 and PMREM prefiltering. This removes the solar energy spike before adding the shadowed direct light. The source pixels are not mutated. The visible HDR display gain is 1.6 after normalization, separate from the lower-intensity illumination probe. The display texture clamps values exceeding half-float's 65504 representable maximum instead of uploading infinities; this affects the already saturated solar disk, not a darkened baseline comparison.

Day settings: environment intensity 0.95; directional 2.05 with warm near-neutral #ffefdc; small hemisphere 0.30; ACES exposure 0.95. These are art calibration settings, not a photometric lux claim. The HDR sky and direct light are directionally aligned; moving shadow camera follows the car without rotating the source. Direct light has one 1024-pixel bounded shadow map (512 low preset).

## Night

Night uses an original analytic coastal sky with a low navy zenith and gently brighter, slightly varying horizon. It is not a scaled day HDR or indoor RoomEnvironment. A small visible moon follows normalized [-22,42,-28]. The PMREM probe omits the moon disk; the direct moon light supplies that directional contribution once. Display sky is 1024 x 512, light probe 512 x 256. Both are local generated linear-light half-float textures, with no network dependency.

Night settings: environment intensity 1; directional 0.38 #a4b9d7; hemisphere 0.38; ACES exposure 1.05. The two accepted stock headlights remain 180 candela-scale renderer intensity, and the stable pool stays four nearby practical spotlights at maximum 1000 (two low), warm-white #ffe4c4 rather than the previous orange-biased #ffce91. Existing headlights and installed product area-light paths are preserved. Fog reaches 900 m at night / 1400 m in day, with its near range extended to 240 / 400 m rather than hiding the new scenery.

## Ownership and inspection

Both solo Harbor and Crew replace RoomEnvironment with the same `loadOutdoorEnvironment` initializer before calling `harborLighting`. `lighting.inspect().outdoor` reports exact source, probe processing, source resolution, solar direction, intensity and exposure. Day/night probe, background, PMREM target, lights, targets and cloned light-lens materials have explicit disposal; original lens materials are restored when a rig is removed. Live light counts remain stable when pooled practical intensities fall to zero.

## Focused checks

`npx tsx --test tests/outdoor-environment.test.ts tests/light-pool-stability.test.ts`: four passing checks. They parse the actual selected HDR, prove source pixels unchanged, verify source sun elevation and lobe suppression, bound finite night sky output/moon alignment, preserve six resident standard spotlights while moving away from fixtures, and remove lights/targets/owned lens clones over three rig lifecycles. This is CPU/data/lifecycle evidence, not a runtime image or GPU performance benchmark. Integrated normal-camera daylight/night images and wall-clock four-car profiling are required separately.

## Internal benchmark review and repairs

Benchmark01 was visually rejected: despite an outdoor sky, the day rear deck/gantry had insufficient diffuse fill; sky display was subdued while white road markings already approached their previous brightness. Daylight repair increased IBL0.72 to0.95 and hemisphere0.08 to0.30 and independently raised sky display gain1.6, leaving direct2.05 and exposure0.95 intact. Benchmark02 proves the car/markings did not acquire a new global exposure while source shadows/sky became more readable. Its asset-provenance file verifies all37 runtimequality asset hashes unchanged during capture. Geometry/material changes from the artist also repaired the clearly wrong road crosshatch; this is not an isolated lighting A/B for all surfaces.

Benchmark02's new fine asphalt made the old1900 practical pools look excessively yellow/bright against dark facades. The next repair reduces practical maximum to1000, changes lamp color to warm-white #ffe4c4 and lifts night hemisphere0.26 to0.38. The accepted player headlights/product remain untouched. This calibration needs the next integrated runtime review; it is not an approval by numbers.
