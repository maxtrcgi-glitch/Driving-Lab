# Driving Lab 0.13 — verification

2026-10-10. `npm run check`: exit 0, **24 scripts passed**, once after the final code changes. Separate syntax/resource imports checked through Node bootstrap; git diff --check passes. Documentation edits after tests do not change runtime inputs.

Evidence: evidence/check.log and evidence/performance.json in the release ZIP. CPU benchmark is Node linux x64, not phone FPS. Original WIP snapshot and baseline tag retained. Zip CRC/checksums and Git bundle verified at packaging; publication identity/status in RELEASE_RECEIPT.json.

A/start: all 6 densities / 5 seeds, immediate speed matches nearest same-lane leader, same-lane front/rear and adjacent traffic, rolling drivetrain checks. B/density: actual count, 72/120, instance capacities, width/length non-overlap. C/D/speed/brake: 120 s road-space driver per density 28/42/72/120, acceleration / hard deceleration / stop / 250 km/h / recycling and live count changes. NPC allocation failures absent in these scenarios; artificial saturation returns null safely. E/stability: finite state, bounded cars and 8 chunks, 100 km projection/streaming, original physics/controls/circuit/roof/telemetry checks. F/input: events/sensor/menu stubs, new pad tuning and app preferences.

Full app-bootstrap executes production app.js with real Vehicle/Three geometry plus DOM and WebGLRenderer stubs, 90 RAF frames with 120 NPC and no spawn collision/broken beams, all spawns/settings/pause. This verifies composition and JavaScript startup in stubs, NOT actual browser/WebGL startup.

Browser/device QA NOT performed: no supported control-browser available; no alternative browser installed or server preview improvised. Actual iPhone FPS, GPU render cost, heat, touch feel, sensor/audio/clipboard permissions, geometry appearance and vehicle realism remain unverified. The candidate is experimental. IPHONE_TEST_PLAN.md defines manual acceptance.

Numerical highway-drive runs density=0; do not report its 3.17 km as dense-traffic driving. Traffic-experience isolates traffic from player physics. Passing finite scenarios cannot prove all seeds/maneuvers or a general NPC crash solver.
