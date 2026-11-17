# R4.4 Checkpoint B — WebGL CI recovery

The [existing R4.4 workflow](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/44111617246) passed on [`3d7df23790d6dca828644e82aeaecf601542501a`](https://github.com/maxtrcgi-glitch/Driving-Lab/commit/3d7df23790d6dca828644e82aeaecf601542501a). Both materials compiled in WebGL2. The rendered scene recorded 2 draw calls and 74,448 triangles with 2048 × 2048 maps and zero shader or WebGL errors. The mobile-sized Chromium smoke check covered loading, an injected texture transfer failure, Retry, dolly and Copy Diagnostics.

The [original run](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/44105892220) timed out at `capture.cjs:29` while Playwright waited for the first canvas screenshot's element to become stable. The harness now reads the WebGL buffer in the animation frame that renders it. The timing passes use a fixed 296 × 167 drawing buffer and extend the original 4.5-second sampling window when necessary to collect at least 12 frames, with a 30-second sampling deadline.

## WebGL captures

Each camera pair uses the same Blender-derived road and lane-marking geometry. A uses tiled PBR and B uses stochastic sampling. All six captures are 1152 × 648 and each A/B pair has distinct rendered pixels.

| Camera | A | B |
| --- | --- | --- |
| Driver Eye | [A](webgl-driver-A.jpg) | [B](webgl-driver-B.jpg) |
| Roadside | [A](webgl-roadside-A.jpg) | [B](webgl-roadside-B.jpg) |
| Overview | [A](webgl-overview-A.jpg) | [B](webgl-overview-B.jpg) |

GitHub Actions refused the PNG artifact upload because the repository owner's artifact storage quota was exhausted. The JPEGs above are the verified fallback captures recovered from the passing job log.

## Driver Eye timings

Chromium WebGL2 ran through ANGLE SwiftShader on GitHub's Ubuntu runner. These are browser frame intervals under software rendering. The four passes had 12 samples each, so each p95 is the largest observed interval in that pass. Physical mobile GPU performance remains unmeasured.

| Pass | Material | Frames | FPS | Median frame (ms) | p95 frame (ms) |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | A | 12 | 0.70 | 1266.6 | 4166.6 |
| 2 | B | 12 | 2.04 | 449.9 | 916.6 |
| 3 | B | 12 | 1.26 | 466.7 | 2516.6 |
| 4 | A | 12 | 0.59 | 1283.3 | 2566.6 |

[Raw timing and renderer diagnostics](webgl-diagnostics.json)
