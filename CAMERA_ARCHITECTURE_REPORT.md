# DriverView Hybrid v0.14A.4 — Camera Architecture Report

## Scope и входные материалы

Основа: A33 eff802fb141cef9294dfabe0eaf4dfff4b751a7c, проверенный исходный ZIP SHA256 1cd0721aa9e1d97d7c3cf1f37749f2a22440d6c9ca3e44ddac1447c3204773c2. Оба исследовательских архива из Developer Camera Input Package прочитаны: 02_DEVELOPER_SPEC, 03_STAGE_B_SOURCE_AUDIT, 04_VALIDATION_PLAN и Director speed addendum. Их source audit относится к A31: актуальная A33 camera implementation проверена отдельно. При конфликте приоритет имеет текущее задание Director: индивидуальные переключатели, без дополнительных пресетов Sport/Natural/Stable. Реализация собственная; сторонний код CSP/AC/RHM/BeamNG не переносился. Новый глобальный ресерч не проводился.

## Один pipeline

`Vehicle/contacts (read-only) → CameraObservation + CameraRoad → CameraRig.step(DT) → CameraRig.apply → Three PerspectiveCamera`.

Physics DT=1/240. Road preview ≤30 Hz. Head/gaze/FOV/recenter/chase lag обновляются на fixed simulation ticks. apply получает число выполненных ticks × DT; slow motion автоматически использует 0.25 скорости симуляции. Кузов и камера показывают одну и ту же текущую физическую pose, без отдельной интерполяции chassis, способной сместить камеру относительно кузова. Только CameraRig пишет position/quaternion/up/FOV; resize отдельно меняет aspect/projection. Старые конкурирующие Chase/Orbit/lookAt/FOV ветки удалены. Освещение, звук и графика окружения сохранены.

## Источники и знаки

Frame R: basis.right (+local X), up (+Y), forward (+Z). Three camera смотрит по local −Z; orientation строится через Matrix4.lookAt и один quaternion, без предположения о camera yaw sign. β=atan2(v·right,v·forward). Положительное ускорение по каждой локальной оси вызывает отрицательное относительное смещение головы. Знаки проверены зеркальными тестами.

Seat anchor = car.eye = (+0.37,+0.439,−0.13) в кузове. CameraObservation дифференцирует `origin + R·eye` на physics tick; это та же render anchor, а не COM velocity, подставленная вместо origin velocity. Такая оценка включает вращательную и центростремительную составляющие в seat point. На deformable кузове это кинематическое приближение, не модель реального сиденья/мышц. Angular velocity = shortest quaternion increment q_current × inverse(q_previous) / DT; angular acceleration — его производная, world→local. `vehicle.ax/ay` не используются как vertical/seat acceleration: они уже имеют фильтр около167ms.

Specific force change: Rᵀ(a_seat − g_world) − (0,g,0). Clamp acceleration ±50m/s², angular acceleration ±30rad/s². Translation filter τ40ms; vertical low component τ220ms, high component = filtered−low, gains0.12/0.22. Angular filter τ80ms. Производные warm up3ticks; teleport/history reset не дифференцируется, rebase переводит cached positions в новый origin. Никакой случайной тряски или RPM/throttle camera driver.

## Head model

Exact critically damped spring: x''+2ωx'+ω²(x−target)=0, аналитический шаг для постоянной цели. Частоты: side/long3.2Hz, vertical3.7Hz, pitch/roll3.5Hz. Targets side/long = −0.7a/ω² × intensity × safety; vertical = −(0.12a_low+0.22a_high)/ω² × gain; pitch/roll = −0.16α/ω² × gain. Пассивный yaw отсутствует. Speed modifier ≤1.15 между80–200км/ч умножает физический отклик, не создаёт vibration сам по себе.

Hard state bounds side±40mm, vertical±24mm, long±60mm; pitch/roll±0.04rad. Outward velocity обрезается на hard bound. Visual compression L*tanh(x/L): side±20mm, vertical±12mm, long±30mm; pitch/roll±0.02rad. Envelope проверен на текущей номинальной GR86 mesh; 162near-ray проверки без пересечения видимой геометрии в40mm от глаза. Это не доказательство отсутствия всех peripheral artifacts в повреждённой машине.

## Horizon/look

Slow body up/forward reference τ650ms; компенсируется55% быстрого roll/pitch, pitch correction≤0.10rad. Длительный bank/grade постепенно сохраняется. Horizon blend входит/выходит с τ180ms; Static/DriverView не обнуляет отображаемый эффект в UI-event. Passive local rotations применяются со знаком forward-Y=−ηX, up-X=−ηZ (right-handed basis); проверены отдельным composer sign test. Композиция body yaw + filtered pitch/up + passive rotation + deliberate gaze; нет двойного вращения кузова.

Highway preview: own current road offset, s+clamp(speed×0.65s,8,55)m. Route heading alignment>0.65, offset≤15m. Circuit: первоначальная nearest branch, затем локальный ±18segments поиск и continuity progress; направление>0.55 и distance≤12m. Seam обрабатывается modulo courseLength. Pad/bumps preview выключен. Это геометрический preview своей дороги, без prediction racing line/NPC target. Глобальное переключение на соседнюю ветвь не выполняется; при потере corridor confidence взгляд возвращается к кузову. AutoLook использует направление future point + measured yawRate×0.10s (≤0.07rad), а не рулевые колёса. Curvature участвует через будущую геометрию.

Drift gaze: только forward speed>3m/s, safe pose; speed gate3–10m/s. Enter |β|>0.12rad100ms; exit<0.075rad180ms. Weight≤0.8, τ180ms. β direction ограничен±0.38rad; смешивается круговое среднее body/road/velocity с ненулевым body reserve. Gaze spring2.8Hz, target≤0.38rad, rate≤0.8rad/s. Не экстраполирует ненадёжную betaDot. Countersteering не меняет взгляд непосредственно. Reverse/stop, airborne, severe roll, heavy damage/contact приводят к body-safe gaze. Safety confidence плавно входит за250ms и выходит за60ms; контакт≥2wheels, up.y>.45, damage<.65, collisionPulse<.5. Это visual heuristic, не slip classifier и не Assist.

## Speed/FOV

Vertical base60° (UI55–90), speed extra0/3/6°. Disabled в Static и вне cockpit. `smoothstep(40,200,speedKmh)`, forward-speed gate0–3m/s, riseτ0.6s/fallτ0.8s, rate≤6°/s. FOV зависит от фактической скорости, не педали/RPM. Horizontal FOV = 2atan(tan(vertical/2)×aspect); при844/390 и60° это около102.7°. Projection обновляется при изменении FOV/near/aspect; на каждом fixed tick никаких GPU операций.

## Unified Chase

Modes0Chase,1Cockpit,2Hood. Отдельный Orbit удалён. Default distance5.6m,height2.15m; speed не отодвигает камеру. Small direction lag exp(−14DT) с world-error bound1.2m; body heading primary, limited velocity correction≤0.10rad. Camera pad upper-right — единственный orbit pointer owner; steering pad и pedals не менялись. Orbit yaw±π, relative pitch−0.16…0.6rad. User input имеет приоритет; послеrelease900ms, exponential recenter2.5×speed s⁻¹, speed0.4–2.5. ToggleOff сохраняет ручной угол. Blur/cancel/restart освобождают capture. Mode transition350ms smoothstep в vehicle-relative frame, без старого world-position lag и final snap. Respawn — прямой reset вместе с машиной, не пролёт через старую локацию.

## Lifecycle, settings, performance

Pause freezes fixed state; resume/hidden reset derivative histories и spring velocities, сохраняя отображаемые offsets для мягкого возврата. Hard reset/repair/location смена полностью сбрасывает динамику. World rebase сохраняет local states и переводит world caches, включая road target. Camera settings key driving-lab-camera-v014a4; независим от vehicle/experience prefs. DefaultDriverView: inertia25%, horizon/autoLookOn; drift/FOVOff. Static — контрольный first-person body-fixed вариант. Reset Camera не меняет setup автомобиля.

Предвыделенные vectors/quaternions/springs; road helpers создают небольшие snapshots≤30Hz, не на каждом240Hzшаге. CPU/frame ring2×1800Float32 (~14.4KB), сортировка только при экспорте. Camera diagnostics включены в metadata обычного telemetry export; app.metrics.cameraMs включает fixed-tick наблюдение/road/rig и render apply. Physics/traffic timings сохраняются. No postprocessing/new shaders/dependencies.

## Ограничения

Нет браузерного GPU renderer/реального iPhone в этой проверке. Автотесты не доказывают комфорт, клиппинг после сильной деформации салона, отсутствие укачивания или frame pacing Safari. Lookahead при off-road intentionally suppressed; большой drift/reverse не превращает взгляд на180°. Высота/fore-aft глаза не вынесены в UI: не требуются минимальным текущим контрактом и увеличивают clipping envelope. Manual cockpit glance/gyro — future roadmap. Старое extreme-oversteer ограничение сохранено; C03 Shadow не активирован.
