# Driving Lab — доступные исследования

## C0.2 — собственная ограниченная валидация

Нового интернет-ресерча не было. Использованы исходники/предоставленное Stage B исследование и реальные driver-input engine runs. Новые данные/пределы — C02_VALIDATION_PROTOCOL, C02_CLASSIFICATION_RESULTS, DRIVING_LAB_C02_HANDOFF и evidence ZIP. Test-only frozen-state tyre relaxation probe50ms не является полным vehicle predictor. Alignment уменьшал front force, но изменениеyaw moment иногда ускоряло текущий yaw, так что alignment не признан универсальной corrective целью. Late phase heldout failures и sparse warning обосновывают отдельный ограниченный C0.3 и новую разметку до активного ассистента.

## C0.1 — актуальное исследование Stage B

Прочитан предоставленный Driving_Lab_StageB_Intelligent_Countersteering_Research_2026-10-11.zip (включён целиком в резервный архив). Особенно SIGN_CONVENTIONS_AND_AUDIT, FORCE_HYPOTHESIS_RU, DEVELOPER_SPEC_RU и VALIDATION_AND_CALIBRATION_RU. Новый интернет-ресерч не проводился. Трёхрежимные рекомендации этого исследования отменены новым решением пользователя; коэффициенты не переносились в активную помощь.

Независимые probes C0.1 подтверждают input→negative rack/yaw и alpha*Fy<0. Старые имена skid-counter/skid-wrong не являются метками физически правильной команды. Геометрическое wheel alignment, yaw damping и сохранение траектории — разные цели. Числа прошлых replay/force closure — результаты предоставленного исследователя, не новые измерения этого этапа. В C0.1 выполнены собственные sign/state/identity tests; точность всех физических моментов/реальная GR86 не утверждается.

Новая модель reference пока только geometric alignment и kinematic yaw diagnostic. Empirical stable-turn reference и candidate predictor требуют отдельной валидации; предлагаемый BeamNG-inspired UX не означает воспроизведение алгоритма BeamNG или его физики.

В этом аудите новый интернет-ресерч не проводился. Документ опирается на уже существующие PHYSICS_NOTES.md, RESEARCH_013.md и vehicle-spec.js. Ссылки ниже перенесены из этих материалов; страницы заново не открывались. Следовательно, подтверждено наличие источников и выводов в проекте, но актуальность каждой страницы на дату аудита не подтверждалась.

| Материал | Зафиксированная идея | Применение/ограничение |
|---|---|---|
| [BeamNG pressure wheels](https://documentation.beamng.com/modding/vehicle/sections/wheels/) | Шина как узлы/связи/pressure construction | Наши аналитические шины не эквивалентны; не приписывать точность BeamNG |
| [Studio397 batch tests](https://www.studio-397.com/2016/10/tyres-the-big-one-part-iii-realtime-model-batch-tests/) | Отдельный стенд шины и пакетные испытания | Нагрузки, longitudinal/lateral и combined force, а не только время разгона |
| [tTool tests](https://docs.studio-397.com/display/DG/tTool%2BRealtime%2BBatch%2BTests) | Автоматизация измерений модели | Идея для регрессий; tTool не встроен |
| [LFS report 2010](https://www.lfs.net/report-dec2010) | Дорогая исследовательская модель → дешёвое realtime приближение | Исторический материал, не описание последней версии LFS |
| [iRacing NTM V7](https://www.iracing.com/physics-modeling-ntm-v7-info-plus/) | Нагрузка, давление, температура и конструкция | Предыдущий исследователь указал проблемы прямого доступа; подробности не считать надёжно прочитанными |
| [iRacing car technology](https://www.iracing.com/car-technology/) | Измерения/CAD для параметров машины | Маркировать каждый параметр как published/measured/estimated |
| [ACC features](https://assettocorsa.gg/assetto-corsa-competizione/) | Взаимодействие шин, двигателя, подвески, электроники; звук | Используем идею обратной связи; не утверждать копирование закрытой модели |
| [Reiza development report](https://forum.reizastudios.com/threads/automobilista-2-may-2024-development-update-the-road-to-v1-6-pt1.33571/) | Удобный занос не доказывает точность шин | Управление и физику проверять раздельно |
| [Three.js optimization](https://threejs.org/manual/pages/optimize-lots-of-objects.html) | Объединение геометрии | В коде есть инстансинг/merge; FPS устройства неизвестен |
| [Toyota USA 2022 GR86](https://pressroom.toyota.com/toyota-announces-pricing-on-all-new-2022-gr86/) | Опорные параметры американской 6MT | Не смешивать рынки/комплектации и 60 mph с 62 mph |
| [Toyota global GR86](https://global.toyota/en/newsroom/toyota/36247827.html) | Размеры и компоновка | Не заменяет измеренные attachment points и tire curves |
| [Toyota UK](https://media.toyota.co.uk/toyota-presents-the-new-gr86/) | Другой регион/0–62 mph | Сравнивать при одинаковых условиях |

Технологии сейчас: buildless JavaScript + Three.js удобны для браузерной раздачи без runtime CDN и нативного билда. Это наблюдение по коду и инженерная оценка удобства итераций, а не доказательство оптимальности по CPU/GPU. Сохранять текущую архитектуру до измерений выгоднее, чем начинать миграцию без выявленного ограничения.

Мобильные ограничения из доступных материалов: DPR влияет на число пикселей квадратично, тени/число объектов стоят GPU/CPU, sensor/audio требуют разрешений/действия пользователя, нагрев требует длинного device test. Фиксированный шаг физики отдельно от рендера; telemetry renderMs — CPU submission, не GPU measurement. В текущем loop всё работает на main thread.

Пятиточечный контакт 0.13 — собственное усреднение высоты/grip, не физический протектор. Перенос веса возникает из сил узлов; значения springs/damping/CG, дифференциала и шин остаются оценочными. Температура/износ обсуждались как будущее, но не реализованы. Assetto Corsa отдельно от ACC в имеющемся RESEARCH_013 подробно не покрыта; запрос исследовать «все лучшие симуляторы» нельзя объявлять полностью закрытым.


## Узкая проверка GR86 steering —2026-10-11

[Официальный материал Toyota UK](https://media.toyota.co.uk/toyota-presents-the-new-gr86/), раздел Steering: ratio13.5:1,2.5 lock-to-lock turns. При постоянном ratio эквивалентный центральный угол450°/13.5=33.33° (наш вывод, не опубликованный individual wheel angle). Solver .57rad=32.66° оставлен. Реальные inner/outer angles и временной response рейки материал не сообщает; A.1 не заявляет их calibrated reconstruction. Расширяется только доступный пользовательский диапазон существующего solver, без изменения физических ограничителей.

## Touch Countersteering Research — прочитан в Stage A

Архив Driving_Lab_Touch_Countersteering_Research_2026-10-11.zip материализован, CRC проверен. Прочитаны DIRECTOR_BRIEF_RU/REPORT_RU/READ_FIRST/SOURCES и составevidence. Его расчёты относятся к0.13/0.14A, не кA.1; дефицит end-lock уже устранёнA.1. Полезные ограничения: раздельные finger/target/rack, timing/release source switch, hub velocities vs body beta, sign validation, полное initial state, no-zero/no-wrong-input помощь дляBalanced. Исследовательские gain.15–.30/1–3° не выбраны как новыеcoefficients. Источники/S1–S9 и исходный отчёт находятся в исследовательскомZIP итоговогоархива; внешние страницы здесь заново не проверялись, нового internet research не было. ПользовательскийfeedbackA.1 указывает наexcess/secondary skid, причинная задержка конкретного жеста без синхронногоdevice log неизвестна.
