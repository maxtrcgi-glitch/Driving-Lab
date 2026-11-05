# DRIVING LAB v0.14A.3 — STEERING TEST HANDOFF

2026-10-11. Experimental, ожидает iPhone feedback. Отдельная private HTTPS публикация: https://max-driving-lab-steering-a3.maxtrcgi.chatgpt.site . Stable A.1 https://max-driving-lab.maxtrcgi.chatgpt.site НЕ заменена. Доступ тестового сайта владельцу через его ChatGPT account; доступ к другим чатам передавать полным ZIP.

## База и ограничения

Полный C0.3 ZIP восстановлен, CRC/source bytes/Git/RELEASE_RECEIPT проверены. Base commit 9bf44b25273a8ad1aa1b10ec7d8b4ea185037d49; protected baseline/C03 и baseline-C03.zip. Ветка work/0.14A.3. Freeze выбранной характеристики 19603eee13ab5a2ab468372ee6ea16c8bdf3dfca до повторного heldout predictor validation. Final source commit и separate publication commit в RELEASE_RECEIPT.json; это разные репозитории, не взаимозаменяемые SHA.

JavaScript ESM, local Three.js r180/WebGL, custom shared node-beam vehicle240Hz/substeps1920Hz. Одна будущая Countersteering Assist Off/On+Strength, без трёх физических режимов. Новая характеристика — базовая эргономика, никакой автоматической помощи, steering correction/effective strength0. Shadow Predictor optional и выключен по умолчанию; алгоритм не изменён.

## Диагноз полной цепочки

Touch position → normalized pad fraction → signed abs(fraction)^precision (default1.45) → raw demand → speed/progressive shaped target → SteeringResponse.position → input.steer → physical rack → Ackermann front wheel W0/W1. Pad callback записывает raw/target без временного фильтра; app event updateInputs(dt=0) не продвигает response. Response продвигается fixed240Hz шагами; Vehicle.step следует за ним.

Основная измеренная задержка крупных перекладок — программный slew limit1.8 normal/2 return/2.4 reversal normalized units/s плюс LP tau35–55ms. Механическая rack cap3rad/s не лимитировала прежние движения (1.368rad/s peak full reversal). Между response.position и rack на стенде дополнительного delay не обнаружено; front angles отличаются геометрией Ackermann. Sensor sampling, iOS event delivery, screen scanout и фактический FPS не измерены. Arithmetic quantization таблицы15/30/60/120Hz — не device latency measurement. Существующий frame clamp80ms/max20 physicssteps не изменён; низкий FPS может увеличивать реальную wall-clock задержку при отброшенном времени.

## Изменение controls.js

Static shaping, full lock±0.57rad и точность центра неизменны. Fast envelope — smoothstep((abs(target)-.30)/.70) × smoothstep((abs(target-position)-.12)/.68), обе функции clamped0..1. Только touch/tilt, не digital и не returning. Rate плавно смешивается между legacy rate и3.4 normalized units/s; tau multiplier от1 до.8. Sign берётся только из действия водителя. Никаких state/slip/yaw/reference сигналов в steering command. Boost сохраняется при пересечении центра, но затухает при достижении target. Малый target<=.30, tracking error<=.12, digital и release используют точный legacy код. Прежний position state при переключениях сохраняется; hidden/blur/cancel lifecycle не менялся.

Исследованы legacy, selected3.4/.8, medium4.2/.65, max5.2/.5. Выбран минимальный ускоренный вариант; максимальные скорости не оказались лучше в динамике. Params copied into preallocated predictor candidate processor посредством прежнего state copying, поэтому predictor использует новый response; его исходный алгоритм byte-identical C0.3.

## Стенд задержек

140 runs:4 variants×5 speeds(50/100/150/200/250)×7 initial/final finger positions; обе полные mirror reversals. Настоящий Vehicle/rack/Ackermann, stationary actuator bench с указанной скоростью только для shaping. Это НЕ высокоскоростная дорожная проверка; отдельно360 real dynamics runs ниже. Время от принятого нового finger demand, progress от начального actual rack к установившейся цели.

Полная перекладка finger+100→−100 при200km/h:

|Параметр|A.1/C0.3 legacy|v0.14A.3 selected|
|---|---:|---:|
|rack50%|416.7ms|295.8ms|
|rack90%|862.5ms|583.3ms|
|rack within0.05° of final|1145.8ms|866.7ms|
|W0 actual angle90%|829.2ms|554.2ms|
|W1 actual angle90%|887.5ms|608.3ms|
|peak actual rack rate|1.368rad/s|1.938rad/s|

Full goal rack32.6586°, individual wheel targets28.3247°/38.3270° unchanged; opposite direction exchanges wheel timing. t100 exact отдельно в JSON, часто null в3s из-за асимптотического LP: tolerance нельзя выдавать за точное100%. Medium rack90%=487.5ms;max408.3ms, но отвергнуты после dynamics. Finger+50→−50 при200km/h: rack50%=41.7ms,90%=129.2ms, tolerance245.8ms, точно прежние. +20→−20:41.7/129.2/145.8ms unchanged. Release100→0:254.2/454.2/683.3ms unchanged. Полные таблицы всех скоростей/starting positions и цепочка в evidence/steering-latency-summary.csv, steering-latency.json/csv. Различать finger fraction и shaped demand: половинный finger при200km/h даёт маленький shaped target, поэтому acceleration там намеренно не включается.

## Динамика и выбор

360 real physics runs:4 variants×5 speeds×9 scenarios×2 signs. Straight, small correction, ordinary lane change, half/full flips, early/late/excess counter, release. Donor initial state получен настоящими gas/steer/handbrake действиями, не injected beta/yaw; full Vehicle nodes/wheels/tyres/rack/filters restored identically before each variant. Старый SteeringResponse exact A.1/C0.3 class сохранён как LegacySteeringResponse; A.1 physics byte-identical C0.3.

Straight/small correction/ordinary lane change checkpoints(command/rack/beta/r/x/z) bit-exact для всех variants50–250km/h. Нет изменения нормальной чувствительности. По30 skid cases/profile recovery proxy(beta<3°,abs yaw<.1rad/s,forward speed>3m/s sustained.3s): legacy6,selected8,medium6,max6. Это proxy, не доказательство безопасной траектории. Opposite-side episodes proxy(>3°, только forwardU>3 и absbeta<.8rad для исключения spin/angle wrapping): legacy2,selected14,medium18,max18. Ускорение повышает риск переброса при удержании ошибочной команды — существенное ограничение.

Early counter100km/h sign+: legacy maxbeta78.5°,не восстановился;selected28.7°,recovery1.40s;medium148.3°,max179.9°,не восстановились. Early50km/h recovery1.07→1.30s (ухудшение). Excess holding opposite full1.8s на150–250km/h selected достигал≈180° spin вместоlegacy≈67–76°: помощника, скрытого damping или гарантии спасения нет. Высокоскоростные severe cases не восстановились и с ускоренным рулём. Выбор не основывался на одной метрике; нужен реальный closed-loop iPhone feedback.

## Проверки и shadow predictor

29 existing Node test programs,5 Shadow,1 predictor, fast actuator suite,360 dynamics, trace ring/UI bootstrap passed. App bootstrap использует RendererStub, не реальный WebGL. A3 equivalence12 pairs8640ticks per side: requestedOn100/Off100/On0 и predictorOn/Off identical actual controls/rack/fullvehicle/ABS-TCS/state/slip при новой ergonomics,30/60/120 simulated render cadence, signs/reset. Legacy equivalence24pairs17280ticks per side явно подключает frozen LegacySteeringResponse; это не заявление exact steering identity нового и прежнего response. Protected physics/spec/state/reference/slip/predictor/traffic/world/model bytes equal C0.3. Camera code app unchanged вне version/trace/download wiring.

Predictor rerun SAME frozen C0.3 heldout families/speeds110/180/220 для paired regression нового processor, без tuning. Не новый независимый model acceptance holdout.96 snapshots,92 accepted,4 rejected,92 exact duplicate HOLD full-state replays,184 action branches/horizon:

|Horizon|beta MAE/RMSE/max deg|yaw MAE/RMSE/max rad/s|
|---|---|---|
|50ms|.014581/.043075/.274966|.005078/.014207/.090652|
|100ms|.038930/.108086/.678011|.010489/.027911/.163702|
|200ms|.149133/.346007/1.872136|.031124/.064843/.288638|
|400ms|.813933/1.558845/6.574743|.084567/.144969/.525869|

400ms forecast ranking:84 ambiguous,4 UNWIND advantages,4 HOLD advantages matched branch oracle. Runtime conservative gating abstains86/92 accepted;4 invalid also no recommendation. Краткий forecast ranking не равен runtime advice. Старые C0.3 scores исторические и НЕ валидируют A3. 400ms errors выросли; active assist всё ещё не разрешён/не готов. Node predictor warm median1.4067ms,p951.9172ms/call на текущем host, не FPS/температура iPhone. Полный predictor measurement/branch data в evidence/heldout.json,C03_analysis.json,prediction-errors-by-speed.csv и logs.

## Диагностика и файлы

Changed dist/controls.js (selective response), new steering-legacy.js, steering-trace.js; app.js/index.html (version/trace export/label), driving-diagnostics.js (stage metadata). New tests fast-steering,fast-steering-dynamics,a3-equivalence,steering-trace,package-steering-test; legacy c03-equivalence explicitly uses frozen processor, app-bootstrap updated. No tyre/suspension/traffic/camera algorithms changes.

SteeringTrace preallocated2400×12 Float64 values (~230KB),120Hz,20s ring. No capture allocations/feedback. Pause menu Steering trace ·20s exports CSV with sim time,car time,touch fraction,raw,target,position,rack/W0/W1,speed,yaw,handler_age. car_t identifies resets. Handler age — accepted callback-to-CPU sample; НЕ sensor-to-display latency; several physics samples can occur within one render batch. Existing shadow186-column CSV preserved. Pausing preserves trace; mode/reset diagnostics unchanged.

Build cache: separate origin + moduleDirectory modules/v014a3-913f07a6b2d0, SHA256 fingerprint ALL21 JS module bytes; entry and relative imports versioned together, CSS query. No service-worker dependency. BUILD_RECEIPT and served-assets evidence specify deployed bytes. Deployment success alone не означает iPhone/WebGL success.

## Передача/дальше

Один ZIP содержит source,history.bundle,protected baseline,originalC03 full ZIP,evidence,ready build,receipt,this HANDOFF and iPhone test instruction. Source git restore: git clone history.bundle local-dir; checkout final SHA изreceipt, baseline/C03 доступна. dist/index.html требует static HTTP(S) server, не file:// ESM; ready build содержит local Three.js и ресурсы. Не публиковать на stable Site автоматически. Test-site repo имеет собственную identity; canonical source archive сохраняется без stable deployment.

Следующий шаг только после Max iPhone feedback + steering trace. Сравнить ordinary control, fast full reversal, over-hold risk, actual handler/command/rack delay. Не начинать active assist/camera/traffic. Модель GPT-6.1 Sol для анализа/ограниченного tuning; GPT-6 Sol regression; Luna документация; Astra только отдельная сложная force/transient задача по решению пользователя. Автоматического переключения моделей нет.
