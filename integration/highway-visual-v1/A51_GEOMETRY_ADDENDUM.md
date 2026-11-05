# A.5.1 additive notice to Director / Visual Developer

Дата2026-10-11. Контракт A50 v1.0.0 не заменён: metres,ground pivot,+Xright/+Yup/+Zfront,slots/lane offsets,legacy-global-z-v1,200m half-open owner segments,8 chunks,world-Z group convention сохраняются. Дорога теперь имеет C2 seeded blocks с более выраженными кривыми/уклонами. Исходные HIGHWAY_VISUAL_CONTRACT/ROAD_COORDINATES/reference описывают A42; этот addendum — изменения фактической реализации A51.

Новый read-only Highway.heightGradient(s)=H′; Highway.metric(s,t)=3D length derivative; Highway.frame(s,t,out) с reusable arrays position/right/up/forward, grade, curvature, yaw. curvature(s) исторически X″, frame.curvature=X″/(1+X′²)^(3/2). Lane centre по point(s,LANES[i]), pitch добавлен в point; не считать s длиной дуги. Height остаётся H(s), offset горизонтальный, banking отсутствует. Seed и глобальные IDs независимы от floating origin.

VISUAL_INTEGRATION_EXAMPLE.createA42RoadAdapter сохраняет имя/API для совместимости, но теперь surface frame читает heightGradient при наличии. Fallback аналитической A42 высоты только для reference/demo. Не копировать старую синусоиду H′ в ассеты! Assets получают transform от host adapter, не рассчитывают дорогу самостоятельно.

Нормали полос теперь аналитические и согласованы между chunks. Разметка использует общий phase2/spacing12 по глобальному s. Barrier boxes получают grade pitch, posts/trees upright. Коллизии остаются Core-owned; Visual Kit не может менять collision envelopes. Нет bridge support/banking/arc-length IDs/new visual extension callbacks. Registry/lifecycle API остаётся detached; hooks и LOD будут отдельным A52 после feedback/разрешения.

В All-In-One актуальные dist/{highway.js,road-geometry.js,highway-world.js} и tests/road-visual-frame.mjs; reference/ намеренно остаётся A42, версия подписана. Тестирует96 frames и NPC3D traversal. Forward frame для встречного направления умножает F иR на−1, U сохраняет; знаки высот/трансформации не выводить только из yaw. Предоставлять ассеты через прежний registry, не редактировать Core.
