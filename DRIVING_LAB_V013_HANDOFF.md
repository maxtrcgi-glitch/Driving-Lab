# DRIVING LAB — V0.13 TECHNICAL HANDOFF

Дата: 2026-10-10. Статус: **0.13 experimental для iPhone acceptance**. Исходники собраны, numerical/stub tests выполнены; настоящий WebGL/browser/iPhone запуск не подтверждён. Не объявлять полностью стабильной мобильной сборкой. Exact source SHA/Sites version/deployment статус — RELEASE_RECEIPT.json в итоговом ZIP.

## Изменения

Сохранён неизменённый WIP перед работой и baseline 0.12 tag/commit. Последнее задание пользователя разрешило завершить существующий WIP целиком в пределах стабильности, вместо предыдущего рекомендации выделить только rolling spawn.

Highway: rolling spawn с ближайшим лидером, NPC примерно ±64 м в полосе игрока, nearby adjacent traffic; 72/120 и buffers действуют. Исправлены безусловная вставка после исчерпания spawn search и направленное recycle. Following/lane decisions 30 Гц, движение 240 Гц; остановленные NPC не разворачиваются на нулевом atan2. Gap/lane safety остаются существующими правилами, не новая система ИИ. Если безопасное размещение невозможно, spawn возвращает null; active/requested раскрывают недобор. Проверенные штатные сценарии достигли полного requested count без отказов. Adaptive cap не вводился, телефонный бюджет неизвестен.

Сохранены совместимые WIP physics footprint, rolling drivetrain reset, procedural GR86/road/world, graphics profiles и pad tuning. Это не новое доказательство точности GR86. Добавлено сохранение quality/pad/density, CPU timing traffic/Vehicle/render и RAF cadence в CSV/3 и Pause → Telemetry.

Модули: app.js, highway.js, telemetry.js, index.html; WIP controls.js, physics.js, gr86-model.js, highway-world.js, world.js; package.json/tests/docs. No new dependencies, no engine migration, no workers, no new mode/research. Three.js r180, buildless static JS.

## Проверки

24 скрипта npm run check (21 прежний + release013 + traffic-experience + app-bootstrap). Traffic-experience: 6 плотностей × 5 seed; same-lane lead/rear; 120 секунд variable-speed road-space driver на 28/42/72/120, hard braking до 0, stop и до 250 км/ч, live density changes, finite state, continuous motion, NPC width/length non-overlap и saturation rejection. Сценарий изолирует трафик от физики игрока и не является реальной поездкой/полным crash test.

App-bootstrap: полный production app.js в DOM и WebGLRenderer stubs с реальными Vehicle/Three geometry, 90 RAF frames при 120 NPC, без spawn contacts/broken beams; pause/settings/preferences и все spawns. Это проверка JS composition, не GPU. Другие тесты: шины, крыша/переворот, динамические импульсы, course, drivetrain, menus/touch/tilt stubs, bounded telemetry/instances и 100 км streaming. Highway-drive numerical driver имеет density=0; не считать его поездкой в плотном потоке.

## CPU измерения

Node v24.19.0 linux x64, текущий контейнер, warmup и 4800 шагов на плотность. Измерения не изолированы от нагрузки окружения и не являются iPhone FPS/прогнозом. Traffic.step включает AI+movement, не collisions/render. Vehicle step измерен отдельно на ровной поверхности.

| NPC | active | Traffic.step среднее, мс | p95, мс |
|---|---|---|---|
| 0 | 0 | 0.0012 | 0.0014 |
| 28 | 28 | 0.0193 | 0.0338 |
| 42 | 42 | 0.0197 | 0.0434 |
| 72 | 72 | 0.0212 | 0.0370 |
| 120 | 120 | 0.0420 | 0.0897 |

Vehicle.step среднее: 0.4321 мс. Реальный rendering/GPU FPS/нагрев отсутствуют. В игре теперь можно получить timings на самом телефоне; raf_hz — cadence callbacks, не непосредственное GPU измерение.

## Ограничения и следующий этап

Мобильный GPU/startup не проверен: control-browser недоступен, не устанавливался альтернативный браузер/preview. Документ IPHONE_TEST_PLAN даёт acceptance и сравнение density/quality. Существующий contact footprint усредняет высоты, tires/suspension/CG оценочные; unvalidated 0–60 mph ~7.76 s vs сохранённый claim 6.1. Procedural car сходство ещё требует Max. Нет NPC–NPC crash solver, temperature/pressure/wear tires, offline/native/open world. NPC не гарантируют защиту от внезапного опасного вклинивания игрока.

Следующее: iPhone CSV и симптомы → точечная регрессия → profile/оптимизация. Main-thread physics и повреждённая deform skin могут быть заметным CPU bottleneck. Выбор adaptive cap/LOD/меньшей частоты отдельных систем только по device data. Worker/WASM/новая физическая архитектура — будущий отдельный этап.

GPT-6.1 Sol: диагностика и обычный код/profiling; GPT-6 Sol: bounded fixes; Luna: documentation/CSV summary. Astra: сложная устойчивость/контакт/подвеска только отдельной задачей. Автоматического переключения нет, новый deep research сейчас не нужен.

Документы PROJECT_STATE/ARCHITECTURE/CHANGELOG/NEXT_TASK обновлены. V013_VALIDATION хранит результаты текущего запуска; AUDIT_VALIDATION и TECHNICAL_HANDOFF_REPORT описывают прошлый аудит и не заменяют этот report. Итоговый ZIP содержит source/resources/docs/tests/Git bundle/check evidence/provenance, исключает credentials. Existing Site сохраняет аудиторию, GitHub не использовался.
