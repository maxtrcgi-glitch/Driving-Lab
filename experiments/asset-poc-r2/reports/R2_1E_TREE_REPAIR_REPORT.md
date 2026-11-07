# R2.1e Recovery — Tree visual repair report

**Recommendation: REJECTED for the present R2.1e candidate.** It visibly worsens canopy coverage versus old LOD0 in the available matched view. This rejects this candidate, not the source asset or the possibility of a future repair. Whether a mobile-quality tree can be made from this source remains inconclusive; no production or mobile acceptance is claimed.

## Evidence and scope

- Branch `visual/asset-poc-r2`; verified HEAD before report: `480b5a46e75e723872683e9d7e7e7557cbb6d06e`. The existing [successful run 42261857853](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42261857853) used that same SHA. Job 128043580940 succeeded.
- Downloaded and visually inspected all four PNGs in [artifact 13524074746](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42261857853/artifacts/13524074746). The downloaded ZIP SHA-256 was `b76eb89fbb2fddd5a32ef52e33a2232bf001121c817672984bb3753b1dbca856`, matching GitHub's artifact digest. This artifact also contains old LOD0.
- Existing run logs show source BIN SHA-256 `8da6c3c389ad8748286d1b7488cd827f75ebdad9d8f59ef7dfb0916df5edc634`, matching the expected source. This is evidence from the prior run, not a fresh source download.
- The existing test script uses 1280×800, DPR 1, camera (7, 4, 10) looking at (0, 2, 0), FOV 42°, identical background, ground, hemisphere and directional lights. Chromium WebGL 2 uses SwiftShader. Four screenshots are independent page loads. No model transforms or material overrides except the explicitly described original-alpha mode.
- The test detects page/request errors and GL errors, not visual quality. All four reported zero GL error and no captured errors. No workflow was rerun and no model was regenerated for this report.

## Matched-view visual observations

| Image | Observation |
| --- | --- |
| `original.png` | Broad, recognizable leafy canopy, dense fine detail and silhouette. Default glTF material path; this is not a strict alpha-mask reference. |
| `original-alpha.png` | Same source geometry, with separate original alpha map and alpha test 0.45. Canopy remains broad and leafy, though somewhat more open than default; branches and small leaves remain visible. This is the closer reference for a masked canopy. |
| `lod0.png` | Tree structure remains recognizable, but large holes and sparse disconnected leaf clusters replace much of the original canopy. |
| `candidate.png` | Significantly fewer visible leaf clusters than old LOD0; canopy is almost bare, with fine isolated flecks and exposed branches. It is visually further from the source in this view, despite more rendered triangles. |

Only one fixed camera and static frame were reviewed. No close-up, rotations, motion, shadow, different background or actual device comparison is supplied by this artifact. These observations do not establish performance or behavior at other distances.

## Alpha conversion versus geometry

The prior investigation identified a 16-bit-to-8-bit alpha conversion problem. The current candidate generator reads the source alpha as uint16, explicitly scales by 257 and rounds to uint8, attaches it to RGB and downsamples to 512×512 with Lanczos. The old leaf material uses MASK with cutoff 0.45; direct inspection of the artifact's LOD0 confirms this. These are distinct from geometry reduction. The original source alpha pixels and original conversion procedure were not independently available in this recovery, so the old alpha error and candidate's fidelity were not re-measured pixel by pixel; do not interpret the successful render as proof of exact alpha fidelity. Downsampling, cutoff, UVs and material/texture handling can still affect coverage.

The candidate generator also replaces old leaf geometry with a spatial selection of 400 connected components from the original mesh, copying source positions, normals and UVs; trunk and branches come from old LOD0. Thus old LOD0 versus candidate changes both leaf geometry and the texture simultaneously. The result is **not** an alpha-only A/B test, nor a geometry-only A/B test. The worse candidate does not prove that corrected alpha alone causes a loss, or that alpha had no role in old LOD0's sparsity. Farthest-point selection of just 400 components is a plausible contributor, but its causal contribution has not been isolated. Triangle count alone does not measure canopy coverage.

Run-reported rendered triangle counts include the two ground-plane triangles:

| Mode | Rendered triangles including ground | Draw calls including ground |
| --- | ---: | ---: |
| old LOD0 | 5,265 | 4 |
| candidate | 18,352 | 4 |
| original-alpha | 2,062,489 | 4 |
| original default | 4,001,869 | 5 |

The default original's render count differs from original-alpha because the material/render path differs; these are renderer statistics, not unique source geometry counts or GPU timings. Candidate count exceeds LOD0 by about 3.5× yet looks sparser in this frame.

## Remaining defects and mobile risks

- Candidate: substantial canopy coverage and silhouette loss, exposed branches, fragmented/dot-like foliage; old LOD0 is also visibly too sparse against original-alpha.
- R2.1d recorded additional silhouette thinning and trunk deformation at LOD1 and fragmentation at LOD2. Those LODs were not re-evaluated in this R2.1e artifact and remain unapproved.
- Fine alpha-masked foliage, double-sided materials, overdraw and dense instances may cost mobile GPU fill rate and create shimmer/aliasing, especially in motion. Texture memory, decompression, draw calls, LOD transitions, device heating and frame time must be measured on target iPhone/Safari in representative scenes; triangle totals and desktop software-rendered stills do not establish a mobile budget.
- Candidate has no demonstrated visual or performance advantage suitable for shipping; do not replace the game asset or promote these LODs based on the successful workflow.

## Next diagnostic, if separately authorized

Use the already recovered source and preserve this evidence. Perform a controlled matrix with identical camera, lighting, geometry, UVs and cutoff: old geometry with old versus correctly converted alpha, then fixed alpha with old versus alternative geometry. Inspect texture channels and per-cutoff coverage before and after resizing. Compare multiple angles, distances and motion against original-alpha; evaluate a representative road scene on target hardware before setting budgets or accepting any LOD. Avoid treating original default and original-alpha as identical material paths. No additional asset work is authorized by this report.
