# Driving Lab A.6.0 — Revision 2: traffic behavior correction

Status: experimental candidate following failed iPhone acceptance of the first A60 preview. PR #2 remains draft. Do not merge or replace stable A52.

Repository: https://github.com/maxtrcgi-glitch/Driving-Lab
Branch/PR: core/traffic-ai3 — https://github.com/maxtrcgi-glitch/Driving-Lab/pull/2
Comparison baseline: previously published A60 commit0acd17058f615ded086294fe87e7abaf2fc5c132.
Stable A52:2cd72beceeddb2ada569bc9e7e69582f0c925cc8; untouched.
This revision supersedes the prior report's recommendation and its traffic/performance measurements. Final CI and deployment receipts are recorded in the PR body after this commit is tested. Earlier passing CI does not verify this revision.

## User-observed failure and audit
At matching density, Max reported little speed variation and no observed lane change in five minutes. That is failed behavioral acceptance despite the first build passing technical tests.
The original benchmark counted all lane starts across the streaming ring. It did not prove a completed pass or a maneuver within the player's forward observation band. Original A60 still showed actual speed standard deviations averaging only9.15–11.44km/h in the test below.
The previous common outer-lane preference was retained too broadly, and asking for a longer adjacent gap could reject a pass even when its leader was faster. The rear acceptance formula demanded the full IDM desired interval instead of bounding the follower's induced braking.
There was also a real recycling inconsistency: entry side was picked from old actual speed, then speed was reset to desired. The new actor could immediately be outside the retirement boundary for its new relative speed. The old version recorded9511 inconsistent entries across27 scenarios; the corrected version records0. This is a headless consistency count, not visible spawning. Fallback lane search now starts from the actual lane, so it visits all three alternatives after lane changes.

## Behavior changes
- Stable seeded desired speeds: trucks72–97km/h; Calm cars83–108; Normal97–133; Assertive119–155. Values do not jitter each frame and persist across recycling. Actual speed still responds to leads, density, grade and curvature.
- Stable cruising preference: trucks/Calm outer lane, Normal middle, Assertive inner lane. Motivation compares the attainable pace and acceleration in each lane; passing and a return toward that preference still require safe gaps. No visibility-triggered weaving or forced maneuvers near the player were added.
- Target-lane rear NPC safety is based on its own predicted IDM acceleration >-2.5m/s², alongside the unchanged front/rear duration and gap constraints. Fast-player checks retain the stricter closing-gap rule and220m observation bound. This is MOBIL-inspired safety, not the full politeness model.
- Emergency stopping-distance demand can bypass jerk comfort in both source and target lanes. The ordinary comfort ramp remains; no universal braking wave is scheduled.
- New spawn speed lies within the front/rear braking envelope and agrees with the selected entry side. Desired speed is stored separately; safe entry may begin at surrounding flow speed. The existing fog-safe boundaries, object reuse and population cap remain.
- Only highway.js plus a Revision2 title marker in index.html change from the first A60 candidate. Original physics, steering, camera, road, seat/UI controls and resources are protected.31 non-traffic runtime files remain exact A52.

## Reproducible observation comparison
Command: `node tests/a60-visible-flow.mjs` (current quality gate), prior build measured with `--measure-only`.
27 runs:28/72/120NPC × player100/150/200km/h × seeds917/2027/8123,300 simulated seconds each,30Hz traffic, unchanged road seed86. Before code was checksum matched to the published GitHub candidate. No ZIP or archival Git history is needed by current tests.
A completed NPC pass requires a slower NPC lead observed before maneuver initiation, same generations, a completed lane change and subsequently moving ahead by both half-lengths plus5m within30s. Generation changes invalidate a pending observation.
The observation bands are road-s0–150/250m ahead. They are NOT camera frustum/pixel/occlusion checks; no claim of actual iPhone visual acceptance is made.
Each row below totals nine five-minute runs at one density. Stddev is the mean of per-run actual speed stddev in the forward250m band.

| NPC | Completed maneuvers ahead150m before → after | Completed NPC passes ahead250m before → after | Actual speed stddev km/h before → after |
| ---: | ---: | ---: | ---: |
| 28 | 28 → 36 | 12 → 15 | 11.44 → 17.27 |
| 72 | 76 → 92 | 38 → 53 | 10.14 → 12.59 |
| 120 | 79 → 129 | 41 → 86 | 9.15 → 12.53 |

All27 corrected runs: zero spawn failures/normal NPC/barrier contacts, finite states, positive sampled NPC body gaps (minimum12.999m). At densities72/120 each run includes a nearby completed maneuver and an NPC pass AFTER30s warmup. The observation gate requires those events, consistent entry direction, and mean actual speed stddev≥12km/h per density group. It deliberately permits sparse28NPC scenes without an overtake in every five-minute observation; maneuvers are not forced to satisfy a quota. Old A60 fails the new quality gate, including the entry-side assertion.
Raw per-run summary: evidence/A60/R2/observation-before.json and observation-after.json. These are headless model observations, not replayed human input.

## Tests and safety
`npm run check:traffic-ai3` locally PASS: existing profile/longitudinal tests,2160 index/linear comparisons, C2 cancellation,31-file protection,30min endurance, new completed-overtake/fast-player/braking tests, and27 observation scenarios.
`node tests/traffic-ai2.mjs reports/A60/feedback` PASS: all24 heldout combinations, safe and blocked lane changes, no overlap, no ordinary ping-pong, barriers/crash capsules and frequency contracts. No old assertion was relaxed or deleted.
Deterministic slower-NPC fixture: lane completion3.9083s; completed pass10.7375s; maximum240Hz lateral step0.007199m. Fast rear player250km/h blocks the pass when the other adjacent lane is occupied. Additional checks bound induced rear braking and require early source-lane braking.
30min/120NPC endurance:99.018km road-s,3243 recycles, no empty flow, no NaN, original car objects reused, minimum sampled gap11.4378m, same-seed respawn match. See evidence/A60/R2/endurance.json.
Full mandatory A52/current suite and real Chromium WebGL smoke are required on this commit. Their result/command durations and URLs are attached to PR #2 after execution. Historical source identities remain separate failing diagnostics and must not be described as a fully green workflow.

## Paired CPU measurements
Three repetitions per implementation, order alternated; Node traffic only, seed917,60 simulated seconds. Dependencies other than highway.js are the same. Median of each run's p95 for FOUR240Hz traffic steps, milliseconds:

| NPC | Previous A60 p95 ms | Revision2 p95 ms |
| ---: | ---: | ---: |
| 28 | 0.13440 | 0.15025 |
| 72 | 0.19320 | 0.22883 |
| 120 | 0.28671 | 0.30851 |

The extra safety/pace calculations have a small CPU cost at dense flow. These are synthetic Node measurements subject to scheduling/JIT/GC; they are not iPhone FPS, GPU timing, allocation rate or GC-pause proof. Full browser initialization and actual device frame pacing remain separate checks. No optimization claim based solely on a global maneuver counter is made.

## Preview and manual acceptance
Use only https://driving-lab-a60-traffic-preview.maxtrcgi.chatgpt.site . The new header must say **Traffic AI3.0 · Revision2** (spaces in the actual header). The PR body records the exact published GitHub/source/deployment SHAs; do not assume an older live preview has already updated while CI is running.
Control path: Pause → Controls & setup → Circuit & conditions → Highway traffic. Match density with A52 (72 then120) and graphics settings; the separate address has separate saved preferences. Compare slower trucks/Calm traffic with brisk cars, following, lane changes and actual passes for five minutes; then approach at150–250km/h and drive curves/hills. Confirm seat/camera/controls and a longer session remain stable.
No main/tag/Release/production-site changes. No merge. No Visual R2 or scoring changes.
Recommendation: keep PR draft pending this revision's CI and actual iPhone feedback. Technical PASS cannot substitute for Max observing a more natural flow.
