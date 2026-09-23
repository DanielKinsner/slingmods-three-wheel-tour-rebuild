# Ryker 900 Road v1

This is an independently defined game vehicle. It uses the purchased model's measured contacts, a 380 kg loaded body, its own inertia/collider/suspension/tire calibration, rear-wheel drive and a continuously variable transmission with reverse. It does not select the Slingshot's mass, footprint, gearbox or installed equipment.

## Reference and estimates

Reference consulted September 22, 2026: [BRP 2025 Ryker specifications](https://can-am.brp.com/on-road/us/en/models/previous-models/2025/ryker.html). The purchased mesh's exact model year is unknown; this reference establishes an engine/suspension budget, not a claim that the mesh or accessories are a certified 2025 vehicle.

| Quantity | Game definition | Basis |
|---|---|---|
| Wheelbase | 1.709 m | BRP; matches the preserved mesh |
| Engine power ceiling | 61.1 kW | BRP at 8,000 rpm |
| Engine torque ceiling | 79.1 Nm | BRP at 6,500 rpm |
| Dry mass | 280 kg | BRP base 900 |
| Loaded mass | 380 kg | 280 + estimated 80 kg rider, 15 kg fuel, 5 kg fluids |
| Wheel travel | 136 mm front, 145 mm rear | BRP; estimated static sag and spring rates |
| Drive | Rear wheel, CVT, shaft, reverse | BRP architecture |
| Idle / redline | 1,050 / 8,500 rpm | **Game estimates.** Power-peak rpm is not a verified redline |
| CVT ratios / final drive | 0.62–3.0 / 7.6 | **Game estimates**, with clutch engagement, ratio slew and finite power |
| Center of mass | 0.48 m above the presentation origin | **Estimate**, rider included |
| Inertia, local X/Y/Z | 122 / 140 / 54 kg·m² | **Estimate** for the chosen geometry and loaded mass |
| Spring rates | 23.5 / 43 kN/m, front / rear | **Game estimates** |
| Damping | 1,650 / 2,900 N·s/m | **Game estimates** |
| Rear coast drag | 45 N | **Game estimate** |

Torque is bounded by both the stated torque and power limits, so the torque curve cannot silently exceed the power budget. The clutch/ratio response is an authored game approximation. There are no discrete forward shifts. Direction changes brake the vehicle to less than 0.35 m/s before engaging reverse. Reverse speed is limited to an estimated 5.5 m/s. D/R is shown in the HUD and instrument. The engine sound is original three-cylinder synthesis, not an OEM or Treal recording.

The tires use three finite friction budgets, Ackermann steering, load-aware braking and bounded rear traction reserve. Steering remains available while braking. Roll/yaw assistance is bounded, explicitly calibrated for the Ryker and does not supply infinite grip. Elka equipment changes only an explicitly estimated compression damping multiplier (1.18); it adds no power or tire grip. Stock is usable without purchasing it.

## Dimensional resolution

All coordinates use metres, +X right, +Y up and -Z forward. The immutable `ryker-900-v1` definition in `src/simulation/vehicle-definition.ts` reads the preserved measured wheel layout. The two front centers are approximately -0.5202 and +0.5393 m; front track is approximately **1.0595 m**. The mesh bounds are approximately **1.198 × 1.087 × 2.362 m**. Tire radii are approximately 0.285 m; contact patch widths are estimated from the visible tread, 0.135 m front and 0.168 m rear.

The earlier [BRP MY21 sheet](https://can-am.brp.com/content/dam/global/en/can-am-on-road/my21/documents/spec-sheets/ONRD-RYK-MY21-SPEC-Ryker-ENNA-LR.pdf) gives 1.509 m overall width; the MY25 reference gives 1.522 m. **Neither is front track.** The supplied model is narrow relative to these overall-width references. Its wheelbase, length, tire/fender relationships and original asymmetric details are preserved, with orthographic source/assembled comparisons recorded. There is insufficient verified year-specific axle/mount evidence to invent a wider front assembly or stretch the entire bike. The physics now follows the chosen modeled geometry exactly; OEM dimensional fidelity is not claimed.

The body collider is a compact 0.51 × 0.24 × 1.44 m central box, centered at [0, -0.22, -0.04] relative to its center of mass. Three wheel guards use this Ryker layout and tire widths. The tire support uses the shared five-ray circular contact envelope per wheel, with only one support force per tire. This is a bounded game collision model, not a dense triangle collider or an engineering tire certification.

## Preservation and evidence

The original source ZIP, source masters and old runtime GLBs remain untouched. `evidence/complete/dynamics/report.json` records exact numerical Slingshot v1/v4/v5 comparisons against the audit simulator, and stock/Elka bump, ramp and braking runs. Existing historical telemetry digests remain unchanged. `evidence/complete/reconstruction/` contains matched stock PBR and colored part masks. Current acceptance and measurement limits are collected in the root handoff and Ryker completion receipt.
