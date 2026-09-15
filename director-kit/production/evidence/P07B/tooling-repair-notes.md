# P07B tooling repairs

- Independent reviewer caught inconsistent pointer/manifest/build identity acceptance; stage now rejects mismatches and unsafe identity strings. Regression passed.
- Hosted HTTP validator now permits a genuine custom HTML404 but requires404status and rejects root gameHTML. Prior local true404result remains valid.
- During handoff editing, an add-file patch replaced the existing .gitattributes text. Pre-push comparison caught it; a separate recoverable commit restored every historical binary/evidence rule and retained only the new packet/handoff rules. No assets/evidence were rewritten. Existing CRLF immutable records were retained despite git whitespace-check reports; those are byte-preservation data, not runtime failures.
- Initial retained-output probe assumed files was an array; corrected read-only probe used the actual object map and verified all49 hashes. No runtime/output edits occurred.
