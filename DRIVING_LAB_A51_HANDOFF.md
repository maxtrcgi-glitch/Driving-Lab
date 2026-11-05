# DRIVING LAB — A.5.1 HANDOFF

Main channel: https://max-driving-lab.maxtrcgi.chatgpt.site
Version: v0.14A.5.1 — Highway World 2.0. Published and34 HTTPS resources verified. Runtime Git59f0a89f07b6b39c58fb307cef63ddaf7b51f7ea; native Git002bc21feeaae3dd27d31ed89b3f24ca4a3982f7, Site version26, buildv014a51-dbd1b70304b4. Exact IDs: RELEASE_RECEIPT.json.
Control/rollback: accepted A.4.2, native version25, immutable source tag before-highway-geometry/v0.14A.4.2; same main URL after rollback, not a separate simultaneously published control URL. No second control URL invented.

## Delivered

Geometry-only seeded C2 blocks: long straights, smooth S-bends, hills/descents and combined curvature. Additive Road Frame API, analytical normals, common dash phase, graded barrier/marking/NPC transforms, NPC3D lane metric. Existing6 lanes, 8×200m segments, bounded deterministic re-generation/rebase. No new visual assets/bridges/banks/branches; Visual Kit V1.1 remains Visual Developer work. The updated detached adapter and A51_GEOMETRY_ADDENDUM must be passed to Visual Developer alongside current Highway/RoadGeometry files. Contract parameterization and slots remain compatible.

Changed runtime: dist/road-geometry.js (new), dist/highway.js, dist/highway-world.js, dist/app.js and index.html (version labels only). Adapter updated to query actual heightGradient. Vehicle physics, tyres/suspension, touch/SteeringResponse, transmission/launch fix, ABS/TCS, cameras, player damage and Shadow modules are byte-identical A42 (29 protected dist files). No active steering assistance. External road contacts necessarily differ on new surface. Traffic decisions/collision mechanisms preserved, path advance/transforms adapted only.

## Validation and limitations

npm run check:29 suites passed. 75×300s traffic runs,18/28/42/72/120,80/120/160/200/250,3 traffic seeds, road86; no spawn failures, overlaps/normal traffic/barrier contacts, no artificial empty1000m intervals.500km geometry/resource lifecycle, four100km seed geometry sweeps, C2 join continuity, exact seam normals/vertices, 96 additive adapter frames,300s NPC path/pitch checks. Six15s real Vehicle contact/camera scenarios include grades, both travel directions,200/250 starting speed and rebase; all4 tyre contacts after1s/no damage.100s Highway drive passes.2400 full state Shadow On100/Off equivalent steps and exact29protected bytes. Original30/60/120FPS camera numerical tests, launch regression and UI bootstrap passed. Raw data/logs reports/A51.

Do not overstate: no real A51 iPhone, GPU/browser render or screenshots. Contact tests use an offline driver, not player/assist;250 start scenario drops to232km/h and lane tracking error up to1.983m; no claim that all bends are comfortably drivable at250. Pure-pursuit perfect-lane test initially failed; test explicitly separates safe road/contact envelope from lane precision and records all metrics. Floating-origin stale plane comparison corrected in test only. Existing extreme oversteer remains unresolved. Road C2, not C3; legacy s is not arc distance; NPC collisions/gap logic remain lightweight planar/s-space, suitable only gentle geometry. Asphalt strips are5m sampled; actual seams/visibility need iPhone review. Historical protected-source tests aimed at older releases are retained as legacy tests; use road-identity for A51, not stale byte expectations.

CPU comparison Node/Linux:28 NPC traffic0.0338→0.0370ms/frame,72:0.0930→0.1021,120:0.1843→0.2008; scene CPU update0.0357→0.0383 /0.0852→0.0925 /0.1413→0.1569. Four240Hz steps + world update per simulated60Hz frame; no GPU/physics cost included. Heap retention +74,904B after200km GC probe;8 chunks/≤8 profile cache/120 reused NPC. Full P95/max/repetitions performance.json. These are not Safari FPS or GPU memory measurements.

## Test on iPhone now

Verify version A.5.1 and fingerprint BUILD_RECEIPT; drive5–10minutes through first straights/bends/hills at80/120/160 then200, with28 and120 NPC. Check continuous traffic, no ground steps/holes, NPC road alignment/lane changes, camera look-ahead on bends, DriverView/Chase switches, pause/resume/respawn, long rebase and touch release. Re-run100→0→100%gas launch, circuit/test-pad regression. Report device/iOS/settings/density, video and telemetry if needed. Full checklist IPHONE_A51_TEST.md. Comfort/frame pacing acceptance is pending.

## Preservation / next task

Source branch work/highway-geometry-A51, runtime and delivery commits/tags in receipt/package START_HERE. Full backup includes source/tests/docs/currentready-build, previousA42flatZIP, source.bundle and native-site.bundle, release/publish/hash evidence and SHA256 manifest. Restore Git bundle before tests that inspect tags; static build serves dist, requires HTTPS on iPhone. No external GitHub publication asserted.

After delivery stop. Wait for iPhone feedback; if accepted, separately review Visual Kit against A50+A51 addendum and integrate bounded instanced host hooks in A52. GPT-6.1 Sol for normal integration/testing, Sol fixes, Luna docs, Astra only proven hard geometry/contact issues and prior agreement. Cameras/physics not reopened as part of asset integration. Director should forward the addendum/currentgeometry modules to Visual Developer; no messages sent externally on user's behalf.
