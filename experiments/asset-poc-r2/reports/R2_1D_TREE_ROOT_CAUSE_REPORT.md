# R2.1d Recovery — Tree root-cause evidence

**Recommendation: INCONCLUSIVE.** The rejected LOD0/1/2 remain unapproved. There is clear evidence of large geometry reduction and canopy bounds shrinkage across the optimized LODs, but no controlled original-versus-derivative render was obtained and the cause of LOD0 sparsity cannot be isolated from alpha, UV, source geometry, and material effects. Do not claim that the original has the defect or that changing a cutoff fixes it.

## Identity and scope

- Inspected branch `visual/asset-poc-r2`, starting HEAD `36099b5f6fddd98d21b4827abd6dc3eee22473d7`.
- Original: [Poly Haven Tree Small 02](https://polyhaven.com/a/tree_small_02), Rico Cilliers; page lists a separate leaves alpha texture and original model. The original model was not available in the repository and was not downloaded or rendered during this recovery.
- Previous R2.1 provenance records 2,062,487 original glTF triangles and source binary SHA-256 `8da6c3c389ad8748286d1b7488cd827f75ebdad9d8f59ef7dfb0916df5edc634`; these are historical report values, not independent measurements in this recovery. It records that the existing LOD0 was meshoptimizer-simplified and its leaf alpha combined with albedo. The reduction script is not present in the inspected tree.
- The SHA of the commit containing this report is available from the file history; embedding that same commit's SHA in its contents would change the commit SHA.

## Geometry findings

R2.1 recorded LOD0 counts: branch 770, leaf 4,000, trunk 493 triangles, total 5,263. Independently decoded the GLB JSON headers of LOD1 and LOD2 from the repository via the GitHub connector and divided triangle index accessor counts by three:

| Material | LOD0, historical | LOD1, verified header | LOD2, verified header |
|---|---:|---:|---:|
| Branch | 770 | 238 | 60 |
| Leaf | 4,000 | 1,200 | 320 |
| Trunk | 493 | 274 | 272 |
| Total | 5,263 | 1,712 | 652 |

Leaf triangles drop by 70% from LOD0 to LOD1 and 92% from LOD0 to LOD2. LOD1 leaf x-min is -1.1855 m and LOD2 -0.8855 m; R2.1b recorded LOD0 -1.309 m. Bounds alone cannot quantify visible coverage or prove that particular leaf cards disappeared. Existing same-camera renders show loss of silhouette, consistent with excessive simplification, but they do not isolate reduction from UV or alpha changes. The historical source total and optimized total suggest extreme overall reduction, not a measured original leaf count or a controlled comparison.

## Materials and alpha

LOD1 and LOD2 headers both specify three material primitives; leaves use `alphaMode: MASK`, `alphaCutoff: 0.45`, a PNG base-color texture, double-sided rendering and a normal texture with scale 0.4. All three materials are double-sided. The previous R2.1 report documents the same cutoff for LOD0 and an RGBA albedo. This establishes configuration, not correct texture alpha values, UVs, tangent basis, color-space conversion, source fidelity or visual impact. Alpha cutoff and texture downsampling remain plausible contributors, not verified causes. Normals can affect shading; no controlled lighting/normal test was run.

## Existing WebGL evidence

[Previous R2.1c Actions run 42252616308](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42252616308) succeeded on Chromium 151 / WebGL 2 using SwiftShader. [Its screenshot artifact](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42252616308/artifacts/13521432041) contains `comparison-lod0.png`, `comparison-lod1.png`, `comparison-lod2.png` with camera (7,4,10), FOV 42°, and identical viewer lighting, plus other images. These are R2.1c screenshots, not new R2.1d screenshots. The R2.1c report records sparse LOD0, thinning and trunk deformation in LOD1, and a fragmented silhouette in LOD2.

Reviewed viewer, Chromium test and workflow. Viewer loads the three files with GLTFLoader and does not override their materials; it uses a hemisphere light and a directional light. The existing workflow runs on relevant viewer/test/workflow changes or manual dispatch; a report-only change does not trigger it. No new Actions run, original-vs-LOD render, corrected candidate, or fresh screenshots were created: the specific LOD0 cause is not established and changing parameters blindly would not be a controlled repair.

## Recovery access and next diagnostic

GitHub connector read the target branch and text files. Local `git ls-remote` could not authenticate; the connector returned an empty body for the >1 MB LOD0 via the contents endpoint, while LOD1/2 were inspected as base64. The official original was not retrieved in this environment. Thus UV arrays, pixel-level alpha comparison, original source primitives and direct geometry correspondence are unverified.

Next diagnostic, if authorized as a separate continuation: obtain and hash the official 1K glTF and its textures, compare its primitive counts and leaf alpha/UVs against LOD0, and render source and LOD0 under identical framing and lighting with the existing CI viewer. Isolate alpha cutoff and mesh changes one variable at a time. No mobile performance or repairability claim follows from current evidence.
