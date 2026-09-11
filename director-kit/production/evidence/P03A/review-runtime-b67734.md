# Independent frozen-runtime review — b67734c

P03A acceptance pending. G3 remains pending. Reviewer: /root/gate_review.

Blocking defect reproduced in an isolated headless Chromium browser: open normal entry, click Inspect, then Rear. The camera is [4.6, 2.8, 6], behind the bay wall, and the entire vehicle is hidden. The actual screenshot was inspected at C:/Users/SM-DAN~1/AppData/Local/Temp/p03a-review-b67734/normal-rear.png (SHA256 d6e0f01b6c843e7d804b5b4249601868cb2e28fd6a45b653e79d96e145185cec). A capture-only orbit radius does not fix this user-facing interaction. Repair the actual bay camera/occluder policy and check rear presets plus a full orbit through production controls. The existing route assertion checked cockpit but did not establish Rear visibility.

The original final-01 turntable-light-sweep-SILENT.webm is also rejected as full-orbit evidence: independent 2 Hz decoded-frame inspection over its 13.64 seconds shows initial loading and only front three-quarter through side. It does not show rear or the opposite side. Preserve this failed capture; replacement must have separate provenance and disclose frame-stepped software timing if applicable.

Other frozen evidence checked: all seven final stills visually inspected; final pad-driving-SILENT.webm inspected over the full 39.4 seconds at 2 Hz (79 decoded sample frames). The car persists through acceleration, both turn directions, braking and C-key chase change; credible vehicle shadow remains, with no large moving rectangular bands observed in those samples. This is sampled video inspection, not normal-speed subjective play or hardware performance proof.

Independent npm test rerun: 29/29 pass; TypeScript no-emit check passes. All 48 build-input hashes match disk; frozen commit blobs agree after expected CRLF normalization (15 text files differ only in line endings). Independently fetched all 11 served manifest, JS/CSS and hero/bay/pad GLB entries: every hash matches capture-report.json. Existing final presenter assertions cover actual wheel and cockpit quaternions, suspension travel and nonspinning rear-caliper travel. No asset defect is newly alleged by this runtime finding.

Runtime source SHA256: 434c7b2d2f375ef0e50427a80348bbaefdac0fd2b015d16bac763fc8ab63c0ff. Capture report SHA256: 41621a8b330029687e24d831bd16325573ad72367332efba97ced6b8816eb2cc. Final browser verification SHA256: f536fe46c7531b6ecdfde44d7ab1707dd49fcc5888d045515fad841553f1189b.
