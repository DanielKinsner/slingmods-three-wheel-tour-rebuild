# P05 performance acceptance continuation

Continue only in `C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild`. Do not reset or restart. Last verified runtime is `7fe1e881b0712be2fa09b4c4eec6baa9d0ebb0d6`; later packaging commits contain reports and evidence, not a different game. Current source is bound by `director-kit/production/evidence/P05/build-inputs-verified.json`.

I0–I4 are integrated. The 102-test suite, 4,200-object exact player parity, two full-field physics fixtures, contact/rule/save/controller/audio/UI tests, fresh chapter and existing career flows, complete wall-clock video and eight runtime stills are delivered. P05-01 through P05-17 and P05-19 have local evidence with stated method limits. P05-20 review is complete with an open performance finding; P05-18 acceptance remains held. G3/G4, human fun/audio, physical-controller feel, foreground and other-hardware performance are not approved.

The original unrecorded stock720 seed97 case had a 366.6ms active interval near 48.3 seconds, clipping 266.6ms under the accepted 100ms session cap. Its neighboring submission/physics elapsed spans do not identify actual CPU execution or a root cause. The original heavy equipped1080 first/retry repeat missed p95/p99 at 33.4/50ms. See `performance-summary.json` for the original matrix and separately retained followups. The later trace and clean stock720 followup did not reproduce the pause. The full 426MB diagnostic trace remains local; its hash and selected events are packaged. No source cause was confirmed. Do not call non-reproduction a repair or blame another application from a later activity sample.

The remaining work is bounded diagnosis in an observed low-contention host window, without stopping or controlling user apps: repeat the same clean case, retain host conditions, and separately trace a reproducible stall. If evidence identifies an app cause, repair that cause and rerun parity plus affected tests and a fresh matrix. Do not weaken thresholds, alter physics/collisions/rules, discard old samples, fake results, or reduce the labeled drawing buffer. Current chapter functionality does not need rebuilding.

With the existing matching preview already running on port 5187, the next exact clean command is below. A timestamped new evidence directory preserves every prior attempt. It launches only an isolated headless browser and does not record video. Run alone, not beside tracing, video encoding or other Codex GPU work. Absence of concurrent user load cannot be guaranteed or achieved by taking over the desktop.

```powershell
Set-Location -LiteralPath 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
$env:EVIDENCE_DIR='director-kit/production/evidence/P05/resume-equipped1080-'+(Get-Date -Format 'yyyyMMdd-HHmmss')
$env:WIDTH='1920'; $env:EQUIPPED='1'; $env:RACES='2'; $env:SEED='11'; $env:RECORD='0'
node scripts/profile-review10.mjs
```

For the original stock case use a fresh `resume-stock720-...` directory, WIDTH1280, EQUIPPED0, RACES1, SEED97. For a separate trace, choose another new directory with the same environment values, then run `node scripts/review10-trace-generated.mjs`. The preserved derivative is identified in trace-harness-provenance.json and is diagnostic only. The one-time wrapper scripts/trace-review10.mjs refuses to overwrite its already generated source/provenance; do not rerun that wrapper over them. If dist is unavailable, `npm ci` then `node scripts/build-review10.mjs` and `npm run preview` creates a new manifest at the then-current commit; preserve the old manifest/evidence and label the new runtime accurately. Never overwrite the frozen manifest to make new captures appear old.

P05 changes are scoped to shared simulation coordination, competition/controller/UI, career/chapter, rival resource/audio integration, and supporting tests/scripts. Accepted public assets and player physical constants are unchanged. Packaging-only changes after the runtime freeze are README, this resume note, review generators, day/trace capture tools, current ledger and selected P05 evidence. Historical archives, Blender originals and unrelated untracked work remain in place. This file records a continuation; it does not promise automatic background work.
