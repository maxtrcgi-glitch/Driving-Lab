# DRIVING LAB — v0.14A.1 TECHNICAL HANDOFF

Статус: точечное исправление доступного диапазона контрруления, candidate для iPhone. Новая камера B/C/D не реализована. Существующая обычная езда сохранена; полный механический угол теперь доступен на конце хода. Публикацию/commit/backup сверять с RELEASE_RECEIPT.json итогового ZIP.

## 1. База и сохранение

Published A source: 4b88fe85b9dfa81f9252c80923f66ff5ce90ab8e. Source opening workflow подтвердил ту же базу; git был clean. До изменения сохранены baseline-v014A.zip и detached checkout. Работа в /workspace/sites/max-driving-lab, branch release/0.14A.1. Итоговый ZIP содержит полный tracked source, локальную Three.js/лицензию/resources, тесты, документацию, evidence, baseline A и Git bundle с полной историей. Предыдущие резервные ZIP остаются сохранёнными отдельно; GitHub не использовался.

URL: https://max-driving-lab.maxtrcgi.chatgpt.site. Существующий owner-only доступ сохраняется. Счётчик Sites не равен номеру игры. Shared project chat не означает общий filesystem: передать другому чату ZIP и actual SHA.

## 2. Пользовательская проблема и подтверждённая причина

Max подтвердил на iPhone улучшение обычного steering A, включая перестроение на 200. При заносе полное противоположное thumb travel не давало достаточного угла. В A аналоговый speedEnvelope умножал ВСЮ кривую, включая full input: центральный/rack угол на 200 только 8.09°, front Ackermann 7.77/8.44°, хотя solver допускает central 32.66°.

0.13 pad/tilt имели full normalized command ±1 без speed envelope; mechanical limit ±0.57rad был тем же. A.1 не увеличивает mechanical limit и не меняет tire grip: возвращает доступ к нему через внешнюю часть кривой.

## 3. Изменения и параметры

Runtime логика изменена только в dist/controls.js (SteeringResponse target). dist/app.js — только version/profile/telemetry export labels; dist/index.html — version и точное описание range. package/tests/docs обновлены. physics.js, vehicle-spec.js, highway.js, models/render/camera/sound/sensors/adapters НЕ изменены.

Существующие s=abs(speed m/s), b=clamp((s-8)/48), L=.14+.86/(1+(max(0,s-8)/18)^2). Touch exponent=1+.35*b после pad precision 1.45 по умолчанию; tilt exponent=1.15+.35*b. q=abs(raw)^exponent.

Новый u=clamp((q-.45)/.55), reserve=u*u*(3-2*u), analog target=sign(raw)*(L*q+(1-L)*reserve). При q<=.45 exact прежняя карта и transient ответ при одинаковом initial controller state; q=1 даёт target=1 на любой скорости. Smooth C1 transition, монотонный, bounded/symmetric. Default high-speed onset примерно 66.5% физического хода пальца; настройки precision/travel влияют на его положение. Не общий gain increase.

Digital reserve=0, прежний диапазон сохранён. Tilt как аналоговый интерфейс тоже получает outer reserve. Параметры rate/tau/reset/neutral unchanged: increase 1.8, return 2.0, sign reversal 2.4 command units/s, tau .035+.020*b. Fixed step 240 Hz и physical rack max 3rad/s прежние. На 200 opposite full lock до 90% теперь .917s вместо .258s при прежних сокращённых lock endpoints. Нельзя говорить, что скорость поворота увеличена.

Код НЕ читает beta/yaw для steering, не определяет направление контрруля и не меняет body velocity/yaw. Test driver feedback/inverse mapping существует только tests/*.mjs, не импортируется app. Не ESC, не auto-countersteer, не скрытая стабилизация.

## 4. Реальный ориентир и неизвестное

Toyota официальный материал https://media.toyota.co.uk/toyota-presents-the-new-gr86/ прочитан: ratio 13.5:1, lock-to-lock 2.5 turns. Вычисление 360*2.5/2/13.5=33.33° даёт приближённый эквивалентный центральный угол при постоянном ratio. Это не отдельно опубликованный inner/outer wheel angle. Текущий mechanical .57rad=32.66° близок; оставлен без изменений. Individual steering geometry/rate не калибровались по реальным измерениям Toyota.

## 5. Тесты — читать все протоколы

npm run check: exit 0, 27 scripts. Новая tests/countersteer-range.mjs проверяет карты на 2001 points/mode/speed, exact old center, full analog lock 0–250, monotonicity/symmetry, digital unchanged, actual front angles через Vehicle. Сохранены старые regression/highway/control/handling/bootstrap tests. Production bootstrap использует DOM/WebGLRenderer stubs, а не real browser GPU/iPhone.

A/B limits и reversal: tests/countersteer-comparison.mjs BASELINE_A OUTPUT. На 50/100/150/200/250 central maximum A 29.94/17.30/10.82/8.09/6.79°; A.1 32.66° на всех. Front outer/inner A.1 28.32/38.33°. Эти mapping benches задают speed только контроллеру, не моделируют круг на полном угле при 200.

Midrange waveform: команды двух профилей exact equal при одинаковом raw до .55^1.45 на всех скоростях. Прежний lane-width maneuver 200/250: 3.407/3.159m unchanged.

Same-finger recovery: 36 runs, 100/150/200, beta ±10/20/35°, node yawRate ∓.45rad/s, gas .1, dry/default, 5s DT1/240. Driver finger=clamp(2*(-beta/.57+yawRate*.3)), raw pad exponent1.45. Recovery beta<3° и yawRate<.07rad/s for .5s, speed>3m/s. При 10° обе recover; positive-side times A .721/1.075/1.725s, A.1 .708/.883/.988s. Однако на 20/35 новый большой угол при той же агрессивной finger policy часто вызывает переброс/вращение; 100/20 A recovery ~1.196s, A.1 нет за 5s. Failures сохранены. Нельзя представлять A.1 как гарантированно более устойчивую при любой прежней finger policy.

Same-physical-request authority: tests/countersteer-authority.mjs, ещё 36 runs. Driver запрашивает central normalized -beta/.57+yawRate*.3; тест inverse-map каждого профиля 18 bisections. Finger positions отличаются, одинаков желаемый PHYSICAL угол. A ограничивается диапазоном, A.1 имеет нужную authority. Все выбранные A.1 states recover. Для 200/20 A не за5s и saturated5s; A.1 1.467s, peak beta27.10°. Для 150/20 A не, A.1 1.388s. 200/35 A.1 2.454s. Это возможности модельного steering с тестовым водителем, НЕ ручное принятие на iPhone. Не смешивать два протокола.

При обычной коррекции математическая идентичность доказана; новое ощущение крайнего хода требует пользователя. 250 — imposed initial speed/mapping, не утверждение о достигнутой максималке.

## 6. Физические ограничения и failure interpretation

Airborne lift5m первые .15s: нейтральный/full lock дают одинаковые x/yawRate и zero tire force. Без контакта рулём остановить yaw нельзя в этом интервале.

Zero-grip: friction tireForce=0, но старый solver добавляет load-based rolling resistance независимо от mu. Residual yaw difference ~.001486rad/s, recovery за .15s отсутствует. Это приближение solver, отмечено ROADMAP; не исправлялось за рамками задачи. Не называть mu0 bench доказательством идеальной frictionless модели.

Сильный spin/late countersteer, ущерб подвеске, недостаток свободного пространства/сцепления требуют отдельных условий. Полная physical controllability envelope не определена. Неудачный scripted run не доказывает физическую невозможность: другой timing/угол может восстановить (разницу протоколов видно в данных).

## 7. Регрессии/производительность/камеры

Старые spawns/rolling traffic/speed/density 72/120/circuit/pad/bumps, четыре камеры, menu/prefs/touch cleanup проверены существующим набором. No new deep rendering work или зависимости. Браузер/control-browser unavailable; runtime WebGL device QA, FPS и нагрев не измерены. Новых performance numbers не выдумывать. Target map добавляет scalar smoothstep без allocations и без вызовов физики.

Камера остаётся прежней inline app.js; Automatic Look/Head Physics/Stabilization/Perspective controls не созданы. Full v0.14 не объявлять завершённой.

## 8. Следующий шаг и модели

Max: reload до label 0.14A.1, IPHONE_V014A1_TEST_PLAN. Сначала подтвердить обычную езду, затем достаточность end angle и своевременный unwind; записать CSV и при возможности screen recording. Если остаточная проблема в времени поворота — отдельный bounded rate diagnostic, не увеличение чувствительности всего диапазона и не ESC.

После device acceptance перейти B Automatic Look/architecture по NEXT_TASK, затем C/D/E. GPT-6.1 Sol для локальной диагностики/камеры, GPT-6 Sol для small regression, Luna для docs/CSV; Astra только сложный воспроизведённый solver question. Переключение вручную.

Второму чату передать ZIP целиком. START_HERE → HANDOFF → PROJECT_STATE/NEXT_TASK → V014A1_VALIDATION/evidence/receipt. Репозиторий восстанавливается из history.bundle; указания в START_HERE. Источники и публикация подтверждены только когда receipt содержит succeeded и exact SHA.
