# DRIVING LAB v0.14A.4.1 — TECHNICAL HANDOFF

**Основная ссылка:** https://max-driving-lab.maxtrcgi.chatgpt.site  
**Публикация:** подтверждена. Native version24; build `v014a41-af05b60245b5`; deployment succeeded; HTTPS и32/32HTTP ресурсов/SHA совпали.  
**Версия:** v0.14A.4.1 — Launch & Head Inertia.  
**Runtime implementation commit:** `daacb8ecde389624b22f2fd1c43b25f3fd3a51dc`.  
**Published Sites Git commit:** `8350ad1616a1e6b37317b54999a2c2c1466d785a`.  
**Контрольная A.4:** immutable tag gameplay-baseline/v0.14A.4 →79d4c7ef5f49908e2d18f53e44985dec079e18b2, native version23, site sourcefeb87fe198843e9c383397c63238816ba1c31a1a. Полный ZIP backup/baseline-v014A4.zip, SHA25646f884900f6b65b573dceb2e1c1e8594df473f092726676f17d02f9e9118cab3. Откат подготовлен, не выполнялся.

## P0 — отказ повторного трогания

Реальный физический тест A4: разгон до100, полная остановка, полный газ8s; RPM900, recovery=true, clutch≈0, drive torque0, скорость≈0. При downshift recovery ждёт закрытое сцепление, но запрещает combustion. На остановке launch требует RPM, которые без combustion не растут. В dist/physics.js изменён только выход из recovery: после окончания shiftTimer при |u|≤3m/s и connectedRPM<1900 начинается обычный launch control. Нет изменения силы шин/скорости/импульса кузова или ограничителей руления.

Legacy regression5/14FAIL, fixed15/15cyclesPASS, в том числе два последовательных GR86120-stop-relaunch, TCS/LSDOn/Off, приводыRWD/FWD/AWD, reverse и лёгкий реальный bumper collision без broken links. RWD после исправления достигает20км/ч за1.68–1.70s,≈98.6–98.8км/ч за8s. Не реализован manual transmission, поэтому его проверка невозможна. Три начальных clutch state и timed torque-cut отдельно проверены. Source guard разрешает ровно один изменённый блок physics;5760moving full-state ticks против A4 bit exact. Подробно LAUNCH_FIX_REPORT.md; JSON/графики в reports/relaunch-*.

## P1 — head inertia

В A4 данные реально доходили от seat finite-difference acceleration через40ms filter, gain, spring и offset до render transform. Но longitudinal translation≈9мм при разгоне, а устойчивый head pitch≈0: он был только от angular acceleration. Исправление dist/camera-rig.js добавляет отдельную critically damped spring longPitch2.6Hz, target−.0045×clamped actual seat longitudinal acceleration×existing gain. Никакой постоянной анимации. Accel — голову назад/взгляд слегка вверх, braking — вперёд/вниз. Общий composed pitch ограничен±3.44°, сохраняются прежние translation bounds и наблюдатель. Состояние корректно сбрасывается и плавно гасится. Default25%, storage key и существующие пользовательские настройки сохранены.

На одинаковой реальной физике Static/A4/A41 сравнение100% даёт добавку≈1.305°/2.175° при разгоне/торможении. Translation≈−8.95/+15.64мм в выбранных кадрах, прежняя. Фактический контрольный viewport844×390, ориентир80м сдвигается+7.70/−12.87px. См. HEAD_INERTIA_FIX_REPORT.md, head-chain графики и CPU perspective triptychs. Это CPU geometry projection с простой QA-дорогой, не настоящий WebGL screenshot. Заметность/комфорт iPhone ещё не подтверждены.

## Изменённые файлы и границы

Runtime: physics.js — только low-speed recovery handoff; camera-rig.js — новый longitudinal pitch и диагностические scalars; app.js/index.html — версия/название. UI переключатели/границы/хранение не переделаны. Build tool обновляет versioned fingerprint. Tests: relaunch, launch-validation, head-inertia, head-projection, head-lifecycle, camera-identity, app-bootstrap. Source identity guardphysics исключён из старого camera byte guard явно, заменён отдельным строгим проверяемым diff guard.

18защищённых модулей (controls/spec/tyres-spec/driving-experience/shadow estimators/reference/slip/predictor/trace/telemetry/sensors/world/models/course/traffic/Three) byte identical A33/A4. Physics beyond recovery block identical A4. Camera stillread-only:4800полных Vehicle ticks identity с/безcamera. Chase960exactticks противA4. ABS/TCS параметры и алгоритмы не изменены. Countersteering Assist не активен, requestedOn100 даётcorrection0; C03Shadow Predictor сохранён. Его core/guards тесты прошли, новая полная heldout prediction study не проводилась и не требуется как доказательство camera fix.

## Проверки

- npm run check:29coreprograms PASS послеP0; app-bootstrap/ui-menu повторены нафинальной версии.
- npm run check:launch: legacyfailsrequired, fixed15cyclesPASS, exactmoving5760ticks,3clutchfault-state cases.
- npm run check:camera: realVehicle0–200–0,9динамических сценариев при30/60/120FPS, settings/FOV/pause/respawn/rollover/rebase/cabin mesh guards, identity4800ticks, CPU benchmarks PASS.
- check:head:12реальныхпрогонов, sign/pipeline/Static/default horizon/Off/reset/damped convergence, CPU cockpit projections, exactChase960ticks PASS.
- check:shadow и check:predictor PASS. Нет активного steering вмешательства.
- Прежняя опубликованная A4 перед изменением: HTTPS32/32HTTP200+SHA совпали. Новая A.4.1 подтверждена: HTTPS, версия в index/BUILD_RECEIPT и32/32ресурсов/SHA; сведения в RELEASE_RECEIPT/evidence.

CPU head microbenchmarkfour240Hz steps+apply: A4p503.756µs/p956.465µs, A41p504.140µs/p956.023µs; линейная fixture, Node24, без дороги/GPU. Это не iPhoneFPS, не frame pacing/thermal измерение.

## Что проверить на iPhone

См.IPHONE_V014A41_TEST.md: проверить HUDv0.14A.4.1,10повторений80/120→полная остановка→газ100 безrespawn, TCSварианты, затем Static/DriverView100% наоднойпрямой сFOVOff, gazeOff. Ожидаются отчётливый короткий наклон при разгоне и противоположный при торможении, возврат безкачания. Повторить с25%, horizonOn, затем highway/defaultsettings. Если дефект повторился — записать видео, telemetry иsetup. Camera diagnostics включают filteredseat accel, gain, target/output pitch, offsets, safety; steering/traffic diagnostics сохранены.

## Ограничения и следующий шаг

Новый iPhone тест не проведён разработчиком; WebGL/визуальныеshaders/GPU/термальная стабильность в этой среде не проверялись. Системная камера safe gating приаварии сохраняется. Экстремальная oversteerпроблема известна и не исправляется. Автоматических ассистентов не добавлять. Следующийшаг — только оценка игрока и, при необходимости, небольшой fix по видео/telemetry.

Архив включает source/tests/docs/reports, ready build, обе Git истории, проверенный входной deployment archive и неизменную полнуюA4backup. Source finalcommit и nativepublished commit могут различаться из-за post-publication documentation; runtime hashes сравниваются отдельно. Точные SHA/versionID/buildID смотреть вroot RELEASE_RECEIPT.json.

Рекомендуемая модель для обычного follow-upfix: GPT-6.1Sol; документацию можно Luna, сложную физику Astra только по отдельному решению. После сохранения и публикации Developer останавливается.


Packaging note: сохраняются исходный helper tar.gz и распакованный tar. Все59runtime файлов совпали с build;32ресурса совпали с HTTPS ответами. Native archive сообщает другой контейнерный SHA; его wrapper не скачивался и побайтное равенство контейнеров не заявляется. Оба хеша и проверка payload зафиксированы в RELEASE_RECEIPT/evidence. Финальная документация: tag delivery/v0.14A.4.1; runtime tag release/v0.14A.4.1 не перемещён.
