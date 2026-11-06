# R2.1b — Tree WebGL / LOD checkpoint

Status: **CONDITIONAL — INCOMPLETE VALIDATION**. This checkpoint provides a viewer and recovered LOD candidates. It does not meet visual, WebGL runtime or performance acceptance criteria yet.

## Version and provenance

Parent HEAD: `73454450e3f18b6046a847593da2e2c2848cc8c8`. The commit containing this report is identified by Git history; a commit cannot embed its own final SHA without changing that SHA. No game, main or stable build modifications. Poly Haven Tree Small 02, Rico Cilliers, CC0 1.0: https://polyhaven.com/a/tree_small_02 and https://polyhaven.com/license. LOD0 was obtained directly from GitHub and SHA-256 matched the R2.1 report. LOD1/LOD2 are existing meshoptimizer simplifications recovered from the same Driving Lab V1.3 package, not freshly generated. No source reduction script was run in this checkpoint. The V1.3 recorded simplification counts correspond to the GLBs below.

## Assets and static inspection

| LOD | Triangles | Vertices | GLB bytes | SHA-256 |
|---|---:|---:|---:|---|
| 0 | 5,263 | 9,018 | 1,112,600 | `5451ecdc9246b6ff9d99098c02096102156d65d2f122bab4247b301a70bf44c8` |
| 1 | 1,712 | 3,427 | 801,600 | `7ae6cf527613e053091694f26e8a0a0df87ffdf96a4415d1c1bc057a90a42ee1` |
| 2 | 652 | 1,230 | 683,408 | `12669f5eb975179bb250ea11d3658c489dbe583ae7ce53ce1f858106cf8073f8` |

LOD1 is below the suggested 2,000–3,000 triangle target; its suitability requires visual evaluation. LOD2 is geometry, not a billboard. All LODs contain three material primitives and nine embedded images: three 512×512 albedo maps, six 256×256 ORM/normal maps. Leaf albedo is RGBA and uses MASK; materials are double-sided. Approximate uncompressed RGBA8 texture storage per LOD: 4.5 MiB base, about 6 MiB with full mip chain; three separately loaded LODs may consume about 18 MiB, excluding overhead, geometry and driver implementation. Instances share resources within each LOD. Actual GPU memory was not measured.

LOD0 bounding base y≈0.0018 m, ground at y=-0.01 m; LOD1/2 base y≈0.0066 m. This is a coordinate check, not proof of visual contact. Leaf bounds shrink across levels, notably LOD2 minimum x -0.886 m vs LOD0 -1.309 m; silhouette change and popping risk must be judged in motion. This observation does not establish visual acceptability.

## Viewer

Run `python3 -m http.server 8000` from `experiments/asset-poc-r2`, then open `/viewer/`. Viewer source and Three.js r180 + MIT license are bundled locally. Orbit/zoom, manual selection, per-tree automatic distance selection with 2 m hysteresis, 1/10/30 clones, triangle counts, renderer calls, frame time and FPS controls are implemented. Distances 12/25 m are provisional, not tuned; no instancing. Rendering stats include the ground. The viewer has not been observed in WebGL in this environment, so its operation and thresholds remain to be verified.

## Validation performed

- GitHub binary downloaded, SHA-256 verified; the committed LOD0 was not modified.
- GLB header, length, index bounds and image decoding checked for all three files. Three.js r180 GLTFLoader parsed all three scenes in Node, with image bitmap decoding stubbed; actual images independently decoded with Pillow. This is not a browser rendering test.
- `node --check` passed for viewer JavaScript. A local HTTP server returned 200 for HTML, main module, loader, loader utility and three GLBs. Not an end-to-end rendering check.
- Desktop Chromium/WebGL: **NOT MEASURED**. No Chromium executable was installed. Playwright Chromium installation attempted from official CDN, but repeatedly returned an empty/truncated ZIP and ended with “End of central directory record signature not found”. A separate cloud browser could not connect to the local test server (`ERR_CONNECTION_REFUSED`).
- iPhone Safari/WebGL: **NOT TESTED**. No iPhone session was available. Separate HTTPS viewer: **NOT PUBLISHED**; no existing approved test deployment target was identified. Local viewer sources are provided.

## Visual quality and performance

Silhouette, canopy density, branch geometry, leaf transparency/clipping, two-sided appearance, normals, lighting, contact, card visibility during orbit, LOD popping, and WebGL errors remain **NOT VISUALLY TESTED**. Static bounds and metadata cannot establish their quality. No screenshots, measured draw calls, FPS or frame times are claimed. For 1, 10 and 30 trees in each LOD, draw calls/FPS/frame time remain **NOT MEASURED**; actual draw calls vary with visibility and culling. Run the viewer on desktop and on iPhone before a decision. In particular compare 1,712-triangle LOD1 against 5,263-triangle LOD0 before accepting the reduction, and inspect LOD2 canopy shrinkage.

Source/file hashes for newly added files are listed in `R2_1B_SHA256SUMS.txt`; that list excludes itself and this report to avoid self-reference. Report SHA can be computed from its checked-out bytes.
