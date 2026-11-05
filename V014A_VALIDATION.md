# Driving Lab 0.14A — проверка этапа A

Это численный и composition audit, не iPhone QA. Финальный npm run check: exit 0, все 26 скриптов passed. Полный статус фиксируется в evidence/check-final.log и RELEASE_RECEIPT.json. Команда включает 26 скриптов; дополнительный steering-comparison запускается отдельно с baseline checkout. Старые 0.13/regression scripts сохранены.

## A/B с настоящим кодом

Baseline Git 097aac99685f7a7a3e2846a74b595931daebc500. tests/steering-comparison.mjs импортирует Vehicle и bindSteeringPad из неизменённого checkout; проверяет byte equality physics.js. 5 скоростей × 6 манёвров × 2 версии = 60 прогонов. Одинаковая ровная сухая плоскость, defaults, без газа/тормоза, 0.4 с settling, затем 3 с, DT=1/240. Скорость естественно уменьшается (200 → около 185 км/ч за тест); нет принудительного поддержания скорости/yaw. 250 км/ч — imposed initial condition, не доказательство максималки GR86.

Манёвры: correction (finger .08 на .4 с), laneChange (.25 на .4 с и -.25 на .4 с), sharp (.8 на .3 с), countersteer (+.6 на .35 с и -.6 на .35 с), release (.3 на .35 с), oscillation (.12*sin на 1.2 с). Default pad precision=1.45, travel=1. Записываются фактические rack/FR/FL angles, filtered ay, yaw rate, beta, смещение и скорость. peakWheelDeg в JSON означает центральный угол рейки; CSV отдельно содержит Ackermann FR/FL. response90_s — до 90% начальной цели рейки, с естественной меняющейся скоростью; не human reaction time.

Малая коррекция — значения «0.13 / 0.14A»:

| Начальная км/ч | Пик рейки ° | Пик yaw рад/с | Пик ay м/с² | x после 3 с, м | 0.14A t90, мс |
|---|---|---|---|---|---|
| 50 | 0.8385 / 0.6788 | 0.0653 / 0.0524 | 0.738 / 0.576 | -0.823 / -0.655 | 83 |
| 100 | 0.8385 / 0.2733 | 0.0971 / 0.0320 | 1.573 / 0.515 | -2.349 / -0.763 | 96 |
| 150 | 0.8385 / 0.1180 | 0.1113 / 0.0161 | 2.287 / 0.339 | -3.533 / -0.500 | 108 |
| 200 | 0.8385 / 0.0614 | 0.1196 / 0.0091 | 2.870 / 0.227 | -4.328 / -0.321 | 121 |
| 250 | 0.8385 / 0.0492 | 0.1247 / 0.0077 | 3.318 / 0.215 | -4.847 / -0.291 | 125 |

Все 60 прогонов: finite state, нет самопроизвольного разрушения балок, рейка вернулась к нулю. Assert: высокоскоростная малая коррекция даёт <40% прежнего угла и меньший yaw; на 50 км/ч сохраняет >80% прежнего угла. До 28.8 км/ч полный аналоговый диапазон сохранён. Это не подтверждение максимального сцепления/устойчивости во всех условиях.

## Запас маневрирования и ограничения

Дополнительный steering-dynamics: finger +.55 на .55 с, -.55 на .55 с при 200/250. За 3 с смещение 3.407/3.159 м, остаточный yaw 1.426/0.948°, peak beta 5.390/5.428°. Полоса шоссе ~3.7 м; получено движение сопоставимой ширины, не автоматическое точное центрирование полосы. Замер на плоскости без traffic; не гарантия безопасного перестроения на извилистой дороге.

При большом sharp-input .8 на 200 км/ч peak beta остаётся ~21° (0.13 ~47.8°). Вход +.65/-.65 на .5 с на дополнительном диагностическом прогоне дал около 10.1 м смещения и остаточный yaw -3.66°: симметричный ввод не обязан вернуть траекторию, когда шины близки к пределу. Это важное ограничение, а не passing stability assertion. Выбранный профиль не является ESC. Сильный ввод требует обратной связи водителя. Нельзя утверждать, что «машина больше никогда не уходит в занос».

## Lifecycle / регрессии

SteeringResponse: touch/tilt/digital, 0/50/100/150/200/250, ±speed symmetry, finite/rate/reversal, neutral snap/reset, dt=0, 30/60/120/240 Hz constant-input convergence. Промежуточный ответ rate-limited фильтра может слегка отличаться при произвольных больших шагах; production всегда 240 Гц. Старый датчик сохраняет timeout 500 мс.

App-bootstrap: production app, real geometry и Vehicle, DOM/renderer stubs, 209 simulated RAF frames, 120 NPC start, pause/settings/experience prefs, все spawns, четыре переключения камер, настоящие pointer events, cancellation/release/lostcapture, blur, скрытие/возврат страницы, reset. Сохранены highway regression, contact/structure/drivetrain/handling/telemetry и model checks.

Нет control-browser: browser/WebGL screenshots не сделаны. Нет подтверждения native Safari/iPhone input feel, WebGL GPU, FPS или нагрева. Driver camera остаётся 0.13. Математические тесты не заменяют визуальную проверку.

## Производительность

Контроллер: отдельный Node v24.19 linux x64 микро-бенчмарк 100000 calls, total 13.799 ms, mean 0.138 μs/call после 10000 warmup. Это один CPU-only замер класса, без физики/DOM/render, не FPS телефона и не end-to-end стоимость. Fixed-step фильтр не выделяет объекты; DOM/adapter state собирается по событиям/RAF, не 240 раз/с. Physics/traffic/render не переписывались. Надёжный device budget требует CSV и iPhone.

## Повторение

npm run check

git worktree add --detach /absolute/baseline 097aac99685f7a7a3e2846a74b595931daebc500

node tests/steering-comparison.mjs /absolute/baseline /absolute/evidence

В ZIP лежат полные JSON/CSV, лог checks и Git bundle. Ошибки запуска/возврат к базе диагностировать отдельно от оценки камеры.
