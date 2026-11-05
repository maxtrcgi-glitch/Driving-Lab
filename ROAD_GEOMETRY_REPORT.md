# A.5.1 Road Geometry Report

Исходная A42 использовала две синусоиды X(s) и две H(s). Новая RoadGeometry генерирует независимые детерминированные4800m блоки. Каждая горизонтальная/вертикальная пара переходов использует Q(u)=10u³−15u⁴+6u⁵. X/H и их первые две производные непрерывны; внутри блока профиль поднимается/возвращается к0, между блоками есть длинные прямые. Это ограниченная height-field дорога, не универсальный spline graph. Геометрия зависит от road.seed; trafficSeed остаётся независимым.

Формулы сохранённого контракта: n=√(1+g²), g=X′(s), κ=X″/n³, a=1−tκ. P=(X+t/n,H,s−tg/n−origin). R=(1/n,0,−g/n); F=(ga,H′,a)/√((na)²+H′²); U=F×R. Metric=|dP/ds|, grade=H′/(na). Метры/SI. s — глобальный Z-параметр, не длина дуги; t — горизонтальное правое смещение. Lane centres=point(s,LANES[i]). Положение локального chunk не вращается: его group.position.z=s0−origin. Исторический curvature(s) остаётся X″, frame.curvature — истинная горизонтальная κ.

Теоретические ограничения профиля: |X|≤250m, |H|≤22m, |H′|≤0.0375, горизонтальные радиусы порядка≥838m. На четырёх seed/100km измерены κ≤0.00109755/m (R≥911.1m), уклон≤3.656%, straight sample fraction45–46%. Это диапазон данной выборки, не глобальное доказательство всех seed.

Surface strips остаются5m по s; общие граничные вершины/аналитические нормали совпадают. Dash phase теперь глобальная12m, без сброса в каждом200m chunk; barrier/marking boxes получают pitch. Trees/posts остаются upright. Новых материалов, моделей, lights, shaders нет. Изменения только highway.js, highway-world.js, road-geometry.js и version labels.

Физика без изменений: refreshContactPlanes делает5 проб высоты на каждую шину, фактические наклонные нормали и контакты идут в существующие силы. Шесть15s real Vehicle runs:4 контакта после1s, damage0, ошибка нормали≤1e-08;100s highway-drive отклонение0.375m, крен0.200°, без повреждения. Оффлайн numerical driver не входит в игру. Первоначальная проверка идеального1.5m lane following не прошла на200/250; это understeer/ограничение простого pure-pursuit контроллера. У тестового контроллера добавлен публичный велосипедный feed-forward; contact safety envelope3m явно отделён от идеального следования полосе. При250km/h max deviation1.983m и конечная232km/h — удержание250 и идеальная полоса не подтверждены. Настройки шин/подвески не менялись. Другая ошибка теста: stale contact plane после rebase сравнивалась с новым origin; исправлено только преобразование координат проверки.

NPC: прежние решения/перестроения/IDM-like следование/ринг/коллизии сохраняются. s advancement использует3D metric(s,t); mesh pitch=atan(H′/(na))*direction. Lane-gap логика остаётся консервативной в s, collision response лёгкой планарной, не node-beam; это явное ограничение, достаточность проверена sampled scenarios. Crashed NPC сохраняют прежнюю simplified terrain-height/planar reaction. Не утверждается полная физика NPC на крутых уклонах.

Непрерывность75×300s, densities18/28/42/72/120, speeds80/120/160/200/250, traffic seeds917/2027/8123, road seed86. Спавнfailures0, visible-spawn fog proxy0, normalNPC/barrier contacts0. Встреча определяется пересечением road-s, не гарантирует обгон в той же полосе. При80km/h поток может быть быстрее игрока, поэтому встреч впереди0 допустимо. Visibility — численный fog proxy; реальный GPU/frustum/картинка не проверены.

| km/h | Same-direction encounters / 5 min, min–max | Max empty ≤500m, s | Empty ≤1000m, s |
|---:|---:|---:|---:|
| 80 | 0–2 | 13.17 | 0.00 |
| 120 | 9–97 | 20.50 | 0.00 |
| 160 | 28–229 | 18.43 | 0.00 |
| 200 | 46–351 | 12.87 | 0.00 |
| 250 | 70–510 | 7.33 | 0.00 |

CPU benchmark: Node v24 Linux, alternating baseline/current3 runs each,1800 simulated60Hz frames/run; 4 traffic steps + scene transform/stream update, без player physics/GPU/rendering. Concurrent machine load влияет на результаты. Измерения не FPS iPhone.

| NPC | Traffic ms A42 → A51 | World update ms A42 → A51 |
|---:|---:|---:|
| 28 | 0.0338 → 0.0370 | 0.0357 → 0.0383 |
| 72 | 0.0930 → 0.1021 | 0.0852 → 0.0925 |
| 120 | 0.1843 → 0.2008 | 0.1413 → 0.1569 |


200km retention probe: heap delta74904B после GC,120 NPC повторно используются. 500km mesh lifecycle:72 live surface geometries,118 total mesh batches,8 chunks/≤8 cached profiles; dispose events сбалансированы после clear. Это проверка JavaScript/resource lifecycle, не GPU memory measurement. Небольшой рост CPU ожидаем для новой геометрии; сравнение P95/max и все сырые данные reports/A51/performance.json.

Без банков/branching/pooling. Прямые между блоками закономерны; детерминированные случайные параметры разнообразят их, но разметка/ассеты прежние. Far terrain и реальные seams/камера проверяются игроком. Visual Developer получает additive contract note; исходный A50/reference остаётся исторической A42. Не запускается активный assist и не меняются правила камеры.
