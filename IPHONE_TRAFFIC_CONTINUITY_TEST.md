# iPhone — проверка A33

Открыть https://max-driving-lab.maxtrcgi.chatgpt.site в Safari или заново открыть Home Screen приложение. HUD: DRIVING LAB v0.14A.3.3 — Traffic Continuity Fix. Если версия старая, закрыть вкладку/приложение и обновить страницу. Новый build использует module fingerprint, service worker отсутствует; старый открытый JS сам не заменится.

1. Highway28NPC: старт среди потока, initial speed соответствует lead; разгон до200km/h, продолжать5min. После обгона первых машин новые встречаются; смотреть вперёд и отметить самый длинный пустой участок.
2. То же42/72/120NPC: разница плотности реальна, active/requested видно Pause→Telemetry. Нет наложений, внезапных появлений рядом, удаления ещё видимой машины.
3. Sparse18:200km/h5min; отдельно160km/h — допустимое известное warning до46–54s между crossings в тестах, но машины в1000m сохраняются. Сообщить, воспринимается ли дорога пустой.
4. Тормозить до0, держать10s, снова разгоняться. NPC безопасно перестраиваются, обгоняют, реагируют на rear approach; проверить столкновение с NPC и ограждением.
5. Обычный steering150–200, Touch cancel/release, ABS/TCS, track/test pad, camera switches — поведение основы должно сохраниться.
6. Pause→Telemetry→Download: обычный файл содержит trafficContinuity в JSON header (5Hz six-minute ring). Передать Director видео, файл, выбранную плотность/quality, длительность. Для повтора seed добавить ?trafficSeed=917; обычный restart использует новыйseed.

FPS устройства не подтверждён Node benchmark. Не продолжать новые physics/camera changes в рамках этого теста.
