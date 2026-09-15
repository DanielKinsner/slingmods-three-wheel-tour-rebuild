# Static-output hardening review

## Final frozen runtime verification

`hardening-final/report.json` passed all 11 checks on frozen runtime `758c2b291a9b5bd525fe9acd1425537657fadf70`, served from `demo-dist/2026-09-15T04-11-59-668Z-758c2b291a9b`. `setup/hardening-final.log` retains the complete final output.

The separate ordinary-keyboard run `native-final-02/report.json` passed six flow stages without scene hooks: root Tab/Enter, real throttle motion, pause and held-throttle neutral gating, camera change, held-R fresh attempt, garage/shop comparison and equip state, deliberate first-party product popup/return, reload and fresh crew audio boundary. The exact product URL resolved to the intended RGB kit page and reported SM-133. Product return retained the same garage document and demo state. The 720p controls and installed-shop images were visually inspected for legibility and gauge separation.

`native-final/report.json` is a retained harness failure: it dereferenced the camera settings before the next real animation frame wrote them. A null-tolerant polling repair passed; no runtime change was needed. `native-final-result.json` points to the successful report and its hash. All test browsers were closed before final movie capture.

## Repaired candidate: 11/11 checks passed

Tested the actual static server at `http://127.0.0.1:5188`, serving `demo-dist/2026-09-15T04-08-53-131Z-6f473ee7d258-working`. Exact candidate identity, harness SHA-256, timestamps and all observations are in `hardening-repaired/report.json`; terminal output is `setup/hardening-repaired.log`.

The headless browser used explicit ANGLE D3D11 and muted host output while enabling the actual Web Audio graph. The measured renderer identity was NVIDIA GeForce RTX 4080 / Direct3D11. These are functional checks, not performance measurements or a human listening certification.

### Verified behavior

- Root visitor entry requests no GLB/HDR, exposes no scene testing globals, and has four ordinary action links. Historical scene/asset/neutral/diagnostic selectors are rejected. On 390 × 844, the explicit keyboard/WebGL 2/no-touch-driving note is visible before the first drive action: note bottom 460 px, action top 490 px.
- Injected 404 responses for the current vehicle, required brand sign model, daylight HDR, lazy crew JavaScript and shared runtime JavaScript produce a readable recovery panel. Removing each interception and clicking **Retry page** restores one scene canvas. The shared runtime chunk contains the embedded physics WASM; there is no separate WASM request to intercept.
- Injected audio-bank metadata failure leaves the ready game usable and presents **Sound unavailable — retry**. Removing the interception and clicking the existing sound button enables sound with exactly one AudioContext and one audio control panel.
- Holding a required model request leaves a visible ordinary exit that returns to Development Preview. No placeholder model is substituted.
- Chromium launched with `--disable-webgl` reports graphics unavailability and offers recovery. Actual `getContext('webgl2')` returns null in that test.
- During a natively started crew race with enabled audio, `WEBGL_lose_context.loseContext()` pauses the race and audio. Physics ticks stop at 218 and remain 218 on the later observation. Retry starts a fresh ready scene at zero ticks, one canvas, one audio UI, and sound requiring a new deliberate enable action.
- Recovery makes the background inert, declares an aria-modal alert dialog, and keeps repeated Tab navigation inside its two actions. The 720p context-loss screenshot was visually inspected: heading, explanation, focused retry and return action are readable.
- Native Back returns to a working single-canvas garage. A separate explicitly dispatched `pageshow` event with `persisted=true` verifies the full reload branch and a fresh document identity; this is **not** a claim that native BFCache restoration occurred.

## Internal failures and repairs retained

`hardening-initial` preserves the initial eight passing cases and two ordinary-click timeouts, with its exact executed harness. A D3D11 follow-up passed Back/restoration, but sound did not enable. No definitive cause is claimed for the initial click timeouts.

The follow-up uncovered a real output-closure defect: the initial staged output omitted `assets/audio/p03b2`; requesting its `provenance.json` returned HTTP 404. The lead added the complete runtime-used metadata and nine WAV files to the staged allowlist and added closure regressions. No audio source/graph change was needed. The successful repaired-candidate run covers normal enable plus injected failure/retry.

Independent visual review also identified a demo-return link overlapping the race gauges and a narrow-screen support notice below the drive actions. The link now sits away from the gauges and is hidden during active driving; a concise support notice precedes actions on narrow/coarse-pointer screens. The repaired candidate includes these changes.

Global art approval, G3/G4, complete race/reward validation and the final performance matrix are separate gates. This report does not replace them.
