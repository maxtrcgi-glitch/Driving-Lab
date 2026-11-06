> Superseded after failed iPhone traffic acceptance. See [Revision2 report](Driving_Lab_A60_Traffic_AI3_R2_Report.md) and current PR checks. Earlier results below refer to the first candidate.

# Driving Lab A.6.0 — Traffic AI 3.0
Status: ready for independent review. Required regression/browser/merge gate PASS for the runtime candidate; iPhone acceptance pending. Separate experimental preview only.
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
Observed interim indexed candidate starts 31/71/85 (before the final emergency-source-lane fix). These are starts, not completed overtakes. Single-run p95 at 120NPC: baseline0.492ms vs candidate0.286ms; warmup, CPU scheduling and run order limit inference. This is not iPhone FPS or GPU time.
Both samples retain requested density and object identities, zero spawn failures, zero normal NPC/barrier contacts.
Targeted local tests: persistent seeded profiles, 1200 physics steps, gap response and emergency braking PASS; 2160 indexed-vs-linear neighbor queries PASS; C2 early abort and 220m perception bound PASS. Full existing traffic-ai2 scenario file PASS after the explicit abort/cooldown distinction.
The full current suite (17 commands), continuity matrix, integration and real browser gates passed in Actions run42113517088 for runtime bcc182a670d90ce9cb2b01332d09440135b702a5. The later validation commit adds an endurance case and evidence/docs, and corrects the AI telemetry version identifier from2 to3 without changing traffic behavior; its PR checks remain authoritative. CI also writes reports/current/results.json, reports/browser/smoke.json and reports/A60/current-node.json.
No device FPS, hardware GPU timing, true allocation count or GC-spike claim is made. Existing exposed-GC retained-heap/object reuse tests remain mandatory.
No substantial GPU/render content was changed, but that alone does not prove no iPhone performance regression.

## Scope and outstanding acceptance
Only highway.js plus app/index version labels and AI telemetry version may differ from A52 runtime; the other31 dist files must remain byte-identical.
No scoring/challenge, physics, steering, cameras, road geometry, resources or Visual R2 changes.
A separate HTTPS preview is published at https://driving-lab-a60-traffic-preview.maxtrcgi.chatgpt.site (owner access). Its 34 game files match the pinned candidate SHA-256 manifest (initial previewbcc182a; final telemetry metadata refresh is recorded in PR). Stable main URL remains A52. iPhone validation, visual naturalness, actual completion/overtake quality and device frame pacing remain pending.
Director should inspect the PR's required checks and the manual guide before acceptance. Do not merge automatically.


## Verified candidate and CI receipt — 2026-11-05 UTC
Repository: https://github.com/maxtrcgi-glitch/Driving-Lab
PR: https://github.com/maxtrcgi-glitch/Driving-Lab/pull/2 (core/traffic-ai3 → main; do not merge automatically).
Runtime candidate: bcc182a670d90ce9cb2b01332d09440135b702a5.
Verified PR merge ref: cbe8062cac8cb7df56e1806a3dd19019bfbeee8c (a temporary GitHub test ref, not a merge into main).
CI: https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42113517088
Required current regression tests: PASS. Required real Chromium WebGL smoke: PASS. Required merge gate: PASS.
Historical identities: FAIL, diagnostic only, exit1; all four historical comparisons still report differences. Overall workflow is therefore not wholly green.
Raw required results and Node benchmark are in evidence/A60/ci-required-results.json and ci-node.json; full log/artifact is available from that run (current-regression-reports, artifact13455537912). Evidence reflects its named commit, not an unrun future revision.

| Exact command | Result | Seconds on hosted Node22 |
| --- | --- | ---: |
| `npm run check:syntax` | PASS (exit0) | 4.20 |
| `npm run check:static` | PASS (exit0) | 0.19 |
| `npm run check:infrastructure` | PASS (exit0) | 0.19 |
| `npm run check` | PASS (exit0) | 77.42 |
| `npm run check:fast` | PASS (exit0) | 34.04 |
| `npm run check:predictor` | PASS (exit0) | 2.06 |
| `npm run check:shadow` | PASS (exit0) | 4.91 |
| `npm run check:seat` | PASS (exit0) | 26.06 |
| `npm run check:traffic-ai2` | PASS (exit0) | 41.40 |
| `npm run check:continuity` | PASS (exit0) | 46.99 |
| `npm run check:camera` | PASS (exit0) | 23.60 |
| `npm run check:launch` | PASS (exit0) | 72.08 |
| `npm run check:head` | PASS (exit0) | 13.57 |
| `npm run check:calibration` | PASS (exit0) | 97.42 |
| `npm run check:highway2` | PASS (exit0) | 102.15 |
| `npm run check:integration` | PASS (exit0) | 0.45 |
| `npm run check:traffic-ai3` | PASS (exit0) | 0.59 |

Installation: `npm ci`; browser installation: `npx playwright install --with-deps --only-shell chromium`; browser: `npm run check:browser`; benchmark: `npm run bench:traffic-ai3` — PASS.
Added targeted command retains the three initial AI3 tests and additionally runs `node tests/a60-endurance.mjs`. Original twelve npm commands remain included in check:current; none was disabled.

## Final scenario measurements
- Original traffic-ai2: 24 combinations ×90s, densities28/72/120, seeded variation and repeatability, free/blocked overtake, fast rear approach, simultaneous reservations, braking, curve/road alignment, barriers and crash capsule regression — PASS.
- Continuity: 75 combinations ×300s, densities18/28/42/72/120, player80/120/160/200/250km/h. Zero spawn failures; zero fog-visible recycling; maximum empty-ahead1000 duration0s; minimum sampled body gap8.7023m. Sampling/proxy limits in the original scenario reports apply.
- Additional continuous endurance: 1800 simulated seconds at120NPC, traffic30Hz, seed917, about99.018km in road-s. 3276 recycles, original NPC objects reused, no NaN, no normal NPC/barrier contacts, no empty-ahead1000 interval; minimum body gap sampled each second14.0372m. Respawn matches a fresh same-seed startup exactly. This is headless traffic/road validation; player collision physics and rendering are not part of this scenario.
- Indexed neighbor queries: 2160 indexed-vs-linear comparisons; early abort preserves initial lateral position, velocity and acceleration; maximum 240Hz offset step0.00112275m in the cancellation fixture.
- Emergency braking: -8m/s² against a stopped lead, including a source-lane lead during an ongoing maneuver. This last case motivated commitbcc182a; comfort jerk limiting must not delay emergency braking.
- Mutation controls in disposable copies: replacing braking acceleration with zero makes longitudinal test fail; replacing smooth lateral travel with an instant lane assignment makes lane test fail (both exit1). No production file was mutated. Raw evidence: negative-controls.json.

## Performance: before/after and practical limits
Paired local Node24.22.1 measurements: three runs of each implementation, order alternated, same seed917/densities/60 simulated seconds. Original traffic module and all imported physics/road/spec dependencies were checksum-matched to the A52 GitHub manifest. The baseline host checkout differs in its unrelated index.html only; that file is not loaded by this CPU benchmark. First pre-change data was also captured directly from GitHub A52 sources in Checkpoint1.
Reported values below are medians of per-run p50/p95; unit is milliseconds for FOUR traffic steps (one simulated60Hz interval), excluding renderer/player physics.

| NPC | A52 p50 | A60 p50 | A52 p95 | A60 p95 | A52/A60 lane starts |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 28 | 0.03514 | 0.04042 | 0.09572 | 0.16277 | 31 / 31 |
| 72 | 0.11318 | 0.10446 | 0.18490 | 0.19294 | 59 / 70 |
| 120 | 0.22687 | 0.17572 | 0.37012 | 0.29052 | 64 / 91 |

Sparse-flow tail cost increased; dense-flow cost improved on this machine. Small samples, JIT, scheduling and different runtime versions limit extrapolation. Starts are not completed overtakes.
Final candidate desired-speed standard deviation:11.39/10.40/10.81km/h. Counts maintained28/72/120, zero spawn failures and normal contacts, all original NPC objects reused in the benchmark.
Hosted Node22 benchmark p95:0.38546/0.35154/0.36533ms; p50:0.06536/0.18054/0.25937ms. These are a separate machine, not a paired baseline comparison.
Existing exposed-GC traffic memory test:60000 steps/250 simulated seconds,120NPC, retained heap delta4064 bytes, NPC objects reused. This measures retained heap, not allocation rate or individual GC pauses. No claim of zero allocation or zero GC spikes is made.
Full-game FPS, GPU cost, memory pressure and thermal throttling on iPhone remain UNVERIFIED. Use IPHONE_A60_TRAFFIC_AI3_TEST.md before acceptance.

## Real browser evidence and environment limitation
Chromium151.0.7922.34, real WebGL2/OpenGL ES3 through ANGLE Vulkan SwiftShader, viewport844×390. No DOM/WebGL stubs. Real game initialization, four observed driving frames, camera/seat UI, seat transform, persistence after reload and reset all passed. pageErrors/consoleErrors/failedRequests/httpErrors are empty. Two optional screenshot attempts timed out; there is no visual screenshot proof or sustained FPS claim from that smoke test. Raw: evidence/A60/browser.json.
A separate attempt in the interactive cloud browser could not create WebGL: GL_VENDOR/GL_RENDERER Disabled, BindToCurrentSequence failed. This does not invalidate the separate working CI browser; it prevents a visual naturalness judgement here. iPhone Safari remains required.

## Stable protection, preview and handoff
31 non-traffic dist files are exactly A52 by SHA-256. Only highway.js and app/index version/title strings and aiVersion telemetry metadata differ. Original a52-dist.json remains intact; a60-dist.json separately pins all34 candidate files. The original A51 highway reference fixture is exact, SHA-25620d161dd33cc85363fbb0bc8c974e8fb7cee210094ddcdf9d812978817933934 (extra newline corrected in982772a).
Main and stable tag target remain2cd72beceeddb2ada569bc9e7e69582f0c925cc8. No stable Release edits or main-site publications were made.
Preview: https://driving-lab-a60-traffic-preview.maxtrcgi.chatgpt.site
Preview project: appgprj_6aecf6a677d4819181a7af4ff05f3157; saved version1; source87a5dc879e1cd4676b507e327258640bdb2515f9; deploymentappgdep_6aecf6d7a078819193b0d1fa63a80184 succeeded. Provenance manifest maps all34 files to GitHub runtimebcc182a. Site source SHA differs from GitHub because hosting configuration is separate.
The repository's original hosting manifest still identifies the stable site: never deploy an experimental checkout with that configuration. Preview hosting is separate and is not merged into gameplay source.

## Checkpoint and validation commits
1. Baseline/architecture: ab1f79467e047941177335580fd5a2b17201d3ab.
2. Longitudinal model: c68c87b772c5e0b126d97a7296ff8772fa8d1a15.
3. Lane index/cancellation: a44f0408cf3d704681eb44c63f19b79da7fe6952.
4. Integration: fe33b3f35dd0ef7c8970270f326ba8663e7c7447.
5. Exact historical fixture bytes: 982772a2695f4a6ae6aa868b4c4112f6ada2626d.
6. Source-lane emergency response: bcc182a670d90ce9cb2b01332d09440135b702a5.
7. Final validation/evidence/guide commit: see PR history (this report is included in that commit).

## Model references and design choice
Primary descriptions: https://traffic-simulation.de/info/info_IDM.html and https://traffic-simulation.de/info/info_MOBIL.html .
IDM contributes desired speed, gap, relative speed, time headway, comfortable acceleration/braking. MOBIL's separation of incentive and safety informs the preserved acceleration-gain lane selection. This is a bounded IDM-like and MOBIL-inspired game model, not a full calibrated implementation of MOBIL politeness/disadvantage equations. Conservative predicted gaps and follower headway are retained, with explicit maneuver commitment and cancellation layered on top.

Recommendation: READY FOR INDEPENDENT REVIEW. Do not merge or replace stable A52 until Director accepts the separate preview. Remaining acceptance work is actual iPhone performance/frame pacing, visual naturalness and completed overtakes, plus unavoidable impacts from impossible late cut-ins. Normal NPC-NPC full rigid-body physics remains outside this architecture. No Traffic Challenge or Visual R2 work is included.
