# Stage B — ручная проверка на iPhone

Новая сборка не развёрнута поверх A.1. Этот сценарий для отдельного разрешённого HTTPS-тестового размещения в будущем; текущаяliveA.1 не имеет слояSimulation. ЛокальныйHTTP не гарантирует sensors/clipboard.

1. Проверить label0.14A.2 Stage B / Simulation baseline. Зафиксировать travel/precision/покрытие/car config/ABS/TCS/graphics/traffic/camera, сравнивать сA.1 при одинаковых настройках.
2. Обычные corrections50/150/200 и перестроения: ощущение должно остатьсякакA.1. Полныйtouchtravel открывает lock; не пытаться специально разогнатьсядо250.
3. На площадке умеренныйзанос обеихсторон: своевременный, запоздалый и избыточныйcounter; Simulation не должен спасать автоматически. При нейтральномпальце машина может естественно стабилизироваться или вращаться — физическаяреакция не доказательствоassistant.
4. После отпускания команда возвращается с прежнимfilter/rack delay, а не мгновеннообнуляетскорости. Touch+gas/brake, cancel/blur/lock phone/pause/reset/game-mode changes не оставляютheldinput.
5. ABS/TCS flags не меняются при reset/Simulation selection. Камеры и Highway rolling spawn/скорость/72/120 должны сохраниться. ДругихпрофилейвUI нет.
6. Pause → Telemetry → Mark/Copy/Download последние30–60s. Header CSV/4, driving_experience1, assist_state1/correction0, detector/phase empty. Приложить iPhone/iOS и screen recording.
7. Оценить 10–15min нагрев/RAF/CPU maxima, не считатьrenderCPU GPU FPS. UI/source switch/phone comfort не подтверждены Node tests.

При regression остановитьтест и приложитьлог; StableA.1 сохранена. Улучшенияконтрруления от помощи ожидаютсявбудущихBalanced/Assisted, не вSimulation.
