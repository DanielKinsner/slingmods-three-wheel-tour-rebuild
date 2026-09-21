# Static R/N/D/M console detail â€” 2026-09-21

Owner request: restore the four labeled console buttons seen in the supplied
reference, without functionality changes. This is a presentation-only addition.

`console-detail.ts` hides the three unlabeled 2026 placeholder keys and adds a
front-to-back R, N, D, M column in the existing console insert. Rounded dark caps,
silver edging and white labels follow the reference. It attaches once when the
hero loads; normal asset cloning retains the detail in rivals and dash thumbnails.
Existing material roles protect it from paint/finish changes. Normal scene
disposal releases its geometry, materials and label textures.

No button input, selected-mode indication or manual shifting is implemented.
Automatic shifting, driving inputs, Sport v5/v4 behavior, saves and original
model/Blender files remain unchanged. Legacy vehicle comparisons are untouched.

Typecheck and 22 existing model, instrument, material and historical-build tests
pass. Packaged showroom and road cockpit captures were visually inspected.
Black/red and white/graphite finishes, forward/reverse driving and return passed
with no page errors; the original white/graphite v4 recipe remained unchanged.
Focused browser evidence is saved locally under `.tools/console-detail/`.
Continue on main through the existing authorized Vercel game; no new site or spend.

Packaged candidate: `demo-dist/2026-09-21T16-23-27-376Z-3e986f5a11a3-working`; all 334 inventoried
inputs match the validated source. Hosted commit verification follows deployment.
