# Review16 — owner showroom refinement

## Start here

This replaces the earlier Review16 ZIP and includes its relevant P08B verification. It continues the same private feature branch. Runtime: **822ff5f5a9cc211775076074c7d106e8d372286a**. The ZIP's MANIFEST.json supplies the exact pushed packaging commit and a hash for every payload. No main merge or publication occurred.

Watch `director-kit/production/evidence/P08B-Refinement/film-final-02/P08B-Signature-Experience.mp4`, then compare `screenshots/02-floor.jpg`, `04-closed-bay.jpg`, `05-lift.jpg`, `06-departure.jpg`, and the four-finish comparison `14-four-swingarm-finishes.jpg`. Reference photos are shown in the labeled composite `13-owner-references.jpg`; full original images are recoverable from Git.

## What changed

- Reference-guided gray/charcoal/red vented floor tiles with rounded diagonal ribs, normal relief, roughness and drainage detail. The generated image candidate was evaluated but rejected for oversized ribs; the final maps have editable procedural source.
- Nearby closed bay door, four-post lift details, wall stripe, chest and compressor. Original showroom and vehicle assets remain preserved.
- Test This Build plays a 5.8-second skippable departure through the actual door. Pause/resume, focus loss, Escape/button/controller skip and reduced-motion bypass work. Quick Race remains direct. The transition animates presentation only and transfers the existing validated build recipe to the existing drive.
- Swingarm paint follows all four accent palettes, including graphite for white/graphite. Stock springs, calipers, metal, trim and other cars retain their materials. Returning to blue/orange restores the original material exactly.
- One ElevenLabs-generated door effect plays through the actual game mix and respects sound settings and lifecycle. The successful request used 35 provider credits. No voice/music, account change or purchase was needed. No credential is included or required for playback.

## Validation and honest limits

Read `handoff/P08B-REFINEMENT-VALIDATION.json` for the complete current receipt. All 180 tests pass locally and in the isolated remote checkout. Required recovery covers 181 runtime/editable inputs. Integrated static tests cover six actual departure navigations, all skip modes, audio loading while paused, build/save return, all four paint transfers/reloads and preservation of the earned P08A career.

Two native 1920×1080 four-car Express races use a disclosed control-only automated player and the ordinary rivals/shared physics. Every participant finishes; player places fourth. Running-phase p95 is 16.7/16.8 ms; maxima 33.3/16.8 ms, with no running frames above 100 ms. A recorded 8.27-second ready-phase loading gap remains in `native-express/all-phases.json` and the raw data. Capture runs are separate from performance measurement. These are same-host Chromium/RTX4080 results, not hardware-wide certification.

The 3:03 film contains actual game audio, including the synthetic door cue, captured from the live WebAudio graph. It uses real-speed footage and measured visual/audio synchronization; loading and synchronization boundaries are cut. The departure is briefly paused through the real UI to finish the audio segment before navigation. The optional Original Harbor excerpt is omitted because its opening synchronization flash was absent; the complete Express race remains. Full video and individual audio recordings remain in Git. No fabricated racing result or replacement soundtrack is used. Human listening/fun approval remains open.

The floor uses mapped relief rather than individual physical slots; room dimensions are inferred. Door gathering is an animation approximation and the small exterior apron is plain. Final OEM/room fidelity, rear articulation, physical controller/device testing, G3/G4, human listening/fun, release and hosting remain held. This packet asks for director review, not approval of those gates.

## Recover and run

Clone `https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git`, select `feature/p08b-slingmods-experience`, and check out the packaging SHA in MANIFEST.json. Then:

```powershell
python scripts/verify-p08b-refinement.py
npm ci
npm test
npm run demo:build
$env:PORT='5197'
npm run demo:preview
```

Open **http://127.0.0.1:5197/**. Build Your Slingshot → paint/products → Test This Build → departure → free drive → Back to Showroom. Quick Race opens Express or Original Harbor. Continue Career preserves the earned chapter; `/?scene=crew&play=demo` remains the separate easy-entry demo.

This lean packet is not a standalone executable. Full runtime/editable assets, original recordings, references and historical evidence are in the private Git repository. REMOTE-ASSETS.json and REMOTE-EVIDENCE-INDEX.json give exact paths/hashes. `python scripts/restore-p08b-data.py <NEW_OUTPUT_DIRECTORY>` restores the packet's focused historical data; use the same command in the full checkout for all original records. Dependencies, Blender/browser binaries, generated static output and browser saves are machine-local.

Next action: Astra reviews the refreshed packet. Preserve the feature branch and held gates.
