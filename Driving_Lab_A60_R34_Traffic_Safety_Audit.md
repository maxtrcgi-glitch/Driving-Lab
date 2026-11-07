# Driving Lab A.6.0 R3.4 — Traffic Behavior, Density & Safety Audit

**Decision · FURTHER CORRECTION REQUIRED**

The iPhone 17 Pro Max run on preview v5 covered about 3.14 km, reached 194 km/h and included 25 player overtakes. The player noticed one NPC lane change and stretches with little traffic. The overlay showed six starts, six completions and more than 20,000 candidate rejections. Density, camera settings and seed are unconfirmed. The player overtake counter and NPC maneuver counters measure different events. Candidate rejections accumulate across repeated evaluations. The prior completion count could include abort settlement, although the v5 report does not establish that this occurred in that run.

## Camera observation

The runtime samples the active driving camera after rendering, using its inverse world matrix and projection matrix, including horizontal and vertical FOV. It tests the moving NPC body center. An observation requires one sample in the frustum. Sustained means at least 0.5 s of consecutive in-frustum samples, sampled at up to 10 Hz, with no sample gap above 0.22 s. Near sustained adds a 250 m world-distance limit from the camera. The separate ahead-250 metric uses road-s at maneuver start. These categories are not nested. Frustum inclusion approximates line of sight and does not measure occlusion, apparent size or human perception.

For each density, totals below cover 12 five-minute simulations with three seeds and four constant player speeds. The test applies the production CameraRig and perspective at 844×390 to scripted driving inputs. Runtime telemetry uses the live camera.

| NPC | Starts | Starts ahead ≤250 m road-s | In frustum | Sustained | Near sustained | Preferred-lane starts | Preferred-lane sustained | Actual NPC passes | Actual passes ahead ≤250 m road-s |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 28 | 570 | 40 | 273 | 272 | 45 | 129 | 49 | 217 | 27 |
| 72 | 1912 | 115 | 958 | 949 | 162 | 159 | 39 | 598 | 59 |
| 120 | 3407 | 202 | 1630 | 1612 | 297 | 135 | 6 | 855 | 92 |

Preferred-lane starts record a maneuver motivated by cruising-lane preference. Actual passes require a committed intention and clearing the identified target. A successful lateral transition can occur without an actual pass. The large difference between global starts and close, sustained frustum observations is consistent with the user's feedback. It does not reconstruct the individual iPhone run.

## Density, speed and local gaps

Three seeds (917, 2027, 8123) at each of 12 density/speed combinations, 300 s each at 30 Hz. Count and spacing snapshots are taken once per second. Empty intervals are timed at 30 Hz, including startup and the final sample boundary. Nearest distances use available same-direction vehicles. Ahead/behind and the first bin triplet count same-direction cars only. Both-direction bins include oncoming NPCs with greater road-s. Spawn and recycle counts are sums across three runs. The spawn count includes initial fill.

| NPC | km/h | Active min–max | Mean ahead / behind | Nearest ahead p50 / p95 (m) | Mean nearest behind (m) | Mean ahead 0–100 / 100–250 / 250–500 m | Both directions | Spawn / recycle / failed |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 28 | 100 | 28–28 | 13.9/10.1 | 90/261 | 101 | 0.8/1.3/2.8 | 0.9/1.6/3.1 | 211/127/0 |
| 28 | 150 | 28–28 | 12.6/11.4 | 74/330 | 117 | 1.0/1.4/2.3 | 1.1/1.7/2.7 | 300/216/0 |
| 28 | 200 | 28–28 | 12.4/11.6 | 74/302 | 118 | 0.9/1.4/2.3 | 1.1/1.6/2.7 | 425/341/0 |
| 28 | 250 | 28–28 | 12.3/11.7 | 69/286 | 102 | 0.9/1.4/2.3 | 1.1/1.6/2.7 | 559/475/0 |
| 72 | 100 | 72–72 | 27.3/32.7 | 28/89 | 48 | 2.5/3.4/4.7 | 2.9/4.0/5.8 | 609/393/0 |
| 72 | 150 | 72–72 | 32.4/27.6 | 27/135 | 48 | 2.3/3.3/5.7 | 2.8/4.0/6.8 | 850/634/0 |
| 72 | 200 | 72–72 | 31.7/28.3 | 27/95 | 39 | 2.3/3.5/5.8 | 2.8/4.1/6.9 | 1172/956/0 |
| 72 | 250 | 72–72 | 31.4/28.6 | 27/97 | 36 | 2.3/3.5/5.8 | 2.8/4.1/6.9 | 1507/1291/0 |
| 120 | 100 | 120–120 | 54.8/45.2 | 17/57 | 33 | 3.7/5.7/9.5 | 4.5/6.8/11.3 | 1145/785/0 |
| 120 | 150 | 120–120 | 55.2/44.8 | 17/53 | 24 | 3.7/5.6/9.3 | 4.5/6.7/11.2 | 1478/1118/0 |
| 120 | 200 | 120–120 | 53.6/46.4 | 16/50 | 21 | 3.8/5.6/9.3 | 4.6/6.8/11.2 | 2002/1642/0 |
| 120 | 250 | 120–120 | 53.5/46.5 | 17/51 | 21 | 3.8/5.6/9.4 | 4.5/6.8/11.3 | 2572/2212/0 |

Maximum empty interval per combination in seconds / meters traveled. A vehicle beyond the stated horizon can still be ahead. The 500 m p95 is conditional on an empty episode, and the percentage is the fraction of all scenario time.

| NPC | km/h | Empty 100 m | Empty 250 m | Empty 500 m | Empty 500 m p95 / % time | Both directions empty 500 m |
|---:|---:|---:|---:|---:|---:|---:|
| 28 | 100 | 85.4/2373 | 56.5/1570 | 0.0/0 | 0.0/0.00% | 0.0/0 |
| 28 | 150 | 38.2/1592 | 29.3/1221 | 11.6/483 | 11.6/2.05% | 6.9/286 |
| 28 | 200 | 20.3/1128 | 14.4/802 | 3.0/167 | 3.0/0.44% | 1.5/83 |
| 28 | 250 | 12.2/847 | 8.6/600 | 2.7/185 | 2.7/0.61% | 2.7/185 |
| 72 | 100 | 11.6/322 | 0.0/0 | 0.0/0 | 0.0/0.00% | 0.0/0 |
| 72 | 150 | 15.9/661 | 8.3/347 | 0.0/0 | 0.0/0.00% | 0.0/0 |
| 72 | 200 | 8.1/450 | 3.3/181 | 0.0/0 | 0.0/0.00% | 0.0/0 |
| 72 | 250 | 4.5/310 | 1.2/86 | 0.0/0 | 0.0/0.00% | 0.0/0 |
| 120 | 100 | 0.0/0 | 0.0/0 | 0.0/0 | 0.0/0.00% | 0.0/0 |
| 120 | 150 | 1.1/44 | 0.0/0 | 0.0/0 | 0.0/0.00% | 0.0/0 |
| 120 | 200 | 1.3/70 | 0.0/0 | 0.0/0 | 0.0/0.00% | 0.0/0 |
| 120 | 250 | 0.8/53 | 0.0/0 | 0.0/0 | 0.0/0.00% | 0.0/0 |

| NPC | Global lane means, lanes 0–5 | Lane means within 500 m ahead | Adjacent same-direction road-s spacing p50 / p95 (m) |
|---:|---:|---:|---:|
| 28 | 5.7/9.6/8.7/0.6/1.6/1.7 | 1.3/1.8/1.6/0.1/0.3/0.3 | 74/264 |
| 72 | 15.8/21.4/22.8/2.0/5.3/4.7 | 3.1/3.9/4.2/0.4/1.0/0.9 | 37/111 |
| 120 | 29.6/35.1/35.3/3.4/7.7/8.9 | 5.9/6.3/6.5/0.6/1.5/1.7 | 23/61 |

The configured population was maintained at all densities, with recycling and zero spawn failures. No scenario lost all same-direction NPCs within 1 km ahead. At 28 NPC and 150 km/h, the longest no-population-in-500-m interval lasted 11.6 s (483 m of travel). Even 100 km/h can leave a 100 m horizon empty for 85.4 s, depending on relative speeds. The 500 m horizon stayed populated in the tested 72/120 scenarios. The lane counts and spacing tails show uneven local distribution despite maintained population. As the player passes a group, the next may still be hundreds of meters away, even as far-field recycling continues. Faster runs recycle more cars. Gap duration and distance vary with relative speed and seed. These results demonstrate local gaps and a player-speed effect, with no reproduced streaming population collapse or persistent buildup exclusively behind the player. The experiment establishes a range under controlled conditions, without setting a gameplay target for acceptable gap length.

## Passivity and decisions

Historical comparison uses nine five-minute scenarios per density and the existing 250 m road-space observer, which has different pass semantics from the new committed-target counter. The offline counterfactuals each remove one existing scheduling restriction with the same 27 scenarios. All normal gap, rear braking, player and reservation checks remain active in those experiments.

| NPC | R3.2 passes | R3.3/R3.4 passes | R3.4 without committed-target hold | R3.4 without reconsideration gate |
|---:|---:|---:|---:|---:|
| 28 | 23 | 19 | 19 | 21 |
| 72 | 52 | 31 | 49 | 37 |
| 120 | 55 | 45 | 56 | 41 |

The hold after a committed pass prevents new maneuver evaluation while the target remains relevant. The counterfactual points to this as a meaningful contributor at 72 and 120 NPC. The reconsideration delay has mixed results across densities. The sensitivity runs are diagnostic and leave production behavior unchanged.

| Metric, full 36-scenario matrix | 28 | 72 | 120 |
|---|---:|---:|---:|
| Decision evaluations | 3,022,841 | 7,772,726 | 12,954,243 |
| Candidate rejects, repeated | 3,367,488 | 7,858,688 | 12,671,870 |
| Slower leader encounters | 807 | 4,911 | 11,572 |
| Safe opportunity evaluations | 1,686,628 | 2,620,574 | 2,765,720 |
| Intentions created | 771 | 4,493 | 10,414 |
| Unique intentions with a safe candidate | 695 | 3,409 | 6,298 |
| Accepted intentions | 398 | 1,588 | 3,021 |
| Closed before commitment | 265 | 2,176 | 5,590 |
| Abandoned intentions, including committed | 290 | 2,278 | 5,819 |
| Wait timeouts | 234 | 1,948 | 5,166 |
| Target unavailable | 26 | 147 | 392 |
| Target irrelevant | 30 | 180 | 252 |
| Blocked evaluations | 294,612 | 2,394,670 | 5,973,293 |
| Blocked evaluations with a safe candidate | 178,712 | 784,473 | 1,171,434 |
| Blocked and safe but no winning incentive/preference | 129,791 | 569,108 | 890,860 |
| Committed-target holds, evaluations | 53,500 | 230,783 | 305,329 |
| Cooldown with slower leader, evaluations | 60,891 | 403,481 | 954,006 |
| Reconsideration with slower leader, evaluations | 18,981 | 163,571 | 445,310 |
| Waiting, NPC-seconds | 8,389 | 58,293 | 146,659 |
| Wait episodes over 10 s | 397 | 2,787 | 7,108 |
| Following slower traffic, NPC-seconds | 12,548 | 100,838 | 251,534 |
| Slower-follow episodes over 10 s | 359 | 2,376 | 5,930 |
| Clean lane-change completions | 548 | 1,762 | 3,049 |

Longest observed waits were 28.1/28.2/28.2 s. Continuous slower-follow episodes reached 173.1/299.0/300.0 s and may span a leader change or scenario boundary. They measure the following condition rather than duration of the literal FOLLOW state. A safe candidate may still offer inadequate pace or acceleration benefit, lose to preference/ranking, or require a deferred retry. The existing slower-leader trigger uses a 1.5 m/s margin below target speed. The pace/acceleration checks and preferred-lane scoring explain why gap safety alone cannot predict acceptance. Existing reservation regression fixtures reproduce conflicting intentions. The matrix does not assign every rejection to a unique safety cause. Timeouts, hold, cooldown and reconsideration are tracked independently, and evaluation counts may repeatedly describe one driver.

## Diagnostic corrections

- Before the correction, a waiting intention whose target moved behind could emit a completed pass without commitment. The targeted test expected zero and received one. It now requires EXECUTE_PASS and records uncommitted clearance separately.
- Before the correction, an aborted trajectory settling back into its lane could emit a normal lane-change completion. The positive test expected zero and received one. It now emits abort settlement separately.
- The display now shows the configured density, repeated candidate rejections, unique goals with safe opportunities, accepted and closed goals, lane-change starts/clean completions, actual passes, preferred-lane starts and frustum observations. The copied diagnostic includes the aggregate event counters. The title and runtime metadata identify **Traffic AI R3.4 Experimental**.
- Visibility tracks active maneuvers only, capped at 128, with generation/despawn cleanup. The existing event ring is 128 and actor state is capped at 256. The HUD remains opt-in. Paired runs assert matching simulation end states under identical inputs, with diagnostics both enabled and disabled.

## Architectural safety

**Road-s approximation.** Sampled the first 30 km on seed 86, lanes 0–2, with 1 m numerical chord integration on the actual lane surface. For road-s gaps of 12/30/120/250 m, p95 absolute discrepancy was 4.40%/4.38%/4.44%/4.26%, with a 5.83% maximum. A 30 m road-s difference at s=12,400 m on lane 2 was 31.86 m along the lane, while the worst sampled overestimate was 30 m versus 29.83 m. Grade-only contribution peaked at 0.051%. The approximation can shift near-threshold classifications. A consistent lane arc and relative-motion model would require coordinated changes to the safety calculations.

**Update order.** Same-order seeded runs replayed exactly. Reversing the NPC iteration order from equivalent states changed the first maneuver decision at 8.00/5.27/5.57 s for 28/72/120 NPC. Normal versus reversed starts over 60 s at 150 km/h were 18/17, 33/33 and 86/90, with no counted contacts or spawn failures. Sequential updates expose different kinematics and reservations inside the same tick. A two-phase snapshot and deterministic conflict arbitration would need a separate architectural change.

**Body overlap.** A controlled ordinary NPC pair with 1 m longitudinal and 0.4 m lateral separation overlapped, with zero crash-pair checks and zero contacts. Marking a crash in the positive control produced one pair check and one contact. Gap checks and maneuver reservations prevent conflicts. The crash-contact path is not a general overlap detector for ordinary NPCs. Zero counted contacts in the matrix cannot establish absence of all overlaps. An ordinary-pair overlap monitor belongs in a separate targeted correction.

## CPU and verification

Node median ms per simulation step across three alternating paired repeats per density, 60 simulated seconds after 10 s warmup. Projection is averaged across all simulation steps, including ticks without a camera sample. Timing excludes rendering and is not an iPhone GPU, frame-rate or thermal measurement.

| NPC | R3.3 off | R3.4 off | R3.3 on | R3.4 on | R3.4 projection on |
|---:|---:|---:|---:|---:|---:|
| 28 | 0.05233 | 0.04136 | 0.05740 | 0.06671 | 0.00011 |
| 72 | 0.10164 | 0.10826 | 0.13965 | 0.15882 | 0.00018 |
| 120 | 0.17246 | 0.17926 | 0.23542 | 0.28588 | 0.00037 |

Local targeted Traffic AI tests passed, including the 30-minute endurance, R3.1 diagnostics, R3.2 traits, R3.3 intent and new R3.4 frustum/counter contracts. Static verification covered 37 runtime files. The required 17-suite regression workflow, Chromium WebGL smoke, merge gate and independent historical diagnostic are linked from [draft PR #2](https://github.com/maxtrcgi-glitch/Driving-Lab/pull/2). The PR records the final checkpoint SHA, CI run and preview receipt when available.

```sh
npm run check:traffic-ai3
npm run check:static
node tests/a60-r34-density.mjs reports/A60/r34-density.json
node tests/a60-r34-architecture.mjs
node tests/a60-r34-overhead.mjs /path/to/R3.3-checkout
node tests/a60-r34-counterfactual.mjs --measure-only --variant=without-hold reports/A60/r34-no-hold.json
node tests/a60-r34-counterfactual.mjs --measure-only --variant=without-reconsider reports/A60/r34-no-reconsider.json
```

GitHub checkpoints [R3.4a](https://github.com/maxtrcgi-glitch/Driving-Lab/commit/28716a0aef7f028d6719c07356a70946442e375f) and [R3.4b](https://github.com/maxtrcgi-glitch/Driving-Lab/commit/c02ff2537df25f75f4e5d66358edcbd29655a23a).

**FURTHER CORRECTION REQUIRED.** The evidence supports investigating committed-target hold and local replenishment/distribution before tuning maneuver frequency. The road-metric, iteration-order and overlap findings need targeted safety follow-up. No new real-device session was observed during this audit. A diagnostic preview can capture the density and close frustum counts from a repeat iPhone drive, but cannot establish visual acceptance by itself.
