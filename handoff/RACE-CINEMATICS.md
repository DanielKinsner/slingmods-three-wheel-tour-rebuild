# Race cinematics — isolated local candidate

Owner assignment: create new high-end race cinematics while other agents redesign the rider and UI. This work is on `codex/race-cinematics`, in the managed `race-cinematics` worktree, based on `7b5018570ed0bb40f83e25e9c6bba96b435aca9e`. The shared main checkout, index, rider files, UI files, and owner kickoff were not edited. No push, merge, deployment, new dependency, paid asset, or service was used. This does not release the Phase 2 performance HOLD or start the Phase 3 roadmap.

## Play

Production preview: `http://127.0.0.1:5237/?scene=express&route=express&mode=race&look=golden-hour&play=preview&cinematic=arrival`.

Enable sound, then use **Director's cut** in the lower left to replay Destination, On the grid, or Victory. The preview films are explicitly labeled; previewing Victory cannot create a finish or reward. Start a race for the automatic grid film. A valid finish plays the celebration once. First place says Victory; other finishers receive their actual place and time. Invalid runs are not celebrated.

The automatic sequences can be disabled in Director's cut. The preference uses its own localStorage key, outside career/build saves. Escape, Space, Enter, Backspace, the on-screen button, or a released-then-pressed controller confirm/back/menu button skips. Reduced motion bypasses automatic camera travel; explicit previews show a brief static composition. Leaving or hiding the page cancels the sequence and stops its score.

Recovery: `npm ci`, `npm run build`, then `npx vite preview --host 127.0.0.1 --port 5237 --strictPort`. Use a free port if another agent owns that one. Development in this worktree used 5217. Do not stop the other agents' servers.

## The sequences

- Destination: 9.5 seconds. A descending establishing shot, low asphalt approach, then the destination title portrait.
- On the grid: 7 seconds. Tire detail, side dolly, front hero reveal, and a crane back to the driving position before the ordinary countdown starts.
- Finish: 8.3 seconds. Low finish tracking, a continuous rear-to-front orbit, and a held hero portrait with the real classification. The camera follows the actual vehicle; this is not a fabricated replay or simulation slow motion.

The same tracks adapt to the Slingshot and Ryker, actual equipped paint/parts, all three destinations, their existing lighting, and portrait layouts. Scenery collision rays and ground clearance constrain the camera. Parked introductions add the existing soft tire-contact presentation, because no simulation contact tick has happened yet.

The lens adds depth-aware defocus, highlight-derived horizontal halation, restrained grain, and vignette in the existing composite pass. Depth decoding supports the renderer's reversed and logarithmic modes. A separate HDR/depth target is allocated lazily for films and reused; ordinary driving keeps its original target and does not execute the extra texture samples. That cached target remains resident until resize, quality change, or disposal. No new shadow maps, downloaded textures, or additional full-scene passes are introduced.

The original score uses synthesized sub impacts, filtered air, and a short harmonic resolution. It joins the existing captured master limiter and obeys master volume, interface volume, explicit sound activation, mute, and lifecycle cleanup. It does not replace either vehicle's engine synthesis or claim an OEM sound recording.

## Integration for the other agents

Most implementation lives in `src/presentation/cinematics/` and `src/audio/race-film-score.ts`. Four existing files contain small integration changes:

1. `src/express.ts`: lifetime-owned director, deferred first start, camera override after ordinary presentation, neutralized controller input while keeping device identity, and test-only preview inspection.
2. `src/presentation/render-pipeline.ts`: optional `FrameLook.cinema`, lazy cinematic target, and composite shader extension.
3. `src/audio/game-audio.ts`: score bus access and cleanup.
4. `src/demo/profile.ts`: three allowlisted preview link values.

There are no edits to the rider, vehicle geometry, CrewUI, showroom UI, physics, race rules, rewards, or save schemas. The small independent Director's cut disclosure can be relocated by the UI agent without changing the director. Preserve the hooks when reconciling `express.ts`. Review and cherry-pick the local commit only after the owner chooses how to combine concurrent work; do not switch the busy main checkout or auto-merge.

## Verification

Run the focused unit/regression command recorded in `evidence/cinematics/RECEIPT.json`. `scripts/cinematics/check.mjs` exercises real WebGL views, unchanged telemetry/storage during all preview tracks, both vehicle types, all destinations, portrait layout, reduced motion, input skip, an actual input-driven checkpoint-valid lap, once-only finish presentation, and the native wall-clock film with captured live audio. `BASE_URL` and `EVIDENCE_DIR` select the preview server and output folder.

`scripts/cinematics/inspect.mjs` samples authored shots for visual inspection. Its camera seek hooks require an isolated controlled test in the ready state; they cannot award anything. Normal play uses the actual frame clock. Screenshots are rendered game frames, not generated mockups. Failed development attempts are retained locally alongside the final evidence; the receipt distinguishes them.

No quiet-PC sustained benchmark or physical controller/mobile-device certification is claimed. The existing large Rapier bundle warning remains. The visual source is the current committed vehicle/rider/world art; the other agents' uncommitted redesigns are intentionally absent from this branch.
