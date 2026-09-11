# Astra director addendum 01 — Finish one convincing Slingshot

**Decision: KEEP the correct rebuild. Do not start over.**

Reviewed snapshot: `b073e1e2d4fab9e5eaf3ef4ed9aefacbd34c2cc5`, supplied as `Astra-Review.zip`.

This addendum narrows **P03** and opens one targeted drivetrain correction. It does not replace the fresh-start policy, repeat P00, import an old game, change the engine, or authorize a wider campaign. The current rebuild is already the fresh project we wanted.

## 1. Work in the right place and preserve the baseline

Every implementation command must use this root explicitly:

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
```

Confirm `git rev-parse --show-toplevel` once. The Codex task's default directory may still be `slingmods game`; do not use it for implementation. Do not make a third project, reset to the reviewed commit, wipe work, or overwrite historical accepted evidence. Inspect and preserve any legitimate changes made since the supplied snapshot. Do not rerun the original project-scaffolding kickoff.

Keep the existing Three.js/TypeScript/Rapier application, dimensional contact layout, isolated save namespace, Blender export pipeline, and useful driving tests. Existing P01 clay remains a baseline, not a final asset. Historical G0/G1/G2 decisions remain historical records; append the new finding rather than rewriting their evidence.

Read `AUDIT.md` for findings and evidence. This task is implementation, not a request for another proposal. Make routine design and engineering choices without asking Dan to choose options. Use isolated tools; never take over his mouse or make him perform repetitive QA. Do not spend money, change deployment targets, or touch the live storefront.

## 2. The next deliverable is P03A, not the whole original P03

Build **one finished-looking Slingshot in a compact material-inspection/showroom bay**, and prove that the same asset still drives on the existing pad. No campaign, extra vehicle, rivals, shop, new race circuit, full workshop, city, weather system, or extra cinematics in this packet.

The selected vehicle remains the **US-market 2024 Slingshot R AutoDrive**. Finish the existing reference direction: **Radar Blue Fade bodywork, black structural/trim surfaces, correct contrasting wheel finishes**. Use the existing verified reference dossier, including the AutoDrive cockpit images. Do not import a later-year fascia. SlingMods red `#C91820` is a restrained accent in the bay/UI, not a substitute for the vehicle's reference paint.

The bay is a small purpose-built space: a neutral floor with subtle texture, charcoal rear wall, broad overhead fixtures, one restrained SlingMods accent, and lighting that reveals panel curvature. It is **not** the final interactive garage. Do not model a building full of tools, lifts, merchandise, and background props yet.

## 3. Correct the confirmed RPM defect in a small separate change

In the reviewed `src/simulation/drivetrain.ts:15`, wheel RPM uses:

```ts
(Math.abs(speed) / radius + Math.abs(rearOverspeed)) * 60 / (2 * Math.PI)
```

This makes equal positive and negative overspeed produce the same engine input. The tire presenter, however, integrates signed wheel rotation from longitudinal speed divided by radius **plus** signed overspeed (`src/simulation/index.ts:135`). A braking/locking wheel and a spinning wheel must not become the same drivetrain state.

Run the included reproduction **from the project root**:

```powershell
node --experimental-strip-types --test SlingMods-Astra-Review-01/repro/drivetrain-wheel-speed.test.mjs
```

The reviewed version passes three fixture checks and fails the lock regression. Correct signed rotational-speed handling before taking magnitude and keep clutch/idle/shift behavior explicit. A one-expression signed-sum hypothesis passed the isolated four tests in Astra's environment; that is a diagnosis, **not** a fully validated game patch. Use the actual rear-contact longitudinal/wheel state where appropriate rather than creating a second competing RPM model.

Add the regression to the project's normal test suite, and exercise wet braking, wheelspin, recovery, reverse, normal rolling, and shifts through the full simulation locally. Do not weaken assertions to approve the old result. Record the outcome in a short new G2 addendum. No general physics rewrite or retuning campaign is authorized here.

The artist can work on the visual candidate while this small correction is made in separate files. Both must be resolved before this packet is submitted as complete.

## 4. Rebuild weak surfaces, not the entire application

The present car has recognizability. The next standard is convincing **surface construction**. The current hood/fenders and cockpit are not final shapes awaiting a color change.

Work in this order:

1. **Primary panels and cockpit proportions.** Rework the hood-to-wing transitions, front fascia and lamp apertures, side boarding cutout, rear shoulders/undertray, dashboard/console, seat shape, and windshield section. Match the existing model-year photographs using corresponding viewpoints. Preserve sharp design creases where the real design has them; use controlled curvature and panel thickness elsewhere. Avoid folded-sheet silhouettes, intersecting decorative slabs, abrupt flat spots, and smoothing that rounds away identity.
2. **Surface/reflection check before full material work.** Export the candidate, use neutral clay plus a glossy diagnostic material and a broad moving light/reflection source, and inspect it in the browser. This exposes pinching and faceting earlier than texture production. This is a local artist/reviewer checkpoint, not a request for Dan to approve an image.
3. **Finish the large readable details.** Model credible lamp housings/lens sections, wheel rim depth and spokes, restrained tire tread/sidewalls, windshield transparency, cockpit instruments/controls, seat bolsters, seams, and useful mechanical detail visible from chase/cockpit. Do not spend the next pass adding tiny bolts while primary body forms remain weak.
4. **UVs, maps, and runtime materials.** Provide valid UVs for surfaces that need maps. Author actual scale-appropriate roughness/normal/base-color detail; bake Blender-only procedural networks where necessary. Paint needs controlled clearcoat reflections, not metalness set to 1 everywhere. Rubber, textured plastic, upholstery, painted panels, metal and lenses must remain distinguishable under the same light. Do not bake directional highlights into paint or use noise as a substitute for material design.

Keep the accepted ground-reference origin, axes, wheel centers/radii, steering/spin hierarchy and declared part/camera mounts. Do not scale a visual body independently from the physical contacts. The empty driver seat is explicitly unfinished until P03B; do not introduce an inaccurate mannequin merely to tick a box.

Use new versioned sources/exports such as `slingshot-p03a.blend` and `slingshot-p03a.glb`. Keep the accepted P01 file unchanged. Integrate through an explicit candidate selection while under review; replace the default asset only after the local review is genuinely satisfied.

If two revisions fail the same surface problem, change the construction method or topology in that area. Do not respond by adding subdivision everywhere, postprocessing, stronger reflections, or more props.

## 5. Make the export economical while keeping editable source

The current hero has **214 mesh primitives and 34,688 triangles**; the recorded whole-scene frames report roughly **450 rendering calls**. This is not a mandate to reduce visual quality. It is a reason to improve batching before four detailed vehicles share a scene.

Keep logical editable objects in Blender. In the export, merge static parts by material and transform space where safe. Retain independent steering/spinning wheels, suspension bindings, lamps and replaceable stock/accessory islands. Do not flatten mount transforms or merge away upgrade visibility control. Join equivalent spoke geometry into each wheel's appropriate exported material mesh rather than submitting every spoke separately.

Use the original art budgets as **ceilings to justify, not triangle quotas to fill**. Favor a driving/export layout that can later support LODs. Report the candidate's triangles, material groups, textures/resolutions, estimated or measured texture memory, and actual renderer call counts at the same views. A provisional engineering aim is roughly 40–70 hero color-pass draw calls; it is a planning target, not a universal rule or an automatic pass condition. A justified exception is better than a distorted asset.

## 6. Repair lighting artifacts and make progress easy to open

The supplied movie shows large rectangular dark bands moving across the otherwise open pad, clearly visible around 9–10 and 14–16 seconds. Diagnose this. In the reviewed workbench, every mesh casts/receives shadows and the directional shadow area follows the car. Start with controlled caster/receiver isolation, then check shadow bounds/bias and receiver geometry. These are hypotheses, not an established root cause.

Do not approve a fix that simply disables all vehicle contact shadows or hides the floor in darkness. Capture the same pad maneuver before/after with the artifact absent and a credible vehicle shadow retained.

Add a simple showroom/look-development route. Once it works, make the normal application entry open that bay, with direct **Inspect** and **Drive** actions. Keep explicit calibration and driving-pad routes available. Do not make Dan discover query strings to see the newest work. Keep UI minimal; diagnostic load numbers belong in a toggled overlay rather than a final-looking menu system.

Use the existing renderer. Do not migrate to WebGPU, add a shader framework, or invent a new state architecture for this packet. Shader compilation, material disposal and capture flags may be improved in focused changes. Runtime footage must show the exported asset, not a Blender-only render.

## 7. Ownership and review

Use at most the useful roles: one vehicle artist owns the candidate Blender/source/export/maps; one integration lead owns the small drivetrain fix, runtime bay, renderer/shadow work and tests; a separate reviewer inspects the actual results read-only. Keep write ownership separate. When a genuinely separate review context is unavailable, label the review self-reviewed rather than inventing independence.

Do not regenerate the old evidence archive. Keep one concise current comparison set and one new review note. Existing gate hashes are provenance checks, not taste judges.

Acceptance for this packet:

- Recognizable geometry is now convincing in neutral front, side, rear, three-quarter and cockpit views, not merely under attractive dark lighting.
- A light sweep shows controlled panel surfaces without obvious pinching/faceting or intersection problems.
- Actual exported paint, plastic, tire, upholstery, glass, lens and metal materials read differently at useful viewing distances.
- The candidate drives using the existing dimensional/animation contracts; no new wheel/steering mismatch, and the identified shadow bands are repaired.
- The RPM regression is repaired and integrated tests are rerun locally, with honest results.
- Export statistics and the testing environment are recorded. Software-renderer results are not sold as hardware frame-rate or subjective handling approval.

**G3 remains pending.** P03A does not contain the finished rider, complete camera/audio set, final garage/track sample, or physical-hardware performance evidence required by G3. Do not mark G3 passed or begin P04 because this narrower packet looks good.

## 8. Deliver and stop at a visible checkpoint

Produce `Astra-Review-02.zip` (number it if that name exists) in the correct rebuild root, containing:

- A short `REVIEW-ME-FIRST.md`: exact commit/root, local launch command and entry URL, changes, remaining limits, test results/environment, candidate file names, and honest gate status.
- Six current runtime images: front three-quarter, side, rear three-quarter, cockpit, close material detail, and the bay as normally opened.
- One short runtime turntable/light-sweep recording and one short pad recording showing the new asset and the shadow repair. Label silence and software-rendered timing honestly. Do not add audio merely for this deliverable.
- Relevant source/Blender/export/maps plus the focused tests and before/after statistics. Exclude dependencies, downloaded tools, secrets and redundant historical evidence.

A missing capture stays explicit; do not substitute concept art. Commit a reviewable local checkpoint only after verifying that it contains no secrets or unrelated work. No deployment or storefront changes.

End with the ZIP's exact path and a concise statement of what passed and what remains. Do not ask Dan to choose a style, tune suspension values, operate Blender, or conduct the test run.

**Later, not now:** P03B will make the car enjoyable to drive/present through driver contact, gamepad/keyboard tuning, the additional driving cameras and coherent engine/tire audio. P03C will finish the actual garage and the small day/night road sample and performance evidence. Only then do we consider the race/upgrade slice. For this run, finish P03A and stop.
