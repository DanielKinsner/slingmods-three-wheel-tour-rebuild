# Root and external-link proof corrections

The first full hosted sequence passed gameplay but its first root screenshot caught graphics preparation. The first separate root probe incorrectly waited for a diagnostic global that is intentionally unavailable on the curated root without test flags. That timeout is retained in hosted-root-final-01. The repaired root check waits for the real preparation overlay to be removed and verifies that diagnostics remain absent.

The first hosted sequence used a context-wide diagnostic init script, which also appended test/profile/scene flags to the external product popup URL. The product href was correct and the page opened, but this was not retained as the final clean-link proof. The final harness restricts diagnostic injection to the exact game origin. hosted-final-02 repeats the complete root/previews/drive/race/retry/return/link sequence with that correction. No game implementation or live-site content was changed by these harness repairs.
