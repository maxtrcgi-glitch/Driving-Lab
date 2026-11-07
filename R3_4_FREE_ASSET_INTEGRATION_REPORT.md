# R3.4 Free Asset Integration — Recovery Report

## Decision

**READY FOR DIRECTOR REVIEW**, as an experimental comparison only. This is not approval for production integration or a claim of photorealism or iPhone performance. Original scene and assets remain unchanged in this recovery.

Reviewed source: `c8a9e08ee7e0330da5f2813a58553830e60c5394`, branch `visual/asset-poc-r2`. The branch was at this SHA before this report commit. The report commit does not alter the reviewed scene.

## Evidence and reproducibility

- [Successful GitHub Actions run 42405765330](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42405765330), job compare, tested that source SHA. Both inspect.py and test.mjs completed successfully.
- [WebGL comparison artifact](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42405765330/artifacts/13587427728): ten PNGs, stats.json, and assets.json. Reviewed driver daylight, driver low sun, roadside, overview, guardrail and shoulder closeups.
- [Runnable showcase artifact](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42405765330/artifacts/13587447763).
- Separate private HTTPS showcase: https://driving-lab-r34-showcase.maxtrcgi.chatgpt.site . Deployment status succeeded. The site source commit is `a3ee5a6fca35934a4c87b53c53b3d8e8bf926a8e` in its separate hosting repository; it contains the CI showcase artifact plus hosting configuration. All 23 bundled repository files were independently compared using Git blob SHA-1 against the GitHub tree at the reviewed SHA and matched. The artifact-generated root redirect and hosting manifest are not repository source files. This deployment did not update the stable gameplay Site. The actual iPhone rendering, controls and frame rate are not yet verified.
- Four paired views use 1280×800, same position/direction at distance 20, FOV 52, identical hemisphere and directional lights, sun positions, tone mapping and exposure. Low sun is a separate matched setting. The closeups are additional R3.4-only views. Screenshots are static, not a motion assessment.

## Visual assessment

Compared with R2.3c, R3.4 shows substantially more pavement surface detail, a textured shoulder, a genuine W-beam guardrail with bolts and posts, and segmented concrete Jersey barriers. These are recognizable real asset geometry and materials; the manifest declares CC0 for Asphalt 02, Gravel Road and Jersey Barrier; the GLB inspection reports CC0 for both Innerscene models. Asphalt Track's separate manifest identifies its source and license.

- **Asphalt:** fine aggregate and cracking add surface character. The same pronounced cracks repeat across lanes and distance, creating an artificial pattern. It looks heavily worn rather than a generic well-maintained highway.
- **Gravel:** visible texture and relief improve on the flat R2.3c shoulder, but the strong orange tint and uniform straight strip look like dirt; road/gravel/ground boundaries are unnaturally abrupt.
- **Guardrail:** recognizable beam profile, posts and bolts are clear in closeup. Repeated segments, uniformly spaced supports and a flat surrounding ground remain apparent.
- **Jersey barrier:** its shape, concrete material and repeated joints are clearly visible. It is uniform, repetitive and has conspicuous gaps/light areas at the bottom. Ground contact and transitions deserve future review.
- **Resurfaced section:** the near-black rectangular 21 m patch with sharp transverse boundaries stands out strongly in overview and driver view. Source shows this is the intentionally adjacent Asphalt Track section at distances 76–97, not evidence of missing textures. Its presentation looks like a conspicuous test swatch.
- The environment is still a bare, flat demonstration with a uniform horizon, clean repeated markings, no surrounding detail, and no realistic transition or weathering. The screenshots do not establish motion quality, aliasing or iPhone performance.

No speculative color/geometry adjustment was applied: the comparison is useful for Director evaluation and changing material appearance without another controlled visual test would mask the original result. These shortcomings remain open.

## Actual test and resource measurements

The existing test launched Chromium headless with ANGLE SwiftShader software rendering, not mobile Safari or native GPU. It waited for asset readiness, rendered views, checked WebGL 2 and GL error 0, checked requests and browser errors, and captured screenshots. All assertions passed; `errors: []`. This is a rendering/loading smoke test, not an automated realism, benchmark, frame-time, continuity, or on-device test.

| Recorded view | Draw calls | Triangles | Three.js texture count |
|---|---:|---:|---:|
| R2.3c driver | 48 | 2,410 | 3 |
| R2.3c roadside/overview | 46 | 2,406 | 3 |
| R3.4 all six views | 13 | 146,998 | 17 |

Counts are renderer.info for the captured frame, not GPU timings. Instancing lowers draw calls while geometry increases sharply. R3.4 test reports 13,423,023 bytes (12.80 MiB) of transferred JPG/GLB asset bodies vs 2,150,973 bytes (2.05 MiB) for R2.3c; these are compressed transfer sizes, not GPU memory or total page download.

Actual GPU memory was **not measured**. Inspection found nine 1024×1024 surface images and eight 2048×2048 embedded GLB images. If each occupies an independent uncompressed RGBA8 GPU texture, the illustrative base-level estimate is 164 MiB, or about 219 MiB including full mip chains. Actual format, texture sharing, GPU allocation, mipmaps and browser implementation may differ; this is neither a measurement nor an iPhone memory budget. Geometry buffer and render target memory are excluded.

## Scope and follow-up

No new downloads, shaders, primitive substitutes, production integration, or stable branch changes were made. No automatic R3.5 work was performed. Director can inspect the comparison and preview, then decide whether the repeated pavement, orange shoulder, abrupt dark patch and barrier grounding warrant a separate iteration. Verify on the actual iPhone before judging speed or appearance.
