# G2 independent review in progress

Reviewer /root/gate_review. This is an incomplete review, not a G2 PASS. Final repaired dynamics build and stress-motion evidence are pending. G3 remains closed.

Inspected current src/workbench.ts, actual browser-capture scripts, runtime rest/left-turn/reverse images, keyboard-motion.json and keyboard-filmstrip.png. Independently probed driving-keyboard.webm with ffprobe: VP8, 1280x800, 25 fps, 19.2 seconds, no audio stream. Independently decoded that actual video with ffmpeg at 5 samples/second into four 5x5 contact sheets (384x240 thumbnails), and visually inspected all 96 samples in chronological order. Extraction went only to a reviewer-specific temporary directory; original evidence was untouched. This is sampled visual inspection, not normal-speed human playback or listening.

Observed keyboard evidence: 61 telemetry samples, real Playwright W/A/S/X/Escape/R key input with the normal animation loop. Acceleration ends at 10.24 m/s; left steering moves x negative and produces positive steering; exit reaches 17.31 m/s; braking lowers speed to 1.73 m/s; selected reverse reaches -3.54 m/s; final braking reaches 0.0012 m/s. The pause before/after telemetry objects are identical. Held reset returns x approximately zero, z approximately 35 and simulation time 0.1 s. Page errors are empty. The sampled video shows forward landmark motion, a left arc, slowed braking and backward landmark motion with R displayed. The near chase maintains a level horizon and stable subject framing without a view flip in these mild maneuvers.

Presenter findings sent to lead before finalization:
- Front wheel steer/spin quaternions and suspension center height consume authoritative wheel telemetry, but the cockpit steering_control node has no binding to steering state. Bind its local-axis rotation before final steering-visual acceptance.
- resetHeld survives pause/blur/visibility boundaries and can combine partial holds across interruptions. Reset continuous-hold timing on interruption.
- The four existing cap images are identical final poses produced by renderFrame(..., present=false). This validates fixed-step schedule equivalence only. It does not establish intermediate wheel/camera coherence or actual 30/60/120/144 Hz presentation.
- The keyboard run advances only about 0.5 simulation second per wall second under SwiftShader because elapsed time is capped; its 25 fps recording also contains repeated rendered poses. It cannot establish real-time physical GPU performance or controller feel.

No additional blocking near-chase or keyboard-control defect was observed in the sampled mild-drive evidence. Art finishing, empty clay seats, detailed suspension link kinematics, audio and mobile/controller hardware remain outside this limited P02 observation. Whole-vehicle suspension attitude in curb/incline impacts still awaits final repaired evidence.

Known blocking integration issue under active engineer repair: straight incline launch develops uncommanded yaw after landing; high-speed curb trajectory needs review. Current broad green dynamics tests do not overrule this blocker. Final source snapshot, stress traces/videos, steering-control binding and interruption-safe held-reset behavior must be inspected before deciding G2.
