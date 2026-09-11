# Final capture correction

The initial b67734c `final-01` pad video and seven stills were valid, but its 13.64-second Playwright turntable video showed only a partial front-to-side movement despite full-orbit commands. That recording does not establish a full orbit. It remains on disk as failed capture evidence and is excluded from the final review ZIP.

A separate cardinal-camera diagnostic also exposed a real bay interaction bug: the rear inspection camera could pass behind the wall. The runtime now keeps all inspection camera rendering in front of the wall, preserving the view ray and disabling bay pan. The actual Rear button and oversized orbit requests are checked by the isolated browser test.

The corrected capture method synchronizes each actual runtime image through CDP, records every camera angle and frame hash, and encodes 145 frames at 12 fps. It is explicitly frame-stepped software rendering, not real-time FPS evidence. The corrected `final-02` set is recaptured from the subsequent frozen implementation checkpoint, including the stills and actual keyboard pad movie. The same frozen hero GLB is used throughout; no Blender render substitutes for runtime evidence. The complete raw frame sequence remains in the workspace; the ZIP contains the movie and manifest, not redundant PNG frames.
