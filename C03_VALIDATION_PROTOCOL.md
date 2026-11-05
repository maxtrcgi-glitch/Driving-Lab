# C0.3 — frozen protocol, 2026-10-11

Baseline b7dc54da1c674a1f40e913a2defe81bfeb9eeadf, complete C02 ZIP verified SHA256 df80a83e5f80d3fa1232a1537bb27e81d72898a2a8a4e4a5d9dcab1c18708143. Slip detector frozen, no tuning on its old heldout.

## Split fixed before predictor evaluation

Calibration: speeds 80,140 km/h; stimuli smooth-release, long-counter, steady-demand, straight. Heldout: 110,180,220 km/h; NEW stimuli delayed-unwind, two-pulse, brake-turn, opposite-flick. Both signs. Snapshot times 1.25,1.60,1.95,2.30 seconds. All stock Vehicle.reset +96 settling ticks then real driver steering/pedals; no injected yaw/beta. Family split, not merely speed transfer. These are deterministic engine stimuli, not independent real-car observations.

Candidate HOLD holds current normalized adapter demand, not geometric reference. UNWIND reduces that demand linearly to zero in 200ms, retaining SteeringResponse position/target/raw/mode and physical rack slew 3rad/s. Pedals held identically at snapshot values; this limits inference when driver changes pedals later. Horizons50/100/200/400ms; exactly96/192/384/768 physics substeps. Predictor shares two candidate trajectories; no node-beam clones at runtime.

Offline validation branches restore entire enumerable Vehicle state excluding terrain function/deformation back-reference; skin caches rebound, node/wheel/beam/drivetrain/internal rack retained. Whole DrivingExperience histories cloned. Verify duplicate HOLD bit-exact before treating comparison as counterfactual. Raw COM beta and chassis momentum yaw read independently from Vehicle, not classifier labels.

Independent outcome annotation uses branch endpoint/path: an opposite-side slide requires initial |beta|>=3deg and crossing beyond opposite3deg within horizon. HOLD worse iff UNWIND reduces |beta| by>=2deg AND |COM lateral speed| by>=0.5m/s, without increasing |yaw rate| by>0.1rad/s or endpoint lateral path deviation by>0.5m; reverse defines UNWIND worse. Otherwise AMBIGUOUS. This multi-signal proxy is not expert controllability/desired-road-path ground truth. Freeze oracle separately from runtime decision; no tuning to heldout outcomes.

Publish all accepted/rejected snapshots, errors MAE/RMSE/max beta(deg)/yaw(rad/s)/lateral velocity, rack/trajectory errors by horizon/speed, ranking confusion including ABSTAIN. Invalid future contact/damage separate from model error, do not silently discard. Both-sign symmetry and zero actuation/full-state identity mandatory. Node benchmark median/p95 runtime call cost only, not iPhoneFPS.

Initial runtime model parameters: planar fixed loads/contact geometry, measured tyre alpha/kappa memory, bounded hub residual decay40ms, measured acceleration residual decay40ms, frozen per-wheel drive torque with wheel-spin/friction/brake/ABS relaxation; no future suspension/drivetrain/node dynamics. Integrate at1/1920s to keep wheel-spin stiffness stable. Decision requires conservative multi-signal dominance; UNKNOWN/ABSTAIN otherwise. Default disabled, optional sampling<=30Hz. Output never feeds steering.
