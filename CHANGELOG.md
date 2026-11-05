# v0.14A.5.2 — 2026-10-12
Added Seat Height/Forward-Back/Reset Position and compact paused Live seat preview. Local-base offsets in CameraRig, metres storage/cm UI, additive old-key migration. Safe localStorage getter fallback. Current cabin bounds height[-.15,.02],forward[-.20,.02]m, reserves existing head motion.
No physics/steering/transmission/road/AI/asset changes; calibrated Head Inertia/Drift Gaze and Chase algorithms unchanged. Added seat/cabin/identity/CPU tests, actual app UI/reload/denied-storage checks, iPhone guide and A51 rollback. Publication facts exclusively RELEASE_RECEIPT; real iPhone test pending.

# v0.14A.5.1 — 2026-10-11

Added geometry-only deterministic C2 block profiles: straights, transitions, bends, slopes. Preserved A50 parameterization and slots; new heightGradient/frame/metric are additive. NPC speed advance accounts for3D offset-lane length; roadside markings/barriers and NPC meshes follow grade. Analytic normals match across chunks; global dash phase removes segment-reset cadence. Added geometry/contact/NPC/identity/performance tests and A51 Visual Developer addendum. Physics/steering/transmission/cameras unchanged; extreme oversteer not fixed. Device acceptance pending. Publication facts in RELEASE_RECEIPT.

# A.5.0 — documentation / integration contract

Восстановлена неизменная A.4.2 и поставлен gameplay baseline tag. Добавлены пять документов/API example, exact source excerpts/modules, manifest/sample slots, CPU tests/demo и A.5.1 proposal. Runtime, физика, трансмиссия, steering, cameras и Traffic AI не менялись. Новая игровая сборка не опубликована. По сообщению Director/player камера A.4.2 принята.

# v0.14A.4.2 — Camera Feel Calibration

Подтверждённые изменения: independent Head/Gaze Reference/Natural/Strong live presets; separate accel/brake translation/pitch/onset/release; expanded but cabin-bounded head envelope; velocity gaze separated from road averaging; filtered beta/hysteresis/confidence and explicit yaw rate/acceleration limits; configurable gaze intensity/max with persistence. Full comparisons/tests/CPU projections included. Physics/launch fix/steering/traffic/Chase unchanged. New iPhone result pending. Previous A.4.1 launch fix accepted by player per Director, camera judged too weak.

A.4.1 publication verified: native24, buildv014a41-af05b60245b5, HTTP200/SHA32/32. iPhone acceptance pending. Sources/backup retained; stop for player feedback.

# 2026-10-11 — v0.14A.4.1

Confirmed fix: shiftRecovery launch deadlock after automatic downshift; no tyre/grip/body impulse changes. Added acceleration-driven bounded head pitch, diagnostic fields and real dynamics/CPU projection tests. Preserved steering, TrafficAI, Chase, ABS/TCS and C03Shadow. ExistingA4 archived/tagged. iPhone acceptance pending.

# A.4.1 checkpoint — P0

Repeat-launch deadlock reproduced and fixed; legacy fails5/14, fixed passes15cycles; moving full-state identity5760ticks and core29programs PASS. See LAUNCH_FIX_REPORT.md. Head-camera work remains pending. Not published yet.

# v0.14A.3.3 — 2026-10-11

- Воспроизведено исчезновение доступного потока A32 после стартовой группы; regression до исправления действительно падает.
- Убран компактный весь fleet start; оставлены безопасные близкие соседи, введён распределённый road-space reservoir без повышения общего NPC budget.
- Рециклинг учитывает relative road velocity; outgoing/incoming hidden bounds различаются, при blocked entry доступен внешний запас; actor properties сохраняются.
- Добавлена ограниченная5Гц traffic continuity telemetry, исходная steering telemetry сохранена.
-127×5min continuity scenarios и явные предупреждения sparse18/160; pre-GPU fog proxy, CPU benchmark, player identity, AI safety suites.
- Новое fingerprinted build entry; main публикация подтверждена native21 + HTTP hashes24/24; source/build/Git backup сохранены в All-In-One с корневым RELEASE_RECEIPT.
- Физика/руль/camera/ABS/TCS/tyres не изменены. Extreme oversteer не исправлен.

# Подтверждённые изменения — 2026-10-11

## v0.14A.3.2 Experimental — Traffic AI 2.0 / итерация1

Коммит реализации 5af739f2ae2cf301fb679a5e3ad04faf51a165ba. Новый trafficSeed при обычном старте, фиксированный query seed для теста, разные скорости/интервалы/грузовики/стили. Перестроение: closing-gap checks, резервирование source/target, gain/cooldown, quintic и остановка бокового прогресса на месте. NPC road-barrier containment и crash capsule контакты. Recycling может выбрать свободную полосу своего направления за пределами окна; машины переиспользуются. Исходные player collisions/road/camera/physics/steering/диагностика не менялись. Добавлены три автоматических теста и отдельная тестовая сборка.

## Gameplay Baseline v0.14A.3.1

Director подтвердил обычную езду на iPhone удобной. Тег gameplay-baseline/v0.14A.3.1 →8bc0030, freeze-docs c94a2db. Проверены исходныйZIP/source/build/live bytes. Экстремальный oversteer не исправлен; исследовательский цикл остановлен. Контрольная публикация сохранена без изменений.

---

# Gameplay Baseline Freeze — 2026-10-11

Director confirmed ordinary driving on iPhone playable. v0.14A.3.1 is the frozen gameplay base at 8bc0030, tag gameplay-baseline/v0.14A.3.1. Control: https://max-driving-lab-recovery-a31.maxtrcgi.chatgpt.site . Extreme oversteer remains unresolved; the steering investigation is paused and no longer blocks other gameplay work. Physics, tyres, steering response/mapping, ABS/TCS, diagnostics, camera and damage are locked.

Next: separate Traffic AI 2.0 first iteration, fixed-seed tests and random normal traffic starts, safe lane changes and lightweight NPC barrier contacts. Do not modify or republish the control build. See GAMEPLAY_BASELINE_RECEIPT.json.

---

# 2026-10-11 — v0.14A.3.1 Recovery Investigation

- Verified fullA3archive/Git/receipt;frozenexperimentalprotocola93437d.
- NoVehicle/controls/tyre/rate/LSDalgorithm/traffic/camera/modelchanges;allAssistcorrection0.
- Read-onlySteeringTrace/2:60Hz20s84columns,sourceevent/steeringchain/tyres/axletorque/quality,exports/version.
-696naturalenginecases/24exactforceobserverreplays,finiteoracle/pathawarecriteria,144LSD/pedaltrials,frozenauthority/relaxation/engineclamp/momentum/convergenceaudits. Findingsandnegativecasesdocumentedwithoutclaimingphonecausality.
- Sevenplots,newofflineautomatedtests,diagnosticHTTPSseparatefromstable. FullphoneCSVmissing;deviceQAandrootcauseunresolved. Documentation/backup/receiptprepared;finalGit/sourceanddeploymentfactsinreceipt.

# 2026-10-11 — v0.14A.3 Steering Test Experimental

- Verified C0.3 full archive/Git/base; protected baseline/C03 and frozen legacy class.
- Selective acceleration of driver large commands3.4/.8, unchanged small/digital/release/static fullrange. No assist/physics changes.
- Full-chain rack/wheel latency140bench runs,360dynamic trials, shadow identity/legacy identity and predictor rerun. Exact100% distinguished from0.05° tolerance. Increased over-hold secondary slide risk documented.
- Preallocated20s steeringtrace CSV,versionlabel,separateprivateHTTPS testbuild/fingerprinted modules; stableA.1 publication not replaced.
- Source/docs/full backup and receipt prepared; realiPhone/WebGL pending. Final commit/verified save details inRELEASE_RECEIPT.

# Driving Lab — подтверждённая история

## 2026-10-11 — v0.14A.2 C0.3 Shadow Experimental

- Полный C0.2 архив/receipt/Git/source bytes проверены, baseline/C02 и backup защищены. Protocol freeze ada44c6; predictor freeze01fad81 до heldout.
- Optional disabled-by-default planar HOLD/UNWIND predictor50/100/200/400ms, штатная ergonomics/rack dynamics и tyre memory, без управляющей обратной связи.
-20 appended diagnostic fields (186 total), reset/enable/disable; version labelC0.3. Controls/physics/state/reference/slip/traffic/camera неизменны.
- Новые family split,94 accepted heldout exact counterfactual snapshots, errors by horizon/speed, Node cost, both signs. Late-horizon errors задокументированы; активный assist не признан готовым.
-24 pairs/17280 ticks per side exact C0.2 physical/control identity;29 legacy+5 shadow+1 predictor checks passed. Real contact-loss/collision fail closed. WebGL/iPhone не проверены, стабильная публикация не заменена.

## 2026-10-11 — v0.14A.2 C0.2 Shadow Experimental

- Добавлен предварительный read-only SlipStateDetector, episode/quality/dwell и диагностический early warning; активных рулевых поправок нет.
- Добавлены approximate tyre yaw moments и18 CSV fields (166 total); legacy indices/null fields сохранены.
- Reference проверен на actual driver-input engine dynamics и exact final-substep tyre force/moment probes; геометрический ориентир не признан recovery target.
- Detector/protocol freeze commit b25c846 до heldout; late phases не прошли transfer acceptance. Подробные errors/misses/UNKNOWN не скрыты в C02_CLASSIFICATION_RESULTS.
-66 пар/C0.1/47520 ticks точно совпали поphysical state/command, classifier cadence30/60/120 identity; real road drop/collision/reset/reverse guards проверены. Источники сохранены без замены liveA.1. Нет iPhone/WebGL validation.

## 2026-10-11 — v0.14A.2 C0.1 Shadow Experimental

- По новой инструкции отменён продуктовый план Simulation/Balanced/Assisted; внутренний Simulation baseline сохранён без изменения команд. Один будущий Countersteering Assist Off/On + strength; diagnostic configureAssist пока не включает управление.
- Добавлены read-only COM/contact state и геометрические steering references, fixed-tick observation после контактов,28 колонок CSV без сдвига старых индексов.
- Проверены физические знаки input/rack/yaw/Fy, Ackermann inversion, производные/wrap/guards/reset. 90 same-state replay pairs,21600 steps точно совпадают со Stage B при запросах On0/50/100 и Off.
- Физика/эргономика/трафик/камера/графика неизменны. Стабильная публикация не заменяется. Нет нового iPhone/WebGL acceptance, детектора или активной помощи.

Номера игры взяты из кода в Git. Коммиты имеют одинаковое сообщение Update Site source, поэтому описание дополнительно сопоставлено с сохранёнными README/PHYSICS_NOTES и diff. Здесь перечислены подтверждённые вехи, не полная история каждого параметра.

| Игра | Git | Подтверждённые изменения |
|---|---|---|
| 0.2 | 88cce3a | Существует сохранённый код с этим номером; подробные release notes здесь не реконструируются |
| 0.3 | 01ee471 | Существует сохранённый код с этим номером; подробные release notes здесь не реконструируются |
| 0.4 | f0bccf7 | README: расширенные численные проверки ввода, датчиков, сцепления/торможения; исторические результаты не считать повторно проверенными в этом аудите |
| 0.5 | 674c0c0, 9c250e4 | Touch pad, пропорциональные педали и управление разрешениями tilt; работа с TCS/восстановлением описана в исторических заметках |
| 0.6 | 62e0033 | Сокращённый HUD и pause/settings интерфейс |
| 0.7 | 6619a32 | Handling Circuit ~2.077 км и GR86 reference baseline |
| 0.8 | 73eac2d | Автоматическая телеметрия последних 60 с, копирование/экспорт/отметки; handbrake справа |
| 0.9 | c55fb2a | Переход к сокращённой силовой node-beam структуре; заметки о 0.10 описывают предыдущий 0.9 лог |
| 0.10 | b73a96d | ABS только при service brake, torque-dependent LSD, изменения сцепления/переключений, процедурная реконструкция кузова |
| 0.11 | 51a4437 | Направляющая ступицы, travel stops, точки крыши/трение, размыкание и согласование сцепления при переключениях |
| 0.12 | 6d4e55c | Endless highway, встречный/попутный трафик 0/18/28/42, перестроения, импульсы NPC, streaming/rebase, ветер/шины и highway telemetry |

## Исторический WIP 0.13 на момент аудита

На момент аудита: app/controls/gr86-model/highway-world/highway/index/physics/world/package/test highway изменены; RESEARCH_013.md и release013 test добавлены без исходного коммита.

Diff подтверждает rolling spawn и согласование трансмиссии, nearby traffic, 72/120 и размер instance buffers, пять проб контакта, pad travel/precision, DPR/shadow profiles, процедурный асфальт/окружение и правки геометрии купе. Это наличие реализации, а не подтверждение мобильной готовности или визуального сходства. Нет подтверждённой публикации 0.13.

## Аудит — 2026-10-10

Созданы PROJECT_STATE, ARCHITECTURE, ROADMAP, CHANGELOG, RESEARCH, NEXT_TASK, TECHNICAL_HANDOFF_REPORT и AUDIT_VALIDATION; снимки baseline/WIP, binary patch, полный Git bundle и SHA-256 inventory. Код игры не изменялся; новая версия не публиковалась. Текущий запуск проверок описан в AUDIT_VALIDATION.

## 0.13 experimental — Traffic Experience, 2026-10-10

Сохранён неизменённый WIP; завершён rolling spawn с лидером/последователем в полосе игрока, исправлен безопасный поиск места и переразмещение потока при разной скорости. Решения ИИ 30 Гц при плавном движении 240 Гц; остановленный NPC сохраняет направление. Плотности 72/120 работают без скрытого cap. Сохранены работоспособные изменения кузова/контакта шин/окружения/pad/quality из WIP. Добавлено сохранение experience prefs, performance telemetry CSV/3 и вывод active/requested. Добавлены variable-speed/density/allocation, bootstrap и CPU benchmark проверки.

24 скрипта автоматических проверок; итоговый статус и конкретные цифры в V013_VALIDATION. Browser/GPU/iPhone acceptance отсутствует — сборка experimental. Документы/исходники/ZIP и provenance сохраняются через release workflow; публикация подтверждается отдельно RELEASE_RECEIPT.json.


## 0.13 — уточнение при начале 0.14

RELEASE_RECEIPT подтверждает successful deployment 097aac9 (Sites version 12). Пользователь лично подтвердил на iPhone rolling spawn и скорость потока. Исторические записи «нет подтверждённой публикации» выше относятся к моменту аудита, а не текущему состоянию.

## 0.14A candidate — High-Speed Steering, 2026-10-10

Сохранена неизменённая 0.13; отдельная ветка release/0.14. Подтверждён и устранён обход speed shaping pad/tilt. Общий SteeringResponse с аналоговым speed envelope, прогрессивным центром, rate control и возвратом; fixed-step обработка без прыжков от событий. Сохранён прежний digital диапазон. Расширены lifecycle/bootstrap проверки и добавлены steering-response, steering-dynamics и A/B comparison с настоящим кодом 0.13.

60 сравниваемых прогонов; финальный npm run check прошёл (26 скриптов), включая сохранённые 24 регрессии. Камера, traffic и физический решатель не изменялись. Этапы B–D не начаты. Device steering acceptance pending; публикация подтверждается RELEASE_RECEIPT итогового архива.


## 0.14A.1 — countersteer range,2026-10-11 local

После iPhone feedback подтверждён недостаточный analog end-travel range A: central8.09° at200 вместо mechanical32.66°. Добавлен smooth outer reserve, сохранив exact center/midrange, прежние rate/tau, digital profile и solver. Full analog возвращает mechanical limit при любой скорости; это не автоматическая стабилизация.

27 scripts passing; mapping/limits/rate,72 recovery runs в двух разных протоколах, no-contact/zero-grip limitation. Документированы как успешные recovery, так и перебросы при агрессивном одинаковом finger policy. Source/commit/backup/publication подтверждаются receiptZIP. Новая камера не реализована; iPhone outer-zone acceptance pending.

## 0.14A.2 Stage A — 2026-10-11

База0ef5b8d сохранена неизменённымZIP/worktree. Добавлен архитектурный контракт Input/Processor/Estimation/Assistance/SharedPhysics. Pad получил read-only fraction/active/last-event getters без изменения выхода. CSV/4 append23 полей, прежние индексы сохранены; input_mode теперь следует фактически выбранному source даже при digital override tilt. Detector/assist не реализованы, состояние неизвестно/null, correction0. Added diagnostic/immutable-baseline tests. Подтверждения tests/receipt в STAGE_A_VALIDATION и итоговомZIP. Stage A сохранён без заменыliveA.1. Никаких исправлений переброса или помощи пока нет.
## 0.14A.2 Stage B — 2026-10-11

Добавлен Simulation в driving-experience.js и подключён в app.js. SteeringResponse и физика прежние; скрытых корректировок нет. ABS/TCS не меняются. Будущие профили declared unavailable, выбор отклоняется безопасно. CSV/4 теперь отражает Simulation1/disabled1/correction0. Labels/settings note обновлены, без декоративного selector. 29 scripts и 48 pairs/41 040 steps exact full-state comparison сA.1 пройдены; adapter baseline38 880steps повторён. Device QA не выполнялся. Stage B source saved without deploy; baselineStageA/A.1 и Git history включены в полныйZIP.

## v0.14A.4 — DriverView Hybrid (2026-10-11, technical camera candidate)

- Read-only seat kinematics, critically damped bounded head inertia, partial horizon, road preview/automatic look and optional drift gaze.
- Optional vertical dynamic FOV0/+3/+6, defaultOff; Static reference and persistent camera controls/reset.
- Unified closer Chase replaces separateOrbit; dedicated camera gesture, delayed smooth recenter and adjustable distance/height/speed.
- Fixed simulation-time camera pipeline, rebase/reset/pause/slow handling, camera CPU diagnostic ring.
- 29core checks, new camera/clearance/projection/full-state identity/CPU checks. No change in physics/steering/touch/ABS/TCS/TrafficAI/graphics/ShadowC03. Real iPhone camera acceptance pending. Publication not yet confirmed at this checkpoint.

### v0.14A.4 integration checkpoint

- Static/DriverView и horizon toggle затухают плавно вместо прямого переключения final transform.
- Уточнены знаки малых local pitch/roll rotations в composer; добавлены regressions для переключений и обоих знаков вращения.

### v0.14A.4 publication (2026-10-11)

- Финальная camera сборка опубликована на основной ссылке, native version23, site Git feb87fe198843e9c383397c63238816ba1c31a1a, fingerprint v014a4-de3fd49b6ce9.
- A33 сохранена: native version21, immutable tag и неизменный полный backup ZIP. Финальная доступность/hash verification — в RELEASE_RECEIPT и evidence.
- Реальная iPhone camera/performance QA ожидается; субъективная готовность не объявляется.
