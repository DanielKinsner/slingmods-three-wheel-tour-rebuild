# 01 — Confident braking and test-drive entry

## A. Finish the driving intent, do not trade it away

Owner target: punchy, responsive, forgiving racing. Sport v1 already improves acceleration and cornering; keep that character. Stock must be enjoyable without purchasing DDM shocks. Reverse must remain clear and reliable, not accidentally engage while braking through zero.

Read the existing `src/simulation/profile.ts`, combined tire forces, brake-steering modifier and contact/guard implementation. Review the **matched-speed** traces, not the misleading fixed-time-to-brake traces whose entry speeds differ. Current near-stop distances: legacy/Sport ~36.84/49.93 m at 60 mph and ~128.18/158.85 m at 110 mph. The legacy 110 result also has ~10.3° yaw, so simply restoring old coefficients is not acceptable. Sport currently scales braking to .70 and reduces steering allowance up to35% under braking.

Instrument before changing: requested/actual longitudinal and lateral force, wheel loads/contact/travel, friction saturation, yaw/roll/pitch, chassis and passive-guard contacts/impulses, speed, input and stopping path. Establish whether the limiting issue is tire allocation, unloaded-wheel requests, chassis/guard interaction, assist logic or something else. Do not treat the local prior diagnosis as proven.

Develop a stable bounded repair using the existing three-contact model. Brake-force/load allocation, documented anti-lock/stability assistance or a specifically evidenced erroneous guard interaction may change. No hidden yaw/position teleport, no path-following player motion, no extra fourth tire-force channel, no mass/scale fudge, no lowering vehicle speed or route precision merely to obtain a pass. A visual handbrake/drift gimmick is not required.

Use a new versioned Sport tune if behavior changes; preserve v1 and legacy as read-only test references. Keep all exposed coefficients and assist behavior documented as game modeling, not OEM specifications. Product adjustments must remain compatible, removable and meaningful without inventing extra grip or performance gains for visual-only parts.

### Internal design goals, not real-vehicle claims

Aim for 60-mph near-stop around40m or less, and stable110-mph near-stop around140m or less, on the same flat-asphalt diagnostic. These are useful target improvements, not a mandate to falsify forces. Record best achieved and stability tradeoffs when not attained. From straight input, aim for <=2° accumulated yaw and <=0.5m lateral displacement without coarse correction; preserve secure tire support and controlled chassis attitude. Do not prefer an unstable shorter stop.

Preserve approximately the current4.73s simulated0–60 launch unless a justified correction is needed. Retain responsive left/right low/medium steering and stable fast sweeps. Include matched brake-turn tests at partial and full braking in both directions, with actual stop/path/yaw outputs and a short normal-camera demonstration. Less understeer must not become unavoidable spins. Validate noisy analog, digital keyboard, imperfect steering pulses, release/re-press reverse, explicit direction, pause/focus/disconnect and wall recovery.

Do not demand Dan run these tests. A human-fun claim still requires human feedback; automated input and footage must be labeled honestly.

## B. Preparation that feels like part of a game

Latest native Express evidence: reported preparation9.846s; a ready-phase interval8.266s. This does not identify the cause or prove eight seconds of unresponsive interface. Instrument the actual transition from Test This Build/Quick Race, with separate timings for fetch/cache, GLB/image decode, construction, shader/material preparation, first frame, first controllable frame and return. Note timer/RAF boundaries so a waiting interval is not mislabeled as CPU rendering cost.

Improve the slowest measured dependency. Reuse exact immutable assets/decoded resources where safe, avoid unnecessarily loading the full world for an unrelated screen, warm necessary shaders deliberately, and dispose duplicate scenes/listeners/audio safely. Keep compile behavior supported by the installed renderer. Preserve current visual settings, geometry and product fidelity; do not make a hidden lower-quality default to improve the number.

Provide a responsive branded loading/progress state with meaningful stages, failure/retry and cancel/back where safe. Start the departure film only at the right preparation point; do not pad/fake percent completion or hide an unbounded stall under animation. Skip/reduced-motion/blur/pause must work, and the build recipe must survive aborted or failed transitions.

Measure cold and warm paths honestly, with installed/configured assets and repeated garage→Express→garage cycles. Initial target: materially improve cold first-control time under the same disclosed host conditions and make warm return/re-entry reuse demonstrable. Report exact measured improvement; no arbitrary universal loading guarantee.

Keep timing capture separate from video and benchmark automation overhead. The decisive acceptance is a responsive, recoverable entry plus repeat-race stability—not a reduced average that discards loading or failed trials.
