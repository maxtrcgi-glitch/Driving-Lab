# PERFORMANCE_BUDGET — A.5.0 provisional contract

## Confirmed baseline facts

A.4.2: eight200m road chunks, at most120 NPC,6 traffic instance batches. Nine strip meshes+five static instance batches per chunk →112 road batches +6 NPC = **118 mesh batches**. CPU scene census with all8 chunks and120NPC: **78,152 instantiated triangles**, **234,296 bytes** unique geometry attribute/index buffers,1 asphalt texture64×64 RGBA. These are potential scene counts; not actual GPU draw calls, culling visibility, whole-game memory or shadow-inclusive passes. Instance buffers, materials, driver/GPU allocations, car/track geometry and render targets are excluded from234KB. Existing scene shadow receiver flags do not imply a shadow caster draw for every road mesh.

Global lighting: Hemisphere+Directional sun, shadow1024², PCFSoftShadowMap, fogExp2 density.0017, procedural environment128×64. Pixel ratio max1 performance/1.5 balanced/2 high. Preserve graphics quality and fog; no new post-process. Geometry window is roughly−400…+1200m relative to current200m key, not guaranteed fog cutoff. NPC continuity reaches beyond streamed road geometry; don't shorten traffic distances based on decorative LOD.

## Proposed first-integration budgets (not hardware guarantees)

| Resource / scope | Initial gate | Measurement |
|---|---:|---|
| Retained road segments | exactly8, plus explicitly bounded bridge-owner pins if later approved | lifecycle count |
| Incremental static prop batches | ≤24 across8 segments (≤3 added parts/segment); replace existing batches where possible | CPU census then renderer.info.render.calls |
| Highway visible/potential batch planning | existing118 + incremental≤24; actual renderer calls measured separately | no automatic per-object Mesh proliferation |
| Incremental instantiated triangles | ≤60,000 across retained decorations | sum triangles×count per LOD |
| Incremental GPU geometry/instance buffer estimate | ≤16MiB | attributes/index/instance arrays, shared counted once |
| Incremental decoded textures incl mipmaps | ≤32MiB | width×height×channels×~4/3, uncompressed estimate |
| Texture atlas edge | generally512–1024;2048 only reviewed shared atlas; no4K per-object textures | inventory |
| Added per-instance real lights/shadow passes |0 | scene traversal |
| Added steady world CPU median | ≤0.5ms/frame provisional delta | same baseline scenario/device |
| Segment build added CPU p95 | ≤2ms provisional, amortize over frames if needed | creation/recycling instrumentation |
| Total-game target |60FPS /16.67ms frame interval | real iPhone Safari RAF p50/p95, not Node |

Do not treat60FPS as guaranteed by triangle count. Fill rate, transparency, shadows, resolution and physics share budget. Proposed limits can tighten after actual measurement. No changes to baseline rendering/quality in this documentation stage.

## LOD / visibility proposal

Near props0–150m: detailed LOD0;150–400m LOD1;400–650m low-poly LOD2; vegetation silhouettes may remain to900m with a dedicated bounded batch. These are initial review values, not a universal cutoff. Signs must stay readable until passed; no range based solely on asset centre if bounds span the camera. Bridge silhouettes and large canopies need extent-aware culling. Use10–15% distance hysteresis, coarse10–15Hz host LOD decisions, separate shared geometry batches, stable bounds and crossfade only where transparency cost is justified. Fade tiny props into fog; do not change fog to conceal popping. The sample supports one LOD and explicit bounds; switching/fading not installed in A.4.2.

## Required measurement before game integration

Same seed,density120,speed200km/h, camera/quality/viewport held constant; start warm, record5min plus repeated reverse/restart/rebase. Compare baseline against added assets. Collect renderer.info.render.calls/triangles, renderer.info.memory.geometries/textures, JS world generation/update CPU p50/p95/max, frame intervals, active chunks and batch/instance capacity. Memory counters are counts, not bytes; DevTools memory where available plus typed-array/texture estimates. renderer stats may count multiple passes; define sampling/reset boundaries. RAF elapsed time is not GPU completion time. Check after20 recycling passes that geometry/texture counts plateau and shared resources remain valid. Real iPhone heat/quality effects need player testing.

## Actual example timing

Node one-part reflector batch creation over502 segments: median0.0167ms, p950.0787ms. This measures only the small detached placement example; not a representative whole-road benchmark, real renderer or iPhone FPS. CPU frame tests576cases and lifecycle bound passed. Full data in CONTRACT_TEST_RESULTS.json.
