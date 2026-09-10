# G2 addendum 01: signed rear-wheel RPM correction

Historical G0/G1/G2 evidence and decisions are unchanged. This new addendum records Astra's confirmed defect and a narrow repair after reviewed baseline b073e1e2d4fab9e5eaf3ef4ed9aefacbd34c2cc5. G3 remains pending.

The supplied direct-module regression was run against the actual original module: 3/4 passed, wheel-lock regression failed. After24 ticks, a locked-wheel input incorrectly yielded4950 RPM versus3711.37 for free rolling. The fix combines signed longitudinal/radius and overspeed contributions before taking magnitude. Locked forward and reverse fixtures now settle at idle, while additional wheelspin increases RPM. The same signed arithmetic helper is used for wheel phase. No coefficients or assertion bounds were retuned.

The existing launch/idle floor,10000 RPM/s crank response, reverse engagement below0.5m/s and shift torque interruption remain explicit approximations and are unchanged. The powertrain samples tick-start body-forward speed and previous overspeed. The tire presenter uses contact-projected longitudinal speed and overspeed updated by this tick's force computation. Shared algebra does not make those two states identical.

A controlled experiment feeding the same-tick contact projection into the powertrain failed the existing strict ramp lane drift bound. Its source and failure log are retained in diagnostic-contact-projection and integrated-initial.log. That extension was not retained, and the ramp bounds were not relaxed. A broader rear-wheel-state/rotational-inertia model is outside this narrow correction.

Validation on Windows / Node24.15.0 / npm11.6.2 / Rapier0.20.0:
- Supplied native-strip-types regression4/4 after repair, unchanged assertions.
- Normal npm test suite27/27, including all16 earlier checks,5 signed-speed fixtures and6 integrated RPM scenarios.
- Integrated traces include wet braking, unassisted wet wheelspin and lift/brake recovery, reverse, moving reverse interlock, ordinary rolling, incline and real integrated shifts through gears1-5.
- Tests verify wheel phase increments follow signed angular-speed telemetry, reverse rotation sign, zero drive torque during shifts, bounded engine RPM and recovery to idle. TypeScript checking passed.

Measured maximum absolute difference between the engine's tick-start angular input and the rear wheel's end-of-tick angular telemetry (rad/s): straight0.10245, reverse0.03727, wet loss/recovery7.07032, moving reverse interlock0.12669, incline1.46483, wet braking6.91452, rolling/shifts4.91482. Full per-tick inputs/state are in integrated-rpm-traces.json. This is an explicit model/timing estimate; it is not exact OEM coupling or subjective driving approval.

No audio, controller, general handling retune, feature expansion or G3 approval is included.
