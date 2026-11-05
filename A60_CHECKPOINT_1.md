# A60 checkpoint 1 — baseline and architecture
Main and stable target verified: 2cd72beceeddb2ada569bc9e7e69582f0c925cc8.
Stable annotated tag object d8c0a708bc68f884b5c16d8a419172ce9eaf5a82 unchanged.
Sources read directly from GitHub before authoring.
Runtime already has IDM-like acceleration, seeded cautious/regular/brisk profiles, 30Hz lane decisions, safe front/rear predicted gaps, quintic lateral paths and both-lane reservations. Crash contacts exist for pairs involving a crashed NPC, not general normal-NPC collision resolution. Normal flow therefore depends on avoidance.
Spawning uses a relative-velocity ring: entry1320m, rear1300m, retire2200m; actors retain identity and generation increments, no speed boost to chase player. Geometry: global-s (not arc length), metric compensation and road frame/pitch; keep these unchanged.
Baseline is not motionless obstacles: seed917 / 60 simulated seconds records 31/59/64 lane-change starts at densities28/72/120, desired-speed standard deviation about10.3–10.7km/h. Counts are maneuver starts, not completed overtakes or a visual-quality claim.
No normal NPC or barrier contacts, no spawn failures, stable counts and object reuse in these baseline samples. Node cost measured separately in baseline.json; no iPhone FPS or GPU claim.

Plan:
2: Extend persistent driver parameters and situation-aware longitudinal targets, jerk bounded comfortable response with explicit emergency override; retain IDM relative-speed/gap response and stable seed.
3: Improve incentives/return bias, finite-range rear-player TTC, commitment and safe early abort with continuous lateral boundary conditions; index lane neighbors at strategic cadence. Keep all collision/road/streaming contracts.
4: Add scenario and repeat-seed tests, baseline/candidate comparisons, protect non-traffic dist against stable tag, preserve existing behavioral suites, update explicit per-stage integrity expectations only for reviewed changes. Run real Chromium integration and current regression gates; draft PR only, no stable publication.
Use separate commits for each checkpoint. No challenge/scoring, Visual R2, physics, steering or camera changes.
Current acceptance: checkpoint1 measured; AI3 implementation and acceptance NOT yet complete.
