# A.5.2 seat offset addition
Existing CameraRig owns transform/FOV. vehicle eye.clone + local user(0,seatHeight,seatForward) + unchanged dynamic offsets → chassis quaternion → unchanged orientation/effects → apply. Observation anchor/calibration remains original, not user-slider motion. Chase/Hood unchanged. Optional per-vehicle constructor seat bounds independent of eye; future car selector must supply matching storage/UI bounds. Persistent additive fields use existing camera key,0 defaults, finite clamping.
Camera Settings adds a compact paused live-preview layout, no new render loop or per-frame vectors. Details and limits: DRIVING_LAB_A52_HANDOFF.

# A.5.1 geometry addition

Geometry-only RoadGeometry provides seeded C2 X/H derivatives to existing Highway. Additive frame/metric/heightGradient API, no change of legacy-global-z-v1. Player terrain adapter unchanged; NPC path advancement uses3D metric. Renderer uses analytic normals and grade pitch. Eight chunks/max8 cached profiles, no new assets/LOD pipeline. Full equations/lifecycle in ROAD_GEOMETRY_REPORT and integration/highway-visual-v1/A51_GEOMETRY_ADDENDUM. Physical modules and camera modules remain A42 byte-identical.

# A.5.0 — proposed Highway visual interface

Существующие Highway/buildHighwayWorld/Traffic AI не изменены. Новый contract example находится вне dist в integration/highway-visual-v1. Host-owned road frame/anchor planner → provider geometry/material registry → per-segment InstancedMesh batches → idempotent release/rebase. s сохраняет значение globalZ, units metres, t positive road-right, orientation +Z front. Разделены actual A.4.2 и deferred slope/bank/arc/LOD/bridge extensions. Полная схема в HIGHWAY_VISUAL_CONTRACT.md; интеграционные hooks будут отдельной задачей.

# A.4.2 Camera calibration addendum

camera-profiles.js supplies independent cached head/gaze numeric tables. CameraRig fades parameters at fixed240Hz, integrates bounded critical springs, keeps road and velocity look separate, rate/acceleration limits modern yaw, then applies final Three pose. Accel/braking targets, soft display bounds and final pitch cap are independent. Legacy Reference is exact, no new writer of vehicle state. See CAMERA_FEEL_CALIBRATION_REPORT.md for all numeric coefficients and safety gates. Settings retain existing localStorage key; two presets, gaze intensity/max extend schema. Unified Chase/CameraObservation/CameraRoad byte or replay protected.

# A.4.1 addendum

Vehicle engine/node-beam model unchanged except completed low-speed shift recovery handoff. CameraRig gains longPitch criticallydamped2.6Hz spring driven by filtered actualseat acceleration; sum with angularpitch bounded±.06rad. Sole final camera owner preserved; CameraObservation/settings/Chase/road unchanged. New scalars exported via existing diagnostics. Details HEAD_INERTIA_FIX_REPORT.md.

# Camera pipeline v0.14A.4

Единый read-only CameraObservation/CameraRoad → CameraRig.step240Hz → applyThreeCamera. Source/filters/head/gaze/horizon/FOV/chase ownership и lifecycle подробно в CAMERA_ARCHITECTURE_REPORT.md. Settings отдельно от vehicle setup; fixed simulation time для head/FOV/recenter; runtime camera/frame ring1800samples. Physics/traffic/diagnostics архитектура ниже сохранена.

# Traffic Continuity v0.14A.3.3

`Highway.spawn` сохраняет близкий rolling start, заполняет остальную ограниченную популяцию по кольцу и проверяет зазоры. 5/6 бюджета — попутное направление, 1/6 встречное; это явное перераспределение, не увеличение общего количества. `Highway.step` вычисляет знак относительной продольной скорости, оставляет incoming cars за1320м до их входа в видимый поток и удаляет outgoing только за1300м. При нехватке места поиск продолжается до2192м, максимум160tries×3lanes. Сохраняется безопасный отказ; в измеренных прогонах failures=0. Профиль/тип/desired существующего actor постоянны после рециклинга, индивидуальные различия при seed/reset сохраняются.

`TrafficTrace` — отдельный read-only модуль: предвыделенный Float64Array1800×16,5Гц,6мин, ~230KB. Запись только после новых physics steps, без backfill дубликатов; reset при смене location/start. Экспорт в metadata обычного Telemetry-файла как trafficContinuity schema DrivingLabTraffic/1. Активные/направления/передние зоны100/250/500/1000м/nearest/relative speed/instant pass time/spawn-retire rates/failures. Infinity экспортируетсяnull. Нет управляющих feedback-зависимостей.

Нормальные NPC: прежняя planar road-space модель AI2, решения30Гц, проверки TTC и source/target-lane reservations, quintic3.8–4.4s. Crashed NPC: прежние planar OBB/capsule контакты. Player physics и diagnostic modules byte-identical A31. Render: прежние8chunks, instanced120capacity, frustumCulled=false для traffic; весь активный набор передаётсяrenderer. Дальние NPC могут находиться вне streamed road geometry, до зоны видимости; GPU/occlusion не измерены. FogExp2 density.0017:1%contrast около1262м. Запас1300/1320м — conservative CPU-proxy, не доказательство отсутствия pop на экране.

# Traffic AI 2.0 — первая итерация

Дорожная геометрия seed отдельно от trafficSeed. Highway.reset(roadSeed,trafficSeed) детерминирован; приложение при обычном старте выбирает новый trafficSeed, query override поддерживает воспроизводимость. Нормальные NPC имеют road-space кинематику, IDM-подобное следование с индивидуальными headway/acceleration. Scratch laneInfo переиспользуется. Решения30Гц; source/target/actual overlap резервируются; checks front/rear closing и gain/cooldown. Quintic боковая интерполяция3.8–4.4с, ограниченная прогрессом при малой скорости. После контакта NPC переходят в planar инерцию. OBB support против стен и capsule impulse против NPC; предвыделенный crashed-index буфер, narrow phase только crashed участники. Player collide/rebase/render unchanged. Метаданные экспорта: road seed + trafficSeed + AI counters. Базовая физика игрока, touch/rate/Shadow modules locked; no active assist.

---

## v0.14A.3.1 — read-only force diagnostics

Steeringpipeline/Vehicle/state/ref/slip/predictorunchangedA3. SteeringTraceexpanded60Hz1200rows84preallocatedFloat64columns;capturesafterobserve,endtickforces/anglesandfiltered40msderivatives. Passivepad/button/keyboardlistenersrecordtimestamps/ownershipclues,digitalHeld/tiltstateonly. Nofeedback/controlchanges. OfflineForceProbewrapsdistributeCouplewithoriginalcalledexactlyonce,actual1920Hzpreintegrationmoments;offlineV8fullsnapshots preservealiasgraphforcounterfactual. Finiteopenlooppulseoracleandgeometrycontrollerexistonlytests,notdist. Detailedforce/momentdecompositionandlimitationsinRECOVERY_INVESTIGATION_REPORT.

## Актуально v0.14A.3 — selective steering response

Input acquisition/static shaping неизменны; controls.SteeringResponse получает только raw/speed/dt/mode, selective large-target/large-error rate envelope3.4 normalized/s и tauScale.8. Не читает state/slip/predictor, не выбирает direction. Frozen steering-legacy отдельный test reference. Shared Vehicle physics byte-identical C0.3. Existing DrivingExperience observer/predictor remains read-only, candidate processor copies new params. New preallocated SteeringTrace120Hz ring2400rows exports full command/rack/wheel chain; app sampling after physical step, nofeedback. CSV shadow186columns unchanged. Separate fingerprinted staticbuild21modules, cacheprefixinBUILD_RECEIPT. Historical C03 architecture descriptions below apply to originalbase; response now changed only as documented.

# Driving Lab — архитектура

## Актуально C0.3 — Shadow Predictor

Основная цепочка input → неизменный SteeringResponse → Vehicle.step остаётся C0.2. Параллельно DrivingExperience.observe обновляет прежние state/reference/slip и, только если configurePredictor(true), отдельный BoundedSteeringPredictor<=30Hz. По умолчаниюfalse. Никакой обратной связи с input/physics. Off/On strength пока request-only, effective correction0.

Предиктор содержит две preallocated planar candidate states: HOLD текущий adapter demand; UNWIND до0 за200ms. В каждом копируется processor memory, rack slew3rad/s; four-wheel brush combined slip/alpha-kappa relaxation/wheel-spin с frozen load/drive/brake и bounded measured acceleration residual40ms. Горизонты50/100/200/400ms в одной траектории. Нет runtime node-beam clones, нет tyre physics modification. Geometric steering reference не target. Decision400ms preliminary толькоdiagnostic; uncertainty не calibrated.

CSV186 columns,20 appended; старые166 сохранены. Predictor hard-invalid/reset/repair/pause/blur/hidden очищает history через resetShadow. Полное отключение не выполняет прогноз. Offline tests отдельно клонируют complete Vehicle/processor/observer histories для exact replay; это не runtime architecture. Full model/protocol/error limits в DRIVING_LAB_C03_HANDOFF/C03_VALIDATION_PROTOCOL/C03_PREDICTION_RESULTS.400ms errors не позволяют активную помощь.

## Историческое дополнение C0.2

Новая параллельная shadow цепочка: Vehicle.step/contacts → VehicleStateEstimator → geometric SteeringReferenceEstimator → SlipStateDetector → CSV. Последний только классифицирует, никак не связан с выдачей рулевой команды. В движке одна физика; будущий единый Assist Off/On+strength. Slip detector читает beta/betaDot/r/rDot, actual rack, relaxed rear alpha/force use и quality residuals; fixed-tick dwell/hysteresis/episode/reset. NORMAL/DRIFT_LIKE/UNSTABLE_SLIDE/RECOVERING/SIDE_TRANSITION/UNKNOWN предварительны, confidence не probability. Late phases не прошли heldout acceptance; не использовать для активного control.

VehicleState дополнен approximate contact tyre yaw moments about true COM; полный equation yaw/force closure не утверждается. Reference остаётся геометрическим, алгоритм C0.1 не менялся. CSV166 колонок, прежние148 индексов сохранены, classifier отдельные slip_* fields. Полный текущий контракт/параметры/ограничения — DRIVING_LAB_C02_HANDOFF.md. Более ранние описания планов ниже — история.

## Актуальное дополнение C0.1 — 2026-10-11

Stage B DrivingExperience сохранён. Input acquisition → прежний SteeringResponse → input.steer → единая Vehicle physics. Параллельная ветвь после Vehicle.step/контактов: DrivingExperience.observe → VehicleStateEstimator → SteeringReferenceEstimator → CSV diagnostics. Эта ветвь не имеет обратного воздействия на steering. Одна будущая помощь Off/On + Strength, прежние три режима отменены; внутреннее имя simulation — compatibility, не отдельная физика.

vehicle-state.js суммирует все32 массы/скорости, разделяет true COM и chassis velocity; горизонтальные U/V/beta отделены от полного body/contact basis. Производные yaw/beta обрабатывают wrap, betaDot сравнивается с кинематической оценкой acceleration. Wheel geometric alpha вычисляется в контактной плоскости; relaxed alpha остаётся отдельной памятью шины. validity/reason bits — диагностические квалификации, не skid detector. steering-reference.js инвертирует существующий Ackermann для направления front hub velocity на почти ровной дороге. alignmentRack не является стабилизирующей целью. yawKinematic — геометрическая справка, не желаемое yaw при заносе. Learned beta_ref/r_ref пока неизвестны.

Интерфейсы/reset/contracts и будущая интеграция: DRIVING_LAB_C01_HANDOFF.md. Ниже историческое описание реализованных систем; разделы с планами Balanced/Assisted заменены новым решением.

Состояние: 0.14A.1 countersteering candidate; базовые 0.12 и 0.13 сохранены. См. PROJECT_STATE.md. Код — ES modules без сборщика и runtime CDN. Node используется для тестов, Python HTTP server может раздавать статику локально. Нет backend игрового состояния, Unity, Godot, внешнего физического движка, WASM или Web Worker.

## Модули

| Файл | Ответственность |
|---|---|
| dist/index.html, style.css | HUD, touch-зоны, dialog-меню, настройки, welcome |
| dist/app.js | Composition root, ввод, фиксированный шаг, камеры, звук, UI, сохранение config |
| dist/physics.js | Vehicle, узлы/связи, подвеска, tireForce, трансмиссия, контакты, повреждения, StructuralSkin |
| dist/vehicle-spec.js | Опорные параметры GR86 и оценочная кривая момента |
| dist/course.js | Контур трассы, высоты/покрытие, точки старта и статические препятствия |
| dist/highway.js | Детерминированное шоссе, projection/terrain, NPC, импульсы, rebase |
| dist/world.js | Scene, трасса/test pad, свет, туман, деревья; делегирует модель buildGR86 |
| dist/highway-world.js | Восемь чанков, инстансинг трафика и окружения |
| dist/gr86-model.js | Процедурная сетка купе/колёс/кокпита, материалы, приборы |
| dist/controls.js, sensors.js | События pointer/touch, pad, pedals, фильтры и права tilt |
| dist/telemetry.js | Ограниченный буфер, диагностические поля, CSV и clipboard fallback |
| dist/three.module.js, three.core.js | Локальная Three.js r180; лицензия в THREE-LICENSE.txt |
| tests/*.mjs | Численные/геометрические проверки и input/DOM stubs |
| .openai/hosting.json | Идентификатор Sites и static.directory=dist |

## Поток исполнения

app.js выбирает terrain callback по location. Ввод задаёт gas/brake/steer/handbrake/reverse. requestAnimationFrame накапливает время: DT=1/240, максимум 20 шагов за кадр, frame delta ограничивается 80 мс. На шоссе порядок: Highway.step → Vehicle.step → Highway.collide. После физики выполняются rebase, обновление графики автомобиля/камеры, renderer.render, телеметрия и HUD. Меню/hidden останавливают шаги и сбрасывают ввод. Slow mode масштабирует накопление времени.

Каждый Vehicle.step включает подшаги 1/1920 с. Сила тяжести, балки, амортизаторы, стабилизаторы, направляющая ступицы, шины и аэродинамическое сопротивление действуют на узлы; pose восстанавливается из структуры. Отдельного физического yaw/roll-clamp в исследованном решателе нет. Однако в решателе существуют ограничители численных значений и приближённые контакты; это не полный непрерывный механический solver.

28 узлов кузова/крыши и 4 ступицы, всего 32; 148 кузовных балок, 8 arm links и 4 struts, всего 160. Балки упругие с damping, пластическим изменением длины и порогом разрыва. Подвеска имеет bump/rebound stops и дополнительную боковую направляющую ступицы. Геометрия оценочная; wheel camber фактически задаётся нулём в syncPose.

Шина — аналитическая combined-slip brush approximation с нагрузочной чувствительностью, переходом к скольжению и relaxation. Вертикальный контакт — penalty spring/damper. 0.12 получает высоту/градиент локально; 0.13 усредняет пять проб. Температура, давление и протектор не моделируются. Импульсы кузова с землёй используют грубые узлы и проекцию по вертикали; препятствия — круги/узловые сферы и капсулы балок, не triangle collision.

Двигатель/маховик, torsion clutch, шесть передаточных чисел 6MT, автоматический водитель сцепления/переключения, reverse, engine braking. LSD оценочный torque-dependent; ABS требует service brake; TCS опционален и по умолчанию выключен. UI показывает только RWD, хотя solver имеет ветви FWD/AWD. Объявленный параметр не обязательно активен: например yaw inertia вычисляется из узлов, а не берётся напрямую из GR86.yawInertia.

## Шоссе и NPC

Centerline/height — аналитические синусоидальные функции с seed. Шесть полос: по три в каждом направлении. Road-space s/offset преобразуются в x/z и обратно. Рендерит восемь чанков по 200 м; удалённая геометрия освобождается. Начало координат переносится при |z|≥2000, сохраняя road-space.

NPC имеют желаемую скорость, gap/headway acceleration, проверку соседней полосы, перестроение за 3.5 с. Это правила, не машинное обучение. Удар игрока передаёт NPC противоположный импульс с массой и yaw inertia; crashed NPC перестаёт следовать пути и скользит в упрощённой плоскости. Полной подвески/3D опрокидывания/деформации NPC и столкновений NPC друг с другом нет. Объекты переразмещаются за окном примерно -260…+1200 м. Gap/safeLane перебирают массив; following/lane decisions выполняются на 30 Гц, интеграция движения — 240 Гц. Стоимость решений остаётся примерно квадратичной с числом NPC. Spawn отказывает при исчерпании безопасных кандидатов, recycle переносит транспорт между концами ограниченного окна.

## Графика и оптимизация

Three.js WebGLRenderer, MeshStandard/PhysicalMaterial, ACES tone mapping, sRGB, directional sun, hemisphere light, PCF soft shadows 1024², экспоненциальный туман. Геометрия оригинальная процедурная; лицензированная внешняя GR86 не импортирована. NPC — простые формы sedan/truck. Сетка игрока деформируется по StructuralSkin; колёса привязаны к физическим ступицам.

Инстансинг повторяемых объектов, объединение непрозрачных деталей по материалам, ограниченное окно мира, освобождение геометрии, DPR cap, редкое обновление приборов/HUD. В 0.13 профили DPR 1/1.5/2, Performance отключает тени; полноценного adaptive quality или дистанционного LOD нет. Звук через Web Audio синтетический, без записанных звуков двигателя.

## Хранение

localStorage `driving-lab-nodebeam-v010` сохраняет vehicle.config. Телеметрия: память текущей страницы, примерно 10 Гц capture, экспорт около 5 Гц; максимум ~602 строки/60 с, события ограничены. Нет сохранения сессии, cloud saves, офлайн-кеша. manifest даёт standalone-режим, но не нативный APK/IPA. Источник в Git и сохранённые публикации Sites — отдельны от игровых данных браузера.

## Диагностика и настройки 0.13

Experience preferences (graphics quality, pad travel/precision, traffic density) сохраняются отдельно в driving-lab-experience-v013 с проверкой диапазонов. CSV/3 добавляет traffic_step_max_ms (AI+movement), traffic_contact_max_ms (NPC/barrier contacts), active/requested traffic и raf_hz (наблюдаемый RAF cadence). physics_max_ms в 0.13 измеряет только Vehicle.step; render_max_ms — сцену+CPU render submission. Pause → Telemetry показывает последний sample. Измерений GPU здесь нет.


## Рулевой ввод 0.14A

Адаптеры событий (pad/digital/tilt) → выбор активного интерфейса в updateInputs → SteeringResponse.raw/target → SteeringResponse.value на каждом DT=1/240 → input.steer → прежний Vehicle.integrate → угол рейки/колёс → силы шин/движение узлов.

Обработчики и RAF только обновляют сырой demand; они не продвигают фильтр. Шаг фильтра выполняется внутри физического цикла. Это устраняет зависимость накопления команды от числа событий и RAF при одинаковом расписании ввода. UI не обновляется 240 раз/с. Сам SteeringResponse не выделяет объекты на шаге.

Аналоговый диапазон L(v)=0.14+0.86/(1+(max(0,abs(v)-8)/18)^2), v в м/с. До 28.8 км/ч L=1. Кривая pad уже применяет precision (по умолчанию 1.45); общий обработчик добавляет exponent 1+0.35*b, b=clamp((abs(v)-8)/48,0,1). Tilt exponent=1.15+0.35*b. Цифровые кнопки сохраняют прежний диапазон 0.85/(1+(abs(v)/13)^1.7), но проходят общий фильтр. DigitalSteering остаётся compatibility export для старого теста; app его не использует.

Цель=sign(raw)*abs(raw)^exponent*L. Фильтр: точный first-order exponential для постоянной цели плюс предел скорости команды. Аналог: tau=0.035+0.020*b с; нарастание 1.8, возврат 2.0, смена знака 2.4 единиц/с. Digital: tau=0.025 с, нарастание 0.62, отпускание 1.8. dt>80 мс не накапливается; dt<=0 не двигает команду. Значение <1e-5 при нулевой цели становится точно нулевым. Отпускание touch при выключенном tilt переключает к нейтральному digital demand и его возврату; при включённом tilt управление возвращается к датчику.

Reset/blur/hidden/pause очищают demand и фильтр; pointer/touch cancel удаляют активный жест. Сенсор сохраняет прежний stale timeout 500 мс. Сырой demand, цель и профиль доступны в window.drivingLab.steeringResponse; CSV уже содержит эффективный input, actual angle, yaw, ax/ay, beta. Export metadata содержит снимок raw/target, а не их временной ряд.

physics.js и vehicle-spec.js не изменены: механическая рейка ограничена 3 рад/с и ±0.57 рад, шины/подвеска/узлы прежние. Нет yaw damping/velocity clamp/ESC, которые искусственно прекращают скольжение. Камера остаётся реализацией 0.13: car.eye=(.37,1.12-origin,-.13), quaternion кузова, взгляд (0,-.018,1), вертикальный FOV 60° (UI диапазон 55–90), не сохраняемый между сессиями. Новые модули камеры ещё не созданы.


## Изменение0.14A.1 — outer-travel reserve (текущая карта)

Раздел0.14A выше описывает исходную карту до hotfix. Новый shaped q=abs(raw)^exponent. u=clamp((q-.45)/.55,0,1), reserve=u²(3-2u). Analog target=sign(raw)*(L*q+(1-L)*reserve). Digital reserve0. Приq<=.45 exact прежняя карта; приraw±1 target±1, без чтения beta/yaw/vehicle angular state. Speed здесь только для прежней center precision, направление всегда задаёт пользователь.

Никакого изменения rate или physical solver. Расширение целевого диапазона увеличивает время полного lock-to-lock при неизменённой скорости команды. Angle limit±.57rad и оценочная Ackermann геометрия прежние. Реальная Toyota ratio13.5 и2.5turns дают расчётный equivalent central33.33°, не измеренный individual wheel limit; источник и ограничения в V014A1_VALIDATION.

Synthetic feedback/inverse-map существуют исключительно в tests/countersteer-*.mjs. app.js их не импортирует. Runtime изменился только target map через прежний SteeringResponse. Head camera не добавлялась.

## Актуальный Stage A Driving Experience

0.14A.2-stageA добавляет только read-only driving-diagnostics.js и CSV/4 после прежних97 колонок. Ввод → SteeringResponse → Vehicle остаётся прежнимA.1. Detector/assistance не реализованы. Полный будущий контракт трёх режимов, знаков, gate/lifecycle/rate и проверок: DRIVING_EXPERIENCE_ARCHITECTURE.md. Исторические разделы выше описывают предыдущие этапы; metadata raw/target теперь дополнены временным рядом. Touch fraction доступен до precision. Новая камера не создавалась.

## Stage B — действующий Simulation

DrivingExperience (driving-experience.js) отделяет профиль от SteeringResponse эргономики. Simulation всегда передаёт processor output без поправки; reserved vehicleState не читается. app использует слой в event/240Hz loop и reset. modeCode1/state1 disabled/correction0 попадают в CSV/4. Balanced/Assisted unavailable и rejected без скачка. ABS/TCS independent config. Полные интерфейсы и будущий pre-rate assistance contract описаны в DRIVING_EXPERIENCE_ARCHITECTURE.md. Камеры/физика/трафик прежние.
