# v0.14A.4 — техническая проверка

- `npm run check`:29 существующих программ прошли (DOM/WebGL stubs в app-bootstrap; не настоящий браузер).
- `tests/camera-rig.mjs`: точный spring шаг, знаки ±XYZ, настройки,0/+3/+6FOV, два направления drift gaze/return/reverse/stop, invalid data, rollover, rebase2000m, pause/reset/resume, recenter holdoff/manual priority, road lane/circuit seam/invalid branch, mode blends30/60/120FPS; реальные Vehicle сценарии в reports/camera-results.json.
- 9реальных физических сценариев ×3render rates: camera state совпал с tolerance1e−10. Это fixed physics240Hz, renderer CPU-only. Частоты30/60/120 — scheduling теста, не измерение FPS устройства.
- Реальный full-throttle разгон0→200:27.625s; brake200→<0.1m/s:5.9625s. Это время симуляции на штатном двигателе, без изменения параметров.
- `tests/camera-identity.mjs`:19 protected files byte-equal A33,4800full-state tick comparisons при50/100/150/200/250,оба знака steering, mode switch/resume, requested ShadowOn100, correction0, ABS/TCS identical.
- `tests/camera-clearance.mjs`:162near rays/max-offset envelope;15aspect/FOV projection cases; Static position/orientation совпали с body-fixed reference.
- `tests/app-bootstrap.mjs`:120NPC rolling start, seed repeat/randomrestart, pause/settings/all locations/held touch release, реальный UI camera toggles/persistence/reset, одновременно steering pointer77 и orbit88, camera CPU export. WebGL renderer stub.
- Старый traffic-player-identity guard включает style.css и защищает старую камеру: для этой версии его не переопределяли «pass». Новый camera-identity отдельно сохраняет actual physics/traffic/diagnostics и разрешает только UI/camera изменения. Highway dynamics unchanged. Полные A33continuity результаты сохранены в архивной baseline; не выдаются за заново выполненную матрицу.

## CPU cost (Node, не Safari)

Численные данные: reports/camera-performance.json. Legacy render-only baseline и новая система имеют разные workloads: fixed-tick seat/head/road calculations добавляются, но GPU rendering одинаков. Микробенч не измеряет FPS, heat, GPU или scene rendering.

| Component | p50 μs | p95 μs |
|---|---:|---:|
| Legacy cockpit apply | 0.341 | 2.534 |
| New fixed tick + road/fixture | 1.841 | 6.939 |
| New render apply | 0.322 | 1.452 |

4ticks+apply при60Hz: p50 sum≈0.0077ms; p95 components sum≈0.0292ms — не измеренный frame p95. Actual phone metrics нужны из runtime telemetry.

Дополнительно пройдены: UI-event continuity при DriverView→Static/horizonOff, composer localX/localZ rotation signs, независимые steering/orbit pointers и real camera CPU ring export. После исправления переходов повторены camera rig, app bootstrap, clearance и4800tick identity; physics source не менялся.
