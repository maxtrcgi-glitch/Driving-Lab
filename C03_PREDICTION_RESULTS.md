# C0.3 — результаты, 2026-10-11

Модель экспериментальная, Shadow, отключена по умолчанию. Для активного ассистента точности пока недостаточно. Числа ниже — Node/full Vehicle replay, НЕ iPhone/FPS/реальный GR86.

## Ошибки на новой heldout-выборке

Protocol frozen ada44c6, runtime predictor frozen 01fad81 ДО heldout. Calibration:16 traces/64 snapshots, accepted62. Heldout:24 traces/96 snapshots, accepted94 (2 rejected), 188 candidate branches на каждом горизонте. Новые family split/speeds110/180/220; обе стороны. Все94 duplicate HOLD replays совпали по полному физическому состоянию и истории наблюдателей. Будущих contact/damage invalidity в принятых counterfactual branches не было. Зеркальная погрешность beta<=6.45e−13rad.

| Horizon | beta MAE / RMSE / max, deg | yaw MAE / RMSE / max, rad/s | V MAE / max, m/s | Path MAE / max, m |
|---|---|---|---|---|
|50ms|0.0106 /0.0179 /0.0522|0.00348 /0.00554 /0.0212|0.0119 /0.0445|0.000607 /0.00163|
|100ms|0.0290 /0.0492 /0.185|0.00879 /0.0179 /0.0808|0.0240 /0.104|0.00184 /0.00542|
|200ms|0.118 /0.233 /0.901|0.0275 /0.0519 /0.209|0.0824 /0.684|0.00517 /0.0185|
|400ms|0.677 /1.204 /4.047|0.0790 /0.131 /0.467|0.421 /3.346|0.0175 /0.0752|

Rack max error50/100/200/400ms:0.00163/0.00346/0.00518/0.0170deg. Yaw-change direction matches174/168/172/170 of188; beta-change direction188/188/188/186. Tiny changes count equally; this is not magnitude-weighted accuracy. Per-speed MAE/RMSE/max and branch traces: evidence/prediction-errors-by-speed.csv and heldout.json.

## HOLD vs UNWIND

Comparison uses beta AND residual V AND yaw AND lateral path, not yaw alone. At50/100/200ms all94 snapshot comparisons are AMBIGUOUS by the independent outcome proxy; no decisive superiority claim at these horizons. At400ms:

| Actual branch outcome | Forecast UNWIND | Forecast HOLD | Forecast ambiguous |
|---|---|---|---|
|UNWIND better|8|0|0|
|HOLD better|0|4|2|
|AMBIGUOUS|0|0|80|

Runtime conservative recommendation uses400ms plus actual countersteer evidence. Accepted94: UNWIND8, HOLD4, ABSTAIN82 (87.23%); all96 including guards: no recommendation84 (87.5%). UNWIND opportunity8/8 found, but only4 mirrored physical cases, no population reliability estimate. HOLD6 means UNWIND worsens the measured outcome;2 are conservatively missed. Example180km/h opposite-flick at1.25/1.60s both signs: holding countersteer was better; later2.30s unwind was better. Do not hardcode unwind once beta declines.

Opposite-side endpoint proxy: initial|beta|>=3deg and candidate beta beyond opposite3deg. At200ms TP8 FP0 FN0 TN180; at400ms TP14 FP0 FN0 TN174. At50/100 no positives. Endpoint agreement is not continuous hazard certainty; does not prove intention/road-path controllability or detect every intermediate crossing.

Natural trace observation:10 mirrored opposite-side events (two-pulse110/180/220 and opposite-flick110/180). First forecast UNWIND advantage preceded opposite3deg onset by350–400ms; C0.2 warning did not fire before these events. No UNWIND advantage on the other14 traces without opposite crossing. **This is an observed lead of an advantage signal, not validated safety warning.** Earliest trace samples are not all counterfactually replayed; exact action comparison was limited to four frozen snapshot times. Some opposite movement is induced by deliberate driver pulses. No proof of guaranteed prevention, no active steering.

## Failure analysis and limitations

Worst400ms beta4.047deg:110km/h brake-turn1.25s (both actions/sides). Raw demand at snapshot is0; HOLD and UNWIND are identical, but the prior brake transient and rack/tyre memories persist. Frozen filtered brake/drive torque/load cannot reproduce evolving brake, clutch/gear/LSD, suspension and node/carrier motion. Model uses measured residual acceleration for40ms only. These are plausible mechanisms from source, not a completed error attribution experiment. Large V/r errors also forbid safety certification despite good small-branch ranking.

No future load-transfer/contact/terrain prediction, no full driveline/beam/pose dynamics; gate excludes nonplanar/damage/reverse/low-speed cases. Surface is flat dry asphalt, default car; heldout is independent stimulus-family split, not real vehicle data or expert intent annotation. All mirrors and snapshots are correlated. The proxy prefers small lateral displacement relative to original vehicle axis, not an externally specified desired road path. Off/On strength requests remain diagnostic-only.

## C0.2 missed phases

Old heldout reanalysed without changing detector:70 proxy RECOVERING samples:56 lack current convergence<-0.07rad/s,10 invalid/no episode,12 reject yaw-energy guard. Future0.35s proxy recovery often begins before instantaneous growth turns negative; not evidence that lowering the threshold fixes causal inference.10 DRIFT_LIKE:8 exceed detector steady betaDot0.04,2 exceed yaw acceleration0.35; future plateau proxy and instantaneous stable drift have different semantics, no driver intent data.266 SIDE_TRANSITION:62 invalid,70 no remembered episode (overlap), only8 emitted transition rows; conservative reset loses original side. These overlapping counts are diagnostic sample counts, not causal decomposition or event detection rates. Original events0/14,0/4,2/8 remain unchanged. C02_failure_analysis.json retains counts. Slip detector/reference/estimator bytes remain identical to C0.2.

## Cost and non-intervention

Two candidate trajectories share each candidate's50/100/200/400 outputs,768 scalar steps/candidate,6144 wheel evaluations/prediction. Scratch wheel/output objects are preallocated; no explicit new objects/arrays inside substep loop. Brush-law equivalence360 probes. Optional<=30Hz; disabled runs no predictor math.

Node warm100-call benchmark median1.415ms,p95 2.772ms. Heldout snapshot calls median1.361ms,p95 1.880ms (host scheduling differs). These are CPU elapsed times on this environment, not browser FPS/iPhone/GPU. At30Hz host median implies~42ms CPU work/s, not a device guarantee.

24 C0.2 comparison pairs,17280 fixed ticks per side, RAF30/60/120 with same simulation-time input: issued commands, actual rack, ABS/TCS flags, all physical node/wheel/beam/drivetrain state and existing state/slip histories exact. Off100%,On100%,On0%, predictor enable/disable/reset exercised. Render cadence tests do not measure real touch latency. Genuine road drop265 invalid-airborne ticks and collision120 invalid ticks correctly reject predictions; reset/reverse guards pass.29 legacy+5 shadow+1 predictor Node programs pass; renderer in bootstrap stubbed. Real WebGL/iPhone/browser performance NOT tested.

Next: limited Shadow experiment modelling pedal-filter/drive-torque and axle-load evolution, new holdout and earliest-alert counterfactual snapshots. Keep existing detector frozen. Before any active assist require uncertainty calibration, wrong-action scenarios/low-grip tests and real iPhone logs. No active assistance authorised by these results.
