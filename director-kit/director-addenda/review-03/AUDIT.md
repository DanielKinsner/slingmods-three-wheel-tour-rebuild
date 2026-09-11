# Astra Review 03 — keep the gains; separate the remaining work

**Date:** September 11, 2026  
**Input:** `Astra-Review-03.zip`  
**Runtime checkpoint reported:** `404dff91255eb0dadcaadeb81075f86508f36607`  
**Packaging checkpoint reported:** `0db7ede7ea5e4f8a1d2edbf947e583ab40e15193`  
**Decision:** retain the implementation; accept named prototype improvements; retain the front/tire fidelity limitations; G3 remains pending. Authorize the narrow, independent work streams in `CODEX_NEXT.md`.

This is a review of the uploaded snapshot. I have not accessed Dan's live Windows workspace, modified his repository, executed Blender, independently rendered the complete application, tested a physical controller, or measured target-device performance.

## 1. The local team followed the stop rule

The package explicitly returns **HOLD**, naming broad outer-brow end caps, segmented leading-edge transitions, and approximate tire grooves. Its construction record preserves unsuccessful local approaches and does not award a blanket visual PASS. That is the correct response to the last directive, not misconduct or a reason to discard the build.

There is genuine, visible improvement. It still is not a finished, high-fidelity vehicle. The director's job now is to avoid both accepting a weak hero asset and holding unrelated controls work behind an indefinitely repeated cosmetic loop.

## 2. What I accept for the current prototype

### Cockpit and graphics

The padded gray seat inserts and black bolsters separate more clearly. The steering rim, hub/control pods, and selector stack are more deliberately shaped. The conspicuous stepped graphic boundaries are cleaner in the final cabin/cockpit views. I inspected the actual PNGs and same-rig baseline captures, not just the local review's descriptions.

These are **named improvements**, not certification of every cockpit detail, working instruments, exact paint, or a finished driver-camera experience. There is no driver. Screens and instruments remain passive.

### Wheel construction

Swept spokes, a darker barrel, and lug recesses improve the former straight-bar wheel. The tire no longer looks uniformly smooth. However, machined faces remain dark in these views and the tread is still conspicuously coarse. Preserve the useful work; retain tread/machining fidelity as an explicit final-asset limitation. It need not prevent testing analog controls.

### Inspection and presentation

The compact bay has a more intentional neutral/dark fixture arrangement. The full vehicle stays visible in the sampled orbit views. I independently checked the supplied orbit metadata: all 156 recorded bounds are in front of the camera and the maximum absolute recorded normalized-device coordinate is 0.7800000000000011. This checks the recorded path; it does not prove arbitrary camera or resize behavior.

The front still has bright highlights, but my rejection is not 'a highlight is white.' The front's broad planar edge faces and abrupt transitions remain visible in both the ordinary image and changing reflections.

### Retained engineering

I independently compared the supplied simulation modules, shadow policy, contact/pad layouts, pad GLB, P03A baseline GLB, and focused RPM regression test against Review 02. All ten selected protected files are byte-identical. The newly added inspection module and modified workbench are the runtime source changes in this package.

The **five focused drivetrain checks were executed here and all passed** using Node 22.16.0 type stripping against the submitted source. The previously repaired signed wheel-speed behavior is retained.

Evidence: `evidence/independent-rpm-tests.log`, `evidence/independent-inspection.json`, and `evidence/workbench-diff.txt`.

## 3. The front remains the principal visual blocker

The front and front-three-quarter views still show broad bands across the outer brow and a segmented, thick-looking leading return. The large forms read as an approximate panel assembly rather than the coherent manufactured surface in the selected vehicle reference. The connected lamp opening and lower return are better than the old detached assembly, but do not resolve the outer shell.

For external comparison I opened the same dealer-origin front and front-three-quarter photographs identified by the reference dossier. They are visual observations, not OEM CAD, a metric survey, color calibration, or redistributable textures. The model/photo viewpoints are approximate; I did not compute a new millimeter-accuracy fit. See `SOURCES.md`.

### What the construction code actually does

In `scripts/vehicle_p03a1_build.py`, `cage()` closes the first and last sectional loops with single polygon end faces. `sectional()` samples along the rows, calls that cage without subdivision, and assigns a single face normal to the terminal caps. It also applies a fixed set of hard feature breaks through the transverse section. The wing's terminal section is supplied at one common longitudinal coordinate.

Those are observable implementation facts. My diagnosis is that this closure/section scheme is a significant contributor to the broad end-face and transition problem. That is a **source-supported hypothesis**, not a claim that every visible defect has been isolated experimentally. The actual geometry and normals must be tested in the runtime before accepting a repair.

Simply raising subdivision counts, smoothing every edge, changing paint, or revising the whole car again is not the next assignment. Previous supported-subdivision attempts also failed locally; 'use subdivision' alone would just repeat an already tried instruction. `FRONT_SHELL_SPEC.md` specifies a different, much smaller boundary-controlled surface proof.

## 4. Independent asset and package checks

| Directly inspected exported data | P03A baseline | P03A1 candidate |
|---|---:|---:|
| Triangle count across unique mesh definitions | 176,218 | 192,839 |
| Mesh primitives | 52 | 59 |
| Materials | 20 | 20 |
| Embedded images | 16 | 16 |
| GLB bytes | 7,726,756 | 9,433,140 |

Every inspected primitive has a first UV channel. These figures come from parsing the actual GLBs, not copying the report. They are not runtime draw calls, GPU allocation, FPS, or a quality score. The candidate is a disclosed showroom asset being used on the pad; racing LOD and hardware profiling remain future work. More polygons are not the acceptance criterion.

The input ZIP has 215 members, including its manifest. All 214 manifest entries match the supplied bytes; no listed file is missing. All 71 motion-capture input records also match the uploaded source/asset bytes. This ties evidence records to the snapshot; it does not independently prove their execution history or visual quality.

The GLB SHA256 is `f2a417f75028b534a334168670baac3a411d1a0731bd927d0e82a43c8006b1b9`. The input ZIP SHA256 is recorded in `evidence/independent-inspection.json`.

The included `evidence/inspect_archive.py` reproduces the archive, asset and protected-file comparisons using Python's standard library. It is a read-only reviewer utility, not another production gate system to integrate.

## 5. What the recordings prove—and what they do not

I independently ran ffprobe and a full ffmpeg decode on both movies. Both decode without logged errors; both are 1440×960 H.264 video-only streams encoded at 12 fps. The orbit is 13 seconds; the pad maneuver is 20 seconds.

I visually inspected seven orbit samples and ten pad samples extracted at two-second intervals, plus all eight final stills and selected same-rig baseline images. I did not inspect every encoded frame. The sampled pad images show the candidate moving, steering, braking, changing chase distance and retaining its vehicle shadow without the former sweeping bands. They do not establish subjective driving enjoyment.

The package correctly labels the pad film as scripted, frame-stepped capture. The capture script calls `__TWT.advance(...)`; the supplied workbench's advance path calls `draw(seconds, true)`, which snaps the chase camera. This film therefore **does not validate the ordinary smoothed chase-camera path or real keyboard/gamepad input**. It is valid art/binding evidence, not fake evidence; it was never represented as a human playtest.

That missing controls/camera proof is now a useful independent next task. It should not wait for perfect tire grooves.

`evidence/independent-media-check.json` rechecks the movie hashes and recorded projection/speed values. Raw capture PNG sequences are omitted from the input ZIP, so I did not revalidate their individual frame hashes. The metadata's frame counts and bounds are reported separately from independent stream decoding and visual sampling.

## 6. Test provenance and limits

**Executed independently here:** five focused RPM tests; archive/GLB/PNG-header inspection; selected protected-file byte comparisons; manifest and 71 input-hash checks; both movie probes/decodes; visual sampling and source inspection.

**Reported by the submitted package, not rerun here:** the 30-test suite, production TypeScript/Vite build, browser route/binding checks, Blender export validation, and source/topology freeze checks. I inspected the submitted final test and build logs, which report 30/30 and a successful build with a chunk-size warning.

**Not established:** physical GPU frame rate or memory, actual gamepad hardware, ordinary input latency or camera feel, phone support, full race/gameplay loop, model-wide final fidelity, authentic measured vehicle dynamics, or G3 completion.

The container could not resolve `registry.npmjs.org`; the app dependencies are not installed here. I did not substitute a different Three.js/Rapier version or claim a complete game rerun. No Blender execution is claimed.

## 7. Director change: two bounded streams, one handoff

My previous instruction made all controls work depend on finishing the entire visual pass. That was too serial. The safe alternative is **not** to pass the model or expand into the campaign; it is to separate independent engineering work from the remaining art risk.

**P03A2: one front-shell repair/proof.** Work on one outer brow/leading return and its immediate interfaces. Freeze the cockpit, wheels, maps, rear, and bay. Make a genuinely boundary-controlled surface rather than another global polish pass. Maximum two evaluated candidates in this assignment. Promote only after the local surface proof works; otherwise keep the current best vehicle and return the narrow blocker.

**P03B1: input, chase camera, and one small practice route.** Use the current provisional vehicle while developing analog control, reliable keyboard/controller lifecycle, ordinary chase-camera behavior and a short cone-guided handling route on the existing pad. Do not rewrite dynamics or turn the pad into a campaign course. This stream may finish regardless of the art stream's verdict.

G3 stays pending. Driver, sound, remaining cameras, full workshop, day/night road sample, racing, upgrades, and the other vehicles are not silently authorized. The full high-fidelity vehicle requirement remains; only the development dependency changes.

The next deliverable is one `Astra-Review-04.zip`. Dan should not be asked to run QA, choose aesthetics, or resolve routine technical decisions. No desktop takeover, restart, destructive cleanup, paid purchase, or deployment is authorized.
