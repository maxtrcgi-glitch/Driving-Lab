# R3.0 — Highway asset shortlist

**Decision point: Director approval required.** This is an acquisition shortlist, not a production-ready asset pack. No external models were downloaded, purchased, edited or integrated. Product pages and available static previews were checked on 2026-11-07; seller claims are not independent verification of the download, topology, license chain or WebGL/mobile performance. Explicitly check each asset and included license after approval. Prices and listing availability may change.

## Recommendations at a glance

1. **Highway:** [Bypass Road Game-Ready Environment Asset — CGTrader](https://www.cgtrader.com/free-3d-models/architectural/other/bypass-road-game-ready-environment-asset), conditional on resolving a serious license/distribution issue and verifying the available files. Best free candidate found for a multi-lane highway look, not yet proven to be a complete European highway kit. [Image preview](https://img-new.cgtrader.com/items/6406198/58561492e1/bypass-road-game-ready-environment-asset-3d-model-58561492e1.webp).
2. **Surface:** [ambientCG Road 006](https://ambientcg.com/view?id=Road006) for an existing large road material, plus [Asphalt Damage Decal Set 002 — Archade](https://archade.app/marketplace/materials-textures/decals-grunge/asphalt-damage-decal-set-002) for selective real damage, subject to user choice. [Road preview](https://acg-media.struffelproductions.com/file/ambientCG-Web/media/thumbnail/2048-WEBP/Road006.webp), [decal preview](https://archade.app/marketplace/materials-textures/decals-grunge/asphalt-damage-decal-set-002).
3. **Guardrail:** [Innerscene Guardrail](https://www.innerscene.com/tools/library/3d-parts/guardrail-4b2b2ff5), 12 m GLB / CC0, contingent on viewing and inspecting the actual asset. [View/download and 3D preview](https://www.innerscene.com/tools/library/3d-parts/guardrail-4b2b2ff5). The accessible page did not expose a usable static photo; do not treat visual quality as independently verified.

**Important distinction:** no fully verified, free, photorealistic, three-lanes-per-direction European highway kit that permits our WebGL distribution was found. The top candidates below contain real trade-offs; none is approved for implementation by this shortlist.

## 1. Highway environment candidates

### A. Bypass Road — CGTrader — conditional first choice

- [Listing and previews](https://www.cgtrader.com/free-3d-models/architectural/other/bypass-road-game-ready-environment-asset); [direct preview image](https://img-new.cgtrader.com/items/6406198/58561492e1/bypass-road-game-ready-environment-asset-3d-model-58561492e1.webp). Creator salmantechknack1234. Page describes a curved multi-lane modular bypass with markings, dividers and barriers. Seller states 2K/4K PBR textures. The visible render is a seller preview, not proof of in-engine quality or full contents.
- Listing is marked free and Royalty Free (no AI). Description promises FBX, OBJ, GLB and Blender source, but the actual visible file section only lists **FBX 38.8 KB and PNG 8.28 MB**. Treat GLB, OBJ and blend availability as **UNKNOWN** until download confirms. Polygon count **UNKNOWN**. Visual preview is accessible; actual downloadable bytes, exact modules, real-world scale and road lane count **UNVERIFIED**.
- **Critical license barrier:** [CGTrader Royalty Free terms](https://help.cgtrader.com/hc/en-us/articles/360015124437-Royalty-Free-License) restrict redistribution and require reasonable safeguards against end-user access to assets. Plain openly served GLB/FBX/textures and committing unprotected source files could conflict with those terms. Do not download into Git, publish an open WebGL preview using raw files, or assume CC0. Confirm current listing terms and obtain appropriate permission / compliant distribution approach first. Free does not remove the restriction.
- Three.js integration: FBX conversion and texture channel/UV validation likely needed. Geometry may not be suitable for repeated 300 m seamless highway. Mobile performance unknown.

### B. Highway Segment — Grab3D — strongest CC0 prototype alternative, not photorealism proven

- [Listing](https://grab3d.com/models/city/highway-segment/) and [static preview](https://grab3d.com/m/highway-segment/highway-segment-3d-model.webp). Publisher describes a repeatable 23.6 × 23.6 m section with two lanes per direction, median guardrail, shoulder, gravel verge and reflector posts. User target was three lanes per direction: this differs.
- Listing says CC0 1.0, free, no login; full GLB 14 MB, FBX, BLEND, USDZ and OBJ; light GLB 1.9 MB and FBX. Seller lists 37,532 triangles / 4K texture variant and 18,864 triangles / 1K light variant. Model-level counts, not measured draw calls. 300 m would require approximately 13 repeated sections before culling/instancing; repetition and overdraw still need examination.
- Site classifies it **Lightweight / Stylized** even though it claims realistic highway details. The retrieved page reports the interactive preview failed to load; only the static image and seller data were available. Actual download, texture channels, rights provenance and quality at driver height **UNVERIFIED**. Do not promise this is the final visual target. CC0 source is favorable for Three.js; inspect downloaded LICENSE and manifest, then test GLB and seams if approved.

### C. Modular Highway Road PBR — CGTrader — paid optional alternative

- [Listing](https://www.cgtrader.com/3d-models/exterior/street-exterior/modular-highway-road-pbr), [seller preview](https://img-new.cgtrader.com/items/2247671/a47861b23f/modular-highway-road-pbr-3d-model-a47861b23f.webp). Listed price **$18** at lookup; no purchase authorized or made.
- Seller lists 10 models including 20/60/100 m straights: 12/28/44 triangles respectively, plus curves and intersections. Four clean/crack/patch road variants with 2048×1024 base colors and 4096×2048 PBR maps. Formats MAX, FBX, OBJ, 3DS, STL, DAE; GLB not listed. PBR materials are applied only to MAX files per seller; reconstruct materials after export. Barrier/shoulder assets **not established**.
- Royalty Free and subject to the same CGTrader redistribution safeguard. License suitability for downloadable WebGL source is **unresolved**. Formats and images were not independently downloaded; conversion, mobile cost and seamlessness unknown.

## 2. Road surfaces and decals

### A. ambientCG Road 006 — CC0

[Product page with tiling/3D previews](https://ambientcg.com/view?id=Road006) · [static preview](https://acg-media.struffelproductions.com/file/ambientCG-Web/media/thumbnail/2048-WEBP/Road006.webp). Approximately 7.5 m × 7.5 m, asphalt and patch material, PBR maps offered as 1K–8K JPG/PNG ZIP; 1K JPG 6 MB, 2K JPG 26 MB as listed. ambientCG identifies its technique as **procedural**, not a photographic scan; it is an existing material, not a newly generated shader. [License CC0](https://docs.ambientcg.com/license/), including redistribution. Maps, channel conventions and real-time texture memory **unverified until downloaded**. It is a material, not road geometry or a full wheel-wear/marking collection; patch repetition could become obvious.

### B. Archade Asphalt Damage Decal Set 002 — CC0, optional sparse detail

[Product page and real preview](https://archade.app/marketplace/materials-textures/decals-grunge/asphalt-damage-decal-set-002). Creator Zachary Grzybowski. Four 2K PBR decals; page lists color, normal, roughness, AO, displacement and opacity, 12 MB compressed, derived from photogrammetry. Listing identifies CC0 1.0 and permits commercial use and redistribution; free account required to download. Actual file formats/channel orientation, image transparency and license inside archive **UNKNOWN**. Geometry count N/A. These show significant distress in the preview, so apply sparingly only if approved; no evidence they include wheel paths or marking wear. Three.js use needs opacity/normal mapping and mobile overdraw testing.

### C. Poly Haven Asphalt 04 — CC0 scanned surface alternative

[Product page with preview and individual downloads](https://polyhaven.com/a/asphalt_04). Authors Jenelle van Heerden and Sergej Majboroda. Page describes 4 m wide, up to 16K, 1K/2K/4K variants, diffuse, GL/DX normal, roughness, AO, displacement and ARM. CC0. Supports scalable PBR material but not individual overlay decals; avoid repeating distinctive cracks. The preview and package are source references, not a test in our highway lighting. Actual image orientation/memory and mobile suitability need validation. Geometry N/A.

## 3. Guardrail and infrastructure

### A. Innerscene Guardrail — CC0 candidate

[Listing / visual inspection and GLB download](https://www.innerscene.com/tools/library/3d-parts/guardrail-4b2b2ff5). Original unbranded 12 m W-beam, six posts, stated 12 × 0.45 × 0.81 m, GLB 3.4 MB; page states CC0, including commercial use, modification and redistribution. Seller offers download; **not downloaded**. Polygon count, texture dimensions/map types, 3D preview quality, end joins, geometry/material correctness and road-side suitability **UNKNOWN**. GLB is a convenient Three.js test input; instance only if geometry and draw calls permit. The page explicitly does not claim safety certification.

### B. Game-Ready Modular Metal Guardrail — Sketchfab

[Listing / interactive preview](https://sketchfab.com/3d-models/game-ready-modular-metal-guardrail-ac1f0c3b12f84b88a69e991ddfd4af71), Kohik10. Search index identifies a free downloadable modular guardrail under CC Attribution; direct Sketchfab page returned 403 to this research environment. Exact CC version, download format, triangle count, textures, preview quality and current download accessibility are **UNKNOWN**. Require actual listing/license and attribution verification before use; do not assume a GLB or commercial terms based only on index.

### C. Modular Safety Rail Kit — Quixel / Fab — visual and license caveat

[Fab listing / preview](https://www.fab.com/listings/8454a187-319b-4df5-a2c5-68fab8fe7452?lang=en), [seller gallery](https://www.fab.com/listings/8454a187-319b-4df5-a2c5-68fab8fe7452?lang=en). Listing identifies Quixel Megascans, free, FBX plus converted GLB/glTF/USDZ, ~3.1 m long; base color, normal, roughness and other maps, texel density 5356 px/m. It is tagged pedestrian/footpath and may not be an appropriate highway crash barrier. Polygon count and specific texture size tiers **UNKNOWN**.
- The retrieved listing displays license terms as a dash. Do not infer CC0 or assume raw WebGL redistribution is permitted; account access, terms of acquisition and non-Unreal usage must be checked. No download attempted. This is an optional infrastructure alternative, not the recommended motorway W-beam.

## Sources considered, limitations and next gate

Poly Haven Asphalt Track from R2.3 remains available under CC0, but prior WebGL evidence showed low-sun banding and no reason to call it the optimal choice. AmbientCG and Poly Haven offer PBR materials; they do not by themselves constitute a complete highway kit. Fab's [Modular Japanese Highway](https://www.fab.com/listings/e4ba0bbf-1bf1-41a1-a70e-8cdd359fff6f) advertises 50+ modules and 4K maps, but lists Unreal Engine only and Japanese road signs; current price/license and export access are unverified. It is not recommended for immediate Three.js acquisition. Blendkit's [patched road](https://www.blenderkit.com/asset-gallery-detail/9dfbbf5f-01ae-4b70-972b-e6ea68071d15/) was found, but the particular material's license, source files and resolution remain unknown; Blender add-on access may be needed.

**Director decision requested:** choose which source assets to inspect/download. If choosing a CGTrader/Fab restricted asset, resolve redistribution and preview access before any integration. The first approved step should validate actual contents, attribution, visual quality and size, not commit restricted raw source or launch optimization. Prices, licenses, and asset availability require rechecking at acquisition. No approval to buy or implement is implied by this report.
