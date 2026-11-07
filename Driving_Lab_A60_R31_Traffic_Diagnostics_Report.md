# A.6.0 R3.1 — Traffic diagnostics checkpoint

Repository: https://github.com/maxtrcgi-glitch/Driving-Lab  
Branch: `core/traffic-ai3`  
PR: https://github.com/maxtrcgi-glitch/Driving-Lab/pull/2  
Base: `f4f6ca5f349d1622a54431bec7a1bd7172fede48`. The checkpoint SHA is recorded in the PR and can be obtained from its commit list. The report is part of that commit, so embedding its own SHA in the same commit would change that SHA.

## What is available
Opt-in `TrafficDiagnostics` records actual evaluated candidate decisions, starts, completions and aborts. Per actor snapshot has id, generation, driver profile, desired/actual speed in m/s, current and target lane, leader gap/speed, maneuver state and most recent decision/rejection. Profiles reset on generation change; counters cover the current diagnostic session. Samples are collected only while enabled, with a maximum of 128 recent events and 256 actor states.

Events: PASS_CONSIDERED (eligible actor entering candidate evaluation), PASS_ACCEPTED (candidate selected), PASS_REJECTED (per-candidate unsafe or insufficient incentive/preference), LANE_CHANGE_STARTED, LANE_CHANGE_COMPLETED (including a labeled abort completion), and LANE_CHANGE_ABORTED (target threatened and source lane safe). Decision statuses include cooldown_active and already_changing. Rejection reasons directly reflect evaluated tests: insufficient_front_gap, insufficient_rear_gap_npc, player_closing, insufficient_rear_gap_player, unsafe_braking, and incentive_or_preference_not_met. These are candidate evaluations, not a count of unique attempted overtakes; the existing AI also changes lane to return to preferred flow. The system does not infer screen visibility, assign a lane reservation reason, or claim separate human intent.

## Usage
Pause → Controls & setup → Circuit & conditions → Traffic diagnostics. Off by default. Resume driving on the highway: the small overlay updates twice per second and shows the nearest NPC and aggregate counts. The Copy traffic diagnostics button is in the same settings group; it copies the latest visible summary. If Clipboard API is unavailable or denied, selectable text appears in that settings group for manual copying. Diagnostics are reset when disabled, enabled anew, or the highway is reset. The nearby actor is selected by world-space distance; this is not a camera visibility check. Preview was not updated; existing preview remains R2.

## Validation
- `node tests/a60-r31-diagnostics.mjs`: PASS: accepted and completed maneuver, actual player-closing rejection, threatened-target abort, generation reset, caps, and deterministic state comparison enabled/disabled for 28/72/120 NPC.
- `npm run check:traffic-ai3`: PASS (including R3.1 tests, R2 longitudinal, lane change, protected A52 files, 30-minute simulated endurance, controlled passing, 27 observation cases). The final small labeling change was followed by rerunning the R3.1, static and UI tests; it changes only diagnostic strings/formatting.
- `npm run check:static`: PASS, 36 dist files and 56 local resource references; manifest updated for instrumented runtime and the two additional diagnostic assets. All 31 A52 protected files remain byte-identical (`node tests/a60-protected.mjs`).
- `node tests/app-bootstrap.mjs`: PASS with simulated DOM and WebGL stub; toggling overlay, observed text, copy fallback and disabling checked. It is not a browser/iPhone test.
- Independent same-seed old-R2 vs diagnostic-disabled actor-state comparisons, 900 × 1/30s for each of 28/72/120 NPC: exact matches. No coefficients or decision conditions were changed.
- Real browser: NOT VERIFIED. A Python HTTP server ran on port 8765, but the available cloud Chromium returned `net::ERR_CONNECTION_REFUSED` for `http://127.0.0.1:8765/`; no browser UI, clipboard permission, WebGL or iPhone visual claim is made. Full CI intentionally not run in R3.1.

## Cost and limits
Node microbenchmark, three paired 1000-step runs per density, discarding first 200 steps, with JIT/scheduling variation. For 120 NPC median mean `Highway.step(1/30)` was 0.141 ms disabled and 0.210 ms enabled (~0.069 ms absolute). For 72 NPC: 0.087 / 0.134 ms. These are not iPhone FPS, GC-pause or allocation measurements. The bounded event objects allocate while enabled; disabled mode does not create event or snapshot objects. Full device performance and visibility/layout remain to be verified.

No main, stable tag, main deployment or experimental preview changes. No R3.2 work or merge.
