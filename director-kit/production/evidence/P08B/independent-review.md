# P08B independent integration review

Reviewer: art worker, reviewing integration code owned by other workers. Scope is source inspection of Signature scene/config/catalog/UI, Express entry/return, shared audio, career migration and receipt/profile changes against Review15 packets 01, 04, 05 and 06. This is not independent certification of the reviewer's own authored art.

No browser, Blender, race benchmark or heavy job was started during this review. Findings below retain the original source-proven execution paths and their repair dispositions. Existing early screenshots are superseded by room/logo repairs and are not used to claim final visual acceptance. Film, final performance runs, packaging and handoff were already known to the lead and are not repeated as new findings.

## Repaired integration findings

Follow-up source inspection found no remaining open code finding from this bounded review. Original line references below identify the finding snapshot and can shift as integration changes. UI-worker recovery evidence was read directly from `recovery-check/verification.json`: all five injected cases passed (Storage getter denial, Storage method denial, missing asset, unavailable WebGL, and context loss). This reviewer did not independently rerun that browser suite.

### P1 — Temporary preview storage cannot survive the required drive navigation

- `src/signature/config.ts:30-31`: unavailable Storage getters select a module-local `Map` fallback.
- `src/signature/config.ts:27-28`: the drive snapshot is written/read through that fallback.
- `src/signature/scene.ts:77`: Test This Build / Quick Race immediately uses `location.assign`, creating a fresh document and module instance.
- `src/express.ts:29`: the destination reads the drive snapshot before scene startup.

With Storage denied, showroom configuration appears usable and reports a temporary session, but navigation discards the Map. Express then throws because no drive snapshot exists. Returning to the showroom also loses the original draft. The advertised temporary mode therefore cannot complete the core preview → drive → return loop. Method-level getItem/setItem denial is a related uncovered path: acquiring the Storage object succeeds, so no fallback is selected and ordinary draft changes are rejected.

Repair: give the temporary draft/drive scope an explicit origin-checked portable handoff across these same-origin navigations, or keep this temporary flow in one document. Preserve denied/corrupt durable data. Verify getter-denied and method-denied cases through ordinary preview, drive and return; do not merely test the fallback repository within one JavaScript module.

**Disposition — repaired.** The lead added validated local URL fragments and Storage method probes. Preview → drive → Back to Showroom carries the selected recipe. Two follow-up defects were also repaired: `scene.ts` now calls `historyFragment()` on change and undo, so reloading reads the latest recipe; `express.ts` includes the recipe fragment in both its Change Event action and the displayed event link. Getter/method-denied browser evidence confirms the configured recipe survives ordinary drive/return, with career/settings sentinel bytes preserved and zero career database opens. The refreshed-hash and event-link repairs were additionally inspected in current source.

### P2 — Paused race focus trap stops handling keys on its own audio choices

- `src/signature/race-accessibility.ts:3`: keydown is registered on the race root only.
- `src/signature/race-accessibility.ts:5`: the focus cycle deliberately includes `#game-audio` buttons and volume input, which GameAudio appends outside the race root.

After focus reaches those audio elements, Tab/Shift+Tab does not bubble through the race root. The next key uses native tab order and escapes the intended paused-menu cycle. This contradicts the packet's modal focus requirement and is especially visible on the final volume control.

Repair: handle the active-menu cycle on the common ancestor or document with a visibility guard. Verify last audio control → first race action and reverse traversal, including pending result-save state.

**Disposition — repaired in source.** `race-accessibility.ts` now installs the key handler on document, explicitly accepts the audio sibling as a target, ignores hidden/inert/detached race roots, and cleans up on pagehide/root removal. Both ends of the intended focus cycle now reach the same handler.

## Findings repaired while review was running

- **Showroom motion control was disconnected — repaired.** SignatureUI dispatched `motion` while the scene initially lacked state/action handling. The current scene initializes the preference, includes `reducedMotion` in UI state, and changes OrbitControls damping in its motion action. The UI's reduced-motion selector disables transitions.
- **Showroom audio resumed after blur/recovery — repaired.** Its original frame called `audio.update(..., document.hidden, ...)`, replacing the pause set by blur even when a visible page lost focus. The scene now records focus and passes `document.hidden || !showroomFocused`; it also checks `pageActive()` before updating/rendering. This addresses both visible-window focus loss and recovery's synthetic blur. Context-loss recovery is included in the five-case UI-worker evidence above.

## Reviewed paths without a new blocking finding

- Preview recipes and drive snapshots have explicit versions, product/option/vehicle validation and separate keys. The free race module does not import the career client or issue career reward commands. Recipe changes persist the session draft; named saves use the separate durable build key.
- Product selection validates prerequisites, conflicts and mounting slots generically. New products use the researched Sport exhaust/included silver insert, aluminum Swan Neck wing and lower organizer pair identities, with explicit no-performance-claim text. The five product URLs are individual user-triggered external links.
- Stock comparison builds a fresh stock recipe without replacing the original draft; loading/undo validate recipes and preserve named saved builds. Product/inspection presenters restore visibility before changing or driving.
- Active Sport and legacy profiles retain the same front/rear damping baselines (3800/6500 N·s/m), so the current DDM table and street-start mapping are compatible with both. Changing those base values later would require making the mapping profile-relative.
- Harbor records use the Sport handling ID in their record key. Crew/duel/time-trial receipt commands carry the handling profile; duplicate attempt checks reject cross-profile reuse. Untagged historical receipts remain valid as legacy, and existing v1/v2/v3 career progress and ownership migration remain supported. These observations do not substitute for migration/reward regression tests.
- Express uses a separate event/route identity and the selected immutable recipe snapshot, with player-only free drive and three existing rivals for Quick Race. Runtime countdown/arming repair was already in progress with the lead and is outside this review's new findings.

## Acceptance boundary

This review does not grant G3/G4, final fidelity, hardware or release approval. Retain the complete separate performance/audio/visual acceptance evidence before delivery.

## Film harness source review

Read `scripts/record-p08b.mjs`, `scripts/p08b-driving-evidence-agent.ts`, `src/audio/evidence.ts`, current UI selectors and preparation veil. No recording or browser was started during the native benchmark.

- Current selectors match SignatureUI/CrewUI and the loading veil. The script awaits actual scene readiness and unlocks audio before each capture.
- Every segment records the live player/spatial-opponent mix through MediaStreamAudioDestinationNode/MediaRecorder, then stops before scene navigation. The browser mute flag suppresses speaker output and does not replace the graph capture with offline/fake sound.
- Video runs on wall-clock Playwright recording; the race helper supplies disclosed standard-controller values to the real input path. No telemetry replacement or controlled simulation clock is used.
- Start/end chirps and DOM flashes provide measurable audio/video alignment. Composition must measure both endpoints, remove disclosed markers, retain cut positions and preserve original video/audio. Source correctness is not evidence of decoded sound energy or final synchronization.
- No source-proven harness launch blocker found. Before accepting its result, assert actual negative speed/reverse gear in the reverse segment (the reviewed version only saved that telemetry), decode each audio segment and prove non-silent game energy between sync chirps, and verify final clip duration and synchronization. The script's final `pass` alone does not certify those media properties.
