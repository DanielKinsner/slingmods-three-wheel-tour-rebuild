# Loading and drive flow polish — 2026-09-21

Approved scope: the owner's “ya go for it” after the proposed loading, first-minute
flow, visible-polish and playable-verification pass. Continue the existing main
and Vercel game, with one lead and the existing preservation boundaries.

The loading veil and route download dialog now use the existing SlingMods tokens,
fonts and clear player-facing stages. Route preparation names the destination and
distinguishes a race from a free drive. The progress bar measures completed files,
not elapsed time or byte percentage. Interrupted preparation keeps successfully
downloaded resources for that retry; cancellation and timeout still settle workers.
No cache registry or new persistent state was introduced.

Route entry overlaps the independent sky and vehicle loads. Showroom entry overlaps
vehicle, room, Tour Wall and route preview metadata. Existing finish/shader warmup
is preserved so this change does not trade startup time for first-use paint hitches.
The trace verifies actual overlap; there is no general load-time or FPS claim.

“Choose a drive” describes the entry button that opens Destinations. Returning from
a drive restores its destination from the existing snapshot, including Ridge time
of day. Later selections in the current page survive UI updates. Pending copy no
longer claims every action is saving. The redundant Development Preview exit above
the current showroom/route loading veil is removed; recovery exits remain.

29 focused tests pass. One packaged build passes both focused browser scripts:
four finishes, all five install/remove flows, saved and legacy recipes, shop layout,
storage restore, powered display, departure, steer/brake/reverse, cockpit,
pause/reset/return; plus download failure/cancel, 390px retry, 600px destinations,
Ridge entry/return and restored Blue hour. Both report no page errors. Front, rear,
interior and driving captures were visually inspected. No geometry edit was needed.

Vehicle source/assets, contacts, steering/input, Sport v4, audio, product fitment and
save schemas are unchanged. Manual-source/OEM and estimated-mount limitations in
MODEL03 still apply. Browser emulation does not certify physical devices.

Reproduce from the repository root:

```powershell
npx tsx --test tests/drive-preparation.test.mjs tests/p08b-ui.test.mjs tests/model02.test.ts tests/model03.test.ts tests/p10a-integration.test.ts tests/career-handoff.test.mjs
npm run demo:build
$env:PORT='5208'
npm run demo:preview
```

In another terminal, set `BASE_URL=http://127.0.0.1:5208` and a fresh `EVIDENCE_DIR`,
then run `node scripts/smoke-flow-polish.mjs` and `node scripts/smoke-model03.mjs`
with separate evidence directories. Summarized results are committed in
`FLOW-POLISH-VALIDATION.json`; raw local evidence is `.tools/flow-polish`.
The canonical site's `/review-build.json` is the live identity authority.
