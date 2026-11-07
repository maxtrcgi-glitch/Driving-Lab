# R2.2a — Road PBR material checkpoint

**Recommendation: CONDITIONAL.** Poly Haven Asphalt Track 1K is a candidate for further controlled evaluation, not approved for game integration. The 1K and 2K captures look very similar at the tested views, while 1K uses one quarter of the estimated uncompressed GPU texture memory. Both show objectionable repeated broad bands/tiles under grazing illumination, and appear very dark in the frontal lighting setup. Those defects, the limitations of the lighting rig and the absence of real-device measurements prevent acceptance as a finished modern-highway material. Do not modify the game or integrate it from this checkpoint.

## Source, files and provenance

- [Poly Haven Asphalt Track](https://polyhaven.com/a/asphalt_track), author Dimitrios Savva, [CC0](https://polyhaven.com/license), nominal width 2 m. It is photographed track tarmac; relevance to a particular modern highway remains a visual judgement, not established by its name.
- Selected for fine, dark aggregate without added road markings, large cracks or debris. Other considered sources: Poly Haven Asphalt 02 has visible cracks and Worn Asphalt has debris; ambientCG provides CC0 materials as an alternative library. No new dirt, cracks or markings were added.
- Actual assets are the six downloaded, unmodified JPGs in [`assets/asphalt-track/`](../assets/asphalt-track/). [Manifest](../assets/asphalt-track/manifest.json) records exact source URLs, byte counts and SHA-256 hashes for each. Source downloads were performed once by Actions; the committed test uses these files. No AO is used: its benefit for this thin open surface has not been established and it would add a texture/packing cost. No displacement is used.

| Variant | Diffuse SHA-256 | Normal GL SHA-256 | Roughness SHA-256 |
| --- | --- | --- | --- |
| 1K, 1024² | `05c4e79cd99160075969d37bfc6ef72be262153a410bb45510b2c23f7303894c` | `18caf02427a7cd9cd577ceae5aa9daa7bb3ffba60598e2df8aaf75d1925a8a94` | `0646d0cfbe6bf9ea4a8a9e43aec826e7ec32a10b8aff61bf5a4ec02b1bc3c363` |
| 2K, 2048² | `742d1d79560bd661d5871afc857e981e25dcd563bfd24385cbd063ebcaeef06c` | `d9c635867ed0e022580baac711e0dcff679f8301cd906dff162be1bfbad8cfcd` | `b934fb6fbe05770df95fa94fee3a12d45eb121621ce96e9b262f403d49ee493e` |

## Controlled comparison

[Successful Actions run 42332911827](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42332911827), test code SHA `9f20390365b764c5278b5a25e7b4202f7f004ef1`. [Download screenshot and stats artifact](https://github.com/maxtrcgi-glitch/Driving-Lab/actions/runs/42332911827/artifacts/13557369528): contains eight PNGs named `{1k|2k}-{close|distance}-{front|grazing}.png` and `stats.json`. Artifact ZIP SHA-256 `1d6ec631c911edbc98ee048164df514c300106ef3336b4a4c0c95e61caf71355` matched GitHub's digest. Actual Three.js/Chromium WebGL 2 rendered via SwiftShader, not a hardware or iPhone measurement. Images are 1280×800, DPR 1. Same camera, surface, lighting and renderer per matched 1K/2K pair. A 16×48 m plane repeats the 2 m material 8×24; this is a test patch, not a highway scene.

Eight modes passed the script's dimension, page/request and WebGL error checks. Every mode logged one draw call, two triangles, three textures and GL error zero. Counts characterize only this isolated plane; no FPS, GPU timing or device memory was measured. Source textures were committed by successful run as `89530745dd1c55e925b94295673a77800cd58107`. The report commit follows that commit; obtain its SHA from Git history because a commit cannot reliably contain its own SHA.

- **Close/front:** both very dark, with subtle aggregate in the foreground; little visible quality difference between resolutions. The appearance could reflect material, lighting, exposure or their interaction, not a demonstrated intrinsic defect of the source.
- **Close/grazing:** aggregate and surface response are more legible, but repeated broad patches form a visibly regular pattern. Roughness produces a noticeable grazing highlight; whether this matches the intended dry highway needs comparison under calibrated scene lighting.
- **Distance/front:** nearly featureless dark surface in both. **Distance/grazing:** the repeated pattern remains conspicuous, with little apparent resolution advantage for 2K. One static angle per distance and light cannot assess movement shimmer or all roadway views.
- These observations justify preferring 1K provisionally on image quality as well as memory; they do not establish equivalence on higher-density screens or at closer distances. No normal orientation A/B or numerical color calibration was performed.

## Material and GPU settings

- Three.js MeshStandardMaterial, metalness 0, roughness multiplier 1 with source roughness map; no unsupported claim that roughness is physically calibrated.
- Diffuse set to sRGB; normal and roughness are linear/non-color data. Source is labelled OpenGL normal, used with normalScale `(1,1)`; TextureLoader defaults are used consistently on all maps. This is the intended convention, but an independent normal-direction reference test remains outstanding. A different loader/UV convention can require a Y inversion.
- Repeat wrapping; linear magnification, trilinear mipmapped minification, generated mipmaps. Requested anisotropy 8 capped by renderer maximum: SwiftShader reported max 16 and used 8. Real mobile limits, filtering and motion artifacts remain unverified.
- Approximate conservative RGBA8 GPU storage including complete mip chain: three 1K maps ~16 MiB; three 2K maps ~64 MiB. Formula: 3 × width × height × 4 bytes × 4/3. These are estimates, not measured allocations; browser/driver formats, row alignment, decoded copies and mip implementation can differ. JPG byte size is transfer/storage, not GPU residency. Per-manifest compressed file totals are ~2.05 MiB (1K) and ~9.21 MiB (2K). No compressed GPU texture pipeline was built.

## Open issues and scope

Before any integration, evaluate lighting/exposure against actual road reference, address visible repeated pattern without invented markings, verify normal handedness with a controlled diagnostic, then test motion, viewing distances, mip/filter behavior and frame time/memory in a representative scene on target iPhone/Safari. A single software-rendered still setup does not establish mobile performance or realistic final appearance. Further scene or integration work requires Director approval.

The first Actions attempt failed because the Poly Haven API returned duplicate links for a filename; the downloader was corrected and the successful run above used the fixed version. The prior R2.1c tree workflow was automatically triggered by the added viewer file; it was not part of this task and its outcome is not used. No tree assets or game dist were changed.
