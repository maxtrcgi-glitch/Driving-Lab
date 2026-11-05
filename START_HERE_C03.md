# Driving Lab C0.3 — восстановление и проверка

Передать/сохранить целиком итоговый ZIP. source/ — полный проект с локальной Three.js/assets/tests/docs. history.bundle — все Git refs/history, baseline-C02.zip — неизменная база. prior/C02.zip — полный предыдущий архив с receipt/classification/protocol/research. evidence/ — calibration/heldout JSON, detailed branch predictions/actuals/natural traces, per-speed CSV, analysis, equivalence и check logs. build/site-C03.tar — статическая сборка для source-save. RELEASE_RECEIPT.json — проверенные final/freeze SHA и сохранённая версия; deployment=false.

## Восстановление

```sh
git clone history.bundle -b work/0.14A.2-C0.3 driving-lab
cd driving-lab
npm run check
npm run check:shadow
npm run check:predictor
node tests/predictor-validation.mjs /absolute/evidence/calibration.json calibration
node tests/predictor-validation.mjs /absolute/evidence/heldout.json heldout
node tests/prediction-analysis.mjs /absolute/evidence
node tests/c03-equivalence.mjs /absolute/base-C02/source /absolute/evidence/equivalence-C02.json
```

Для equivalence распаковать baseline-C02.zip в отдельный каталог: dist должен находиться непосредственно в указанном base source. Текущие исходники уже восстановлены в /workspace/sites/max-driving-lab, но другой чат должен использовать ZIP/Git, не предполагать общий каталог. Buildless ESM, требуется static HTTP/HTTPS origin; file:// не подходит. Для отдельного сервера dist является document root. Не публиковать поверх стабильного A.1. Здесь новая публичная тестовая URL не создана.

## Shadow API для отдельной тестовой среды

```js
const e = window.drivingLab.drivingExperience;
e.configurePredictor(true);  // только наблюдение, до30Hz
e.configureAssist(true,100); // запрос без фактической помощи
e.correction;               // всегда0
e.predictor.recommendation; // ABSTAIN/HOLD/UNWIND, НЕ команда
e.predictor.candidates[0].outputs; // HOLD50/100/200/400ms
e.predictor.candidates[1].outputs; // UNWIND
e.configurePredictor(false); // полное отключение и сброс
```

Shadow predictor не имеет настройки UI/автоматического сохранения: это временное opt-in диагностическое API, после reload сноваOff. Пользовательские прежние car/ABS/TCS/touch настройки не менялись. Assist toggle/strength active UI остаётся будущей задачей.

## Ручной iPhone test (ещё не выполнен)

Использовать отдельный разрешённый HTTPS preview. Landscape, одинаковые car/ABS/TCS/traffic/settings для сравнений; сначала predictorOff. Highway72/120 rolling-start/initial speed; track/test pad; точные small steering50/150/200kmh, full travel/release/cancel/losttouch. Никаких новых физических ассистентов/улучшений ожидать нельзя.

На test environment получить runtime log; predictorOn/Off при том же контролируемом вводе, обе стороны moderate slide, timely/late/excess countersteer. Отметить намерение/время манёвра, выгрузить60s telemetry. correction/effective strength0 для Off,On0,On100. Смотреть command/actualrack/tyre/beta/r вместе с predictions, UNKNOWN допустим; не принимать recommendation за обещание спасения. Не провоцировать экстремальные манёвры до проверки обычной езды.

Pause/resume/background/reset/repair/mode switch: predictorvalidfalse сразу после reset, no stale state; steering finger release не оставляетinput. Сравнить реальное RAF/frame physics cost и нагрев в достаточном device trial; Node median не FPS. Совместное downsample5Hz ограничивает event timing; для точного исследования нужны более синхронные raw logs. WebGL/cockpit/camera/traffic regression здесь проверена Node bootstrap с renderer stub, визуально на устройстве ещё предстоит.

Документы для координатора: DRIVING_LAB_C03_HANDOFF.md и C03_PREDICTION_RESULTS.md. Следующий этап только по новой инструкции, активную помощь пока не разрешать.
