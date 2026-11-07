# R3.1 — Original highway asset visual validation

Date: 2026-11-07. Branch: `visual/asset-poc-r2`. Starting HEAD verified: `f86b0ff514585cd1b6695bdd7a8a5052afef7624`. Viewer/test checkpoint: `ce8fa5f59d6fb2aaf2a8790fb3fb59e4a27d2d4b`. The commit containing this report is identified by Git history; a commit cannot include its own final SHA without changing it.

## Verdicts

* **Grab3D Highway Segment — REJECTED.** It is a usable modular mockup, but its extremely flat surface, conspicuous white marking strips, simple median/verge and repeated wheel-like longitudinal bands leave it looking synthetic at driver height. The coarse, uniform shoulder transition and simplified roadside posts do not meet the requested realistic direction. Do not repair it in this checkpoint. This judgment is based on the original GLB in neutral lighting; a matched R2.3c comparison was not run, so superiority/inferiority to R2.3c is not quantified.
* **Innerscene Guardrail — ACCEPTED FOR OPTIMIZATION, subject to Director approval.** The actual W-beam shape, end-to-end beam, bolts, posts and blockouts make it a useful candidate. Metal texture appears coarse and facets/blotches are visible close up; inspect at driving distance in context before integrating. This is not production approval. The next step, if approved, is a separate instancing/texture-memory and seam assessment in the highway scene, preserving the source as reference.

## Source and provenance

| Asset | Official source | Original download | License evidence | File size / SHA-256 |
|---|---|---|---|---|
| Grab3D Highway Segment | https://grab3d.com/models/city/highway-segment/ | https://grab3d.com/dl/highway-segment/highway-segment.glb | Source [LICENSE.txt](../r31/evidence/grab3d-LICENSE.txt) states CC0; [manifest](../r31/evidence/grab3d-manifest.json); GLB extras also `CC0-1.0`. The license states Blender procedural scripts with AI-assisted code, not generated geometry. | 14,260,872 bytes; `178f41be4922db5d4e70f6e08b054d2c303ad9c4663f3e4a18bb8fd94c33594e` |
| Innerscene Guardrail | https://www.innerscene.com/tools/library/3d-parts/guardrail-4b2b2ff5 | https://www.innerscene.com/api/library/guardrail-4b2b2ff5/download | Official listing states CC0; GLB root extras `license: CC0-1.0`, `original_design: true`. No separate included license file observed. | 3,540,124 bytes; `188c8b1510d9e19d5add90be91cd83cf2ee234dc62269263b6a504dd9f865ac6` |

Both originals are binary glTF with embedded images; no mesh or artistic edits were made. Source pages and license statements were inspected, but authorship and upstream rights cannot be independently guaranteed. If the files were preserved by the validation workflow, see `../r31/assets/`. The exact copy is verified against the hashes above. Innerscene source has no separate downloaded license text; record the source URL and in-file metadata alongside any redistribution.

## Measured structure

Counts below are taken from GLB accessors/primitives; vertex counts sum primitive POSITION accessors and may count shared vertices multiple times. Dimensions are Three.js transformed world-axis bounds, interpreting glTF units as metres. Geometry was not simplified. Exact accessor, image, transform and material data are in [road metadata](../r31/evidence/highway-segment.json) and [guardrail metadata](../r31/evidence/guardrail.json).

| Measurement | Highway segment | Guardrail |
|---|---:|---:|
| Bounds (X × Y × Z) | 23.6 × 1.1575 × 23.6 m | 12 × 0.8115 × 0.4465 m |
| Meshes / primitives / materials | 5 / 5 / 5 | 3 / 4 / 2 |
| Triangles / summed accessor vertices | 37,532 / 41,428 | 2,212 / 2,838 |
| Render draw calls / triangles, single asset | 5 / 37,532 | 4 / 2,212 |
| Embedded image files / renderer texture count | 14 / 14 | 4 / 18 |
| Estimated uncompressed RGBA8 with complete mip chain | ~352.6 MiB | ~85.3 MiB |

The estimates sum each embedded image once at 4 bytes/texel × 4/3 for mipmaps; GPU representation, NPOT padding, duplicate texture instances, implementation and driver compression may differ. Renderer texture counts are Three.js allocation counters, not image-file counts or measured memory. Guardrail's 18 renderer textures versus four image files deserves investigation before budgeting. No actual iPhone GPU allocation or performance was measured.

Road: asphalt base color and normal 4096×3540; roughness 2048×1770. Body has three 2048² maps; grass 3072² base and 1536² normal/roughness; markings two 512² maps; verge 2048² base/normal and 1024² roughness. Source metadata says 2048px, but actual embedded sizes above are authoritative. All five primitives have UVs. Materials are double-sided, with opaque default alpha; road has separate asphalt, body, grass, marking and verge materials. The body alone contributes 37,336 triangles. Five child meshes each translate Y by −0.2 m. The source describes 11.8 m texture/marking period and 23.6 m longitudinal module; this is a source claim, not a tested adjacent-module seam guarantee. Road width is two lanes each direction; no three-lane carriageway.

Guardrail: four embedded 2048² JPEGs: galvanized base/normal and dark blockout base/normal. Its two double-sided opaque materials have metallic/roughness scalar factors (steel 0.65/0.55; blockout 0/0.8), rather than roughness texture maps. All four primitives have UVs. Nodes have default identity transforms. Geometry includes W-beam, steel posts/blockouts and 1,584 triangles of button-head bolts. Six visible posts span the 12 m module. Adjacent-module joins were not tested.

## Real Chromium WebGL evidence

Successful run: https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42394818313  
Original artifact: https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42394818313/artifacts/13583072551

Three.js `GLTFLoader` loaded the original assets in Chromium WebGL 2 (software SwiftShader, 1280×800), neutral background, hemisphere and directional illumination, no invented scene geometry. `OrbitControls` permits inspection; preset camera views are available through URL parameters. Actual framebuffer captures:

| Asset | Images |
|---|---|
| Highway | [Driver eye](../r31/evidence/road-driver.png) · [Roadside](../r31/evidence/road-roadside.png) · [Overview](../r31/evidence/road-overview.png) · [Asphalt detail](../r31/evidence/road-asphalt.png) · [Marking detail](../r31/evidence/road-marking.png) |
| Guardrail | [Full module](../r31/evidence/rail-overview.png) · [Profile and posts](../r31/evidence/rail-close.png) · [Material detail](../r31/evidence/rail-detail.png) |

The asphalt and marking screenshots currently use the same close camera; guardrail close and detail use the same camera. They are genuine frames but not independent detail views. The road camera is set to 1.2 m above its local ground with fixed field of view; it shows the short module ending against the background. The GLB and its materials/textures rendered, no critical browser errors were reported by the test, and `gl.getError()` returned zero in each captured view. Successful rendered pixels show a working WebGL program for these frames; an explicit exhaustive shader link-status audit was not performed. The viewer changes no geometry or original material parameters, aside from Three.js standard glTF handling and the neutral scene lighting.

## Limitations

No apples-to-apples matched render against R2.3c, no multi-module seam or moving-camera stability test, no camera/device iPhone check and no mobile frame-time benchmark. Neither full-road nor guardrail visual verdict is based on iPhone performance. Repeat draw calls may increase substantially without batching; actual costs depend on implementation. No asset optimization, shader development, road rebuilding or production integration was performed. Stable gameplay was outside the change scope. Director review is required before any next step.
