# R2.1c — Real browser validation and visual quality gate

**Recommendation: REJECTED for current visual use; WebGL loading passes.** The restored LODs are visibly far too sparse in this viewer; LOD1/2 also lose trunk shape and foliage. This is a quality decision for these derivatives and viewing conditions, not a judgment on the original Poly Haven source. Diagnose geometry, alpha maps, UV/material settings and simplification before deciding how to repair; root cause is not established by the screenshots.

## Test identity and artifacts

- Tested commit: `acf113ea90b07cd6e5c18a126ef7ba2f5c4fc882`, branch `visual/asset-poc-r2`. This report was committed afterward; its containing SHA is in Git history.
- [GitHub Actions run 42252616308](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42252616308) — success; real Chromium/WebGL, no mocked WebGL.
- [Screenshot and measurements artifact](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42252616308/artifacts/13521432041) — `r21c-tree-webgl` (expires 2027-02-04). Contains close/medium/far, same-scale LOD0/1/2, 10/30 trees, JSON environment and measurement data, and browser errors.
- Chromium 151.0.7922.34, Ubuntu 24.04 runner, WebGL 2.0. Unmasked renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`. This is **software rendering on a hosted runner**, not iPhone or hardware-GPU performance. Viewport 1280×800, DPR 1.
- Three GLBs loaded, `window.viewerReady` and nonzero `viewerStats` observed. No pageerror, console error, failed request or HTTP >=400 recorded. The test did not explicitly poll `gl.getError()` and does not prove error-free operation across devices.

## Observed appearance

Screenshots inspected: `lod0-close.png`, `comparison-lod0.png`, `comparison-lod1.png`, `comparison-lod2.png`, `30-trees.png`.

- **LOD0:** recognisable trunk and branches, but canopy is extremely sparse and fragmented against the sky. It does not resemble a convincing full roadside tree in this scene. The close view crops part of the crown; the same-scale shot shows the full silhouette. Leaf fragments appear sharply cut; the precise contribution of alpha cutoff, texture/UV, geometry and lighting is unverified.
- **LOD1:** at the same camera position the canopy becomes still thinner, with sizeable gaps, and the trunk ends in a visibly sharp, unnatural point. Not visually suitable as a medium-distance replacement in this configuration.
- **LOD2:** only a handful of separated foliage fragments remain; the crown's coverage and shape change markedly from LOD0 and the pointed lower trunk remains. Not visually suitable as the far replacement in this configuration.
- The branch surface appears shaded and textured in the close screenshot; a reliable normal-map correctness assessment needs multiple views and controlled lighting. Transparent regions render, but leaf clipping and overall coverage require investigation. Ground contact is difficult to judge on this flat unshadowed surface.
- Static screenshots cannot establish whether foliage cards rotate/flatten noticeably in motion, nor measure the temporal severity of LOD popping. Same-scale comparisons show differences likely to cause visible popping, but an orbit/transition recording is still needed. No LOD transition sequence was run in this test.

## Runtime measurements

All values are actual viewer snapshots; forced LOD per row. Draw calls and rendered triangles include the ground (one draw call, two triangles). Camera xyz: for 1 tree `(8,5,10)`; 10 trees `(32,25,44)`; 30 trees `(35,28,52)`; FOV 42°. Active LOD for each row is the specified level for every tree. Screenshot matrix additionally uses close `(4,3,5)`, medium `(9,5,12)`, far `(17,8,24)`, and common comparison `(7,4,10)`.

| Trees | Active LOD | Draw calls | Rendered triangles | FPS | Average frame ms |
|---:|---:|---:|---:|---:|---:|
| 1 | 0 | 4 | 5,265 | 5.45 | 183.51 |
| 1 | 1 | 4 | 1,714 | 5.11 | 195.64 |
| 1 | 2 | 4 | 654 | 4.88 | 204.71 |
| 10 | 0 | 31 | 52,632 | 4.80 | 208.32 |
| 10 | 1 | 31 | 17,122 | 4.62 | 216.47 |
| 10 | 2 | 31 | 6,522 | 5.06 | 197.58 |
| 30 | 0 | 91 | 157,892 | 6.66 | 150.18 |
| 30 | 1 | 91 | 51,362 | 6.56 | 152.40 |
| 30 | 2 | 91 | 19,562 | 5.88 | 169.99 |

**FPS caveat:** viewer reports a moving average of up to 180 frames. The test waits four seconds after each configuration, so FPS/frame-time samples can still include prior configurations and cannot support a reliable LOD performance comparison. Browser scheduling, load, rasterized screen coverage and software rendering also influence them. Draw calls and rendered triangles are current-frame renderer counters; no extrapolation to mobile is valid. Full raw snapshots are in the artifact.

## Outstanding / scope

No iPhone Safari test and no separate HTTPS publication. Further validation requires an orbit and distance-transition recording, gl.getError checks, independently reset/warmed performance intervals and actual device testing. This checkpoint adds diagnostic access to camera/environment, browser test and workflow; it does not alter GLB geometry, stable game, physics, traffic or game cameras. No merge.

R2.1b's `R2_1B_SHA256SUMS.txt` is a historical checkpoint list: its `viewer/viewer.js` hash describes the earlier version, before R2.1c added the camera/environment diagnostic hook. The tested viewer's SHA-256 is `f0909bd033f2e74a9e8dc3d66492d11bcb8b79b257269b9d7255f566af53e1e0`; LOD hashes remain unchanged.
