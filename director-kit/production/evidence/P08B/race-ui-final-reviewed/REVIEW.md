# Exact-runtime race UI acceptance

Runtime: `6aa1dafaac03`, static local server 5197. No runtime edits were made for this check.

Actual Express one-lap race finished validly in 4th at 1:25.225. All production rivals finished. Input comes only from the disclosed EvidenceDriver through the production control adapter. The controlled clock makes this a functional/UI proof, not a wall-clock performance benchmark.

Nine screenshots cover HUD, expanded pause/help/audio controls and naturally reached results at 1280x720, 1920x1080 and 2560x1440. All corresponding viewport/panel overflow and minimum control-size checks pass. MPH/gear labels equal telemetry. Audio volume changes through ordinary arrow keys and focus wraps in both directions between its slider and the first race action. Pause holds the race clock. Race Again starts a different attempt ID. Preview results state no career reward.

Manual review of `hud-1280.png`, `hud-2560.png`, `pause-help-1280.png` and `results-1920.png` confirms the actual car/course remains visible, primary HUD information sits away from the driving line, help copy and focus are readable at 720p, and result/time/actions are clear. The panel/camera layouts remain within each viewport. No further runtime repair was needed.

The initial sibling `race-ui-final` folder retains a screenshot-harness failure: resizing a controlled-clock scene left the graphics backbuffer clear between manual renders. Its verification was marked failed after image review. This reviewed run waits for resize, then continuously redraws the exact same simulation clock while capturing; an assertion verifies that no additional physics ticks occur. All natural race states and results remain unmodified.

Suggested lean screenshots: `hud-1280.png`, `pause-help-1280.png`, `results-1920.png`; include the full JSON records/trace and this review. All nine screenshots remain available in Git evidence if space permits.
