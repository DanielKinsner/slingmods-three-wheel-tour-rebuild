# P10B native performance

Windows 11 Pro / i9-12900K / RTX4080 / 128GB / Chromium153 ANGLE D3D11 / DPR1

Frozen runtime: `bc657a1f9cd77506569e2ac1ee368d75431c42e2`. Native timing is distinct from controlled-clock functional proof and recorded film.

| Route / build / view | Resolution | Attempt | p95 ms | p99 ms | Max ms | Pass |
|---|---:|---:|---:|---:|---:|---|
| harbor day / stock / near | 1920 | 1 | 16.70 | 16.80 | 16.80 | True |
| harbor day / stock / near | 1920 | 2 | 16.70 | 16.80 | 16.80 | True |
| express day / equipped / near | 1920 | 1 | 16.70 | 16.80 | 16.80 | True |
| express day / equipped / near | 1920 | 2 | 16.80 | 16.80 | 16.80 | True |
| ridge day / stock / near | 1920 | 1 | 16.80 | 16.80 | 33.40 | True |
| ridge day / stock / near | 1920 | 2 | 16.80 | 16.80 | 16.80 | True |
| ridge night / equipped / cockpit | 1920 | 1 | 16.70 | 16.80 | 16.80 | True |
| ridge night / equipped / cockpit | 1920 | 2 | 16.70 | 16.80 | 16.80 | True |
| ridge day / equipped / near | 1280 | 1 | 16.70 | 16.80 | 33.40 | True |
| ridge day / equipped / near | 1920 | 1 | 16.70 | 16.80 | 33.40 | True |

Targets: p95 ≤20 ms, p99 ≤33.4 ms, maximum active interval ≤100 ms; numerical tolerance 1e-6 ms only. All participants must finish validly; no substituted outcomes.

## Showroom costs

Cold entry to ready: 5910 ms. Separate from scored racing.

| Phase | p95 ms | p99 ms | Max ms |
|---|---:|---:|---:|
| entry-idle | 16.70 | 16.80 | 16.80 |
| free-orbit | 16.70 | 16.80 | 16.80 |
| first-finish-material-changes | 16.80 | 16.80 | 33.40 |
| warm-finishes | 16.70 | 16.80 | 16.80 |
| first-product-material-changes | 16.70 | 16.80 | 50.00 |
| remove-products | 16.70 | 16.80 | 16.80 |

Each original interval remains in native-showroom-02/verification.json. Material compilation/load stalls remain visible; ready/load is not relabeled as active racing. Two leave/return cycles and optional asset failures are separately covered by loop-final-01/preparation-final-01. Native render object counts are not GPU memory measurements.

The first nine native races use d341ae77e48f. Only showroom loading-stage warmup changed afterward; warmup-runtime-equivalence.json verifies all race inputs unchanged. The tenth race uses final bc657a1f9cd7. Repaired showroom measurement inputs equal final exactly. Original native-showroom-01 preserves the 599.9 ms first-finish hitch; repaired run 02 reduces it to 33.4 ms. Loading duration is cache-sensitive and is not a universal speed claim.

Baseline P10A retained in its historical native reports; this is a presentation-only change with unchanged Sport v3 and routes. Current checks support this workstation and browser only, not universal hardware/mobile certification.
