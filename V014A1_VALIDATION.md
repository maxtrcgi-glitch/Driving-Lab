# Driving Lab 0.14A.1 — диапазон контрруления

Дата: 2026-10-11 Asia/Jerusalem (2026-10-10 UTC). База Git4b88fe85b9dfa81f9252c80923f66ff5ce90ab8e (0.14A). npm run check: 27 scripts, exit0. Отдельно прошли два comparative scripts (36+36 recovery runs). Источник физики byte-identical, state initials детерминированные, одинаковые terrain/defaults.

## 1. Максимальный угол отдельно от чувствительности

Фиксированная номинальная скорость только для mapping bench, full raw=1, контроллер3s при1/240. Реальный Vehicle обновляет Ackermann steerAngle. Это предел карты руля, не тест движения по кругу на полном угле при200.

| км/ч | 0.14A central/rack ° | 0.14A outer–inner ° | 0.14A.1 central/rack ° | 0.14A.1 outer–inner ° |
|---|---|---|---|---|
| 0 | 32.66 | 28.32–38.33 | 32.66 | 28.32–38.33 |
| 50 | 29.94 | 26.21–34.76 | 32.66 | 28.32–38.33 |
| 100 | 17.30 | 15.92–18.93 | 32.66 | 28.32–38.33 |
| 150 | 10.82 | 10.25–11.45 | 32.66 | 28.32–38.33 |
| 200 | 8.09 | 7.77–8.44 | 32.66 | 28.32–38.33 |
| 250 | 6.79 | 6.56–7.04 | 32.66 | 28.32–38.33 |

В0.13 pad/tilt шли непосредственно в±1; mechanical central limit был тем же±0.57rad (~32.659°) на любой скорости. A.1 возвращает доступ к этому ранее существовавшему пределу, не увеличивает механический максимум. Inner/outer — значения оценочной Ackermann geometry; они не заявляются измеренными углами реальной Toyota.

Toyota GR86 official source: https://media.toyota.co.uk/toyota-presents-the-new-gr86/ (Steering), прочитан в этой сессии. Ratio13.5:1 и2.5 turns lock-to-lock. При предположении постоянного передаточного отношения эквивалентный центральный угол=360*2.5/2/13.5=33.33°. Это расчёт, не опубликованные separate inner/outer angles. Существующий0.57rad близок; не менялся. Toyota USA source был найден поиском, но full fetch403; вывод grounded в доступном UK source. Rate data реальной рейки не опубликованы в использованном материале.

## 2. Центральная характеристика и большой ход

Старая цель sign(raw)*L*q, q=abs(raw)^exponent. Новый u=clamp((q-.45)/.55,0,1), reserve=u²(3-2u), target=sign(raw)*(L*q+(1-L)*reserve). Digital reserve=0. До q=.45 всё ТОЧНО как0.14A. Приq=1 target=1 на любой скорости. Выше порога smooth C1 blend, монотонный, без скачков/гистерезиса. Default precision1.45, high-speed exponent1.35: порог примерно66.5% физического хода пальца; при других настройках он изменяется.

Тесты: 2001 точка карты каждого mode/speed (touch/tilt,0/50/100/150/200/250), monotonic/bounded/symmetric, точное равенство прежней карты до порога. Одинаковый sinusoidal demand с амплитудой .55^1.45 даёт byte-exact команды controllers на всех этих скоростях; существующий lane-width maneuver на200/250 сохранён3.407/3.159m. Digital диапазон не менялся. Ограничение физических шин не обходится.

## 3. Rate отдельно от диапазона

Параметры без изменений: analog increase1.8, return2.0, sign reversal2.4 normalized command/s; tau=.035+.020*b s. Vehicle rack max3rad/s остаётся прежним. Быстрее автоматически поворачивать/успокаивать кузов игра не стала.

Пример200км/ч: переход из установившегося отрицательного полного хода к90% положительной цели0.258s(A)→0.917s(A.1), потому что теперь цель32.66°, а не8.09°. Peak command rate обеих2.4/s. Этот тест полного lock-to-lock не human reaction time. Нельзя утверждать, что контрруление стало быстрее; увеличилась доступная амплитуда. При обычном midrange движении ответ полностью совпадает.

## 4. Recovery — два разных протокола

A. SAME FINGER POLICY:36 runs, speeds100/150/200, initial beta±10/20/35°, yawRate∓.45rad/s, dry plane,0.4s settle, gas.1,5s,dt1/240. Synthetic driver finger=clamp(2*(-beta/.57+yawRate*.3)), raw=sign(finger)*abs(finger)^1.45. Это test-only closed-loop водитель; игровой код не читает beta/yaw для steering. Recovery: beta<3° и|yawRate|<.07rad/s непрерывно0.5s, speed>3m/s.

При10° оба восстанавливаются; positive-side recovery times100/150/200: A0.721/1.075/1.725s, A.1 0.708/0.883/0.988s. Negative зеркальная сторона также проверена. Но для20/35 этот агрессивный одинаковый finger policy часто вызывает переброс/вращение A.1; например100/20 раньше recovery~1.196s, теперь отсутствует за5s. Все failures сохранены JSON/CSV. Это не proof физической невозможности — водитель продолжает держать слишком большой угол, не компенсируя изменённую карту.

B. SAME PHYSICAL REQUEST / AUTHORITY:36 runs с теми же initials, но driver запрашивает нормированную рейку clamp(-beta/.57+yawRate*.3). Test harness inverse-map каждого профиля методом18 bisections, затем обычный rate filter. Finger travel различается — этот тест изолирует доступную authority, НЕ эргономику. В игру inverse-map/feedback не добавлены.

A.1 восстанавливает все выбранные36 states. На200/20° A не recovery за5s (range saturated5s), A.1 recovery1.467s, peak beta27.10°. На150/20° A не recovery, A.1 1.388s. На100/20° A1.367s, A.1 1.229s. На200/35° A.1 recovery2.454s при подобранном test driver; не гарантия для пользователя/всех заносов. Идентичный инпут не гарантирует одинаковое улучшение во всех ситуациях; отпускать full lock своевременно всё ещё необходимо.

## 5. Когда увеличение угла не помогает

Строго подтверждённый случай в модели: все колёса в воздухе (lift5m, первые0.15s). Сравнение neutral/full steering: zero tire force, yaw и траектория совпадают; рулём восстановить ориентацию в этот интервал нельзя. Разворачивающей колесной силы без контакта нет.

mu=0: tireForce даёт нули, но существующий solver всё ещё добавляет load-based rolling resistance независимо отmu. За0.15s full lock меняет yawRate лишь~.001486rad/s, recovery нет. Это техническое приближение, а не доказательство идеального frictionless поведения; physics не меняли, отмечено ROADMAP.

Позднее действие, большой yaw/slip, разгруженная ось, повреждения, недостаток места/сцепления могут исключить нужный манёвр; в этой сессии не построена полная граница controllability. Failed driver run нельзя объявлять «физически невозможно». Даже при доступном угле нельзя требовать instant yaw/velocity cancellation. Нет ESC/скрытого countersteer/усиления сцепления.

## 6. Regression/device limits

27 scripts npm check passed: старые physics/highway/handling/structure/controls/scene/settings/telemetry, steering-response/dynamics/range; app-bootstrap production DOM/renderer stubs209 RAF frames,120 NPC, release/cancel/blur/hidden/reset, modes/camera switches/prefs. Не реальный WebGL/iPhone. Трафик/камера/физика/vehicle spec/resource inventory не менялись. Никакого нового FPS не измерено, browser QA/control-browser unavailable. Имеется ручное подтверждение удобства0.14A в обычной езде/200kmh; новая внешняя зона A.1 на устройстве не проверена.

JSON/CSV и scripts лежат вZIP. Повторение:

npm run check

node tests/countersteer-comparison.mjs BASELINE_014A OUTPUT_DIRECTORY

node tests/countersteer-authority.mjs BASELINE_014A OUTPUT_DIRECTORY

Читать оба протокола, включая failures, а не только authority summary.
