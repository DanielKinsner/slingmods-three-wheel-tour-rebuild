# P06C independent scoring correction review

## Scope

Read-only review of the small pending diffs in `scripts/summarize-review13.py` and `scripts/package-astra-review13.py`, `post-build-tool-amendments.json`, and the compact first-matrix summary. Only these two small tool files were hashed for amendment verification. No browser, GPU capture, build, or whole-repository scan was run. The diagnostic repeat was still running and is not certified here.

## Corrected verdict

The original equipped 1080 repeat **fails the timing target**. Attempt 1 has p95 16.7 ms; attempt 2 has p95 33.3 ms and p99 33.4 ms (floating-point tolerance only). The pooled p95 of 16.8 ms must remain descriptive and cannot establish that both races met the p95 <=20 ms target. `performance-summary-first-matrix.json` now records separate attempts and `targetMet: false` for that repeat. Its four single-attempt matrix entries remain true.

The changed summarizer groups active-racing rows by their captured attempt index, computes nearest-rank statistics for each group, and requires every group's p95 <=20 ms, p99 <=33.4 ms and zero active intervals >100 ms. It retains pooled statistics, raw outliers and the source-run hash. This directly fixes the observed pooling error. A later diagnostic pass cannot erase the failed original repeat or establish a cause for it.

## Packaging amendment boundary

The amendment file names exactly the two scoring/packaging scripts. Both `beforeSHA256` values match their entries in the original frozen build-input inventory, and both `afterSHA256` values match the current files. The package code permits changed inventoried inputs only when the path is allowlisted and both hashes match. All other inventoried inputs must retain their frozen hash. The amendment document is selected with the root evidence JSON files and referenced from the package manifest; the diagnostic follow-up is included separately.

This checks the narrow exception logic and its two concrete receipts. It is not a fresh independent assertion that every runtime or asset byte is unchanged; final packaging must execute the full inventory check. Runtime identity remains `b4eef3c7dab3eb77b131a5100c3be0fd1110b095`, with explicitly disclosed post-build validation-tool amendments.

## Remaining scoring guard

The reviewed version checks completion/validity of captured results and final fields, but its per-attempt score iterates the attempt IDs found in racing rows. Before final packaging, add an explicit nonempty/group-count correspondence assertion against completed results/final attempts, ideally checking their attempt indices. That prevents an absent sampling group from silently disappearing from an “every attempt” claim. The daylight path currently pools its samples; its current single-lap scope is safe if exactly one completed result/group is asserted, or it can use the same per-attempt rule. These are evidence robustness guards, not runtime repairs.

### Guard follow-through

Subsequent read-only verification confirms these guards were added: crew indices must equal `1..len(results)`, result/final counts are nonzero and equal, result attempt UUIDs are distinct and match their paired final/race UUIDs, and each summary entry names that UUID. Day scope now asserts exactly one completed result and one sampled group. Both updated amendment after-hashes match the current two files. The missing-group reservation above is resolved for this review's required scope.
