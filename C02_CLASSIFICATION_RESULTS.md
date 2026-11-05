# C0.2 — результаты диагностической валидации

2026-10-11. Detector/protocol freeze commit b25c846, до первого heldout run. Детектор после просмотра heldout НЕ настраивался.29 прежних test programs +5 shadow programs проверяются отдельно от bench quality.

| Группа | Скорости km/h | Прогоны | Fixed steps |
|---|---|---:|---:|
| Calibration final |60/120|44|42240|
| Heldout, изменённые команды |90/160/200|66|63360|
| C0.1 identity, RAF30/60/120 |160|66 пар|47520 на сторону сравнения|

В benchmark только reset(speed),0.4s settle и затем водительский steering/gas/handbrake. Beta/yaw не подставляются. Физика неизменна.11 семейств манёвров:straight,turn,lane,front-demand,rear-brake,counter-release,counter-hold,pendulum,mild-release,mild-hold,steady-slide-probe. Имена не являются утверждением о результате. Heldout — перенос на скорости и timeScale.9/rawScale.9/handbrakeScale.8/gasScale1.1, а не полностью новые семейства или другой движок.

## Heldout по независимому офлайн proxy

| Proxy-событие | Событий | Найдено | Пропущено | Delay относительно proxy onset |
|---|---:|---:|---:|---|
| UNSTABLE_SLIDE |34|34|0|−0.20…0s|
| RECOVERING |14|0|14|не установлен|
| DRIFT_LIKE |4|0|4|не установлен|
| SIDE_TRANSITION |8|2|6|0s у найденных|

Интервалы события>=2 отсчёта20Hz, matching onset−0.2s…end+0.2s. Delay может быть отрицательной, поскольку офлайн proxy подтверждает8° и будущее увеличение, тогда как detector реагирует раньше. Не переносить числа на touch/iPhone latency. Matching не one-to-one, зеркальные события зависимы. Ни100% по34 событиям, ни отсутствие ложных alert на этой выборке не доказывают глобальную надёжность.

На1730 proxy NORMAL samples:0 известных неверных slip alerts;1194 NORMAL,536 UNKNOWN (30.98% abstention). В calibration были2 RECOVERING labels на1238 proxy NORMAL samples (0.162%). При invalid state —0 non-UNKNOWN фаз; mirrored phase/time differences —0. Данные не скрывают disagreement: на10 DRIFT_LIKE samples heldout detector дал8 UNSTABLE_SLIDE и2 UNKNOWN; на70 RECOVERING —44 UNSTABLE_SLIDE и26 UNKNOWN. При oracle UNKNOWN алгоритм всё же выдавал22 DRIFT_LIKE и38 RECOVERING; это неподтверждённые интервалы, не автоматически истинные или ложные фазы.

| Heldout speed | Samples | Detector UNKNOWN | Proxy NORMAL | Ошибочный известный alert на proxy NORMAL |
|---|---:|---:|---:|---:|
|90|1760|636|652|0|
|160|1760|574|532|0|
|200|1760|504|546|0|

Calibration recovery8/12, drift-like4/10 не перенеслись на heldout. Это выявленная слабость, а не основание выпускать активную помощь. Полные confusion matrices, переходы и traces сохранены в evidence/calibration-final.json и heldout-validation.json. Source tests воспроизводят отчёты.

## Reference и силы

Heldout:5280 sampled states, геометрический reference принят3952 (74.85%). При accepted geometry max discrepancy alphaGeom против точной последней pre-integration контактной пробы0.00088648rad≈0.0508°. Max body lateral force discrepancy /max(100N,|exact force|)=8.762e−6. Это flat-road/end-tick сравнение, не абсолютная калибровка шин/GR86.

Exact moment: tyre Fx/Fy applied at contact point, M_y about true all-node COM. Передние/задние суммы записаны отдельно. Не включает normal force/rolling resistance/drag/internal structure и не равен complete yaw dynamics.

Локальное frozen-state tire-relaxation50ms сравнение hold actual rack с alignment:2514 случаев с |yawRate|>.05rad/s и |delta moment|>50Nm. Все уменьшали |front lateral force|,2462 давали изменение момента против текущего yawRate,52 — по направлению yawRate. Например90km/h mild-release t1.55s:beta≈9.8°,rack≈9.6°,alignment≈10.0°,delta moment≈+765Nm приpositive yawRate. Это доказывает отсутствие универсального yaw-damping свойства alignment, но не доказывает, что damping всегда правильная цель.

Rack probe не учитывает достижимость за50ms, изменение скорости/кузова/load и задние силы. Reference геометрически полезен, а steering rescue direction НЕ подтверждён. Для recovery необходимо учитывать rear moment, текущую траекторию, tire memory и динамику actual rack.

## Вторичный занос

В heldout warning появился только у90km/h mild-hold, две зеркальные стороны: t1.70s, до raw motion/body direction crossing≈0.15s и opposite5°≈0.25s. В этой малой выборке оба warning подтвердились в0.75s, но многие события остались без warning. Не трактовать2/2 как надёжную оценку precision/recall. В calibration аналогичные120km/h случаи давали0.15/0.30s lead. Уменьшение yawRate само по себе не использовалось как recovery.

Наблюдаемый паттерн: beta сходится, но actual rack удерживается, yaw уже вращает кузов через направление движения, задняя tire memory/load ещё существенны. Возможна ошибочная трактовка намеренного переходного манёвра; без короткого hold/unwind прогноза нельзя определить достаточность/момент отпускания. Warning только наблюдает, не вмешивается.

## Граница завершения

Сохранён C0.2 Shadow Experimental и результаты проверок. UNSTABLE_SLIDE полезен на этой выборке, NORMAL консервативен; DRIFT_LIKE/RECOVERING/SIDE_TRANSITION и early warning недостаточно валидированы. Статический запуск проверяется production app bootstrap с Renderer stub; реальный WebGL/iPhone/FPS не проверены. Код активной помощи отсутствует. Следующий этап должен закрыть эти ограничения, а не использовать phase как разрешение рулевого вмешательства.
