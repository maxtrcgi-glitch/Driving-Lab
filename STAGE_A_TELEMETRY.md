# Stage A — диагностический контракт

Версия runtime: 0.14A.2-stageA Experimental, steering=legacy-v014A1. Экспорт: существующее Pause → Telemetry → Copy / Download, тот же text envelope с JSON header + CSV + END TELEMETRY. Файл .txt, payload DrivingLabCSV/4. Это компактный переносимый журнал, не plain CSV с первой строки. Считывать по именам колонок; исходные 97 колонок CSV/3 сохраняют индексы. Всего 120.

23 добавленных поля описаны в dist/driving-diagnostics.js и header.drivingDiagnostics. driving_experience=0 legacy-v014A1; 1/2/3 лишь зарезервированы, не активные профили. assist_available/state/correction=0 — реализации нет. skid_detected/skid_phase/yaw_accel пусты/null — неизвестно, а не отрицательное обнаружение. Target до rate/filter отличается от processed/final; existing steer_actual_deg и FR/FL_steer_deg описывают фактическую геометрию. Input имеет обратный знак физическому rack. Wheel alpha/forceLimit уже записываются; шины без нового вмешательства.

Touch fraction — normalized измеренный ход относительно якоря до precision; demand — степенной выход pad либо digital/tilt. touch_active различает нейтральное активное касание и отпускание. Event timestamp/received timestamp относятся только к последнему принятому touch/pointer событию. Reset clears timestamps/fraction; release записывает время и обнуляет fraction. Несовпадение timestamp epochs не используется в управлении. Age — от получения события до времени RAF sample, не latency до физики/фотонов. Граница шага физики по этим полям не измерена. Для digital/tilt last touch timestamps могут оставаться старым жестом; фильтровать по touch_active/input_mode.

local U/V используют горизонтальный yaw; body U/V полный chassis basis. FR/FL motion используют реальные hub velocities; при скорости узла<=3m/s null. forward_motion_valid не детектор заноса, включает finite/Ubody>3/up.y>.5/оба контакта. Reverse/stop не поддержаны будущей помощью по этому флагу, но реальные raw данные остаются в журнале.

Буфер прежний: capture~10Hz, export~5Hz, <=602 строк/60s и <=256 событий; pauses исключены из driving clock, car clock reset отдельно. Никаких дополнительных 240Hz allocations. Новая небольшая array выборка только во время capture, без feedback. Performance CPU overhead на iPhone не измерен. Frame/render/physics timing прежние: render CPU submission, не GPU.

Тест на телефоне, когда диагностическая сборка будет отдельно разрешена к запуску: зафиксировать car setup/ABS/TCS/покрытие/travel/precision; короткая обычная езда50/150/200 и обе стороны умеренного заноса, записать передерживание/отпускание; Pause → Mark issue → Copy или Download последние30–60s. Приложить screen recording и модель iPhone/iOS, режим камеры/графики/трафика. Сначала проверить обычную коррекцию, не пытаться достичь250 ради теста. Текущая опубликованная A.1 НЕ содержит новые поля Stage A.

Для локального запуска извлечь source и на своём компьютере выполнить python3 -m http.server 8000 --directory dist, открыть http://localhost:8000. Для sensors/clipboard на iPhone нужен HTTPS или browser permissions; никаких обещаний phone WebGL/FPS на основании Node. Здесь сервер и real browser не запускались.

## Актуальное дополнение Stage B

Production теперь передаёт experience и записывает driving_experience=1 (Simulation), assist_state=1 (явно отключено), available0/correction0. Старый diagnostic sample безслоя остаётсяcode0/state0 для совместимости. Detector/phase/yawaccel неизвестны/null. Format CSV/4,120колонок и boundedbuffer прежние. Header notes обновлены; legacyprofile raw/target остаютсяпараметрамиA.1. Stage B manual protocol — STAGE_B_IPHONE_TEST_PLAN.
