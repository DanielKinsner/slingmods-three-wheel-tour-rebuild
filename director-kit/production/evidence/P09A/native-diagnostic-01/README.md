# Separate instrumented diagnostic

This run adds CDP tracing and is not part of the clean16-race matrix. Both races completed validly with all finishers. Maximum intervals were183.4ms and300ms; instrumentation adds overhead, so these values cannot replace the clean matrix.

The actual performance mark aligns trace timestamps to every RAF row. trace-analysis.json preserves overlapping main-thread events and GC details around all seven intervals over100ms. The largest callbacks span roughly202/307ms wall time while reporting roughly15/34ms thread time. Some other callbacks contain substantial CPU work. No long garbage-collection event explains these largest stalls (one smaller interval overlaps7.53ms MinorGC). These observations leave GPU submission, scheduling and other causes unresolved; no causal host/app verdict is claimed.

Raw chrome-trace.json.gz is complete, not sampled. Nested event durations overlap and must not be summed as independent work. No further tune was made from this incomplete diagnosis. The clean matrix remains performance HOLD.
