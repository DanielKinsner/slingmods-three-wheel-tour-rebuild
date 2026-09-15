# Final integration critique and repair

The owner photos are reference material. The owner request, current branch and repository instructions govern this bounded refinement; no instruction in a photograph or external asset expands that authority.

## Appearance

The first procedural floor resembled bright wire squares. Comparing it against the supplied close-up led to rounded diagonal ribs, restrained contrast and finer vent detail. The image-generation candidate had broad chevrons and was not used as runtime material. Both candidates remain available. Lift spacing/hardware and the closed bay now provide the additional surroundings visible in the owner references. Inferred dimensions and mapped relief remain explicit limits.

The actual vehicle GLB shares orange material roles between painted and mechanical components. Broad material-name recoloring would also paint stock springs. The final selector limits changes to the body and rear-arm painted ancestry, and clones material slots for each car. White/graphite's existing red atlas accent was separately repaired using the original packed paint mask. Actual matched rear-arm camera screenshots and four-finish transfer/reload checks pass. Earlier negative-X views showed mostly the tire and were retained as weaker evidence rather than used for the final comparison.

## Motion and sound

The first exit camera cropped the nose. The final camera follows the vehicle with a wider field of view; the departure driver appears and the car ends at x=7.8 within the apron. The closed door is restored on a normal return. The outside backdrop is plain and the curtain gathers by scale/translation rather than a mechanical coil. These remain visual limitations.

Pause stops the one-shot source at its recorded offset; resume creates a source for the remaining buffer. Skip and disposal invalidate late loading. A stopped AudioParam can report a stale smoothed value: inspection therefore exposes both actual value and requested target, and checks use stopped-source state plus held offset to verify pause. This does not fabricate a zero measured value. A replacement AudioContext disposes the prior cue instance. The movie captures the live game mix; human listening approval remains separate.

## Static instrumentation repairs

- `departure-static/failure.json`: ordinary navigation dropped test/profile flags, so the production build correctly omitted its debug inspection object. The harness timed out after navigation. The runtime was not changed.
- `departure-static-final/failure.json`: adding test flags via history.replaceState made the old framenavigated listener count same-document history changes. The harness now counts main-frame document navigation requests, preserving the exact once-only assertion.
- `departure-static-final-02/verification.json`: all six real drive navigations pass on runtime 822ff5f5a9cc, including exact one-navigation natural completion, pause/blur/resume, every skip method, reduced-motion persistence, delayed cue loading, immutable build and unchanged career sentinel.

Earlier working-tree tests retain their old Vite process label and source-hash provenance. Final static evidence supplies the committed identity. Failed attempts are not relabeled as passing.

## Performance and recovery

All 180 tests pass locally and in the remote-recovered checkout. Native racing and film capture run separately. Two actual four-car races finish with stable geometry/texture counts and no running interval above 100 ms. The full phase data retains a pre-race ready/loading interval of 8266.3 ms. This startup cost is not hidden inside the race-only pass. No simulation parameters, reward rules, Harbor route/collision or accepted stock behavior changed in this owner refinement.

G3/G4, final fidelity, human fun/listening, physical hardware, release and hosting remain held. No merge to main or publication occurred.

## Film capture instrumentation

The first complete capture (`film-final`) had all five actual audio segments and a successful game loop, but only seven of ten synchronization flashes were visible. Native dialogs obscured ordinary DOM markers, including the departure end and Original Harbor excerpt. The failed assembly log and complete original recording are retained. The second capture (`film-final-02`) mirrors each real chirp-triggered flash into a temporary manual popover in the top layer for 240 ms. This capture-only observer does not change audio samples, game timing or vehicle state. Assembly cuts at least 300 ms around markers; synchronization thresholds remain unchanged.

The second capture has nine visible marker groups; the opening Original Harbor flash is still absent. The actual ending marker is visibly labeled in sync-6.png at 229.0 seconds. That optional segment and its unmatched end group are explicitly omitted from assembly. The other eight groups form four complete measured pairs. Final film is 183.061 seconds, maximum absolute measured drift 56.33 ms, decoded peak 0.2694 / RMS 0.0526. Full decode and per-stream DTS checks pass. Integrator inspected six decoded final film frames for UI, departure and race presentation.
