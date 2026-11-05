# iPhone —0.14A.1

Открыть https://max-driving-lab.maxtrcgi.chatgpt.site, reload и проверить label0.14A.1. Landscape/Balanced/28NPC/default physics, travel100%,precision1.45. Сборка меняет только внешний диапазон руля; camera прежняя.

1. Обычные corrections50/100/150/200 и умеренное lane change: должны совпадать с удобством A.
2. Test pad/Highway density0: вызвать умеренный занос, перевести палец в противоположную сторону. Теперь конец хода открывает больший угол. Не удерживать full lock после восстановления: проверить своевременный unwind, возможный переброс. Начать с60–100, затем150/200 в игре.
3. Разделить жалобу: «угол не достигается» (actual steering вCSV) / «до угла долго идёт» / «передерживаю и перебрасывает» / «шины уже не держат». Полный end-to-end lock90% на стенде~0.92s, не мгновенно. Нет автоматического выравнивания.
4. Pad release/cancel/second finger напедали, pause/фон/reset. Затем при использовании tilt проверить его крайний ход — он тоже открывает mechanical lock. Digital profile прежний.
5. Highway rolling start/density28/72/120 и четыре камеры/settings persistence должны сохраняться. Не считать старую A acceptance подтверждением новойouter zone.
6. Для сбоя записать30–60s CSV Pause→Telemetry; сообщить speed, slip, gas/brake/handbrake, долю хода, момент отпускания и короткое screen recording. Не угадывать FPS.

Критерий: обычная езда прежняя, полного угла достаточно для своевременного манёвра в умеренном заносе, unwind контролируем. Full lock при любой скорости даёт доступный mechanical предел, но не гарантирует сцепление/rescue. Airborne рулём остановить yaw нельзя. Не проверяй всё одновременно с изменением grip/precision/массы.
