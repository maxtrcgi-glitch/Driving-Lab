# DRIVING LAB v0.14A.4.2 — TECHNICAL HANDOFF

Основная ссылка: https://max-driving-lab.maxtrcgi.chatgpt.site
Публикация подтверждена: native version25, build `v014a42-5e80bbad66f5`,33 HTTPS ресурса совпадают. Source runtime `5d7bc6f99bfebaf75832117e3804d2ccdba4881c`; native commit `e4f66b160963b51d5c422899ae910610c1e68faa`. Точные IDs и rollback — RELEASE_RECEIPT.

## Статус

A.4.1 является неизменяемой базой: commit045763b78112d7850df61594ed39b18bc9dc523b, tag gameplay-baseline/v0.14A.4.1. P0 повторного трогания подтверждён исправленным игроком на iPhone по сообщению Director. A.4.2 меняет только DriverView head/gaze калибровку и UI. Экстремальный занос по-прежнему известное ограничение.

## Реализация

Новый camera-profiles.js: независимые Reference/Natural/Strong для головы и взгляда. CameraRig сохранён как единственный владелец позиции/orientation/FOV. Существующие read-only seat acceleration/body velocity источники и Road preview не изменены. Head: отдельные acceleration/braking gains, onset component, hold and release, увеличенные мягкие display caps; lateral/vertical реакции прежние. Gaze: отдельная road contribution и velocity beta correction; filtered beta, hysteresis, confidence, limits по yaw/rate/acceleration. Reference сохраняет A.4.1, современная амплитуда не подавляется прямой дорогой.

UI: Settings → Camera. Head Preset и Gaze Preset выбираются независимо; old Head intensity сохранён, новый Gaze intensity0–100% и max10–25°. Live changes плавно меняют параметры без reset. Ключ localStorage сохранён; настройки пользователя не сбрасываются. Defaults Natural, head25%, driftOff, gaze100%, max25°.

Изменённые runtime файлы: camera-rig.js, camera-settings.js, app.js, index.html; добавлен camera-profiles.js. Физика и исправленная трансмиссия, Steering Response/Touch shaping, tyres, traffic, damage и Chase не меняются.19 protected files byte identical, все physical writes отсутствуют.

## Проверки и данные

CAMERA_FEEL_CALIBRATION_REPORT.md содержит параметры, измерения и ограничения. reports/camera-calibration.json:108 actual Vehicle runs и fixture transfer tests. reports/camera-calibration-response.json:21 measured gaze transitions. reports/camera-calibration-safety.json:68 checks of FPS/caps/intensity/reverse/stop/contact/damage/sign/switching. Reference2880ticks exact, Chase960ticks exact; Vehicle full-state equality each tick.702 mesh rays no near obstructions. UI/bootstrap checks live independent persistence. New check: npm run check:calibration; existing npm run check, check:camera and check:head.

Достоверно измерена амплитуда фактической Three camera, а не только targets. Node CPU benchmark отдельно, не телефон FPS. В отчёте и PNG явно разделены actual physics / constant-signal fixtures / CPU geometry projection. Safari/WebGL/browser screenshots недоступны. Комфорт и заметность пока не подтверждены на iPhone. Strong braking имеет большую angular acceleration: надо оценить вручную.

## Передача и следующий шаг

Один All-In-One ZIP содержит исходники, Git bundles, ready static build, предыдущую A.4.1 rollback copy, тесты/отчёты/PNG, publication evidence и RELEASE_RECEIPT. Source development history и native Site history отдельные; SHA их коммитов не взаимозаменяемы. Полный original A.4.1 архив сохранён отдельно, его исторические вложенные ZIP не копируются рекурсивно.

Следующий шаг — IPHONE_V014A42_TEST.md. Остановиться до решения Director. Не исправлять физику или экстремальное скольжение в ходе camera calibration. GPT-6.1 Sol подходит для ограниченного исправления по видео; Luna — документация; Astra не требуется без новой сложной задачи.
