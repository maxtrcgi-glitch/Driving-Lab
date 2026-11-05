# DRIVING LAB — C0.3 TECHNICAL HANDOFF REPORT

2026-10-11. **C0.3 Shadow Experimental сохранён; активный Countersteering Assist не реализован и пока не готов.** Одна физика, один будущий Assist Off/On + Strength0–100%; три режима отменены. Стабильная опубликованная A.1 не заменяется. Следующая работа только по новой команде.

## Восстановление и архитектура

C0.2 full ZIP восстановлен из сохранённого файла:126 entries, CRC passed, SHA256 df80a83e5f80d3fa1232a1537bb27e81d72898a2a8a4e4a5d9dcab1c18708143. RELEASE_RECEIPT b7dc54da1c674a1f40e913a2defe81bfeb9eeadf совпал с clean Git и всеми103 source files. Старый history.bundle verified. Baseline/C02 и baseline-C02.zip созданы до правок. Ветка work/0.14A.2-C0.3. Protocol freeze ada44c6; predictor freeze01fad81dac9e6047172a41e1531d9eb42ed3e40c до первого нового heldout. Final SHA/source-save IDs в RELEASE_RECEIPT.json итогового архива; не угадывать их по этому документу.

JavaScript ESM/buildless dist, локальная Three.js r180/WebGL, custom node-beam Vehicle240Hz,8 substeps/1920Hz, одна физика шин/подвески. Input → прежний SteeringResponse → Vehicle.step. Observe после физики/контактов: неизменные VehicleStateEstimator, geometric SteeringReferenceEstimator, SlipStateDetector; отдельный optional BoundedSteeringPredictor. Ни один shadow result не читается value/input.steer. correction/effective strength всегда0 при Off/On100%/On0%. ABS/TCS самостоятельны.

## Реализация

- dist/steering-predictor.js: отдельная плоская четырёхколёсная модель, два кандидата HOLD/UNWIND и четыре горизонта. Не клонирует nodes/beams в игре. Включение только drivingExperience.configurePredictor(true), полное отключение(false); по умолчаниюfalse, максимум30Hz. Предварительная recommendation ABSTAIN/HOLD/UNWIND — диагностический вывод, не команда. State guards и дополнительные flat/inconsistency gates; invalidity/reset очищает результат.
- dist/driving-experience.js: lifecycle/optional observation, штатный steering value не менялся. Mode simulation — внутреннее legacy имя, не продуктовый профиль.
- dist/driving-diagnostics.js:20 appended numeric fields,186 columns; все прежние166 индексов сохранены. Enabled/valid/reasons/decision и HOLD/UNWIND beta/yaw на50/100/200/400ms. Решения0 abstain,+1 unwind,−1 hold. CSV/4 остаётся; поля могут отставать до33ms, export5Hz пропускает короткие события. Никакой скрытой силы/прямого yaw/V reset.
- app.js/index.html: только обозначение версии C0.3/telemetry filename. Camera/graphics/traffic/models/controls/physics/spec/state/reference/slip алгоритмы не изменены.
- tests/full-state,prediction-scenarios,prediction-oracle,predictor-validation,prediction-analysis,predictor,c03-equivalence: новые split/proxy/replays/errors/cost/identity/guards. Package check:predictor; тесты telemetry/bootstrap обновлены под новую schema/version.

## Сигналы и параметры

True COM U/V/beta, betaDot/kinematic residual, r/rDot/pose residual и world acceleration; фактический rack; all chassis-node yaw inertia; wheel geom/relaxed alpha/kappa/omega/toe/force/load/grip/driveTorque/ABS factor и axle contact moments через Fx/Fy. Геометрический reference не является steering target и не участвует в кандидатах.

HOLD повторяет текущую adapter demand (после pad curve, до SteeringResponse). UNWIND линейно уменьшает её до0 за200ms. Оба используют копию существующего SteeringResponse с текущими position/target/raw/mode, полным lock±.57rad и mechanical slew3rad/s. Ввод игрока/характеристика touch не изменены. Нелинейность означает, что raw unwind не даёт линейный rack unwind; обе реальные/прогнозные ветви учитывают это одинаково.

Planar integration1/1920s; true tyre law, relaxed alpha length.30m/kappa.25m и combined-slip, spin1.25kg·m², frozen drive torques/load, existing brake/ABS/TCS torque approximations. Hub and measured acceleration residuals decay40ms, capped±6m/s²/±3rad/s²; betaDot участвует в consistency gate, не отдельный произвольный yaw stabilizer. No future suspension/node/driveline/terrain/contact predictor. Scalar brush duplicate tested exactly against tireForce360 combinations. Preallocated objects, no explicit allocations each predictor substep.

Decision at400ms requires countersteer evidence |beta|>.05, rack*beta>0; superiority margins beta.045rad,V.7m/s, yaw tolerance.07rad/s,path tolerance.35m. Ambiguity → ABSTAIN. Эти параметры не calibrated safety bounds; не использовать для активной помощи. Reason1 invalid state,2 nonplanar/inconsistent,4 nonfinite,8 no countersteer evidence,16 no decisive comparison. Default disabled is intentional.

## Испытания и выводы

C03_VALIDATION_PROTOCOL/C03_PREDICTION_RESULTS и evidence содержат полную методологию/цифры. Новый frozen family split: calibration80/140 четырёх stimulus families; heldout110/180/220 четырёх других families, обе стороны, snapshots1.25/1.60/1.95/2.30s. Реальный stock engine reset+settle и steering/pedal stimulus, без вставленных beta/yaw. Snapshot сохраняет весь enumerable Vehicle со всеми nodes/beams/wheels/drivetrain и aliases; terrain один неизменный flat callback, skin caches rebound; processor/state/reference/slip histories восстановлены.94 accepted heldout snapshots,94 exact duplicate HOLD replays. Это точные offline counterfactual ветви в данной сцене; live runtime модель остаётся приближением.

Heldout beta MAE50/100/200/400ms:0.0106/0.0290/0.118/0.677deg; max0.0522/0.185/0.901/4.047deg. Yaw MAE0.00348/0.00879/0.0275/0.0790rad/s; max0.0212/0.0808/0.209/0.467. На400ms residual V max3.346m/s. Данные по скорости/branch/path/rack в CSV/JSON.

HOLD хуже UNWIND по независимому multi-signal proxy8 случаев — все8 распознаны; HOLD лучше6 —4 распознаны,2 abstain;80 ambiguous —все abstain. Это всего4 mirrored improvement cases. Рекомендации12/94; abstain82/94=87.23%, включая2 invalid no recommendation84/96=87.5%. На50–200ms decisive outcome proxy не возник. Opposite endpoint200ms8 TP/400ms14 TP, без FP/FN на этой маленькой выборке. Natural trace advantage signal появился350–400ms до10 opposite3deg events, C0.2 warning молчал. Это не доказательство безопасного предотвращения: earliest signals не все counterfactually проверены, intention/desired road path неизвестны.

UNWIND может ухудшить dynamics:180 opposite-flick early snapshots; позднее в том же манёвре лучше unwind. Самая большая ошибка — brake-turn110/180 при prior brake transient/neutral raw; frozen brake/load/drive dynamics недостаточны. Причины предположительные по устройству модели, нужна отдельная абляция. Хорошая endpoint ranking на этой выборке не снимает ошибки400ms.

Old detector не подгонялся: future proxy RECOVERING часто ещё имеет текущую growing beta (56/70samples); DRIFT plateau proxy мягче instantaneous steady guard (8/10betaDotreject); SIDE потеряла episode после invalidity (62/266invalid,70noepisode). Overlapping diagnostic counts не causal event decomposition. Старые misses0/14,0/4,2/8 сохраняются.

24 identity pairs/17280 ticks per side точно совпали с C0.2 по issued commands/rack/full physics/state/slip/ABS-TCS. RAF30/60/120 при одинаковой simulation-time trace; On100/Off100/On0, disable/reset проверены.29 legacy+5 shadow+1 predictor Node programs passed. Реальный road-drop265invalid ticks/collision120invalid ticks; no actuation. Browser bootstrap uses renderer stub; WebGL/iPhone/FPS/thermal/touch latency НЕ подтверждены.

Node warm-call median1.415ms,p95 2.772ms, heldout median1.361,p95 1.880;6144 tyre evaluations per comparison,30Hz host median≈42msCPU/s. Это не smartphone performance. Нужны device profiling и возможность снизить sampling frequency отдельно от физики.

## Ответы и продолжение

Ограниченный прогноз перспективен для диагностики направления/сравнения действий, особенно<=200ms. Достоверности для активного ассистента пока недостаточно:400ms errors, невалидация early recommendations, малая dry-flat выборка, отсутствует uncertainty calibration и driver-intent path. Следующий ограниченный Shadow эксперимент: причинная абляция brake/drive/load evolution, полный replay earliest advantage snapshots; новые заранее frozen heldout speeds/surface/pedals/wrong-input scenarios. Не менять detector по старому heldout; не включать помощь.

Рекомендуемая модель следующего этапа GPT-6.1 Sol; отдельный сложный force/inertia audit — Astra по решению пользователя, routine regression Sol/documentation Luna. Автоматического переключения нет.

## Передача и ручные действия

Передать второму чату ОДИН полный ZIP. Внутри source/dist/tests/docs, history.bundle всех сохранённых refs, build tar, evidence, RELEASE_RECEIPT, baseline-C02.zip и полный исходный C0.2 архив с receipt/research/evidence. Сохранить ZIP также на собственном устройстве. GitHub не подключался, новая версия сохранена без deployment. Не предполагать filesystem sharing между чатами.

Восстановить: git clone history.bundle -b work/0.14A.2-C0.3 <new-directory>; прочитать receipt/HANDOFF/NEXT_TASK; npm run check,check:shadow,check:predictor. Для equivalence передать распакованный baseline-C02 source. Для calibration/heldout/report generation команды в START_HERE_C03.md. dist готова для static HTTP/HTTPS, file:// ESM не подходит. Стандартная live URL продолжает показывать A.1, C0.3 там нет.

iPhone: сначала отдельная тестовая HTTPS среда, не стабильный URL. По умолчанию прогноз Off; Highway rolling-start72/120,50/150/200kmh normal pad corrections и обе стороны moderate skid, release/cancel/pause/reset/repair/mode switch. При запросах On100/On0/Off одинаковый steering; effective correction0. Shadow on/off лишь после подключения configurePredictor diagnostic API; сравнить CPU/frame telemetry, остановки и reset,60s log экспорт/сбор raw touch и намерений. Не ожидать улучшения управления — этот этап ничего не корректирует. Подробно START_HERE_C03.md. После C0.3 остановка.
