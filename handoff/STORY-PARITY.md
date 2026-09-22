# Story / quick race / test drive parity

The owner asked for the best existing implementation to reach every mode, not
new features or another handling tune. Integration starts from `582c937`, after
Claude completed Phase 2D Harbor water. No simulation, input, tire, drivetrain,
AI controller or collision equations were changed.

## Result

- Chapter 01 Shakedown, Maya duel and crew race use the same road runtime as
  Chapters 02/03, quick races and test drives. The old entry files are redirects,
  so they cannot silently retain a separate presentation stack.
- All road modes receive the existing current 2026 hero/driver/rig, finish,
  five-product presentation, exhaust audio, live mirrors, driving camera,
  speed presentation, graphics presets/post pipeline, route dressing, wet-road
  reflection, and completed Harbor water work. Chapter-specific objectives,
  opponents, lap counts and required night/Ridge atmosphere remain.
- The career garage renders earned paint and all equipped parts with the current
  driver attachment, console detail, front links, mirrors, powered display and
  post pipeline. Its lighting/shock product cards use current shared retail
  fitment metadata. The retained development pad and showroom simulation use v5.
- Every drive uses the existing Sport v5 equations and input mapping. Named and
  fragment recipes are retained intact, while their driven copies use current
  physics. The obsolete opt-in physics picker is removed from ordinary play.
- Resuming a historical prepared career entry creates a current-tune retry and
  retains the old entry as abandoned history. Its equipment stays exact. Cups
  keep already completed results and original equipment; remaining stages use
  v5 and record that version honestly. Reload validation accepts mixed-version
  Cup stages only with unchanged equipment and matching per-attempt records.
- Shakedown still uses the original RaceAttempt timing/validity rules and
  compatible personal-best keys. Credits, unlocks and duplicate protection use
  existing career transactions and certified competition proofs.
- Camera preferences follow explicit career storage across every road. Free
  previews stay separate from the career and historical records.

## Verification

See `STORY-PARITY-VALIDATION.json` for results and source identities. Commands:

```
npx tsc --noEmit
npm test
npm run deploy:build
# Serve the latest immutable publication stage on an unused port:
# PowerShell: $env:PORT='5209'
node scripts/serve-demo.mjs --publish
node scripts/verify-story-parity.mjs
node scripts/verify-story-parity-resume.mjs
```

The complete-career check starts from an empty isolated browser, earns credits
through all ten real races, buys all five parts normally, reloads the partial Cup
and completed career, then revisits Chapter 01 and every free road/mode. Its
controller only supplies pedals and steering to the production fixed-step
simulation; it never moves the car or injects checkpoints, rewards or results.

The resume check starts from that earned test save and deliberately constructs
one v2 prepared entry to exercise migration. It checks old receipts/records,
retry identity, keyboard throttle/steering/pause and preview isolation. It also
checks the current garage and the unchanged archived showroom recipe.

These are packaged-browser functional checks with controlled simulation time,
not a performance benchmark or physical-controller/listening approval. No owner
browser save is opened or modified. Test-only saved fixtures remain under
`.tools/`; the scripts and compact validation receipt are tracked.

## Scope

This integrates completed work through Phase 2D. Unbuilt Phase 2E and later
roadmap items are not implied. Historical validation scripts that used the old
`__HARBOR` / `__CREW` debug shapes are historical; current road evidence uses
`__EXPRESS` for every mode. No new assets, dependency, vehicle or route was added.
