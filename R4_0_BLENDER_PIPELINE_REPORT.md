# R4.0 — Blender Pipeline Evidence Review

**Result: PASS** for the single-asset Blender → GLB → desktop Chromium WebGL pipeline demonstration, with the visual limitations below.

## Evidence and provenance

- Source branch: `visual/asset-poc-r2`; source commit: [86e6e806808445320220c90807b90e00843c9233](https://github.com/maxtrcgi-glitch/Driving-Lab/commit/86e6e806808445320220c90807b90e00843c9233).
- [Actions run 42460573674](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42460573674), job `blender-webgl`: completed successfully. Artifact metadata identifies the same branch and commit.
- [Evidence artifact 13609164618](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42460573674/artifacts/13609164618) contains the actual master .blend, exported GLB, both Blender renders, WebGL screenshot and both statistics files. GitHub lists expiry as 2027-02-06.
- Source asset SHA-256 in Blender statistics: `188c8b1510d9e19d5add90be91cd83cf2ee234dc62269263b6a504dd9f865ac6`.

## Evidence reviewed

Inspected `blender-full.png`, `blender-close.png`, `webgl-export.png`, `blender-stats.json` and `webgl-stats.json`. The full images show the same long corrugated rail, six visible posts and dark blockouts; overall proportions, alignment and silhouette appear reasonably preserved. The Blender close-up shows galvanized surface detail, fasteners and posts; the WebGL full view is too distant to compare those fine details reliably.

WebGL looks darker and more contrasty, with a different background and no visible ground shadow compared with the Blender Cycles render. Different lighting and scene presentation prevent attributing these differences to the GLB export alone. No obvious missing major component, gross deformation or broken geometry is visible in the supplied views. No matched WebGL close-up is available, so fine texture, normals, fasteners and material fidelity cannot be conclusively judged. The Blender images are visibly noisy; the source commit disables denoising.

## Recorded statistics

| Metric | Blender | WebGL |
| --- | --- | --- |
| Triangles | 2,212 | 2,212 |
| Dimensions (m, reported axis order) | 12.0 × 0.4465 × 0.8115 | 12.0 × 0.4464999884 × 0.8115000129 |
| Meshes | 3 mesh objects; 4 imported objects | 4 meshes |
| Materials | 2: hot-dip galvanized steel; recycled plastic blockout | 2 |
| Textures | 4 packed 2048 × 2048 source images | 4 |
| UVs / normals | Not quantified in Blender statistics | Present on all 4 reported meshes |
| Renderer | Blender 4.0.2, Cycles available | Chromium WebGL 2.0; 4 draw calls |
| Errors | — | GL error 0; errors array empty |
| Asset size | Source 3,540,124 bytes | Export GLB 3,539,912 bytes |

The mesh counts use different reporting units and do not establish a loss; equal triangle counts and matching bounds support geometry preservation. Presence counts do not prove correctness of every UV, normal or material pixel.

## Scope and limitations

This is a technical demonstration for one existing guardrail, not visual approval of a complete environment. It does not establish iPhone performance, Safari compatibility, production optimization, matched-light material parity or full-scene fidelity. No pipeline rerun or new render was performed during this review.
