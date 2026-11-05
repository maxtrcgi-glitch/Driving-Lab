# iPhone — v0.14A.4 Camera Test

1. Открыть https://max-driving-lab.maxtrcgi.chatgpt.site в Safari landscape. Перезагрузить старую вкладку/PWA; в HUD должен быть v0.14A.4 — DriverView Hybrid. Camera settings находятся в Pause → Controls & setup → Camera settings.
2. Highway, traffic28, fixed seed по желанию: `?trafficSeed=917`. Одинаковые car settings/route/seed для A/B; руль и физика прежние. Две минуты150–200км/ч: трафик продолжает встречаться, расстояния до NPC читаются, lane corrections привычные.
3. Static/FOV60 — контроль. Затем DriverView: default inertia25%, horizonOn/autoLookOn, drift/FOVOff. Разгон/торможение/плавный поворот/кочки; проверить правильность инерции и отсутствие дрожания/долгой раскачки. При дискомфорте Off или Static.
4. Включать по одному эффекту: inertia0/25/100; horizonOff/On; autoLookOff/On; driftOff/On на test pad. Малый/большой занос в обе стороны, контрруление, возврат, stop/reverse. Камера должна следить за движением плавно, а не прыгать вслед за рулём. Очень большой spin не обязан давать180° взгляд.
5. Отдельно FOV0/+3/+6 с одинаковыми base60/route. Разгон до200, brake, плотный поток: различимость, чтение NPC distance, периферия, укачивание. Strong — экспериментальный opt-in; defaultOff.
6. Chase: default5.6m/2.15m, кузов целиком и дорога видимы. Drag «Camera» upper-right одновременно с левым steering pad. Отпустить:900ms holdoff затем плавный возврат. RecenterOff не возвращает; проверить speed0.4/1/2.5. Distance/height extremes, camera switch/Hood, portrait/landscape.
7. Pause/resume, background20sec, slow motion, respawn/repair, crash/rollover, highway origin shift на длинной поездке: никаких NaN/вылетов/сильных прыжков или выхода камеры через крышу. Сильные повреждения салона требуют особенно внимательной visual QA.
8. Перезагрузить: camera settings сохранены. Reset Camera Settings возвращает только camera defaults, не steering/ABS/TCS/setup. Провести10–15min и сравнить нагрев/frame pacing Static иDriverView. Не менять graphics/traffic одновременно с эффектами.
9. При проблеме Pause → Telemetry → Mark issue/Export file. Metadata camera содержит settings,headOffset,gazeYaw,beta,confidence/reason,generation и frame/cameraCPU p50/p95(max1800RAF samples). Также отправить видео, модельiPhone/iOS/Safari, orientation, quality,density,seed и описание включённых эффектов. Числа CPU не являются GPU frame completion.

v0.14A.4 предназначена для реальной проверки ощущений камеры; технические тесты уже выполнены, субъективная приёмка ещё нет. ОткатA33 доступен Developer по ROLLBACK.md.
