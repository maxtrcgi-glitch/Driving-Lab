# DRIVING LAB — TECHNICAL HANDOFF REPORT

Дата: 10 октября 2026. Этот отчёт подготовлен для второго чата-координатора. Он основан на чтении реального кода/Git/diff и ответах Sites, а не только на переписке. Во время аудита игра не дорабатывалась и не публиковалась.

## 1. Главный результат

Исходники найдены: `/workspace/sites/max-driving-lab`. Это многофайловый статический браузерный симулятор на JavaScript ES modules, HTML/CSS, локальной Three.js r180 и WebGL. Нет Unity/Godot/Babylon.js; физический движок написан непосредственно в проекте. Файлы `dist/` редактируются напрямую и раздаются без сборки. `package.json` содержит тестовый runner, без зависимостей приложения через npm.

Последняя сохранённая/опубликованная игра — **0.12**, Git `6d4e55cb4a41d8f2c057ea2646d42af125c4162d`. Sites называет сохранённую версию **11** — это другой счётчик. В рабочем дереве найдена **незавершённая 0.13**. Не смешивать её наличие в файлах с опубликованной игрой.

Адрес: https://max-driving-lab.maxtrcgi.chatgpt.site

Sites project_id: `appgprj_6ac3ab6964a8819180ced6a4738c6759`.
Saved version: `appgprj_6ac3ab6964a8819180ced6a4738c6759~appgver_8f302b18f2788191b1f658d9b40f1e79`.
Deployment: `appgdep_6ac926aca58c81918617f689969b64fc`; сервер подтвердил succeeded. Архив Sites: 20 файлов, 2,170,880 байт; provenance совпадает с baseline Git. Это проверка сохранённой публикации, не браузерная поездка.

## 2. Устройство и файлы

| Файл | Роль |
|---|---|
| dist/app.js | Главный loop, сборка компонентов, UI, камеры, звук, localStorage |
| dist/physics.js | Node-beam Vehicle, подвеска, аналитические шины, трансмиссия, контакты, повреждения |
| dist/vehicle-spec.js | Опорные данные 2022 US GR86 6MT, отдельные оценки |
| dist/course.js | Трасса, elevation/terrain, barriers и spawns |
| dist/highway.js | Шоссе, traffic following/lane change, столкновения NPC с игроком, floating origin |
| dist/world.js, highway-world.js | Three.js сцена, lighting/materials, chunks/instances |
| dist/gr86-model.js | Процедурная реконструкция купе/колёс/кокпита |
| dist/controls.js, sensors.js | Pad/pedals/keyboard/tilt permissions и filters |
| dist/telemetry.js | Последние 60 секунд и CSV/clipboard/export |
| dist/index.html, style.css | Меню, HUD, настройки |
| tests/*.mjs | Численная/геометрическая проверка и stubs событий/DOM |

Физический шаг 240 Гц, структурные подшаги 1920 Гц, всё на main thread. 32 узла: 28 кузов/крыша и 4 ступицы; 160 связей. Балки имеют elasticity/damping/plastic yield/breakage. Подвеска — сокращённые links/struts, stabilizers, travel stops и боковой carrier guide; измеренной геометрии GR86 нет. Body pose восстанавливается из узлов; deformation skin использует их перемещения.

Шины аналитические combined-slip, load sensitivity/relaxation и вертикальная penalty spring. Это не BeamNG pressureWheel. Давление/нагрев/износ отсутствуют. Кузов/препятствия используют грубые узлы/капсулы/круги, не полный triangle contact или CCD. Двигатель, flywheel, clutch, gear ratios 6MT, автоматический водитель сцепления/переключений, ABS/TCS/LSD — приближённые. UI RWD, TCS default off. Часть чисел опубликована Toyota, остальные — estimates; модель не валидирована против настоящего автомобиля.

Loop: ввод → NPC step (на highway) → Vehicle step → collisions → rebase → обновление кузова/камеры → renderer.render → telemetry/HUD. Камера не передаёт силу решателю. Pause/hidden прекращают физические шаги и освобождают ввод. RAF delta ограничен 80 мс, максимум 20 шагов за кадр; измерение renderMs отражает CPU, не GPU.

## 3. Существующие функции

Режимы: Handling Circuit 2.077 км, test pad со slalom/skidpad/braking, bump lane, endless highway. Четыре камеры: cockpit/chase/hood/orbit. Touch pad с относительным рулением и proportional pedals, handbrake, tilt с разрешением/калибровкой, keyboard. Английский интерфейс, pause/settings, reset/repair, fullscreen request, slow mode, wet surface/config controls. Синтетический Web Audio: engine/wind/tire scrub.

Highway: шесть полос, встречные/попутные NPC, seed-based плавная дорога/высота, following/headway rules и перестроение 3.5 с. Восьмичанковое окно по 200 м, rebase примерно каждые 2 км, recycling cars. NPC planar rigid approximation, импульсы с игроком; повреждённые NPC скользят, не возвращаются сразу к follow path. Нет полноценного NPC–NPC crash solver, опрокидывания/подвески/soft body NPC. В 0.12 плотности 0/18/28/42.

Графика: Three.js standard/physical materials, directional+hemisphere light, 1024² PCF shadows, ACES/sRGB, fog. Car/traffic/scenery процедурные. Оpaque details объединяются по материалам; repeated scenery/traffic инстансируются; удалённая геометрия освобождается. Импортированной лицензированной GR86 нет. Сходство кузова пользователь пока не принял.

localStorage сохраняет vehicle.config (`driving-lab-nodebeam-v010`). Телеметрия в памяти: около 10 Гц capture/5 Гц export, последние 60 с, issue marks и события. Она теряется после reload/закрытия. Manifest даёт standalone browser app; нативного билда и service-worker offline нет. Нет cloud saves, multiplayer/open world/Nordschleife.

## 4. Последняя прерванная сессия

Подтверждено через Git status/diff: изменены 10 отслеживаемых файлов; RESEARCH_013.md и tests/release013.mjs не отслеживались. Незавершённая 0.13 содержит nearby spawn, старт со скоростью лидера, согласованные wheel omega/gear/engine omega, плотности 72/120 и увеличенные instance buffers, пять проб поверхности, настройки pad travel/precision, графические profiles DPR/shadows, asphalt texture/environment и изменения геометрии купе.

Ранее обещанное «старт в потоке уже готов в 0.12» не подтверждается baseline: rolling spawn обнаружен только в diff 0.13. Источник причины прерывания (лимит/ручная остановка/ошибка процесса) технически недоступен. По истории пользователь обсуждал лимиты; нельзя выдавать это за доказанный runtime факт. Старый README устарел в заголовках; новые документы разделяют baseline/WIP.

Ресерч прошлой сессии реально существует в RESEARCH_013.md. Это обзор открытых документов, не запуск сравниваемых симуляторов; содержит ограничения доступа для части iRacing/ACC материалов. В аудите новый масштабный ресерч не проводился.

## 5. Что проверено и что не проверено

См. AUDIT_VALIDATION.md для результатов npm run check по отдельным снимкам. Эти команды исполняют численные модели, геометрию и stubs, не WebGL/Safari gameplay. На iPhone разработчик не ездил, FPS/GPU/нагрев и subjective feel не проверены. Подтверждён succeeded deployment и полный local Git bundle. ZIP-снимки и SHA-256 inventory сохранены отдельно. Никакие исходники не были отправлены в новый внешний GitHub/сервис, публичный доступ не изменялся.

Критические ограничения: незакоммиченный WIP мог потеряться; нет измеренной tire/suspension calibration; 0–60 mph численно ~7.76 с против сохранённого Toyota claim 6.1; старая форма GR86 не принята; 120 NPC и O(N²) соседские переборы на 240 Гц не имеют device budget. Новые graphics/pad settings в WIP не сохраняются. Старт на уклоне не задаёт сразу pitch/vertical velocity и требует проверки settling. Ограниченный spawn search не имеет явного отказа при исчерпании попыток — потенциальный крайний случай, не подтверждённая авария.

## 6. Сохранение, доступ и восстановление

Локальный Git доступен, до аудита 12 коммитов. `git remote -v` пуст; GitHub не подключён/не подтверждён. Sites подтвердил сохранённый commit+deployment archive; endpoint source repository и удалённый fetch в этом аудите не проверялись. Для следующего рабочего чата с доступом Sites открыть существующий source через Sites skill по project_id, не создавать новую Site. Если нет доступа — восстановить переданный архив.

Комплект `Driving_Lab_Audit_2026-10-10.zip` содержит `baseline012/` (последняя опубликованная исходная версия), `working013/` (неизменённый WIP на момент аудита), `history.bundle` (Git history, включая документацию аудита), `unfinished-013.patch`, SHA-256 inventory, `docs/`, исходные research notes и журналы проверок. Patch не включает изначально untracked файлы; они находятся в working013/.

Историю можно восстановить `git clone history.bundle driving-lab`, затем использовать baseline SHA в отдельной ветке. Для WIP проще взять working013 целиком в отдельную папку; не накладывать patch на неизвестное состояние. Восстановленный ZIP не содержит секретов/credentials/.git config. `history.bundle` содержит tracked history. Между моделями передавать source archive + exact commit/status + NEXT_TASK, а не только переписку.

Другой чат внутри проекта не доказанно имеет общий filesystem. Этот чат получил доступ к найденной папке; второй должен проверить отдельно. Для гарантированной передачи Max прикрепляет архив или даёт доступ к существующему Sites, вместе с отчётом. Политика срока жизни локального окружения не проверена. Закрытие чата/лимит не доказывают удаление опубликованной версии, но незафиксированный прогресс нельзя считать устойчивым хранилищем.

## 7. Запуск

Node.js: из корня `npm run check` (установка зависимостей не нужна для текущего package.json). Для локальной игры: `python3 -m http.server 8000 --directory dist`, затем http://localhost:8000 на том же компьютере. `file://` не использовать для ES modules. Эта инструкция вытекает из статической структуры; браузерный запуск в аудите не выполнен. Для tilt на реальном телефоне использовать опубликованный HTTPS адрес в Safari с пользовательским действием разрешения. Открывать опубликованную игру отдельно от working013 локальной.

## 8. Организация работы

Координатор — архитектура, приоритеты, выбор модели и bounded task. Разработчик — код, воспроизводимые тесты, commit/archive/docs. Перед каждым этапом прочитать PROJECT_STATE/NEXT_TASK и git status; сохранить WIP; последнюю принятую сборку не удалять. После этапа обновить CHANGELOG/PROJECT_STATE/NEXT_TASK и сделать отдельный проверенный commit, затем source sync/backup согласно разрешённому заданию. GitHub использовать только после явного выбора пользователя, предпочтительно приватный repo.

Полуавтоматический backup возможен: скрипт ZIP текущих файлов + git bundle + checksums после acceptance, затем подтверждённое сохранение артефакта. В этом аудите создан разовый комплект; регулярная automation или hook не настроены, автопубликация не включалась. Полностью unattended backup пока не подтверждён.

Рекомендуемый ближайший этап — выделить старт в потоке из WIP отдельно от шин/кузова/120 NPC. NEXT_TASK описывает файлы и acceptance. Затем плотность/производительность, контакт шин, управление, GR86 asset и графика отдельными итерациями. Миграция движка/worker/WASM — только после profiling.

Модели по рекомендации Max: GPT-6 Astra — сложная архитектура/физика; GPT-6.1 Sol — основной код/сложные технические задачи; GPT-6 Sol — стандартные исправления; GPT-6 Luna — рутина/документация. Это не автоматическое переключение; расход заранее не гарантировать, Pro не предлагать. Если требуется другая модель, сообщить до задания.

Задание разработчику: версия+SHA+архив; одна цель; допустимые файлы; checks/acceptance; ограничения; нужна ли публикация. Ответ координатору: реализация/commit; реальные результаты checks; device unknowns; обновлённые документы и NEXT_TASK; ссылка на backup. При расхождении истории и кода приоритет у проверенного source state.

## 9. Документы и действия Max

Созданы в корне проекта: PROJECT_STATE.md, ARCHITECTURE.md, ROADMAP.md, CHANGELOG.md, RESEARCH.md, NEXT_TASK.md, TECHNICAL_HANDOFF_REPORT.md и AUDIT_VALIDATION.md. Копии — в docs/ итогового архива; отдельно доступны файлы отчёта/документации.

Ручные действия: скачать итоговый ZIP на компьютер и сохранить независимую копию; скопировать этот отчёт в чат-координатор; при новом рабочем чате прикрепить ZIP/отчёт и потребовать source check перед изменениями; выбрать следующий небольшой этап. Для дополнительного GitHub backup отдельно выбрать приватный репозиторий и предоставить разрешённое подключение. Не вводить credentials в переписку.

Неизвестно: автоматический доступ второго чата к source, сроки хранения локального checkout, реальные FPS/нагрев телефона, точность GR86/сходство новой формы, возможные правки вне найденного checkout. Никакие обещания о таком доступе/точности не делались. Разработка после аудита остановлена до новой инструкции.
