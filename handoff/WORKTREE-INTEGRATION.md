# Four-worktree integration into main

The owner authorized merging the completed rider, premium UI, race cinematics and audio worktrees, repairing integration defects and validating the combined game. This is a local main integration. No push, publication, deployment, dependency addition or metered generation was performed. The original worktrees and their commits remain available.

## Recovery and merge history

The original main is `35cadcfb3c2a35a530f751686e449b22bdfa0116`, retained as `codex/integration-baseline-20260922`. Merges preserve branch history:

| Work | Included branch tip | Merge |
| --- | --- | --- |
| Rider | `8c562e9788dd8addef978e5d66e3afc60affe6db` | `641d224` |
| Premium UI | `fd0a9d23580bd0c7069d60668d22118c1cceea37` | `bb60c9e` |
| Race cinematics | `3aa404faaafddfdfb5c2eed3e8a31b79f3507c92` | `7947c90` |
| Audio | `9b34b299a01c8d7ef4284f39e467462d8a451b59` | `4f0bbb6` |

The premium entry design keeps the complete Ryker controls, products and showroom Route relief. The packaged asset allowlist is the union of all four deliveries. Simulation, driving, career/reward implementation, routes and Ryker assets retain their baseline bytes. Audio settings are additive and preserve saved zero values. The owner's untracked `P06C-HOME-KICKOFF.md` remains untouched; its SHA-256 is recorded in the validation receipt.

## Integration repairs

- Preserve the cinematic score on the existing captured audio graph and make both score systems share Music. Scene music yields during films and returns afterward. Music off, master mute and pause silence the film immediately; changing Interface no longer controls its music.
- Clear impact and suspension cooldowns when simulation time resets, so a new attempt can play legitimate contact sounds immediately. Reset itself stays silent.
- Restore damaged UTF-8 career reward text and the audio retry label.
- Update existing browser drivers to use the visible cinematic Skip control before driving or returning. Accept the actual victory label for first place.
- Update the career parity assertion for existing immutable Chapter 01 entry creation: re-entry freezes the earned build; subsequent free previews must preserve the entire career state exactly.

New audio regressions were demonstrated failing before the repairs and passing afterward. The browser audio test measures the actual post-limiter signal, including film music with Interface at zero and silence after Music off.

## Validation

See `WORKTREE-INTEGRATION-VALIDATION.json` for the final outcomes and `worktree-integration/` for logs, screenshots and machine-readable reports. After each merge, TypeScript, the complete test suite and the curated production build were checked. Packaged browser checks cover the redesigned rider, desktop/mobile UI, Ryker controls, audio scenes, career progression and cinematics. Controlled physics runs are gameplay/reward evidence, not sustained performance evidence.

The final suite passes **429/429**. The combined game passes all ten Slingshot career events, the Ryker valid-lap/reward/earned-part flow, both rider drives, desktop/mobile sound controls, a valid cinematic race with automatic result return, native-clock cinematic/audio capture, and ordinary keyboard drive/pause/return for both vehicles without test hooks. All 613 inventoried inputs in the tested package match the committed runtime. `b84c2f5` contains the final integration repairs; subsequent handoff-only commits do not alter those tested inputs.

The initial baseline test run missed one real-time audio capture synchronization anchor under load; subsequent complete runs passed without relaxing thresholds. The first final career navigation showed the generic loading recovery; direct and garage-transition diagnostic reproductions loaded successfully without exceptions. The complete isolated rerun passed all ten career events, purchases, reloads, frozen Cup entries, Chapter 01 revisits and all six free route/mode previews. The loading failure did not recur and its cause was not established. Failed evidence is retained alongside the successful rerun.

The existing sustained High/Ultra performance gate remains **HOLD**. No Phase 3 work or human listening/physical-device approval is implied.

## Recover locally

```powershell
npm ci
npm test
npx tsc --noEmit
npm run demo:build
$env:PORT='5252'
npm run demo:preview
```

Open `http://127.0.0.1:5252/`. The server is loopback-only and prints its owned PID. Rebuilding the game uses committed assets and requires no generation credentials. Do not rerun metered asset-generation scripts to restore the checkout. The owner handles any later push or deployment.
