# DRIVING LAB — C0.1 TECHNICAL HANDOFF REPORT

2026-10-11. v0.14A.2 C0.1 Shadow Experimental. Единственное актуальное решение пользователя: общая физика и будущий Countersteering Assist Off/On + Assist Strength0–100%. Три режима Assisted/Balanced/Simulation как продукт отменены. C0.1 не реализует активного помощника и не публикуется поверх стабильной A.1.

## Источники и сохранение

Фактически открыта база Stage B `1e94744114961b13fe085120b432fff17de258c0`, чистая до изменений. Создан неизменённый baseline-stageB.zip и отдельная ветка work/0.14A.2-C0.1. Репозиторий /workspace/sites/max-driving-lab. Финальный SHA и save-only receipt — RELEASE_RECEIPT.json в итоговом ZIP. Архив содержит source/, документацию, тесты, Git history.bundle, baseline и оригинальное исследование Stage B. Другому чату передать ZIP целиком; общий filesystem между чатами не гарантирован. Публикация и сохранённый исходный commit — разные состояния.

Предоставленный Driving_Lab_StageB_Intelligent_Countersteering_Research_2026-10-11.zip материализован и проверен CRC. Его трёхрежимная политика отменена, физические исследования используются с указанными ограничениями. Новый глобальный интернет-ресерч не проводился.

## Фактическая архитектура

JavaScript ESM/HTML/CSS, локальная Three.js r180/WebGL, buildless dist. Одна существующая node-beam Vehicle physics,240Hz fixed tick/1920Hz substeps. Ввод touch/digital/tilt → DrivingExperience → прежний SteeringResponse → input.steer → Vehicle.step. controls.js/physics.js/vehicle-spec.js неизменны; ABS/TCS самостоятельные прежние системы. Traffic/камеры/3D/графика не переделывались.

Параллельная Shadow ветвь: после завершённого Vehicle.step и контактов app вызывает observe(vehicle,DT). VehicleStateEstimator читает узлы/колёса; SteeringReferenceEstimator читает его результат. Никакого пути обратно в реальный руль нет. value() по-прежнему вызывает прежний processor, correction=0 всегда. Запрос configureAssist(enabled,strength) валидирует и ограничивает0–100%, но сейчас только записывает диагностическое намерение; даже On100% даёт effective strength0. Это не действующий пользовательский переключатель. UI/persistence Off/On+strength появятся только на этапе активной реализации, после проверки алгоритмов. Старое внутреннее имя simulation/modeCode1 сохранено ради совместимости; реестр содержит только его, setMode balanced/assisted отклоняется.

## Sign Audit

- +z вперёд, +x физически вправо; positive physical rack → positive yaw/worldx.
- Положительный input имеет противоположный знак: target rack=−0.57input. Все будущие расчёты вести в physical delta, конвертация в input один раз на границе.
- Собственные зеркальные probes50km/h подтвердили знак рейки, обоих передних колёс, yaw/yawRate и x. Tire-force probes подтвердили alpha*Fy<0 в проверенной малой-slip точке. Это не подтверждение калибровки всей физики.
- Старые названия skid-counter/skid-wrong не классифицируют правильность контрруления. В новых тестах сценарии именуются по знаку input. FR/FL — исторические индексы CSV; геометрическую сторону определять по wheel.x, а не подписи.
- Beta корпуса, направление front hub velocity и tire alpha — разные сигналы. Снижение передней боковой силы иногда помогает yaw, но не обязательно сохраняет траекторию. Геометрическое alignment не разрешает автоматически вмешиваться.

## Vehicle State Estimator

dist/vehicle-state.js. Все node.mass учитываются для true COM position/velocity. U/V и beta=atan2(V,U) в горизонтальном heading frame; chassis U/V отдельно. Фактический momentum-based yawRate, pose yaw finite difference, rDot, betaDot, acceleration и кинематическая betaDot сверяются диагностически. Angular differences wrap через atan2(sin,cos). Фильтр g=1−exp(−dt/.04), warmup120ms, accepted dt0–40ms. Это исследовательские настройки; реальные latency/error ещё измерять. Pose derivative и chassis yawRate в deformable structure могут различаться; residual не скрывается.

Каждое колесо: contact/load, actual steer/toe, hub velocity, geometric alpha в таком же projected contact-plane basis и с тем же denominator floor, как solver; relaxed alpha/kappa отдельно. Проекция Fx/Fy на body lateral axis использует end-tick geometry и потому приблизительно представляет ранее вычисленную силу. Она не равна точному моменту сил подшага или angular momentum derivative. Exact force/moment closure в этом этапе не перепроверялась.

Validity bits:1 warmup,2 forward-speed,4 contact/load,8 pose,16 damage/toe,32 nonfinite,64 dt,128 collision,256 split grip. Speed hysteresis enter U>5m/s/retain>3m/s; все wheel contacts/load>=100N, front/rear sum>=500N; up.y>=.9 и |roll/pitch|<=.35rad; damage<=.03, toe<=.08rad; collisionPulse<=.05; grip spread<=.12. Эти консервативные диагностические границы НЕ calibrated confidence, не skid threshold. Reverse/stop/airborne/damage/collision/mixed grip получают invalid. Неизвестные derivative values до warmup экспортируются null. Нет детектора фаз заноса/намерений водителя.

## Steering Reference Estimator

dist/steering-reference.js. На почти ровной дороге и загруженных колёсах вычисляет направление скорости передних ступиц phi, вычитает toe и инвертирует существующий Ackermann: rack=atan2(L*tan(phi−toe),L+x*tan(phi−toe)). Load-weighted rack ограничивается существующим±.57rad; input=−rack/.57. Сохраняется saturation. Дополнительный guard512: |body roll/pitch|>.08rad, normal.y<=.995, hubU<3m/s либо |phi|>.7rad. Это НЕ оптимальный угол выхода из заноса и НЕ stable-turn reference.

Диагностический yawKinematic=U*tan(actual rack)/L нельзя использовать как r_ref при контррулении. Обучаемые beta_ref/r_ref, их confidence/age/freeze и empirical stable envelope пока отсутствуют: без калибровки не объявляем текущее скольжение устойчивым и не подменяем неизвестную траекторию нулём. Это конкретная следующая задача Shadow, не готовая основа для активной помощи.

## Телеметрия и lifecycle

CSV/4:148 колонок;28 новых appended после120 Stage A/B, прежние индексы сохранены. Включены Shadow/request/effective strength, state/reference validity+bits, true COM U/V/beta, derivative/residual, geometric references/alpha и body-force projections. Старые skid_detected/skid_phase/yaw_accel остаются null; новая chassis_yaw_dot — явно оценённая производная, а не скрытое изменение старого поля.

Ограниченный существующий буфер примерно10Hz/60s, экспорт около5Hz через Pause → Telemetry → Copy/Download. Control calculations240Hz не питаются экспортом. Новые estimator updates используют заранее созданные объекты; массивы для export формируются на частоте capture. Reset/restart/place/blur/hidden/pause сбрасывают историю; repair дополнительно resetShadow. On/strength diagnostic request не сбрасывает processor/rack. Значение available0/correction0 неизменно.

## Испытания и пределы доказательства

- npm run check: прежние29 Node test programs, включая actual app bootstrap с WebGLRenderer stub, traffic spawn/120NPC, touch lifecycle, settings, existing modes/cameras.
- npm run check:shadow: Sign Audit; read-only/COM/sign/wrap/Ackermann/derivative tests30/60/120/240Hz; guards/reset; CSV real observed state/request vs zero intervention.
- tests/shadow-equivalence.mjs:90 pairs ×240 fixed steps=21600 steps;50/150/200km/h, обе стороны, neutral/lane/slide-neutral/оба знака input, requested On0/50/100%, переход к Off. Копируется полное начальное состояние nodes/beams/wheel histories/drivetrain/rack/StructuralSkin caches. Команды и полное конечное физическое состояние точно совпали со Stage B. Нейтральный input не порождает коррекцию.
- Непрерывность команды сохраняется, потому что просьба включения вообще не участвует в выдаче команды. Поведение активного strength scaling ещё не существует и не проверено.
- Производительность iPhone, GPU/FPS, rendering и реальный touch latency здесь не измерены. Синтетические проверки не доказывают удобство активного помощника или физическую возможность любого восстановления. Нового device acceptance нет. Сборка диагностическая Experimental.

## Рекомендации единому Countersteering Assist (будущие этапы)

1. Сначала проверить calibrated stable reference и hold/release predictor с actual rack rate, processor lag, relaxed alpha/kappa, loads/force envelope, pose-vs-momentum residual. Direction ambiguity/нет trusted reference → abstain; не выбирать направление только по beta или yawRate.
2. Единственная correction target в physical rack units. Authority=min(mechanical feasible range, calibrated absolute cap, confidence cap, driver override/time-integral budget), умноженная на плавный strength0–1. Численные cap/тайминги пока НЕ утверждены; диапазоны старого исследования — гипотезы, не defaults.
3. Плавное нарастание/затухание помощи, скорость изменения target и общий существующий rate limit; не суммировать резкий offset после ограничителя. При Off/0% route exact baseline; переход к нему из ненулевой активной коррекции потребует документированного unwind, чтобы не обещать одновременно instantaneous-zero и непрерывность actual steering.
4. Предотвращать вторичный занос через прогноз hold vs unwind, yaw inertia/rDot и заднюю tire memory. Не ждать только beta=0; не стирать lateral velocity/yawRate. При смене стороны не переносить старый offset. Проверять путь/heading/скорость и повторный занос, а не единственный recovery score.
5. Driver priority и explicit override; fail-closed при reverse/низкой скорости/контакте/повреждении/ошибке данных/прогноза. Assistance действует исключительно рулём в пределах механики, не grip/mass/velocity. Не гарантировать rescue и не пытаться держать неизвестную идеальную полосу.
6. Только после negative-intervention tests — Off/On и0–100% с сохранением настроек, отдельный Experimental iPhone trial. Не создавать три профиля заново.

Следующий ограниченный этап C0.2 — GPT-6.1 Sol; сложную валидацию predictor/моментов можно отдельно поручить Astra после согласования. GPT-6 Sol — регрессии; Luna — документация/экспорт. Это рекомендации, не автоматическое переключение моделей.

## Ручная проверка и передача

Текущая стабильная URL не является C0.1. Для испытания диагностической сборки нужен отдельный статический HTTPS deployment по отдельной инструкции пользователя; source/dist содержит все локальные ресурсы, file:// не подходит для ESM. В этой сессии сборка не публикуется.

Когда появится отдельная тестовая URL: iPhone landscape, Highway72/120, штатный rolling start; при безопасных50/150/200km/h small corrections/оба направления slide на pad, release/cancel/pause/resume/reset/repair. Выгрузить60s telemetry с отметками манёвров. Проверить correction/effective strength всегда0, state/reference reasons объясняют abstention, деривативы без скачков после reset. Не пытаться подтверждать эффективность ещё отсутствующего ассистента.

Чат управления получает этот отчёт + полный ZIP + реальные iPhone logs и формулирует одну следующую задачу. Чат разработки сверяет SHA/базу и сохраняет каждый этап. Сейчас остановиться; активную помощь не начинать.
