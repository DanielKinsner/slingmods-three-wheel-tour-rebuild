# P10A native performance

All eleven configurations, two complete consecutive native races each. Unfiltered phase/tick data and retry epochs retained in each run.json and checkpoint.json. No capture, tracing, compression or other browser/Blender job during measurements. Audio graph enabled with host output muted. Numeric comparison tolerance 1e-6ms only.

Host: Windows 11 / i9-12900K / RTX4080 / 128GB; Chromium 153 ANGLE D3D11. These are same-host tests, not broad hardware qualification. Renderer string is retained for each run in native-matrix.json.

| Configuration | Attempt | p95 ms | p99 ms | Max active ms | Result |
|---|---:|---:|---:|---:|---|
| native-1280-ridge-day-stock-final-01 | 1 | 16.800 | 16.800 | 33.300 | PASS, all four finish |
| native-1280-ridge-day-stock-final-01 | 2 | 16.700 | 16.800 | 16.800 | PASS, all four finish |
| native-1280-ridge-day-equipped-final-01 | 1 | 16.700 | 16.800 | 16.800 | PASS, all four finish |
| native-1280-ridge-day-equipped-final-01 | 2 | 16.700 | 16.800 | 33.300 | PASS, all four finish |
| native-1280-ridge-night-stock-final-01 | 1 | 16.700 | 16.800 | 16.800 | PASS, all four finish |
| native-1280-ridge-night-stock-final-01 | 2 | 16.700 | 16.800 | 16.800 | PASS, all four finish |
| native-1280-ridge-night-equipped-final-01 | 1 | 16.700 | 16.800 | 33.400 | PASS, all four finish |
| native-1280-ridge-night-equipped-final-01 | 2 | 16.700 | 16.800 | 33.400 | PASS, all four finish |
| native-1920-ridge-day-stock-final-01 | 1 | 16.800 | 33.400 | 66.700 | PASS, all four finish |
| native-1920-ridge-day-stock-final-01 | 2 | 16.800 | 16.800 | 33.400 | PASS, all four finish |
| native-1920-ridge-day-equipped-final-01 | 1 | 16.700 | 16.800 | 16.800 | PASS, all four finish |
| native-1920-ridge-day-equipped-final-01 | 2 | 16.700 | 16.800 | 33.300 | PASS, all four finish |
| native-1920-ridge-night-stock-final-01 | 1 | 16.700 | 16.800 | 33.400 | PASS, all four finish |
| native-1920-ridge-night-stock-final-01 | 2 | 16.700 | 16.800 | 16.800 | PASS, all four finish |
| native-1920-ridge-night-equipped-final-01 | 1 | 16.700 | 16.800 | 33.400 | PASS, all four finish |
| native-1920-ridge-night-equipped-final-01 | 2 | 16.700 | 16.800 | 33.400 | PASS, all four finish |
| native-1920-ridge-night-cockpit-final-01 | 1 | 16.700 | 16.800 | 33.300 | PASS, all four finish |
| native-1920-ridge-night-cockpit-final-01 | 2 | 16.800 | 16.800 | 50.000 | PASS, all four finish |
| native-1920-harbor-equipped-final-01 | 1 | 16.700 | 16.800 | 16.800 | PASS, all four finish |
| native-1920-harbor-equipped-final-01 | 2 | 16.800 | 16.800 | 16.800 | PASS, all four finish |
| native-1920-express-equipped-final-01 | 1 | 16.700 | 16.800 | 16.800 | PASS, all four finish |
| native-1920-express-equipped-final-01 | 2 | 16.700 | 16.800 | 16.800 | PASS, all four finish |

Acceptance retained: p95<=20ms, p99<=33.4ms, max-active<=100ms. All 22 attempts pass. Frame pacing quantization near16.7ms is expected for the native 60 Hz lane. Loading/ready and instrumented lifecycle measurements are separate and not removed from their raw phase data.

Geometry/texture/program counters are logical object counts, not GPU-memory estimates. The warm/cold preparation report uses a fresh browser HTTP context with existing OS/driver caches. No deliberate hardware-cache flush was performed. The film has capture overhead and is not a performance benchmark.
