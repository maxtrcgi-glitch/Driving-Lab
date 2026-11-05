# Stage A — проверка 2026-10-11

База immutableA.1 0ef5b8db80c325e23a11827fe370e8b031bf5c24. Неизменённые ZIP и detached worktree созданы до правок. Opening Sites source workflow подтвердил тот же SHA, clean status. Stage A Experimental, не трёхрежимный релиз.

| Проверка | Фактический результат |
|---|---|
| npm run check | Exit0, 28 скриптов, включая новый driving-diagnostics |
| stage-a-baseline.mjs immutableA.1 | Exit0, 38 880 fixed steps exact output/target equality: скорости0/50/100/150/200/250, touch/digital/tilt, input cadence30/60/120 |
| Adapter A/B | Exact callback outputs/order: travel1/1.5, precision1.45/2, pointerup/cancel/lostcapture, touchcancel, reset |
| Runtime core resources | physics.js, vehicle-spec.js, highway.js, highway-world.js, world.js byte-identicalA.1 |
| driving-diagnostics | 23 поля, 120 колонок; original97 indices unchanged; no state mutation; unknown detector=null; modebaseline0/correction0 |
| Знаки наблюдений | Зеркальные lateral±4m/s при yaw0/.8/-2, beta/front direction sign symmetric; reverse/stop/front-contact validity guards |
| Буфер/export | Existing telemetry test<=602rows/60s, reset/setup/issue/copy fallback; CSV/4 column widths compatible |
| Production bootstrap | Real app/Vehicle/Three geometry + DOM/WebGLRenderer stubs; 209rendered calls, rolling120NPC, mode spawns/settings/prefs/cameras/lifecycle; new fields reach log; final bootstrap rerun exit0 |
| Existing handling/range | Прежние lane-change/countersteer-range/airborne/zero-grip tests pass; не новое доказательство комфортного recovery |
| git diff --check | Exit0 |

Главное: алгоритм SteeringResponse не изменён, Stage A не исправляет secondary skid. Проверки30/60/120 задают одинаковый fixed-step input schedule; реальные sensor/event delay/render load устройств не измерены. 250 imposed bench speed, не подтверждение top speed. Все три будущие профиля сравнительно не тестировались — отсутствуют.

Нет control-browser в этом окружении; реальный WebGL/Safari/iPhone и screenshots не выполнялись. Новые phone FPS, heat/CPU overhead неизвестны. Пользовательские тесты A.1 подтверждают обычное управление/full lock, но не Stage A. Диагностические timestamps не input-to-photon или точное время шагаphysics. Буфер10/5Hz может пропустить короткийcountersteer impulse.

Evidence check.log, baseline-comparison.json, bootstrap-final.log в итоговомZIP. Tests reproducible изsource/: npm run check; node tests/stage-a-baseline.mjs /absolute/unpackedA1/source. Final source SHA и save-only результат — RELEASE_RECEIPT.json. CRC/source hashes/Git bundle проверяются при упаковке; публикация Stage A не выполняется.
