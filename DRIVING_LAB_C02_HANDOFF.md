# DRIVING LAB — C0.2 TECHNICAL HANDOFF REPORT

2026-10-11. Stage C0.2 Shadow Experimental выполнен как диагностическая реализация и валидация. **Активная помощь не готова и не реализована.** Архитектура окончательно одна: Countersteering Assist Off/On + Strength0–100%, общая физика. Три независимых режима не создавать.

## База и сохранение

Проверена clean C0.1 `d0430ee1186f3e20112aa6cef4f7b0dcd8017d6f`, прочитаны HANDOFF/PROJECT_STATE/NEXT_TASK. До изменений создан baseline-C01.zip и защищённая ссылка baseline/C01. Рабочая ветка work/0.14A.2-C0.2. Commit b25c846 фиксирует detector/validation protocol ДО первого heldout run. Exact full freeze/final SHA и save-only receipt — RELEASE_RECEIPT.json в итоговом ZIP. Старые0.12/0.13/A/A.1/Stage B/C0.1 остаются в Git history.bundle. Стабильный liveA.1 не заменяется.

Полный ZIP:source/ с dist/tests/docs, baseline-C01.zip, history.bundle, build, evidence, исходное исследование и этот отчёт. Другому чату передать целиком; совместный filesystem не предполагается. Работающий каталог /workspace/sites/max-driving-lab. GitHub не подключался. Сохранение исходников не означает публикацию игры.

## Архитектура и изменённые файлы

JS ESM + локальная Three.js r180/WebGL; одна custom node-beam physics240/1920Hz. Controls → прежний SteeringResponse → input.steer → Vehicle.step сохраняются. driving-experience.js только дополняет observe/read-only shadow: VehicleStateEstimator → SteeringReferenceEstimator → SlipStateDetector. value не читает classifier; correction/effective strength всегда0, даже requested On100% или0%. ABS/TCS независимы. controls/physics/spec/traffic/3D/камера неизменны.

- dist/slip-detector.js: предварительная morphology/quality/episode/early warning.
- dist/vehicle-state.js: добавлены приближённые front/rear tyre yaw moments; прежние COM/derivatives/reference inputs не изменены.
- dist/driving-experience.js: наблюдение/сброс classifier, без управляющей обратной связи.
- dist/driving-diagnostics.js:18 дополнительных CSV columns, всего166; прежние148 индексов сохранены. Legacy skid_detected/skid_phase остаютсяnull; новая phase_code отдельная и предварительная.
- dist/app.js/index.html: статус версииC0.2, прежнее наблюдение и lifecycle.
- tests/slip-scenarios/contact-probe/slip-oracle/slip-validation/slip-detector/slip-lifecycle/c02-equivalence: динамические стимулы, точная test-only force probe, независимые offline proxy labels, качество/guards/identity/cadence. package.json добавляет shadow checks.
- C02_VALIDATION_PROTOCOL.md и C02_CLASSIFICATION_RESULTS.md: методология, split и все ограничения; основные project docs обновлены.

## Параметры и логика classifier

Phase codes:0 UNKNOWN,1 NORMAL,2 DRIFT_LIKE,3 UNSTABLE_SLIDE,4 RECOVERING,5 SIDE_TRANSITION. Это гипотезы наблюдаемой динамики, не намерения/ассистенты. Рулевой input не корректируется.

Берутся true COM beta/filtered betaDot, momentum-based yawRate/rDot, pose yawRate и betaDot kinetic consistency; actual rack/rackRate, geometric/relaxed tire alpha, Fx/Fy/forceLimit, load/contact. Rear alpha/rack derivatives фильтруются60ms. C0.1 derivatives40ms сохраняются. Beta entry envelope=.060+.0005*min(U,60)rad; exit ratio.75; rear slip support>.045rad либо очень большой beta. Рост beta>.060rad/s помогает подтвердить growing slide; сама yaw величина не достаточна.

Quality=min(warmup score,1−|yaw residual|/.50,1−|betaDot residual|/.12), clipped0–1; нужен>=.55. Это **не calibrated probability**. C0.1 hard guards speed/reverse/contact/load/pose/damage/collision/split grip/finite/history действуют до classifier. Недостаточная quality→UNKNOWN(reason1024); ambiguity/dwell также UNKNOWN с pending/dwell diagnostics. Ввод в фазу требует80ms, NORMAL200ms, DRIFT_LIKE300ms. Hard invalidity немедленно очищает историю episode/warning.

NORMAL: малый beta относительно exit envelope и небольшой rear alpha. UNSTABLE_SLIDE: supported deviation+growth либо большой beta/rear alpha с растущим yaw energy sign. DRIFT_LIKE: elevated slip, устойчивые betaDot/rDot/rearAlphaRate/rackRate и наблюдаемое вращение; не доказывает controlled drift. RECOVERING: уже подтверждённая episode, beta сближается, rear memory не растёт сильно, yaw dynamics совместима; не гарантирует возврат траектории. SIDE_TRANSITION: подтверждённая opposite-side slip относительно episode; phase удерживается160ms, side обновляется. В схеме нет прямого yaw/beta обнуления.

Early warning после60ms: beta сближается на исходной стороне, rack удерживается, yaw уже переходит через направление движения в сторону удержанного rack, остаётся rear slip/use. Это текущий паттерн, **не прогноз**. Может совпасть с намеренным манёвром. Коэффициенты frozen b25c846; после heldout не подгонялись.

Смена игровых режимов/reset/repair/pause/blur/hidden очищает shadow через существующий resetShadow. On/strength requested не меняетprocessor. Idle/отмена touch остаются прежними controls; новые расчёты не зависят от RAF и не питаются downsampled CSV.

## Что показали реальные engine scenarios

Подробные таблицы/протокол: C02_CLASSIFICATION_RESULTS.md. Полные JSON traces/confusion/events и logs — evidence в архиве. Начало только reset(speed)+settle; занос развивается от steering/gas/handbrake, а не подставленных beta/yaw.

Calibration44 прогона60/120km/h, heldout66 прогона90/160/200km/h с изменённым waveform, обе стороны. Heldout63360 fixed steps, invalid-known0 и зеркальные phase differences0. На1730 proxy NORMAL samples0 известных slip false alerts, но536 UNKNOWN. События: UNSTABLE34/34, RECOVERING0/14, DRIFT_LIKE0/4, SIDE_TRANSITION2/8. Recovery/drift-like качество наcalibration НЕ перенеслось наheldout. Эти фазы пока ненадёжны. Matrix также содержит неподтверждённые phase на oracle UNKNOWN, ничего не исключено ради хорошего score.

Независимая разметка — offline raw COM heading/velocity + future0.35–0.5s + contact/force/slip, не импортирует classifier и использует другие пороги. Это proxy, а не человеческий ground truth намерений/контролируемости. Семейства манёвров повторяются, поэтому heldout означает перенос на speeds/waveforms, не независимый physics dataset. Нужны независимые траектории и touch logs.

66 пар сравнений с immutableC0.1,47520 fixed steps на сторону: одинаковые nodes/beams/wheel/drivetrain/rack/skin caches и ввод; полное конечное физическое состояние/команды точно совпали, COM beta/reference также. RAF30/60/120 при одинаковом simulation-time input trace даёт одинаковую classification; это не проверка различной реальной input latency.29 прежних Node programs+5 shadow programs; production app bootstrap использует Renderer stub. Road-drop airborne и obstacle collision действительно получены в физике, invalid classifier UNKNOWN. Нет нового реального WebGL/iPhone/FPS/thermal acceptance.

## Ответы для директора

**1. Насколько надёжен Steering Reference?** Как geometric contact-direction hint в accepted near-flat geometry — согласован с exact tire-frame probe: max alpha discrepancy≈0.0508°, body-force normalized discrepancy≈8.762e−6. Acceptance3952/5280. Как steering recovery target — не подтверждён. Local frozen-state relaxation сравнение показало52 из2514 значимых moment changes в сторону текущегоyaw;2462 против. Во всех этих пробах уменьшилась front lateral force. Значит уменьшение front force не гарантирует yaw damping и тем более сохранение пути. Rear moment, inertia, desired continuation и достижимость actual rack обязательны. Probe50ms — не полноценный rollout.

**2. Какие фазы распознаются надёжно?** На этой ограниченной выборке growing UNSTABLE_SLIDE полезен; NORMAL консервативен с большой abstention. Нельзя объявить универсальную надёжность по34 зависимым/mirrored событиям.

**3. Что неоднозначно?** DRIFT_LIKE vs растущий занос/широкий поворот; RECOVERING vs краткое уменьшение beta перед дальнейшим разворотом; secondary vs намеренное изменение поворота; unknown driver desired path и stable-turn reference. Severe spins/reverse/contact/damage должны оставатьсяUNKNOWN. Reduction yawRate сам по себе ничего не доказывает.

**4. Можно ли заранее обнаружить переброс?** В heldout90km/h mild-hold двух зеркальных случаях warning был примерно150ms до raw zero crossing и250ms до opposite5°. Другие события часто пропущены; это не надёжный prediction. Контроль превышения рулевого удержания нельзя строить только на current flags.

**5. Нужен ли C0.3 до активной помощи?** Да: ограниченный short-horizon hold/unwind прогноз с tyre alpha/kappa relaxation, actual steering slew/processor lag, front/rear forces/moments и неопределённостью состояния. Сначала offline prediction-error/sign validation, затем shadow probes. Не начинать полную модель движения/большой refactor. Активную помощь блокировать до heldout improvement и проверки неверных вмешательств. Также уточнить phase/reference semantics и собрать новую разметку; подгонка порогов под текущий heldout не считается улучшением.

**6. Какие данные нужны?** Синхронные real touch/raw/target/rack/physics logs, intentional sustained drift и recoveries с ручной разметкой, сцены understeer/oversteer раздельно, varied surfaces/load/braking в той же физике, observed tyre moment/relaxation residuals и полное начальное состояние. Отдельная Research задача оправдана только для конкретного unresolved predictor/force вопроса; новый глобальный BeamNG ресерч не нужен.

## Продолжение и ручная проверка

Модель для boundedC0.3 — GPT-6.1 Sol; отдельный сложный predictor/force audit можно рекомендовать Astra. Sol — регрессии, Luna — документы. Автоматического переключения нет.

Для восстановления: прочитать START_HERE/RELEASE_RECEIPT, clone history.bundle нужной ветки, npm run check и check:shadow. dist — buildless, нужен static HTTP/HTTPS origin; file:// для ESM не подходит. Текущая стабильная URL показываетA.1, неC0.2. Не публиковать эту диагностическую сборку поверхA.1.

Когда отдельная тестовая HTTPS URL будет разрешена: iPhone landscape/Highway72/120 rolling start, pad normal turns и умеренные обе стороны skid/hold/release, pause/reset/repair/touch cancel; выгрузить60s logs с отметками намерений. correction/effective strength должны быть0 всегда. Особенно проверять UNKNOWN, phase timing и раннее warning без обещания спасения. Performance не подтверждена на устройстве.

Передать чату управления весь ZIP и этот отчёт. C0.2 остановлен; новый этап только по следующей инструкции.
