# R2.3 — Highway visual proof of concept

**Status: CONDITIONAL / NOT VISUALLY ACCEPTED.** A separate 300 m interactive WebGL scene is available, but the captured result does not meet the requested photorealism. Director review and an actual iPhone test remain outstanding.

## IMPLEMENTED

- [Independent HTTPS preview](https://driving-lab-highway-r23.maxtrcgi.chatgpt.site), separate owner-private Site. Driver, roadside, overview, low sun and Drive/Pause controls. Drive moves a camera at approximately 33.33 m/s (120 km/h) through a 230 m loop. This is not vehicle physics; loop reset is abrupt.
- `r23/index.html`: 300 m plane, three nominal 3.5 m lanes with 6 m dashed separators and 12 m gaps, edge lines, shoulder strips, two approximate rails and instanced posts, flat ground, fog, hemisphere and directional lighting. Shoulder gaps observed in first images were corrected in scene commit `7b7d53e7fa2fabade680cd1619d393a1c204a4b7`.
- [Poly Haven Asphalt Track](https://polyhaven.com/a/asphalt_track), Dimitrios Savva, CC0, 1K diffuse/GL normal/roughness with 2 m repeat; existing [manifest](../assets/asphalt-track/manifest.json) lists hashes and source files. Uses standard Three.js material, no rejected R2.2b shader. Three.js vendored MIT license. [Asphalt 05](https://polyhaven.com/a/asphalt_05) was considered based on its listed properties; it was **not downloaded or visually compared under matched lighting**. No claim it is inferior.
- Road proportions and lane markings are a visual approximation; 6 m/12 m example is documented in [European Commission Regulation 351/2012](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02012R0351-20120514). Barriers are simple box meshes, not engineered W-beam models or certified dimensions. The intended crown is not established: the plane has only corner vertices at equal absolute x, so it is effectively flat; markings and shoulder height also require a real profile implementation.
- Source remains in `experiments/asset-poc-r2/r23/`. The independently hosted copy uses the same scene with relative asset paths adapted for its separate site. Source deployment SHA `676986af2a6bdcba3b4f0be44221e083a385864a` is the **Site source** SHA, not the GitHub branch SHA.

## TESTED

- [Chromium WebGL2 SwiftShader run 42371057289](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42371057289), tested GitHub scene SHA `7b7d53e7fa2fabade680cd1619d393a1c204a4b7`; [six screenshot artifact](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42371057289/artifacts/13573493903). Page/request error collection and GL checks passed. Screenshots are real WebGL, not generated imagery. Deployment completed successfully at the URL above; the deployed page was not separately exercised in mobile Safari.
- Six static camera configurations captured. Reviewed driver, roadside, barrier and detail, and earlier overview and low-sun images; captures named detail/barrier use roadside camera rather than dedicated close-up framing. Tested frame reported 32–42 draw calls, 1,904–1,924 triangles, 3 texture objects. Three 1K RGBA8 maps with complete mip chain estimated ~16 MiB, excluding other allocations; not a device measurement. No controlled FPS/frame time measurement was performed. SwiftShader does not predict iPhone performance.
- Visual assessment: lane and shoulder context are more informative than the earlier isolated material plane. However, sky and terrain are flat colors; rails are visibly rectangular; there are no proper drainage details, road profile or natural terrain; asphalt still shows strong bands under low sun and the markings appear uniformly bright. It does not convincingly resemble a photograph. The revised shoulder joins look connected in the inspected images. These findings do not prove improvement over V1.3, whose matched images were not assessed here.

## NOT VERIFIED / acceptance gaps

- Director visual acceptance, iPhone Safari rendering, motion stability, real GPU memory/FPS, long-term thermal behavior and touch usability are unverified.
- No matched visual comparison against Visual V1.3 or real-road photos was completed; game-like asset references were not inspected visually in this checkpoint. Only existing Asphalt Track was rendered. Natural nonuniformity/wear and realistic roadside mesh assets remain incomplete. Roadway vertical profile and crown are not actually achieved. This is an early independent prototype, not the requested final photorealistic highway.
- No production dist, main, traffic, vehicle physics, camera physics or transmission was modified. No integration into the stable game is authorized by this report.

Report commit SHA can be obtained from Git history; a commit cannot contain its own final SHA.
