# P09B final film review

Final: `P09B-Signature-Finish.mp4`
Runtime: `bf1297c97703` (captioned throughout).
Duration184.362 seconds (3:04);20,076,405 bytes.
SHA256: `8f3d24a0b0fb9457739f120e1fb052a8fd7ea802b613715d6868456dec1ac551`.

## What is shown
Actual current showroom entry; finish/lighting/preset changes; shocks and storage installation cues; Thermal product; physical dash switched off/on; saved recipe; equipped bay-door departure; acceleration/shift, stable braking and reverse; career invitation; one complete native-speed earned Express event; result/reward; earned purchase/remove/re-equip; return to showroom and front/rear inspection. Input automation is captioned. The career race uses the control-only evidence driver, without changing poses, checkpoints, clocks or results.

## Editing / sound
Six captured game segments. Only loading/navigation and measured sync-marker boundaries are cut. A small runtime / edited-capture caption is added during encoding. No replacement soundtrack, time warping or fabricated engine recording. Career UI is captured from its new audio graph, including transaction cues. The live capture was taken from each scene's actual game master audio mix.

Per-segment recorded chirps were aligned with actual captured magenta sync flashes; all complete segments retained. Largest absolute measured drift75ms; values and raw sources inFILM-VERIFICATION.json. Decoded final audio peak0.45481, RMS0.038787; every segment has nonzero game signal between markers. These are signal/synchronization checks, not human by-ear listening approval. No listening approval is claimed.

## Visual inspection
Inspected actual encoded frames at15s,64s,160s and180s plus the source powered-display and74mph HUD screenshots. Runtime and automation labels are visible. The car/art/hoops/front remain the current version; settings show sound enabled without a false Enable sound control. HUD remains readable against bright road, earned-workshop transaction state is visible, returned showroom retains the expected owned preview. The metadata label occupies a small bottom-left strip; the original footage is retained unmodified.

## Preserved prior failures
- film-01 stopped after screenshot review exposed a CSS hidden-state control bug, now repaired inruntime.
- film-02 fully captured five valid segments, then its final-return harness clicked a sound-enable button hidden asynchronously by successful auto-restore. Fixed recorder race by verifying actual enabled state; fullretryfilm-03 passed. No game defect or fabricated sound claim.
- First encode attempt could not resolve fontconfig; portable assembler now resolves an explicit local font path. ENCODE-ATTEMPT-01.txt records the failure. No font asset is shipped or required by game runtime.
