# P08B showroom refinement — independent review

Verdict: no outstanding correctness blocker found within this bounded refinement after the repair pass. The final integrated departure proof passes; the limits below remain held.

## Scope and independence

Bounded review of the owner-requested finish, showroom and departure refinements. Shared runtime was read-only for this reviewer. The reviewer authored only `tests/p08b-refinement-finish.test.ts`; the integrator and other workers own the runtime, artwork and integrated browser harness. This is not an independent re-certification of the reviewer's earlier Sport/Express implementation.

## Repaired findings

- Player finish now includes the actual exported rear swingarm accent role and uses the same palette as the swatches. White/graphite is graphite, not red. Explicit role selection excludes calipers, stock/DDM springs and machined parts.
- Original material identities, maps and colors survive blue restoration and disposal. Latest-request generation guards prevent a delayed texture from overriding a newer finish or a disposed presenter. Shared rival material palettes remain unchanged.
- Editable showroom metadata now identifies the refined `.blend`, with nine reference photographs and inferred dimensions. Runtime door and lift use the refined asset. Existing vehicle source and old atlases remain preserved.
- Departure now restores usable showroom controls and scene state after a caught navigation/construction failure, displays the existing driver during the departure, and ends at x=7.8 on the authored apron.
- Recreated AudioContexts dispose the previous door-cue instance. Cue pause retains offset, muted gain respects the settings, skip/disposal cancel delayed loading, and no automatic unmute was introduced.

## Verification reviewed

- `reviewer-tests-final.txt`: reviewer ran 5/5 passing tests: four actual canonical-GLB material-role tests plus the departure path/clearance test. Material fixtures retain real exported names, parent relationships, shared palettes and base values; they do not require GPU/image decoding. Tests include every finish, protected hardware, shared rival isolation, disposal, late asynchronous completion and central swatch agreement.
- `finish-tests-initial.txt` and `finish-tests-02.txt` preserve initial test-construction failures (syntax and a Three.js clone-array identity assumption). These were corrected in the test, not product defects. `finish-tests-03.txt` records the four passing finish tests. TypeScript compilation passed after the integrated APIs landed.
- Integrator's `tests/p08b-door-audio.test.ts` covers retained pause offset, mute/volume and late cancellation; the integrator reports 2/2 passing. This reviewer inspected that test and the current audio source without independently replaying those tests.
- `assets/source/showroom-refinement/finish-repair.json`: 87,218 original orange-mask atlas pixels changed to graphite; outside-mask pixels, original vehicle `.blend` and previous white atlas unchanged.
- `../P08B/showroom-refinement/runtime/verification.json`: isolated actual-asset browser proof passes with no errors. This reviewer viewed `bay-closed.png`, `bay-open.png`, `floor-close.png` and `lift-details.png`. Tile rib pattern, lift structure and framed working curtain read clearly. Door transform starts closed and lifts/scales open. Draw counts are asset observations, not a frame-time gate.

## Final integrated departure proof

Reviewed `../P08B/showroom-departure-complete/verification.json` and its three unedited screenshots. PASS: six actual Express navigations, no page errors. Build label is `ef5927527413-working`, so this evidence describes the tested working tree, not a final pushed SHA.

The harness uses normal runtime RAF and actual UI buttons/keyboard, plus explicit isolated standard-controller samples and browser focus events. It checks natural completion navigates once; Escape/button/controller skip; pause and focus loss freeze motion; reduced-motion preference persists and bypasses departure; saved build, immutable recipe and legacy career sentinel survive returns; driver appears during the departure; and return starts with the curtain at its original closed position and scale. Static showroom simulation telemetry remains unchanged during presentation motion. No fixture physics stepping or car/door transforms are injected by the harness.

The first paused sample is at 0.95 seconds with the door partly raised and car still parked. The leaving sample is at 4.2332 seconds, door fully open and car x=2.7771. All three screenshots were inspected: driver and complete vehicle remain visible, the departure controls are legible, and normal configuration UI returns. Closed-door state is verified numerically; the return screenshot's front camera does not itself show the door.

Audio evidence confirms the cue source is stopped at a retained 0.890667-second offset during pause, with gain target zero; its sampled AudioParam value still reflects the preceding smoothing value. The source being stopped is the relevant silence condition. Deliberately delayed cue loading while paused stays stopped at offset zero and is canceled by skip. Browser playback is muted for the harness; this is lifecycle proof, not human listening approval.

Earlier integrated-attempt failures remain in the sibling `showroom-departure*` directories. The UI worker repaired the evidence field and asynchronous audio/focus assertions and adjusted the framing before this final pass. They are not deleted or treated as successful runs. The integrator separately reports the full suite at 180 passing tests; this reviewer did not replay the full suite.

## Limits

The open bay's gray exterior and short apron can read flat in a still image; final motion should be judged in the integrated capture. Floor vent relief is mapped; dimensions are inferred, not surveyed. No new destination or simulation collision is implied by the showroom presentation. This report does not grant G3/G4, final OEM/room fidelity, real-hardware input, human listening/fun, release or publication approval, nor certify an unfinished film, ZIP, remote commit or performance gate.

