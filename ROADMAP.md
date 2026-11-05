# A.5.2 current priorities
1. iPhone acceptance: seat comfort/clipping, live preview, PWA persistence and old camera settings.
2. Only after Director approval: separate Visual V1.3 review/integration, no assets integrated now.
3. Future cars: vehicle-specific eye + validated seat bounds and per-car storage semantics; no car selector now.
Known extreme oversteer stays deferred. Larger coupled seat envelope/full damaged-cabin frustum checks only if user needs additional range; do not reduce A42 dynamic effects to make room.

# A.5.1 current priorities

1. iPhone acceptance of curves/grades/traffic/camera/frame pacing. Stop until feedback.
2. Review Visual Kit V1.1 against A50 contract + additive A51 note; integrate via bounded host lifecycle in separate approved A52.
3. If measured needed: pool chunk buffers or cached profiles/instance transforms, retain existing resource bounds; GPU budget comes from device measurements.
4. Later road topology/banking/arc length requires a separately versioned adapter; no bridges/exits now. Extreme oversteer remains known and does not block ordinary gameplay. Future gyro/gesture manual driver look stays deferred, not implemented.

# A.5.0 / next gate

Highway World2.0 parallel asset work начинается с versioned contract1.0.0. Visual Developer поставляет render-only resources и counts/license manifest. Developer проверяет и затем после подтверждения Director выполняет ограниченную A.5.1 Geometry Upgrade. Spline/arc-length semantics, banking/graph и driveable bridges — отдельные поздние этапы. Не менять стабильные player/camera/AI ради визуальных ассетов.

# A.4.2 priorities

1. Ручная iPhone оценка Natural/Strong, стойки/обзор, pitch comfort, real frame pacing. Не начинать следующую разработку до Director.
2. Если Strong резкий, ограниченно изменить onset/release по видео; сравнить с сохранённым A.4.2, не трогая физику/управление.
3. Сохранить известное ограничение extreme oversteer; исследования countersteering не возобновлять без отдельного задания.

A.4.1 publication verified: native24, buildv014a41-af05b60245b5, HTTP200/SHA32/32. iPhone acceptance pending. Sources/backup retained; stop for player feedback.

# A.4.1 priority

First validate repeated relaunch and perceptible/comfortable head inertia on iPhone. Capture setup/video/telemetry before further changes. No new physics/TrafficAI/steering/CountersteeringAssist task. Extremeoversteer known limitation retained. Camera effects optional; UI storage preserved.

# ROADMAP — актуальные приоритеты

1. P0: реальная приёмка камерыA4 наiPhone по IPHONE_CAMERA_TEST.md: Static/DriverView, по одному effect, FOV0/+3/+6, NPC distance, input ownership, thermal/frame pacing. Доfeedback не расширять camera feature scope.
2. P1: только измеренные camera issues: снизить amplitude/response если comfort ухудшен; profiler наdevice при jitter; damaged-cabin visibility/clipping и crest/branch preview. Не менятьphys/steering/traffic ради камеры.
3. P1: оценить chase composition и recenter наportrait/landscape, default distance. Head/body interpolation большой рефакторинг только по доказанномуjitter; не внедрён здесь.
4. v0.15+: ручной cockpit glance отдельными gestures; phone-tilt gaze только после калибровки/разрешения конфликта tilt steering. Gyro look вA4 не реализован. Возможные eye height/fore-aft UI после расширения clearance validation.
5. A33traffic принят игроком; редкие sparse18/160 encounter gaps остаются документацией, не задачейэтогоcameraэтапа. Extreme oversteer сохранён, C03shadow не активировать без отдельного задания.

Каждый законченный этап: проверка→Gitcommit/tag→документация/NEXT_TASK→проверенный All-In-OneZIP→публикация mainс откатом. Source preservation приоритет. GPT-6.1Sol для ограниченногоcamera fix, Sol для standardcode, Luna для docs. Astra только отдельная сложнаяархитектура по согласованию; автоматического переключения моделей нет.
