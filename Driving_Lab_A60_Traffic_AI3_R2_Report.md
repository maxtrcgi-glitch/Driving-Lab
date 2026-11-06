# Driving Lab A.6.0 — Revision 2 traffic correction

Status: experimental; first A60 preview failed Max's iPhone behavior acceptance. This report supersedes prior A60/R2 measurements. Keep PR #2 draft. No manual acceptance, merge or stable-site publication.
Repository: https://github.com/maxtrcgi-glitch/Driving-Lab
PR/branch: https://github.com/maxtrcgi-glitch/Driving-Lab/pull/2 — core/traffic-ai3.
User-tested comparison:0acd17058f615ded086294fe87e7abaf2fc5c132.
Stable A52 main/tag target:2cd72beceeddb2ada569bc9e7e69582f0c925cc8; untouched.
The final full-CI and deployment receipts are appended to the PR body after this follow-up commit is tested. Old passing CI is not proof for a new revision.

## Confirmed causes and final changes
The earlier benchmark counted lane starts across the streaming ring rather than completed passes near the player. Max's five-minute observation therefore overrides its positive technical recommendation.
A pooled object was also incorrectly treated as the same driver forever: desired speed/profile survived every hidden recycle. Now logical identity is (id,generation). A new generation gets seeded driver characteristics at hidden entry; within one generation the desired speed/profile stay stable. The memory object and vehicle archetype remain reused. No per-frame random speed jitter or in-view profile switch is introduced.
Desired speeds: trucks72–97km/h; Calm cars72–97; Normal86–122; Assertive122–158. Actual speed still follows leads, density, grade and curvature. The mean was balanced near the earlier flow rather than making every car faster.
Trucks/Calm prefer outer; Normal80% middle/20% outer; Assertive80% inner/20% middle, seeded per driver. Births use this preference when a safe slot exists, with three-lane fallback. This avoids a slow initial car blocking the passing lane while retaining individual variation.
Motivation compares attainable pace and acceleration gain. Rear NPC acceptance bounds its own induced IDM braking above-2.5m/s², alongside gap/closing-duration checks; fast-player checks remain stricter with220m observation. Comfort jerk limits can be bypassed by emergency stopping demand in either occupied lane. Quintic3.8–4.4s lane travel, C2 cancellation, geometry and collision calls remain.
Entry side and initial velocity now agree. The old27-run set recorded9511 entry-direction inconsistencies, the corrected set0. This is not a count of visible spawns. A12m search could miss valid slots; bounded collision-boundary jumps and4m refinement preserve the46m exclusion and braking envelope. All three fallback lanes are examined from the actual entry lane.
No maneuver is triggered by player visibility and no lane-change quota is imposed on NPC logic.

## Completed behavior, measured rather than inferred
`node tests/a60-visible-flow.mjs`:27 runs,28/72/120NPC × player100/150/200km/h × seeds917/2027/8123,300 simulated seconds each at30Hz, road seed86. Old code was checksum matched to the published comparison and measured with --measure-only.
A completed pass requires a slower NPC lead recorded before initiation, unchanged generations, a completed lane change and passing ahead by half-lengths plus5m within30s. Generation changes invalidate pending observations.
Road-s bands ahead150/250m are observation PROXIES, not rendered frustum/occlusion, actual iPhone video or replayed human input. Each table row totals NINE five-minute runs. Stddev averages actual forward250m speed stddev per run.

| NPC | Completed maneuvers ahead150m before → after | Completed NPC passes ahead250m before → after | Actual speed stddev km/h before → after |
| ---: | ---: | ---: | ---: |
| 28 | 28 → 23 | 12 → 20 | 11.44 → 21.08 |
| 72 | 76 → 85 | 38 → 55 | 10.14 → 15.48 |
| 120 | 79 → 141 | 41 → 54 | 9.15 → 15.05 |

At28NPC, lane-change count does not uniformly increase: more passing and wider speeds do not imply more weaving. At72/120 every corrected run has a completed maneuver within150m and a completed pass within250m AFTER30s warmup. The quality gate also requires finite states, positive sampled body gaps, zero normal contacts/spawn failures, consistent entries and mean actual-speed stddev≥12km/h per density. Old A60 fails this gate, including entry consistency. Raw summaries: evidence/A60/R2/observation-before.json and observation-after.json.

## An actual CI failure, kept visible
Intermediate R2 commit4cc8c6fc1189793ad9d0c0d64458ff1c77c3750a was NOT published. Run https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42191188112 passed real Chromium and15 current commands but failed check:continuity and check:highway2 on one shared contract:18NPC/200km/h/seed917 had16.7s empty ahead500m vs required<15s. The limit was NOT relaxed. Speed balance, driver renewal and safe birth placement were corrected; the full follow-up must pass again.

## Local final validation
- `npm run check:traffic-ai3` PASS: existing longitudinal/profile,2160 index/linear queries, C2 cancellation,31-file protection,30min endurance, completed pass/fast-player/rear-braking/driver-generation tests and27 observation runs.
- `node tests/traffic-ai2.mjs reports/A60/feedback` PASS:24 heldout cases, unsafe/blocked merges, ordinary cooldown, body gaps, finite states, crash capsules, barriers and frequency contracts. No original assertion was removed or relaxed.
- `node tests/traffic-continuity.mjs --assert --out=reports/A60/r2-continuity` PASS:75 original combinations ×300s; no spawn failures or fog-visible recycling, no empty ahead1000m interval. Worst empty ahead500m at200/250km/h12.10s (<15), worst encounter gap29.33s (<40), minimum sampled NPC gap9.4951m. Raw: evidence/A60/R2/continuity.json.
- Controlled pass: lane completion3.9083s, actual pass10.7375s, maximum240Hz lateral step0.007199m. A250km/h rear player blocks a pass when the other lane is occupied; induced rear braking and source-lane stopping demand are guarded.
- Same seed/generation reproduces a new driver; object reuse and generation increment are asserted separately from within-generation stability.
- Endurance:1800 simulated seconds/120NPC/99.018km, 3267 recycles, no NaN/empty flow/normal contacts, reused objects, minimum sampled gap8.5223m; same-seed respawn match.

Full `npm run check:current` (17 suites, including all original12 commands), `npm run check:browser` and `npm run bench:traffic-ai3` remain required. Final outcomes, exact command durations and artifact/run links are attached to PR #2 after execution. Historical source-identity diagnostics remain independently failing; the whole workflow must not be called green.

## CPU comparison
Three paired repetitions, alternating order, Node traffic only, seed917,60 simulated seconds. Median of per-run p95 for FOUR240Hz traffic steps (ms):

| NPC | Prior A60 | Final Revision2 |
| ---: | ---: | ---: |
| 28 | 0.13512 | 0.15085 |
| 72 | 0.22135 | 0.22375 |
| 120 | 0.28410 | 0.29984 |

Raw: evidence/A60/R2/paired-node.json. These are synthetic CPU timings with JIT/scheduling/GC variation, not iPhone FPS, GPU time, allocation rate or GC-pause proof. Device frame pacing/thermal behavior remain unverified. Normal NPC pairs still use avoidance, not a new rigid-body solver.

## Preview and acceptance
https://driving-lab-a60-traffic-preview.maxtrcgi.chatgpt.site — confirm **Revision 2** in the header. The PR publication receipt records exact GitHub/source/deployment SHAs and34-file SHA agreement; do not assume an older live preview has already changed while CI is running.
Match density/graphics with A52. Observe five minutes at100–120km/h with72 then120NPC, then test150–250km/h approach safety, hills/curves and a longer session. Settings: Pause → Controls & setup → Circuit & conditions → Highway traffic. The separate address stores preferences separately.
31 non-traffic dist files remain byte-exact A52; only traffic code and version/revision labels differ. No main/tag/Release/main-site, physics/steering/camera/road/seat controls/resources, Visual R2 or scoring changes. No merge.
Recommendation: keep PR draft for another actual iPhone behavior review. Automated PASS cannot substitute for Max perceiving a more natural flow. Manual acceptance is not claimed.
