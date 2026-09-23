# Continue Career repair - 2026-09-23

The owner reported the generic loading recovery screen after Continue Career; Retry repeated it.
A matching failure was reproduced in the packaged game with a Spyder career on the Chapters 02-03
hub (`?scene=career&play=career`). The console reported `This build recipe needs recovery; saved
data is unchanged.` from recipe serialization in the hub's product rendering loop. The original
screenshot's exception was not retained, so this identifies a reproducible matching defect rather
than reconstructing that earlier exception.

The hub only distinguished Ryker from Slingshot. Spyder fell into the Slingshot branch, which added
Slingshot product IDs to a temporary Spyder preview recipe. Recipe validation correctly rejected
that combination. This was a rendering bug; it did not write an invalid recipe to the career.

## Repair

- `career-experience/workshop.ts` renders the correct catalog for each vehicle. Spyder lists its
  six supported parts, keeps installed/removed ownership labels, and opens its career workshop.
  Existing Slingshot purchase/equip/preview and Ryker workshop behavior are retained.
- The garage resolves the saved career vehicle before creating its renderer or loading the vehicle
  and room, avoiding heavy wrong-vehicle loading before a required career redirect.
- Startup recovery distinguishes code errors, asset failures, timeouts and graphics failures, names
  the career/drive/showroom correctly, and exposes collapsed error details. A bounded diagnostic
  is retained in session storage under `slingmods-last-startup-error-v1`; URL query/fragment payloads
  are removed. It never writes to the career store. Retry and keyboard focus cycling were exercised.
- The hub vehicle selector has its own header row, with a three-row phone layout. This fixes an
  observed overlap with the main navigation.

No save schema, validation relaxation, reset, physics, steering, race rules, assets or licensing changes.
No push or deployment. The prior sustained performance HOLD remains; this repair makes no new
frame-time claim. Resume `FLEET-RENDER.md` and `QUALITY-AND-PERFORMANCE.md` for the broader work.

## Evidence

See `CAREER-ENTRY-REPAIR-VALIDATION.json` for build identity and file hashes.

- Full suite: 491 passed, zero failed. Includes per-vehicle recipe links, save immutability,
  Spyder ownership/frozen entries, recovery classification and diagnostic isolation.
- TypeScript and packaged demo build passed: 472 files, 507,318,181 bytes. Existing large-chunk
  warning remains. Final output: `demo-dist/2026-09-23T23-03-31-520Z-d4446dcdd581-working`.
- `scripts/verify-career-entry.mjs` exercises ordinary Continue Career, hub reload and workshop
  navigation for all three vehicles with isolated valid Chapter 02 fixtures, including a saved
  race entry and Spyder purchased/removed parts. Exact career-state equality is required after
  each navigation. All pass, with no console errors or HTTP failures.
- Header collision checks at 1280x800 and 390x844 pass for every vehicle; phone page width stays
  within the viewport. Desktop and phone screenshots were visually inspected.
- In-app browser: the previously failing Spyder hub and workshop now render. Blocking only the
  Spyder model request on the disposable 5227 test origin produces the expected asset recovery
  and retained error details. Removing that block and clicking Retry restores the workshop.
  Focus cycles through Retry, Back to Showroom and Error details. The block was removed.

The isolated fixtures and test origin do not contain the owner's career. The preview on 5226 is
updated in place to preserve the owner's origin and save. The older 5225 preview is left available.

Reproduce the browser regression against a running packaged candidate:

```powershell
$env:BASE_URL='http://127.0.0.1:5227'
$env:EVIDENCE_DIR='.tools/career-entry-new-run'
node --import tsx scripts/verify-career-entry.mjs
```

Use a fresh evidence directory. This harness creates disposable browser contexts; do not transplant
its fixtures into an owner's browser profile.
