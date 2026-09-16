# Reference code, not a game patch
`cinematic.tokens.css` is a small opt-in design seed: values and typography roles for the agent to integrate into the existing UI. It is not wired to the repository or a standalone game, and it intentionally does not ship font binaries.

Use these as starting measurements, then inspect real viewports. Map them into the existing shared token layer; do not simply paste a competing stylesheet into the end of `ui.css`. The fuller interaction/layout contract is authoritative.

Every graphic must remain editable: DOM text, CSS rules, SVG route/tach/icons and real controls. Use a locally licensed condensed font acquired through the project's own asset pipeline if needed. The fallback list is not proof that a font is installed.
