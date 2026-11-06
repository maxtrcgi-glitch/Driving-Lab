# R2.1 — Tree Small 02 checkpoint

## Provenance

- Asset: Tree Small 02, Rico Cilliers / Poly Haven: https://polyhaven.com/a/tree_small_02
- License: CC0 1.0, https://polyhaven.com/license and https://creativecommons.org/publicdomain/zero/1.0/. Attribution is retained voluntarily.
- This is the existing optimized LOD0 from the recovered Driving Lab V1.3 package, not a new reduction. Its recorded source mesh was simplified with meshoptimizer and leaf alpha combined with its color map. No claim of new LOD generation in R2.1.
- Source mesh recorded in V1.3: tree_small_02.bin, SHA-256 `8da6c3c389ad8748286d1b7488cd827f75ebdad9d8f59ef7dfb0916df5edc634`. Original downloaded glTF source contained 2,062,487 triangles across three primitives according to the V1.3 optimization report. The source is not included here.

## Runtime asset

- File: `experiments/asset-poc-r2/assets/vegetation/tree_small_02_lod0.glb`
- GLB 2.0, self-contained; 1,112,600 bytes; SHA-256 `5451ecdc9246b6ff9d99098c02096102156d65d2f122bab4247b301a70bf44c8`.
- 5,263 triangles, 9,018 vertices across three primitives: branch 770/1,121; leaves 4,000/7,399; trunk 493/498. Vertex counts are glTF accessor counts.
- Three materials; nine embedded images. Albedo: 512×512 (branch JPEG, leaf RGBA PNG, trunk JPEG); ORM and normal: 256×256 each (six JPEGs). Leaf material uses alpha mask, cutoff 0.45; all three materials are double-sided. 1K source maps were resized in the prior V1.3 preparation.
- Leaf alpha testing and three material primitives still have a mobile rendering cost. No compression extension is required by the GLB; no KTX2, instancing or additional LOD included.

## Validation and limitations

GLB header and total/buffer lengths checked; all three index arrays checked against vertex counts; all nine embedded images decoded and dimensions checked. Source and CC0 confirmed on Poly Haven. This is a structural check, not a glTF Validator certification or a visual quality approval. No WebGL rendering, device benchmark, FPS, visual comparison or mobile performance claim was made in this checkpoint. Inspect appearance in the target renderer before accepting for the final highway.
