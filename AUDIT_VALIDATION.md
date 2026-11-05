# Аудит — результаты проверки

Дата: 2026-10-10. Код игры в ходе аудита не изменён: SHA-256 всех 46 исходных файлов совпали с инвентаризацией до создания документации.

| Проверка | Результат | Граница |
|---|---|---|
| Sites get/list/deployment | 0.12 commit 6d4e55c, storage version 11, succeeded | Не запуск WebGL игры |
| npm run check, baseline012 из Git HEAD | exit 0, 21 скрипт | Node численные модели/геометрия/stubs |
| npm run check, original working013 | exit 0, 22 скрипта | WIP не опубликован и не принят пользователем |
| git diff --check | exit 0 | Whitespace, не корректность физики |
| Git bundle verify | Полная история и SHA-1, проверка успешна | Восстановление браузерного поведения не проверено |
| SHA-256 original source inventory | Все 46 файлов совпали после аудита | Только найденный checkout |

Рабочая 0.13: procedural player 46 meshes/25,456 triangles; reversal peak roll 3.2088°; highway numerical driver 3,173.33 м, max lane error 0.08474 м, 1 rebase, damage 0. В этом highway-drive трафик отключён (density=0): не выдавать поездку за проверку плотного потока.

release013 test: 120 NPC, 3 seeds, 30 секунд искусственного road-space driver для NPC на seed, minimum body gap 21.6943 м; rolling spawn max roll 0.002801° в отдельной односекундной проверке; проверки omega/gear/engine, instance capacity, tire force symmetry/budget, mixed-surface plane. Это конечная выборка условий, не гарантия любых seed/плотностей/столкновений.

Baseline highway driver: 3,173.34 м, lane error 0.08474 м, damage 0. Подробные stdout находятся в evidence/baseline-check.log и evidence/working-tree-check.log итогового ZIP.

Не выполнены: браузерный запуск, WebGL rendering QA, реальный iPhone, датчики/clipboard/audio на устройстве, FPS/GPU/нагрев, визуальное сходство модели, измерения реальной GR86. В текущем доступном наборе инструментов не обнаружен поддерживаемый control-browser; сервер preview и браузер не устанавливались.

Исследовательские ссылки в RESEARCH взяты из существующих материалов и заново не открывались. Архивы содержат исходники, локальную библиотеку Three.js и лицензию; credentials, access tokens и .git/config исключены.
