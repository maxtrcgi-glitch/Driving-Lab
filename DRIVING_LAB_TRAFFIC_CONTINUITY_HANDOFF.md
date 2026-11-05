# DRIVING LAB — v0.14A.3.3 TRAFFIC CONTINUITY HANDOFF

**Тестовая и основная ссылка:** https://max-driving-lab.maxtrcgi.chatgpt.site  
**Контрольная Gameplay Baseline v0.14A.3.1:** https://max-driving-lab-recovery-a31.maxtrcgi.chatgpt.site  
**Версия:** DRIVING LAB v0.14A.3.3 — Traffic Continuity Fix.  
**Git изменения:** b68fb65414bab271d29199bb31fd71ee4ec7bac5. Точная финальная HEAD документации/архива — корневой RELEASE_RECEIPT.json.  
**Опубликованный Site Git:** 8955a6f4bfc373c10bbeda305b3f6dfbafbe3e24, native version21. Публикация succeeded; HTTP200/SHA совпали для24/24 файлов (index, BUILD_RECEIPT,22modules). Build ID v014a33-48be633cba51.  
**Что изменилось:** распределение и рециклинг трафика; ограниченная диагностика непрерывности. Общий лимит NPC не увеличен.  
**Что проверить игроку:**5мин200км/ч при28NPC после обгона стартовой группы; затем72/120, sparse18/160, визуальные появления, торможение и Safari frame pacing. Ручная приёмка новой версии ещё не проведена.

## Подтверждённая причина
A32 не прекращает генерировать NPC. Компактные стартовые ряды заканчиваются вместе; перенос позади−260м вперёд850–1100м оставляет промежуток между группами. Реальный Highway при200км/ч,28NPC,seed917: околоt7.5с nearest792м; t20с nearest424м и всё ещё8crossings; следующая встреча около34.6с. Прежние тесты постоянного active count не обнаруживали игровой провал. Regression до исправления падает, commit969fb17. Видео29.8с показывает traffic при105км/ч и пустую попутную дорогу при190; неизвестные seed/density не позволяют заявлять точный replay.

## Реализация
`dist/highway.js`: близкие безопасные rolling-start соседи сохранены, остальной набор распределён по±1240м. Из выбранного total density попутный бюджет=density−floor(density/6), встречный=floor(density/6). Например28→24/4,120→100/20. Это явное перераспределение, не рост общего количества; active=requested, максимум120.

Выходная граница1300м; incoming entry1320м с небольшим jitter, bounded safe-slot search до2192м и дальняя граница2200м. Сторона входа/выхода определяется относительной продольной скоростью NPC и игрока. Поэтому новые incoming NPC не удаляются раньше подхода к игроку. Actor переиспользуется; desired speed/profile/type сохраняются. Safe-slot46м, clearance игрока55м, резервирование target/source lane,30Гц AI2 и плавные перестроения остаются. Crashed OBB/capsule контакты и player collisions/rebase сохранены.

`dist/traffic-trace.js`: read-only5Гц ring1800×16 (~230KB,6мин). Counts100/250/500/1000м,active/co/oncoming,nearest,relative speed,instant potential-pass time,spawn/retire rates/failures. Запись только после новых physics steps, reset при перезапуске/сменеlocation. Экспорт в JSON header обычной telemetry: trafficContinuity, schema DrivingLabTraffic/1. Это не предсказание безопасного обгона. Infinity→null.

`dist/app.js`: подключение диагностики и версия; `index.html`, build fingerprint, tests и документация. Камера/physics/input pipeline не менялись.16защищённых модулей byte-identical A31,7200полных физических snapshot comparisons без внешних контактов подтвердили эквивалентность. ABS/TCS и C0.3 Shadow Predictor сохранены; действующих рулевых коррекций нет.

## Измеренные результаты
125constant-speed сценариев×300с: все5скоростей80/120/160/200/250, все5плотностей18/28/42/72/120,3основныхseed и2дополнительных. Дополнительно2×300с acceleration. A32 сравнена на тех же75основных сценариях. New spawn failures0, overlaps0, active=requested; по консервативному fog proxy переносов приcontrast>1% нет. В1000м впереди поток в новых constant-speed сценариях не исчезал.

При200км/ч28NPC worst3seeds: максимальный gap между crossings28.20→16.13с; empty-within500m11.90→0с. При18:33.13→28с и19.20→7.97с. При120:gap2.80→6.70с — менее компактные группы, улучшение каждого численного показателя не заявляется. Таблица25speed/densityrows, JSON timelines и график в C033_RESULTS/reports/traffic-continuity.

**Предупреждение исходного протокола:** при160км/ч18NPC seeds2027/99881 crossing gaps46.2/53.87с и empty50017.53/22.03с превышают первоначальные40/15с. Эти результаты сохранены и не названы passes. Во всём этом интервале NPC в1000м присутствуют. Amended gates: исходные40/15 обязательны при200/250,1000м bound на всех скоростях; amendment открыт в C033_VALIDATION_PROTOCOL. При80 машины обычно быстрее игрока, поэтому zero overtakes не означает пустой дороги. При120 near-equal velocities тоже дают редкие crossings.

Full npmcheck29programs пройден; Shadow5programs и predictor tests пройдены. AI2 safety24×90с,32fixed-seed starts, обгон/опасный rear-TTC отказ/cooldown,24зеркальные swept-wall cases,30/60/120/240Гц, bounded instances/actor retention прошли. App bootstrap использует DOM/WebGL stubs, не реальный Safari. Первоначальный harness failure TrafficTrace binding исправлен; production imports были корректны.

Node CPU benchmark (4×1/240 на simulated60Hzframe), meanA32/A33:28NPC0.0532/0.0476мс;72NPC0.1484/0.1454;120NPC0.2400/0.2346. Три повтора, p95/p99/component costs в continuity-performance.json; шум среды не позволяет обещать ускорение.60000steps/250с/GC:120actor references reused, retained heap delta−37920bytes. **Это не FPS на iPhone и не GPU/frame-pacing measurement.**

## Сохранение и откат
A32 сохранена ДО runtime edits: tag before-traffic-continuity/v0.14A.3.2→663d77ec9486df218d96f8ef83472898366faebe и проверенный A32_previous_version_backup.zip. Доступный прежний большой All-In-One ZIP нечитабелен (missing central directory); из целых source/Git/build/evidence восстановлена полная рабочая копия проекта, а не идентичные байты старого ZIP. Исторические вложенные ZIP не дублируются; Git-история исходников полная.

На главной ссылке ДО A33 была A1/native14/source0ef5b8d — HTTP5/5 файлов это подтвердили, хотя latest saved source20 былA3. ROLLBACK.md содержит точный saved version_id для возврата A1, tag before-main-link/v0.14A.3.3 и source backup. A31 Gameplay Baseline/tag8bc и её контрольная ссылка не изменены. Native21 уже опубликована на главной ссылке с сохранённой owner-private аудиторией; cache must-revalidate, новые fingerprinted module URL. Открытая старая вкладка сама JS не заменит — её нужно перезагрузить.

All-In-One: project/,полная Git bundle,готовый static build,отчёты/график/тесты,HANDOFF,корневойRELEASE_RECEIPT,backup предыдущих A32 и mainA1. CRC и восстановление Git проверяются при упаковке. Корневой START_HERE объясняет запуск и восстановление.

## Ограничения и следующий шаг
Нет новой реальной iPhone QA/браузерного WebGL теста. Видимые pop, terrain occlusion, столкновения при действиях игрока и frame pacing должны проверяться устройством. FogExp2.0017 даёт1%contrast около1262м; CPU distance proxy не гарантирует визуальную незаметность. Дальние NPC могут быть за пределами8streamed road chunks до подхода к visibility zone. Sparse18/160 и extreme-oversteer limitation остаются; последняя не исправлена и поDirector не блокирует gameplay.

Следующий этап — **дождаться игрока**, получить видео и обычную telemetry по IPHONE_TRAFFIC_CONTINUITY_TEST.md. Код до результата не менять. Небольшие traffic fixes — GPT-6.1Sol/GPT-6Sol, документация — Luna при необходимости; Astra только отдельная сложная architecture/physics задача по согласованию. Не возвращаться к контррулению и не расширять работу на камеру в рамках этой итерации.
