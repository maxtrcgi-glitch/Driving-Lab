# C033_RESULTS — Traffic Continuity

## Root cause и воспроизведение
Видео:29.8s,1112×512,30fps. На просмотренных кадрах около3s speed105 traffic есть; около21s speed190 попутный поток визуально пуст. Seed/density неизвестны. Модельный road-space водитель не воспроизводит касания/точную траекторию игрока.

Старая A32 в реальном Highway при200kmh/28NPC/seed917: t7.5s nearest792m, ahead100=0/ahead250=0; t20s nearest424m, encounters всё ещё8. NPC не потеряны: active28, sameDirection14; nearest через gap. На A32 типичные relocation245–369 за5min для18/28NPC выполняются в зоне >1% fog contrast. Тест учитывает t0: прежнее исключение первых30s как warmup само скрывало этот сбой. Regression baseline-regression.log падает на long empty flow, до runtime edits (commit969fb17).

Главная причина — компактные initial rows + distant front re-entry + rear260 retire. Само число850–1100 не доказывало ошибку; measured encounter timelines подтверждают групповые провалы. Новая зона entry дальше,1320м, но **распределённые существующие NPC** сохраняют промежуточный поток; проблема не маскируется ростом общего количества.

## Матрица:75×300s, road86, traffic917/2027/8123
Encounter: road-s crossing попутного NPC, не обязательно same lane/безопасный обгон. Empty500/1000 — отсутствие попутного NPC впереди в соответствующем road-s диапазоне. maxGap включает весь run и конец, без исключения старта.

| kmh | NPC | encountersMin | encountersMax | oldGapS | newGapS | oldEmpty500S | newEmpty500S | newEmpty1000S |
|---|---|---|---|---|---|---|---|---|
| 80 | 18 | 0 | 0 | 300 | 300 | 0 | 11.87 | 0 |
| 80 | 28 | 0 | 2 | 300 | 300 | 0 | 0 | 0 |
| 80 | 42 | 0 | 0 | 300 | 300 | 0 | 0 | 0 |
| 80 | 72 | 0 | 2 | 300 | 300 | 0 | 0 | 0 |
| 80 | 120 | 0 | 1 | 300 | 300 | 0 | 0 | 0 |
| 120 | 18 | 9 | 10 | 113.47 | 116.97 | 35.6 | 27.23 | 0 |
| 120 | 28 | 13 | 15 | 109.9 | 55.2 | 0 | 2.07 | 0 |
| 120 | 42 | 19 | 23 | 51.27 | 54.37 | 0 | 0 | 0 |
| 120 | 72 | 45 | 51 | 33.93 | 46.9 | 0 | 0 | 0 |
| 120 | 120 | 92 | 96 | 7.13 | 14.33 | 0 | 0 | 0 |
| 160 | 18 | 28 | 29 | 56.57 | 46.2 | 27.93 | 17.53 | 0 |
| 160 | 28 | 44 | 46 | 44.53 | 25.87 | 17.13 | 0 | 0 |
| 160 | 42 | 66 | 68 | 37 | 21.43 | 11.17 | 0 | 0 |
| 160 | 72 | 124 | 126 | 19.5 | 14.47 | 0 | 0 | 0 |
| 160 | 120 | 221 | 227 | 4.57 | 8.03 | 0 | 0 | 0 |
| 200 | 18 | 47 | 48 | 33.13 | 28 | 19.2 | 7.97 | 0 |
| 200 | 28 | 74 | 77 | 28.2 | 16.13 | 11.9 | 0 | 0 |
| 200 | 42 | 111 | 114 | 24.97 | 13.1 | 8.1 | 0 | 0 |
| 200 | 72 | 199 | 203 | 14.87 | 9.9 | 0 | 0 | 0 |
| 200 | 120 | 345 | 353 | 2.8 | 6.7 | 0 | 0 | 0 |
| 250 | 18 | 70 | 71 | 23.57 | 17.8 | 11.6 | 6.23 | 0 |
| 250 | 28 | 112 | 115 | 22.1 | 11.2 | 10.57 | 0 | 0 |
| 250 | 42 | 165 | 166 | 18.53 | 9.43 | 7.83 | 0 | 0 |
| 250 | 72 | 293 | 298 | 12.63 | 7.9 | 1.87 | 0 | 0 |
| 250 | 120 | 509 | 512 | 3.2 | 4.7 | 0 | 0 | 0 |

Дополнительные50×300s на11347/99881 не использованы для изменения параметров после просмотра результатов;2×300s acceleration28m/s→200km/h (примерная структура видео).125constant+2acceleration=127сценариев. Все active=requested, spawn failures0, NPC overlaps0, conservative >1%fog relocation0. Warning: исходные gate40s encounter/15s empty500 при160 не выполнены на18NPC seeds2027 и99881:46.2/53.87s и17.53/22.03s. Это **не** полное прохождение первоначального протокола. В amended gate те же ограничения обязательны при200/250,1000m criterion на всех скоростях. На80 трафик преимущественно быстрее игрока, zero overtakes нормальны; finite time to next pass не гарантируется. При120 near-equal relative speeds тоже могут давать длинные интервалы crossings при наличии автомобилей впереди.

При200,28NPC max crossing gap28.20→16.13s, empty50011.90→0s (3seeds worst case). При18 max33.13→28s, empty50019.20→7.97s. При120NPC maxgap2.80→6.70s — меньше прежней концентрации/более ровное распределение, не улучшение каждого показателя. Детальные counts/time/spawn/relative-speed в JSON и CSV evidence.

## Производительность — только Node CPU
4×1/240 Highway.step на simulated60Hz frame;3repeats1800frames, alternating old/new order, 28m/s, no rendering/player physics. Шум Node не позволяет заявлять iPhone FPS или гарантированное ускорение.

|NPC|A32 mean traffic ms/frame|A33 mean traffic ms/frame|
|---|---|---|
| 28 | 0.0532 | 0.0476 |
| 72 | 0.1484 | 0.1454 |
| 120 | 0.2400 | 0.2346 |

Retained heap delta after60000steps/250s/GC: -37920bytes. Actor references reused,120active. Component timing incl lane decisions/barriers/crash capsules and p95/p99 available in continuity-performance.json. TrafficTrace storage bounded~230KB,5Hz, no per-physics-step records.

## Остальные проверки
AI2 safety:24×90s stop/accelerate/brake/high speed, no global artificial jam; mirrored swept walls24cases, overtaking, rear-TTC refusal, cooldown/no ping-pong, contacts. Original renderer untouched; real Three geometry/instance capacity checks in Node. App bootstrap uses WebGL/DOM stubs — не Safari. 16 protected files hash-identical A31,7200 full vehicle snapshots/steer/ABS/TCS/no-contact physics bit-exact. Shadow estimators/detector/predictor lifecycle passed. Player collision/rebase implementation unchanged.

## Ограничения
Новая версия на iPhone ещё не проверена. Реальные visual pop/road occlusion/плавность/FPS и дорожные аварии при действиях игрока могут отличаться от prescribed road-space driver. Распределение направления изменено явно: 5/6 co budget; selected density — общий active count. Live density increase допускает появление дополнительных объектов при подтверждении настройки, как раньше; hidden relocation gate относится к обычному step/recycle. Sparse18/160 limitation и extreme oversteer известны. Seed counts и instant nextPass не являются safety/trajectory prediction.
