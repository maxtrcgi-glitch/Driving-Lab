# CAMERA_FEEL_CALIBRATION_REPORT — v0.14A.4.2

## Подтверждённая причина слабой амплитуды

A.4.1 correctly measures local velocity beta. Its circular average gives body-forward weight 1, road up to .75 and drift up to .8. At beta15° actual camera yaw was 5.65° without road and 3.84° on a straight road; at25° it was9.66°/6.79°. This suppression occurs before smoothing, not at the final Three camera. `reports/A41-gaze-audit.json` is a replay of the immutable A.4.1 source.

Head translation had a 30mm soft saturation and equal acceleration/braking coefficient .7/(2π3.2)². Longitudinal pitch used .0045 rad per m/s² and a .06rad soft limit. Modern calibration separates targets, display caps and phases; lateral/vertical dynamics remain unchanged.

## Изменения

`camera-profiles.js` contains independent head/gaze tables. `camera-rig.js` remains the sole transform/FOV owner. Acceleration/braking gains differ. Onset adds a bounded fast-minus-slow acceleration component only in the direction of the existing load; hold follows measured acceleration; release uses a faster critically damped response. No fabricated shake. Profile parameters fade over200ms rather than resetting dynamics.

Natural translation gains .0045/.0055 m/(m/s²), pitch .0085/.0095 rad/(m/s²); Strong .0062/.008 and .011/.0127. Longitudinal onset gains Natural .00035m/.0006rad, Strong .0006m/.001rad per m/s², onset clamp4m/s². Translation hard state bounds .12/.14m and soft display caps back/front30/40mm and34/43mm. Pitch soft limits .10/.12rad, final caps .085/.105rad. These are visual calibration values, not validated human physiology. Actual rearward movement uses negative localZ, acceleration pitch negative, braking pitch positive.

Natural gaze = .8×filtered beta×confidence; Strong =1×filtered beta×confidence. Beta filtering80/65ms; detector enter4°/3.5°, exit2.5°/2.25°, enter100ms/exit180ms; confidence smoothing160ms. Full confidence at10°/8°. Road anticipation is computed separately and gradually reduced by up to85% during confirmed slip; velocity correction is no longer averaged with a fixed body-forward reserve. User max10–25°, independent intensity0–100%. Actual yaw rate bounded .8/1rad/s, acceleration2/2.5rad/s². The old spring state limit .4rad was identified by a failing amplitude test and raised only in modern profiles to .45rad. Reference keeps old .4rad behaviour.

Unsafe contact/damage/collision, invalid or >68.8° beta, reverse and low speed suppress the velocity target and return smoothly. No steering or physical intervention. At zero gaze intensity road anticipation remains separate. Reference retains exact A.4.1 dynamics when other settings are unchanged, intensity100% and max25°.

## Измерения фактической камеры

Constant-acceleration fixtures isolate camera response, with actual final Three position/quaternion and fixed240Hz observation. They are not GR86 engine output or phone tests. Translation and pitch below are measured after settling; sign is relative to the vehicle.

| Пресет | Ускорение | Смещение, мм | Pitch, ° | t90, с | Возврат 95%, с |
|---|---:|---:|---:|---:|---:|
| reference | +0.5 g | -8.73 | -1.27 | 0.317 | 0.350 |
| reference | -0.8 g | 12.73 | 1.82 | 0.267 | 0.350 |
| natural | +0.5 g | -19.56 | -2.37 | 0.267 | 0.283 |
| natural | -0.8 g | 31.72 | 3.61 | 0.233 | 0.300 |
| strong | +0.5 g | -25.10 | -3.04 | 0.250 | 0.267 |
| strong | -0.8 g | 38.60 | 4.66 | 0.217 | 0.283 |


Constant-slip fixtures retain exact beta for measurement. They are not claims of sustained physical drift. AutoLook Off, gaze100%, max25°, inertia Off. Actual final yaw:

| Пресет | β5° | β10° | β15° | β25° | Max yaw rate, °/с | Max yaw acceleration, °/с² |
|---|---:|---:|---:|---:|---:|---:|
| reference | 0.00 | 1.92 | 5.65 | 9.66 | 45.84 | 2579.05 |
| natural | 1.04 | 8.00 | 12.00 | 20.00 | 45.84 | 114.59 |
| strong | 2.34 | 10.00 | 15.00 | 25.00 | 57.30 | 143.24 |


Reference's high angular acceleration on a step is retained for faithful A/B testing; Natural/Strong explicitly limit it. Full timings, traces and angular acceleration at30/60/120fps: `camera-calibration.json`, `camera-calibration-response.json`, `camera-calibration-safety.json`. Timing uses end-of-phase measured yaw, not touch latency.

## Реальные прогоны Vehicle

108 runs: acceleration from rest, braking from100, throttle release, ordinary lane change, initial slips±5/10/15/25°, all three profiles, render30/60/120 with fixed240Hz physical updates. The slip state then evolves under actual tyres/body, rather than being held. Identical frame grouping gives matching final camera metrics <1e-9. Normalised physical states, control inputs and protected source files remain unchanged.

Actual acceleration maximum translation/pitch: Reference8.96mm/1.31°, Natural19.95mm/2.44°, Strong25.54mm/3.12°. Actual100–0 braking:15.40mm/2.14°,34.98mm/4.15°,40.85mm/5.29°. Strong briefly exceeds the steady experimental targets during stronger actual braking; these remain bounded. Peak rendered combined yaw/pitch angular acceleration for these runs is explicitly reported, including Strong braking928.39°/s². This is a comfort concern for device validation, not hidden evidence of smoothness. Natural is the default; Strong is an expressive A/B choice, not a promise of comfort.

Exact A.4.1 Reference replay2880 ticks, including960 Chase ticks with manual orbit/recentering. Vehicle state equality checked every tick.19 protected source files byte identical, including accepted launch fix, tyres/transmission/controls/traffic/diagnostics and observation/road. Static pose exact.702 short mesh rays at27 extreme camera positions found no obstruction within40mm; modeled bounds remain under roof/behind windscreen. This does not prove visibility around pillars or safety of a deformed cabin.

## Визуальные сравнения

`calibration-view-accelerate100.png`, `calibration-view-brake100.png`, `calibration-view-gaze.png` compare identical physical scene and actual final camera transforms. CPU triangle projection of the actual GR86 mesh, with an explicit straight QA road; not Safari screenshots or WebGL rasterization. Strong versus Reference shifts the80m road marker by10.46px vertically during acceleration,18.31px during braking,100.31px horizontally at beta25°, viewport844×390. Strong gaze brings more of the A-pillar into view, so max angle and intensity remain independently adjustable.

## Производительность и ограничения

Same-fixture Node microbenchmark: A.4.1 median tick0.772µs, A.4.22.517µs; median apply0.315/0.344µs. Estimated camera CPU at60Hz, four240Hz ticks:3.402/10.412µs. No GPU, full-game frame pacing or iPhone FPS measured. Cached parameter objects avoid per-tick profile allocations; existing CameraObservation unchanged.

Browser QA was unavailable because the supported control-browser capability is absent. Fake DOM/bootstrap proves wiring/persistence, not genuine Safari rendering. Need player test for perceived G, gaze direction, pillars, nausea and frame pacing. Extreme oversteer remains unchanged and unfixed. No active Countersteering Assist.
