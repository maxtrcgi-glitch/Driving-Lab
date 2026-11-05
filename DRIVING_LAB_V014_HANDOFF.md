> Исторический отчёт этапа0.14A. Актуальное исправление и limitations: DRIVING_LAB_V014A1_HANDOFF.md.

# DRIVING LAB — v0.14 TECHNICAL HANDOFF

## Статус: завершён этап A, версия 0.14A candidate

Полная 0.14 не завершена. B Automatic Look, C Head Physics/Stabilization, D Perspective и E camera integration не выполнены. Текущая камера полностью прежняя; новые переключатели эффектов/FOV persistence/manual look отсутствуют. Работа остановлена в сохранённой логической точке, разрешённой заданием, чтобы не задерживать исправление steering ради визуальной системы.

## База/сохранение/архитектура

Site https://max-driving-lab.maxtrcgi.chatgpt.site, существующий доступ owner-only сохраняется. Исходники /workspace/sites/max-driving-lab, branch release/0.14. Baseline published 0.13=097aac99685f7a7a3e2846a74b595931daebc500, receipt original ZIP подтверждает deployment/storage version 12. Max лично подтвердил на iPhone spawn в потоке и начальную скорость; другие возможности не считать принятыми на устройстве.

JavaScript ES modules, HTML/CSS, локальная Three.js r180/WebGL, buildless dist/. Собственная node-beam физика 32 nodes/160 beams, основной step 240 Гц/подшаги 1920 Гц. Трафик решений 30 Гц/движения 240 Гц. Ни Unity/Godot, ни внешний physics engine, ни новая библиотека не использовались.

Перед изменением: baseline-v013.zip, tag accepted-013-before-014-20261010, detached baseline checkout. Итоговый ZIP включает tracked source, документы, тесты, evidence, полный Git bundle, базовый ZIP и полный ранее сохранённый архив 0.13. Точный новый SHA/publication status в RELEASE_RECEIPT.json (сохранён после backend result). GitHub не использовался. Другой чат получает файлы через ZIP/Sites workflow, а не предполагаемый общий доступ к памяти/checkout.

## Изменённые файлы

- dist/controls.js: steeringEnvelope и SteeringResponse; адаптеры pad/tilt/hold прежние.
- dist/app.js: единый controller, fixed-step integration, lifecycle reset, debug/export metadata и номер 0.14A.
- dist/index.html: номер/краткое пояснение steering, без новой камеры/UI overhaul.
- tests/app-bootstrap.mjs: фактическая интеграция, pointer/lifecycle/режимы/камеры.
- tests/steering-response.mjs, steering-dynamics.mjs, steering-comparison.mjs: unit/model/A-B.
- package.json: добавлены два постоянных checks (26 scripts). Comparison — отдельная команда с неизменённым baseline.
- PROJECT_STATE, ARCHITECTURE, ROADMAP, CHANGELOG, NEXT_TASK и новые validation/device/handoff документы.

physics.js, vehicle-spec.js, highway.js и рендер/модели не менялись. Tests comparison проверяет byte equality physics с исходной 0.13.

## Диагностика и параметры steering

0.13: pad непосредственно input.steer=padSteer; tilt непосредственно sensor.value; только DigitalSteering уменьшал диапазон с v. Vehicle имел rack limit ±0.57 rad и 3 rad/s, независимо от скорости. Не доказан отдельный дефект шин/подвески — они не калибровались заново.

Новый pipeline: событие → raw/interface → fixed step SteeringResponse → input.steer → прежняя рейка/физика. Для speed s=abs(m/s), b=clamp((s-8)/48,0,1): analog L=.14+.86/(1+(max(0,s-8)/18)^2). Touch exponent=1+.35*b после уже существующего pad precision=1.45. Tilt exponent=1.15+.35*b. Digital L=.85/(1+(s/13)^1.7), exponent 1.

Analog tau=.035+.020*b s; rate increase=1.8, return=2.0, opposite sign=2.4 normalized/s. Digital tau=.025, increase=.62, release=1.8. dt<=0 не продвигает state; >.08 capped. При raw target=0 и |position|<1e-5 exact neutral. Reset при clearInput (blur/hidden/pause/place). Pad release возвращает к digital neutral либо активному tilt, согласно существующему приоритету. Фильтр не меняет vehicle velocities/yaw, не реализует ESC. Это оценочные UX-параметры, не измеренная реальная рулевая рейка Toyota.

## Тесты / измерения

V014A_VALIDATION и evidence содержат полные данные. 60 A/B runs: 50/100/150/200/250 × correction/laneChange/sharp/countersteer/release/oscillation × две версии. Real Vehicle и actual bindSteeringPad, flat/default/coast, dt=1/240, 0.4 s settling +3 s. Скорость задана только при reset, затем естественно падает; 250 не означает достигнутую engine top speed.

При 200 малая correction .08 finger: central rack peak .83845°→.06143°, yaw .11959→.00910 rad/s, filtered ay 2.8698→.2269 m/s², |x|4.328→.321 m через3s. t90 new~121ms. При50 сохраняется81% центрального угла этой малой коррекции. Larger .55/.55 counter-pulse на .55s каждого знака: 3.407m lateral at200, 3.159m at250; final heading 1.426°/0.948°, max beta5.390°/5.428°. Все 60 finite/no broken beams/returned rack. Траектория не обязана автоматически центрироваться.

Big sharp .8 на200 всё ещё даёт peak beta~21°. Диагностический .65 symmetric pulse дал~10.1m x и -3.66° residual yaw. Не утверждать отсутствие заносов или гарантированно безопасный манёвр. На устройстве проверить, не стала ли точность слишком ограничивающей быстрые коррекции.

Финальный npm run check: exit 0, 26 scripts passed; включают исходные регрессии и новую controller/dynamics проверки; точный финальный exit в receipt/log. Bootstrap 209 RAF frames production composition c real Vehicle/geometry, DOM/WebGLRenderer stubs; не GPU/WebGL/iPhone запуск. Pointer release/cancel/lostcapture/blur/hidden/reset, pause/prefs, spawns, four camera switches проверены. No control-browser — screenshots и real browser QA отсутствуют.

CPU-only controller benchmark Node v24.19 linux x64: 100000 calls13.799ms, mean0.138μs/call. Не iPhone FPS/CPU budget и не физика+render. Controller не выделяет объекты per step; adapter/DOM не вызываются 240 раз/с. Новая производительность GPU/нагрев не измерены.

## Архитектура/сигналы следующей камеры (план, не реализация)

Камера пока inline app.js, eye из car.eye, orientation root.quaternion, up повторяет кузов. Текущий FOV — Three.js vertical60°, диапазон UI55–90; horizontal=2*atan(tan(vertical/2)*aspect). Положение/перспектива специально не менялись в A.

B: новый модуль automatic look с локальным velocity в basis.right/forward, yawRate и steer; speed guard/reverse guard, bounded smoothing/reset, default Off. C: независимые head spring-damper и horizon stabilization из ax/ay, vy/подвески/basis, с anti-pause accumulation и allocations control. Roll/pitch fields доступны; rollRate/pitchRate в reset объявлены, но их актуальность НЕ подтверждена — сначала проверить расчёт, не использовать нули как реальные сигналы. Vertical acceleration сейчас отдельным Vehicle field не подтверждён; вычислять с filtered velocity/подвески после диагностики. Не менять solver ради камеры.

D: проверка eye geometry/cabin clipping, aspect/FOV, default минимальные эффекты, camera prefs отдельным валидированным localStorage, height/longitudinal bounds/reset. Пока ничего из этого не реализовано. Manual gyro/touch look записан в ROADMAP v0.15+, не 0.14.

## Передача и следующий шаг

Передать второму чату этот ZIP; начать с START_HERE, этого HANDOFF, PROJECT_STATE, NEXT_TASK, receipt и validation. Координатор формирует один bounded этап с файлами/criteria; разработчик проверяет фактический SHA/dirty state, сохраняет baseline, реализует/тестирует/commit/docs/ZIP. Чаты не должны объявлять полный релиз только по названию 0.14A.

Пользователь: открыть опубликованный URL и проверить label0.14A; выполнить IPHONE_V014A_TEST_PLAN, прислать CSV/короткий отзыв по sensitivity/response. Сохранить ZIP локально/в личном хранилище. Актуальное состояние также сохранено Sites источником; это не публикация на GitHub.

Следующая модель рекомендована GPT-6.1 Sol для B. GPT-6 Sol — небольшие regressions, Luna — docs/CSV. Astra — отдельная воспроизводимая сложная задача contact/head-signal extraction при необходимости. Переключения вручную, квота Work не измерена.
