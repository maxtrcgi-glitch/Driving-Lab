# Driving Lab A.6.0 — Traffic AI 3.0
Status: implementation candidate; independent CI and iPhone acceptance required. No production deployment.
Base: stable A52 tag gameplay-baseline/v0.14A.5.2 / 2cd72beceeddb2ada569bc9e7e69582f0c925cc8.
Branch: core/traffic-ai3. Main, stable tag/Release and Visual R2 are not modified.

## Architecture and audit
A52 already contained seeded profiles, IDM-like following, lane-choice incentives, both-lane reservations, 3.8–4.4 second quintic lane trajectories, 30Hz strategic decisions and lightweight collision handling. A60 extends that implementation rather than replacing it.
The road-space s parameter, metric correction, frame/grade, floating origin and renderer remain unchanged. Spawn/retire ring at 1320/1300/2200m and reuse of NPC objects remain intact.

## Longitudinal model
Persistent desired speed remains attached to each NPC across recycling. Calm/Normal/Assertive map onto the seeded existing cautious/regular/brisk categories.
Headways are 1.75/1.45/1.18s; comfortable acceleration retains 1.2/1.5/1.9m/s². Cars/trucks, driver style and initial lane determine stable desired speeds; no per-frame random speed jitter.
Current target is a deterministic modifier of desired speed: lane factor, mild density factor, uphill load and curvature-based lateral acceleration cap (1.6m/s² trucks, 2.5 cars). Geometry is sampled at the NPC position.
IDM desired gap includes time headway and relative closing speed. Comfortable updates are jerk-bounded (2.2 or 3m/s³), while imminent short-gap/TTC danger bypasses that comfort ramp with up to 8m/s² braking. Safety calculations use unsmoothed required acceleration, so comfort does not weaken gap acceptance.

## Lane decisions, safety and commitment
Existing acceleration-gain motivation and outer-lane return preference are retained. Sustainable differences in targets make more overtaking opportunities; no random lane switches were added.
At 30Hz strategic ticks, six reusable lane lists are sorted once. Lane queries use binary search plus nearest valid neighbors. A new target reservation is inserted immediately before later NPCs decide. Source and target occupancy remain conservative. Recycling invalidates the index for that batch; crashed traffic uses the original scan. No heavy all-pairs neighbor search at every 240Hz step.
Player observations are limited to 220m in road-s; relative speed, front/rear predicted closing over maneuver duration, follower headway and required deceleration govern gap acceptance. NPCs are not told to clear a lane for the player.
When a new conflict appears before 35% of a lane change, source lane is safe, and speed exceeds 8m/s, the NPC may abort back. The return quintic preserves current position, lateral velocity and acceleration (C2 boundary conditions). Cooldown prevents ordinary ping-pong.
After commitment, or when the source is unsafe, the car keeps a predictable path and brakes for occupied leads. This is not a guarantee against physically unavoidable impacts from arbitrary late high-speed cut-ins. No instant lane assignment or world-space straight line movement is used.

## Collision model and continuity
Existing player collision calls and crashed-NPC capsule/momentum interactions remain. Normal NPC pairs still rely on avoidance; there is no newly invented full rigid-body normal-NPC simulator.
Source/target reservations and safe gaps prevent conflicts in tested normal flow. Spawn generation, density cap, fog-safe recycling and existing collision geometry are unchanged.
All original test commands remain mandatory. Historical exact source comparisons remain separately diagnostic.
The seat test's old source-freeze excludes the deliberately changed traffic module; whole-candidate integrity plus a new 31-file non-traffic A52 hash check replace that obsolete traffic source equality. The historical A51 highway alias now reads a pinned fixture rather than the changed current module. This is not a fallback to new code.
The traffic regression's cooldown assertion still applies to ordinary maneuver starts; a documented emergency abort is not counted as a new ordinary lane selection. New tests separately require continuous abort boundary conditions.

## Measurements and evidence
Checkpoint 1 commit: ab1f79467e047941177335580fd5a2b17201d3ab.
Checkpoint 2 commit: c68c87b772c5e0b126d97a7296ff8772fa8d1a15.
Checkpoint 3 commit: a44f0408cf3d704681eb44c63f19b79da7fe6952.
Raw before data: evidence/A60/baseline-node.json. Interim longitudinal data: evidence/A60/longitudinal-node.json.
Node v24.22.1, seed917, 60 simulated seconds, 4x240Hz traffic steps per measured 60Hz interval, no player physics/renderer.
Baseline desired-speed stddev 10.3–10.7km/h; baseline lane-change starts 31/59/64 at 28/72/120 NPC. This disproves the claim that the old system had no lane changes; it does not establish visually satisfactory passing.
Observed interim indexed candidate starts 31/71/85. These are starts, not completed overtakes. Single-run p95 at 120NPC: baseline0.492ms vs candidate0.286ms; warmup, CPU scheduling and run order limit inference. This is not iPhone FPS or GPU time.
Both samples retain requested density and object identities, zero spawn failures, zero normal NPC/barrier contacts.
Targeted local tests: persistent seeded profiles, 1200 physics steps, gap response and emergency braking PASS; 2160 indexed-vs-linear neighbor queries PASS; C2 early abort and 220m perception bound PASS. Full existing traffic-ai2 scenario file PASS after the explicit abort/cooldown distinction.
The full current suite, full continuity matrix, integration and real browser gates must be read from this PR's Actions, not inferred from these local passes. CI also writes reports/current/results.json, reports/browser/smoke.json and reports/A60/current-node.json.
No device FPS, hardware GPU timing, true allocation count or GC-spike claim is made. Existing exposed-GC retained-heap/object reuse tests remain mandatory.
No substantial GPU/render content was changed, but that alone does not prove no iPhone performance regression.

## Scope and outstanding acceptance
Only highway.js plus app/index version labels may differ from A52 runtime; the other31 dist files must remain byte-identical.
No scoring/challenge, physics, steering, cameras, road geometry, resources or Visual R2 changes.
A separate HTTPS preview has not been published; stable main URL remains A52. iPhone validation, visual naturalness, actual completion/overtake quality and device frame pacing remain pending.
Director should inspect the PR's required checks and the manual guide before acceptance. Do not merge automatically.

