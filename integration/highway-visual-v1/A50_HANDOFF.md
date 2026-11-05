# DRIVING LAB — A.5.0 HIGHWAY WORLD INTEGRATION HANDOFF

Рабочая игра: A.4.2, https://max-driving-lab.maxtrcgi.chatgpt.site. Новая сборка не публиковалась. Проверка свежей доступности этого адреса не выполнялась; BASELINE_RELEASE_RECEIPT.json фиксирует предыдущую проверенную публикацию25/buildv014a42-5e80bbad66f5. Director сообщил принятие камеры игроком.

Передать Visual Developer пять основных файлов и example/reference/tests из этого ZIP. Contract1.0.0 описывает реально существующие s/globalZ, lanes, offsets, eight-chunk origin transform и API отдельно от будущих расширений. Дорожный адаптер и asset registry исполняются только в отдельном примере, не в игровой сборке. Существующих asset-extension callbacks, LOD runtime, реальных фонарей/мостов/знаков в A.4.2 нет; они помечены как proposed.

Проверено: исходный All-In-One CRC и362SHA; восстановлен source.bundle на93e5e260977ca0b079ccd198e12ac9cc97fafa28. Gameplay baseline tag создан. Все runtime dist файлы совпадают с A.4.2. Contract Node tests576frames,502segments,8boundedactive; main highway regression100km streaming/projection/deterministictraffic/contact checks PASS. CPU census118batches/78152triangles at120NPC. Browser/Safari/WebGL/FPS/whole-game-memory не измерены. Результаты и предварительные бюджеты разделены.

Новые/изменённые файлы: integration/highway-visual-v1/*; PROJECT_STATE, ARCHITECTURE, ROADMAP, CHANGELOG, NEXT_TASK. Публикации и внешнего push не было. История изменений сохранена в history/source.bundle внутри ZIP; точный новый commit в PACKAGE_RECEIPT.json. Full A.4.2 original archive сохранён отдельно, без повторного вложения30MB. Для rollback игры использовать оригинальный ready-build/native bundle и saved Site25 из baseline receipt, не запускать визуальный demo как игру.

Предложение A.5.1 в A51_GEOMETRY_UPGRADE_PLAN.md: seam tests → minimal host lifecycle hooks → one approved asset → bounded geometry/metrics → review. Не начинать без подтверждения Director. Основное programming GPT-6.1 Sol; Visual Developer создаёт ассеты по контракту; Astra/новый большой research для этого шага не требуется.
