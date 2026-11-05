# DRIVING LAB — DRIVING EXPERIENCE HANDOFF

Последний актуальный отчёт — DRIVING_LAB_C02_HANDOFF.md. Этот документ остаётся историческим Stage B.

Исторический отчёт Stage B. Актуальный этап/решение: DRIVING_LAB_C01_HANDOFF.md. План трёх режимов отменён пользователем; единый Countersteering Assist, пока только Shadow diagnostics.

## Статус и сохранение

v0.14A.2 Stage B Experimental завершён. Simulation подключён к игровому циклу, сохраняет эргономику A.1 без автоматического контрруления/стабилизации. Balanced и Assisted недоступны. Детектор заноса не создан. Переброс при избыточном вводе не исправлялся в Simulation.

Исходники: /workspace/sites/max-driving-lab, ветка work/0.14A.2-stageB. База Stage A307e2719f49dfeaf22b910d28f41247e419829e4 была clean и подтверждена открытием источника Sites; до правок создан baseline-stageA.zip. Reference A.1:0ef5b8db80c325e23a11827fe370e8b031bf5c24, эталон A:4b88fe85b9dfa81f9252c80923f66ff5ce90ab8e.

Финальный SHA/source-save receipt в RELEASE_RECEIPT.json. ZIP содержит source/dist, source/tests, docs, базовые A.1/Stage A, history.bundle, research ZIP и evidence. Другому чату передать целиком; общий filesystem не предполагается. GitHub не использовался.

Live https://max-driving-lab.maxtrcgi.chatgpt.site сохраняет A.1 и owner-only доступ. Stage B сохранён без deployment. Latest source не означает latest live build.

## Архитектура и изменения

JS ESM/HTML/CSS, локальная Three.js r180/WebGL, custom node-beam240/1920Hz, buildless dist. Новый driving-experience.js: DrivingExperience и frozen drivingModes. Pipeline: acquisition → DrivingExperience → SteeringResponse processor → input.steer → Vehicle.step. Processor отвечает за эргономику; Simulation только передаёт выход и не читает dynamic vehicleState.

Интерфейсы: value(demand,speed,dt,inputSource,vehicleState=null), reset(), setMode(mode), processor, command и getters mode/modeCode/correction/assistanceAvailable/assistanceState. vehicleState зарезервирован для будущего estimator; proxy-тест запрещает Simulation любые его read/write. Нет изменений Vehicle/config/yaw/grip/скоростей/положения.

setMode('simulation') сохраняет команду и фильтр. Balanced/Assisted/unknown вызывают RangeError без мутации. Других профилей сейчас нет; реальные межпрофильные переходы ещё не проверены. В меню только пояснение Simulation, без декоративного selector. Persisted выбор отложен до альтернатив; старые prefs не менялись.

Изменены app.js (event/fixed-step/reset/metadata), driving-diagnostics.js (режим/статус), index.html (labels/пояснение), package.json и bootstrap. Добавлены driving-experience.js, tests/driving-experience.mjs, tests/stage-b-comparison.mjs и документы.

controls.js совпадает со Stage A; SteeringResponse source совпадает с A.1. physics/spec/world/highway/highway-world побайтно A.1. Камеры, графика, модели, шины, подвеска и трафик не менялись. Для Stage C потребуется assistance target ПЕРЕД единым rate limiter; не добавлять jump после фильтра. Контракт в DRIVING_EXPERIENCE_ARCHITECTURE.md.

## Параметры и телеметрия

Прежние progressive touch, precision1.45/travel1 defaults, скоростной центр и outer-reserve A.1. Full touch/tilt±1 открывает rack±.57rad: central32.66°, Ackermann28.32/38.33° безtoe. Physical rate3rad/s; processor increase1.8/return2/reversal2.4units/s, tau35–55ms. Формулы сохранены в архитектуре.

Digital сохраняет legacy speed envelope .85/(1+(abs(v)/13)^1.7), rate.62/neutral1.8, tau.025. На высокой скорости полный digital demand НЕ достигает mechanical lock. Это явная эргономическая особенность A.1 ради эквивалентности, не помощник по заносу. Full-lock digital требует отдельной согласованной правки.

ABS/TCS независимы; проверены четыре сочетания config без изменений от слоя. Simulation отключает рулевые ассистенты, а не принудительно все автомобильные системы.

CSV/4 сохраняет120 колонок,≤602 строки/60с,≤256 событий; capture~10Hz/export~5Hz. driving_experience1, assist_state1 disabled, available0/correction0. Detector/phase/yawaccel null/unavailable, не «заноса нет». Сохранены finger fraction/demand/target/processed/final/rack/wheel angles и физические сигналы Stage A. Inputsign противоположен rack; hub direction не оптимальный counter-angle. Touch age — handler-to-RAF sample, не physics/display latency.

## Испытания и ограничения

| Проверка | Подтверждённый результат |
|---|---|
| npm run check | 29 скриптов, exit0 |
| Simulation unit | Exact processor output, unread state proxy, correction0, neutral/release/reset, analog lock, safe mode rejection, ABS/TCS независимы |
| Сравнение | 48 пар:50/150/200 × обе стороны × correction/lane/sharp/skid-neutral/counter/late/excess/wrong |
| Полное состояние | Одинаковый settled donor; nodes/wheels/beams/drivetrain/rack/config/StructuralSkin caches; exact final states |
| Шаги | 41 040 сравнительных fixed steps, включая wrapper input cadence30/60/120Hz |
| Adapter baseline | Ещё38 880 exact steps0–250 и callback order относительно A.1 |
| Production bootstrap | 209 render calls со stubs,120NPC, spawns/settings/prefs/cameras/lifecycle и новый CSV статус |

Physical protocol: settled0.4s, skid beta±10°/yaw∓.45rad/s, dry/default, газ.1, DT1/240, input60Hz, свободная динамика3s. StructuralSkin имеет back-reference: копируется кеш, затем привязывается к новым узлам. Это исправление стенда, не solver. Узлы конечны, команды совпадают каждый шаг.

Неудачи сохраняются: на200/+ neutral skid peakbeta48.507°/yaw.466rad/s, фиксированный counter pulse43.225°/.449rad/s. Критерий recovery beta<3°/yaw<.07rad/s for.5s не выполнен за3s в обеих версиях. Это конкретный открытый ввод, не доказательство физической невозможности. Lane offset−3.250m/peakbeta5.560° одинаков. Simulation не обещает лучшую ловлю.

Нейтральный ввод из neutral controller даёт строго steer0 несмотря на занос. После отпускания обычный rate-limited return/rack delay остаётся — не мгновенный reset физических скоростей. Same-mode/rejected profiles не скачут; реальные переходы трёх профилей ждут следующих этапов.

Real WebGL/Safari/iPhone, screenshots, FPS/нагрев/полная input-to-display задержка не проверены. Старое пользовательское принятие A.1 не переносится автоматически. 250 — imposed benchmark, не достигнутая maxspeed. Му0 rolling-resistance approximation и secondary skid прежние. Ни параметров помощи, ни результатов её испытаний нет.

## Следующий этап и действия

Stage C Balanced только после новой команды по NEXT_TASK: estimator/sign/filter/hysteresis/invalid guards, затем ограниченная помощь правильной ненулевой команде. Correction0 при zero/wrong input. Защитить Simulation exact baseline. Assisted отдельно D, UI/persistence/transitions/device acceptance отдельно E; камера отложена. Research1–3°/gain.15–.30 не утверждены.

GPT-6.1 Sol — Stage C/tests; Sol — регрессии; Luna — docs/CSV. Astra только сложная воспроизведённая задача estimator/solver; глубокий анализ сначала отдельному Research. Автопереключения нет.

Max: сохранить ZIP и передать директорскому чату. Читать START_HERE → HANDOFF → PROJECT_STATE/VALIDATION/NEXT_TASK. На компьютере: python3 -m http.server 8000 --directory dist, http://localhost:8000. На iPhone требуется отдельно разрешённый HTTPS тестовый релиз; liveA.1 нового слоя не имеет. STAGE_B_IPHONE_TEST_PLAN: обычные50–200, обе стороны умеренного заноса, release/lifecycle/ABS-TCS, telemetry30–60s и recording/iPhone/iOS.

Stage B завершён. Stable publication не заменять, ждать следующего задания.
