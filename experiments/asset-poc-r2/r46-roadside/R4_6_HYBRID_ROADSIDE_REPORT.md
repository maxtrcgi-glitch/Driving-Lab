# R4.6 Hybrid Roadside — Production Art Pass

Status: READY FOR DIRECTOR ART REVIEW. This is a review submission, not Director art approval.

The wide brown outer-verge strip is replaced by a narrow grey mineral fringe, mixed soil/low-grass cover, embedded stones and rooted low plants. Identical Driver Eye and Roadside views show the change without different lighting or exposure. The constructed asphalt edge deliberately stays straight. Roadside Close and the additional edge view show real geometric contact and local shadows. Overview shows the transition in the existing composition.

## Evidence

All eight before/after PNG renders are native 1152×648 Cycles outputs, 96 samples with adaptive threshold 0.025 and OpenImageDenoise, rendered with official Blender 4.3.2 (32f5fdce0a0a). The original three cameras, lighting, exposure 0.82 and AgX are retained. A temporary fourth camera is created identically for both edge renders and is not saved into the scene. Comparison images contain only labels and side-by-side placement; no grading or retouching.

- [Driver Eye](review/driver-before-after.jpg)
- [Roadside Close](review/roadside-before-after.jpg)
- [Elevated Overview](review/overview-before-after.jpg)
- [Road-edge profile](review/edge-before-after.jpg)
- [Checkpoint A](review/checkpoint-A-roadside.jpg)

Full-resolution PNGs, audits and checksums are in the accompanying Render Evidence archive. The editable native project, packed maps, three added scan maps, scripts and their helper are in the Source archive. Archive links and SHA-256 are recorded in delivery.json after upload. The original R4.5.1 rollback archive remains available at https://chatgpt.com/library?file_id=libfile_9a470728ad688191b2b2f3ac43ab0b7c&account_id=personal . Checkpoint A native: https://chatgpt.com/library?file_id=libfile_ac48520d83e08191823920b448a69a62&account_id=personal .

## Inspection and construction

Starting branch HEAD was cc6b2ad5ede7affde3a2c53795cec4a9096b423f. Actual R4.5.1 packed native was loaded rather than reconstructing a scene. The existing A9 public-domain photograph was inspected: a maintained motorway calls for an orderly pavement edge and restrained verge disturbance, not erosion or a decorative ditch.

The route has radius 630 m. Outside pavement edge is lateral +13.8 m; opposite edge -17 m. The outside white stripe ends at 10.9 m, leaving about 2.9 m paved shoulder. The existing verge and slope topology are preserved. Only the two existing verge meshes receive small height changes (maximum 0.012367 m), fading to zero at the exact paved boundary and beyond 2.2 m. No subdivision or ditch was added.

Three organized systems:

1. Roadside_Material_Transition: the shared R46_Cover vertex attribute drives mineral-to-low-cover selection. Distance from the actual curved road edge is the primary input. The cover begins beyond 0.13 m; restrained longitudinal variation changes the transition width around 0.68 m, with small exposed-soil pockets. Existing Leafy Grass includes soil/dry cover; the new gravel scan includes a mineral/soil matrix. This is a two-scan coverage model, not three separately invented procedural surfaces.
2. Roadside_Profile_Correction: existing verge objects are linked into an editing collection; maximum height adjustment is 12.37 mm. The seam vertices stay fixed.
3. Roadside_Detail_Instances: four shared 20-triangle mineral-fragment meshes, three existing scanned grass variants and one dry material variant. Instancing uses the same coverage function, deterministic clustered sampling and a BVH of the corrected terrain. Stones embed into the surface; vegetation roots sit 9 mm below it. Density decreases past station 65 m; the focused outside roadside extends from station -18 to 210 m. No new forest placement is involved.

## Texture mapping and normals

Existing Surface metres UVs are unchanged. The old 1.9 m verge tile multiplied by 0.95 makes the new Gravel Stones scan a 2 m tile. Base Color, Roughness and Normal use identical scale and translated coordinates. Existing Leafy Grass mapping remains 1.9 m on this verge. Two translated samples reduce repeated patches, without rotating tangent bases or blurring maps.

Normals decode as normalize(2c−1). Each scan-selection and cover blend interpolates vectors in the same tangent frame and renormalizes. The result is re-encoded and passed through one tangent Normal Map node tied to Surface metres. Translation and uniform positive scaling preserve tangent orientation. This is normalized coverage interpolation, not additive bump layering or raw RGB normal mixing. Normal strength remains 0.65.

Diffuse is sRGB; roughness and OpenGL normal are Non-Color. All dependencies are packed. Mineral fragments use an 8 cm crop of the same scan and roughness 0.83; their 3D shapes are newly authored low-poly geometry, not scanned rock meshes.

## Sources and rights

- New: Poly Haven Gravel Stones, Amal Kumar, CC0, https://polyhaven.com/a/gravel_stones . Only three 2048² JPG maps were retrieved. Exact URLs, sizes and SHA-256 are in assets/manifest.json; fetch_assets.py verifies them. License: https://polyhaven.com/license . The previous Gravel Road scan was too fine and brown for this exposed mineral fringe.
- Reused packed terrain: Poly Haven Leafy Grass, CC0, https://polyhaven.com/a/leafy_grass . Original source provenance remains in the R4.1c manifest.
- Reused packed geometry: Poly Haven grass_bermuda_01 seedlings a/b and grass_medium_02 variant a, CC0; https://polyhaven.com/a/grass_bermuda_01 and https://polyhaven.com/a/grass_medium_02 . No new vegetation download.
- Four authored mineral-fragment shapes: generated by build_roadside.py; redistribution permitted with the project. Dry growth shares an existing grass mesh with a separate restrained tint material.
- A9 photo: existing reference/provenance at r41-highway-master, Kira Nerys/public domain, unchanged.

## Budget and verification

| Added item | Count |
|---|---:|
| Small stones | 634 |
| Larger stones | 7 |
| Low grass | 448 |
| Dry growth | 81 |
| Total instances | 1,170 |
| Asset variants | 8 (7 distinct source geometries; 4 newly authored meshes) |
| New unique mesh triangles | 80 |
| Evaluated stone triangles | 12,820 |
| Evaluated vegetation triangles | 201,929 |
| Total additional evaluated triangles | 214,749 |
| New materials | 3 (terrain, stones, dry growth) |
| New textures | 3 × 2048² |

Texture estimate for added maps: 48 MiB RGBA8 without mips, 64 MiB with full mips; up to 192 MiB if held as RGBA float32. This is a format-based estimate, not measured runtime VRAM. Existing vegetation/terrain maps are reused. No iPhone performance claim or automatic glTF compatibility claim is made.

validation.json records all checks passing: unchanged protected geometry and materials, all original UVs, camera/light transforms and settings, exposure/world, original image properties and exact terrain seam vertices. Only the two permitted verge meshes and assignments differ. No floating/fully buried stones or paved overlap were found; 529 vegetation roots passed ground-contact checks. Visual inspection of all final cameras found no obvious new periodic scatter or channel mismatch at delivered resolution. This does not prove absence of tiling at every future viewpoint.

A fresh deterministic B rebuild reproduces all counts and placement SHA-256:
05e9b052ba7462e601672b9815221b3b0531b76a96d0a39d0beca0c369b08f85.

## Reproduction and rollback

Use official Blender 4.3.2 with OIDN. The downloaded official Linux archive SHA-256 was 4da1c956673c0485e63054e563ee69198cc8f80d8157dd7592dffc8a6a5592e6. The packed final native opens without downloading any assets.

From the archive root, let SCRIPT=experiments/asset-poc-r2/r46-roadside. Restore the unchanged R4.5.1 native from the linked rollback archive, then run:

```sh
python3 "$SCRIPT/fetch_assets.py"
blender -b R4_5_1_Ground.blend -P "$SCRIPT/build_roadside.py" -- A checkpoint-A.blend
blender -b checkpoint-A.blend -P "$SCRIPT/build_roadside.py" -- B R4_6_Hybrid_Roadside.blend
blender -b R4_6_Hybrid_Roadside.blend -P "$SCRIPT/render_review.py" -- after
blender -b R4_5_1_Ground.blend -P "$SCRIPT/render_review.py" -- before
```

validate_roadside.py takes an audit JSON output path after --. compare_validation.py takes the evidence directory containing the before/after audits, budget and deterministic repeat JSON. Source archive includes the existing r41b/edit_scene.py helper in its required relative location.

Checkpoint A commit: 4fddfd3217ca42037c3373ae0efcfe73f68fe7fd. Final B commit is the commit containing this report and delivery.json; exact SHA is provided in the handoff to avoid a self-referential commit hash.

## Artistic limitations and deferred work

The improvement is visible at driving distance, but close-up botanical silhouettes remain limited by the existing grass assets and can look sparse/twig-like. The small mineral fragments intentionally use simple authored shapes; they are suitable for roadside parallax, not hero rock close-ups. Ground cover remains relatively pale under the unchanged daylight. These concerns are shown openly in the edge comparison. The median's original brown material, guardrail appearance, forest, asphalt and markings are preserved and outside this pass. The 12 mm profile change adds restrained relief rather than a dramatic terrain redesign.

No new drainage swale was constructed. Future modular profiles should determine a swale from longitudinal grade, crossfall and a real outfall; a ditch is not justified merely by a material seam. No WebGL export, demo update or deployment was performed. Stop here for Director review.
