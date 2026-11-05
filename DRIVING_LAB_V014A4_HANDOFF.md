# DRIVING LAB — v0.14A.4 TECHNICAL HANDOFF

**Рабочая ссылка:** https://max-driving-lab.maxtrcgi.chatgpt.site  
**Версия:** v0.14A.4 — DriverView Hybrid.  
**Публикация:** native version23, site Git `feb87fe198843e9c383397c63238816ba1c31a1a`, статус succeeded. HTTPS и HTTP200/SHA256 подтверждены для32/32ресурсов: index, receipt, CSS, manifest, icons и26modules. Все загруженные байты совпали с итоговым build.  
**Implementation Git:** `cfeddd88a13043285118f62b97d2bd9122c6058c`; первый camera commit `e5c54fa2e776c515c473fc0f8102fc028467891f`. Полный архивный HEAD и тег — в корневом RELEASE_RECEIPT.json.  
**Контроль A.3.3:** та же рабочая ссылка до обновления, сохранённая native version21 и неизменяемый архив. Отдельный новый URL для A33 не создавался. Откат описан в ROLLBACK.md.

## Основа и границы

Director сообщил об успешном iPhone-тесте A33 Traffic Continuity. Архив A33 проверен по CRC и SHA256: `1cd0721aa9e1d97d7c3cf1f37749f2a22440d6c9ca3e44ddac1447c3204773c2`. Source: `eff802fb141cef9294dfabe0eaf4dfff4b751a7c`, immutable tag `gameplay-baseline/v0.14A.3.3`. Ветка A4: `work/driverview-v014a4`.

Фактическая архитектура: JavaScript ESM, локальный Three.js/WebGL, единая собственная reduced node-beam физика. Шины, подвеска, масса, SteeringResponse, Touch shaping, ABS/TCS, повреждения, Traffic AI и A33 continuity не менялись. Shadow C03 сохранён, действующего Countersteering Assist нет. Экстремальная избыточная поворачиваемость **не исправлена**.

Оба исследовательских ZIP из Camera Input Package доступны и использованы. Их source audit относится к A31; актуальная камера A33 проверена отдельно. Реализация собственная, сторонний код CSP/AC/RHM/BeamNG не копировался. Исследовательские материалы включены в архив. Новый широкий ресерч не проводился.

## Реализованные функции

- DriverView Hybrid: seat-anchor kinematics, демпфированные пружины головы, продольная/боковая/вертикальная инерция, небольшие pitch/roll реакции, раздельная фильтрация вертикальной динамики.
- Частичная стабилизация быстрых колебаний горизонта с сохранением длительного крена/уклона. Переходы DriverView/Static и Horizon On/Off плавные.
- Automatic Look по будущей точке собственной дорожной области и измеренному yaw rate. Highway сохраняет текущий offset; circuit использует локальную continuity branch. Не следует за рулём автоматически.
- Drift-aware gaze по фактическому локальному вектору скорости, с confidence, гистерезисом, фильтрацией и ограничением угла/скорости. Stop/reverse/невалидная динамика дают безопасный базовый взгляд.
- Dynamic vertical FOV Off/+3°/+6°: фактическая скорость, smoothstep40–200км/ч, плавное нарастание/возврат, rate limit. Static отключает новые head/look/FOV эффекты.
- Unified Chase вместо отдельных Chase/Orbit: более близкий follow, distance/height, отдельная Camera gesture area, ручной приоритет, задержка900ms и плавный recenter, настраиваемая скорость/Off.
- Camera settings сохраняются отдельно от car setup; Reset Camera не меняет руль, ABS/TCS или автомобиль. Hood сохранён. Default: DriverView, inertia25%, horizon/autoLookOn; drift gaze/FOVOff.
- Корректный lifecycle для pause/resume, slow motion, respawn/repair, смены локации, origin rebase. Камера не интегрирует время фоновой паузы.
- Диагностика камеры в обычном telemetry metadata: настройки, head offsets, gaze/beta/confidence/reason, FOV, поколения reset и bounded1800-frame CPU/frame buffer.

## Архитектура и изменённые файлы

`Vehicle/contacts → CameraObservation + CameraRoad → CameraRig.step(DT) → CameraRig.apply → Three camera`.

Один CameraRig владеет окончательными position/quaternion/up/FOV. Head/gaze/FOV/chase/recenter работают на simulation240Hz; road preview≤30Hz. Renderer применяет одну итоговую трансформацию. Resize отдельно меняет aspect/projection. Обратных записей в физику или управление нет.

Новые файлы: `dist/camera-observation.js`, `camera-road.js`, `camera-rig.js`, `camera-settings.js`. Интеграция: `dist/app.js`, `index.html`, `style.css`. Тесты: `camera-rig.mjs`, `camera-identity.mjs`, `camera-clearance.mjs`, `camera-performance.mjs`; расширены app-bootstrap и ui-menu harness. Packaging/version script обновлён. Полные численные параметры, единицы, знаки и safety policy — в CAMERA_ARCHITECTURE_REPORT.md.

## Проверки и показатели

| Проверка | Результат |
|---|---|
| Существующая core suite | 29 программ прошли |
| Защищённые модули | 19 файлов побайтно совпали с A33 |
| Полное состояние физики | 4800 тиков identical,50/100/150/200/250км/ч,оба направления |
| Реальные Vehicle сценарии | 9×30/60/120render schedules, camera state tolerance1e−10 |
| Разгон0→200 / торможение до остановки | 27.625s /5.9625s времени симуляции |
| Eye envelope / projection | 162near-ray проверки,15aspect/FOV cases |
| UI/input integration | Настройки/reset/persistence,120NPC rolling start, два независимых pointer |
| Дополнительные regressions | Static/horizon transitions, local pitch/roll signs, rebase/pause/reset/orbit |

ODE/кинематические изоляционные тесты отделены от настоящих физических прогонов. Все игровые прогоны здесь используют Node и CPU-геометрию; app-bootstrap имеет DOM/WebGL stubs. Настоящий браузерный GPU renderer и iPhone этой новой версии **не тестировались**. Управляемый browser QA недоступен; screenshots не создавались.

Exact CPU measurements: `reports/camera-performance.json` и CAMERA_TEST_RESULTS.md. Оценка p50 суммы4fixed ticks+apply при60Hz — около0.008ms; сумма p95 компонентов — около0.029ms. Это Node microbenchmark, **не измеренный frame p95/FPS Safari**. Runtime экспорт позволяет собрать camera CPU/frame samples на телефоне. Новых render passes/шейдеров/postprocessing не добавлено.

Полная A33 traffic matrix сохранена в baseline ZIP. Здесь не выдаётся за заново выполненную матрицу: traffic source остался exact A33. Старый traffic-player-identity guard защищает также UI/style/camera; его не маскировали. Новый camera-identity guard разрешает camera/UI и отдельно проверяет неизменность физических систем.

## Ограничения

Комфорт, укачивание, NPC-distance perception, visual frame pacing и thermal throttling требуют iPhone. Номинальный eye envelope не гарантирует отсутствие стоек в периферии или clipping после сильной деформации салона. Conservative preview выключается вне дороги/при неоднозначном направлении. Большой spin/reverse не поворачивает взгляд автоматически на180°. Нет racing-line planner, visibility raytrace или полной биомеханики.

Manual cockpit glance/gyro look не реализованы; идеи перенесены в ROADMAP. Eye height/fore-aft UI не входят в минимальный текущий контракт и не добавлялись. Camera settings могут изменить ощущения игрока и его ввод; при одинаковом вводе физика одинакова.

## Что проверить игроку

Открыть main link, перезагрузить старую вкладку/PWA и увидеть HUD v0.14A.4. Pause → Controls & setup → Camera settings. Сначала Static/FOV60 как контроль, затем DriverView с default25% inertia. С одинаковыми route/seed/setup включать по одному эффекту. Проверить150–200км/ч в трафике, торможение/кочки/заносы в обе стороны, FOV0/+3/+6 и дистанцию до NPC, Chase + ручной Camera pad одновременно с сенсорным рулём, recenter/Off, portrait/landscape, pause/slow/respawn/repair/rollover/rebase.

Подробный план: IPHONE_CAMERA_TEST.md. Для проблемы нужны видео и обычный telemetry export с camera metadata, iPhone/iOS/Safari, quality/density/seed и точные включённые эффекты. Провести10–15min для оценки нагрева и frame pacing.

## Сохранение, запуск и передача

Один All-In-One ZIP: полный текущий project, тесты/отчёты/документы, готовый fingerprinted build, developer Git bundle, отдельная native publication Git history, deployment tar, исследовательские ZIP и неизменный полный A33 backup. Архивный sourceHEAD отличается от siteGit: после публикации обновлена документация; runtime module bytes совпадают с опубликованными и записаны в receipt.

Локально: `python3 -m http.server 8080 --directory build/dist`, открыть `http://localhost:8080`. На iPhone использовать HTTPS main link. ESmodules не запускать через file://. Restore команды — в START_HERE.md. Source release tag: `camera/v0.14A.4`; validated implementation tag: `camera-validated/v0.14A.4`.

Следующая задача — только ограниченные camera исправления после ручного feedback. Рекомендуем GPT-6.1Sol для runtime camera, Sol для простых fixes, Luna для документации. Astra нужна лишь при отдельной доказанной архитектурной проблеме; автоматического переключения моделей не было.

Director передать этот HANDOFF, root receipt и test reports из того же ZIP. Новый task должен ссылаться на точный archive/tag/commit и сценарий игрока. Другой чат не должен предполагать автоматический доступ к текущему worktree. После delivery Developer останавливается до оценки игрока.
