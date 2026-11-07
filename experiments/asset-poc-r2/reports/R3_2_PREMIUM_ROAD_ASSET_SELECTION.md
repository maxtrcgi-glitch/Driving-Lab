# R3.2 — Premium road asset selection

**Research date:** 2026-11-07. **Branch:** `visual/asset-poc-r2`. **Verified starting HEAD:** `cf19c3903cb2fb2f40dc58112dd97d47d8ab94fe`.

## Decision for Director

These are **conditional inspection candidates**, not production approvals. The sellers' galleries demonstrate modular construction and plausible materials, but marketing images are not the actual game meshes. No pack was purchased, downloaded, opened in Blender/Unreal, rendered in Three.js, measured or tested on iPhone. Close-up and driver-eye quality cannot be confirmed from the accessible overview images alone. In particular, no candidate has yet passed the R3.1 original-asset visual gate.

1. **Road Essentials — strongest European motorway fit**, subject to confirmation that its Unreal-only assets can be legally and practically exported to glTF and that material/marking appearance survives conversion.
2. **Highway Streets and Construction Roads — best documented interchange formats**, subject to checking actual road quality and whether shoulder layouts fit the target.
3. **KitBash3D Highways — high-end professional alternative**, but it is oriented toward urban/elevated US-style freeways and may require substantial asset selection and European adaptation.

If direct access to a qualified close-up and driver-eye preview is a strict prerequisite rather than an approval-stage check, **none is yet fully validated**; request a seller demonstration or sample before purchase. Prices below are observed listings, not quotes; taxes, currency, sale status and license tier can change.

## 1. Road Essentials — Modular Roads, Bridges & Guardrails

![Road Essentials seller overview](https://media.fab.com/image_previews/gallery_images/06a3199e-18cd-4bda-af66-2c877fadb9b1/2752c5c4-3eb7-4bfe-acf2-50546a3c1f12.jpg)

* **Listing:** https://www.fab.com/listings/597854da-9725-4871-905e-a9ec04bdd15f
* **Price:** Fab search showed **from US $49.99**, excluding tax; the accessible product page requires license selection and did not expose a tier-specific price. Reconfirm at checkout: https://www.fab.com/search/channels/unreal-engine?lang=de&tags=highway
* **Seller visual evidence:** [overview](https://media.fab.com/image_previews/gallery_images/06a3199e-18cd-4bda-af66-2c877fadb9b1/2752c5c4-3eb7-4bfe-acf2-50546a3c1f12.jpg), [exit/bridge preview](https://media.fab.com/image_previews/gallery_images/7b92d5c1-f52d-4be0-bce7-500e7ef08ce7/5819265a-e261-4204-9c6a-75a4151a9b36.jpg), [seller demonstration video](https://www.youtube.com/watch?v=NvAievjh7uk), [seller road layouts](https://defconnet.work/en/road-essentials-en/). The accessible images show a road network and marked exit, not conclusive road-level detail; video playback/driver-height inspection was not verified.
* **What is offered:** Seller lists 25 highway pieces plus updates, asphalt patches, adjustable markings, guardrails, barriers, delineators, signs and bridges. Seller describes German RAA sizes and explicitly lists a six-lane road with concrete barrier. Includes spline-oriented pieces and five Unreal master materials with ORM textures. Asphalt/shoulder topology, resolution, per-module polygons and actual embedded content remain **UNKNOWN**.
* **Formats and feasibility:** Official listing reports **Unreal Engine only**. It does not list an independently downloadable FBX, Blender or glTF package. Exporting selected static meshes and textures and rebuilding Unreal material/marking logic for glTF/Three.js is a plausible workflow, **not tested**; decals/blueprints/material graphs do not automatically become an equivalent Three.js system. Confirm export rights, exact UE version and files with seller first. Road detail versus a flat rendered mesh cannot be established from listing imagery.
* **License:** Selection is required on the listing; confirm the exact license before purchase. [Fab Standard License](https://www.fab.com/eula) generally allows assets in projects and use with compatible engines, but prohibits standalone redistribution. Do not assume unprotected raw asset hosting or a public Git repository is permitted. Review web deployment and UE asset export terms with seller/platform.

## 2. Highway Streets and Construction Roads — Sergey Koznov / YONEEKA

![Seller's road module overview](https://img-new.cgtrader.com/items/3959105/1ac88eff5f/highway-streets-and-construction-roads-unreal-engine-project-3d-model-1ac88eff5f.jpg)

* **Listing:** https://www.cgtrader.com/3d-models/exterior/street-exterior/highway-streets-and-construction-roads-unreal-engine-project
* **Price:** **US $78**, CGTrader listing, Royalty Free (no AI), observed on 2026-11-07. [Same titled ArtStation listing](https://www.artstation.com/marketplace/p/pkGeR/highway-streets-and-construction-roads-unreal-engine-project) lists **US $120** Extended Commercial; package/tier equivalence is not verified, so do not assume the cheaper option contains identical files.
* **Seller visual evidence:** [module overview](https://img-new.cgtrader.com/items/3959105/1ac88eff5f/highway-streets-and-construction-roads-unreal-engine-project-3d-model-1ac88eff5f.jpg), [official full listing gallery](https://www.cgtrader.com/3d-models/exterior/street-exterior/highway-streets-and-construction-roads-unreal-engine-project), with 151 preview entries including video thumbnails. The overview shows multiple road pieces with markings and kerbs; reliable close-up and driver-eye quality cannot be determined from the overview. Rendered seller images do not establish the true in-engine detail or lighting.
* **What is offered:** Seller describes 127 road-related elements, straight and curved sections, descents, intersections, road signs, lights and separated scene objects. Lists 26 texture files at mixed sizes including 2K and 4K asphalt; complete independent PBR map set, individual model triangle counts, precise lane widths and dedicated emergency shoulder are **UNKNOWN**. Listing labels the package low-poly and gives 15,555 polygons without clarifying scope; not evidence that a particular road module has detailed geometry. A suitable three-lane configuration is unverified.
* **Formats and feasibility:** Product lists FBX, OBJ, PNG, Unreal assets and Substance data; the listing displays approximately 2.5 GB entries. Seller description says FBX/OBJ use standard materials, so actual PBR setup may need remapping when converting via Blender to glTF/GLB. Mobile memory, atlas sizing, draw calls and seams require tests. Asset files and download contents have not been independently inspected.
* **License:** [CGTrader Royalty Free](https://help.cgtrader.com/hc/en-us/articles/360015124437-Royalty-Free-License) permits qualifying incorporated products but prohibits standalone asset distribution; the game example specifies a proprietary format and prevents users repackaging the asset. Since a browser delivers assets to users, clarify the planned web format with the platform/licensor before committing raw files to a repository or publishing. “No AI” is the listing's stated license, not an independent provenance audit.

## 3. KitBash3D — Highways

![KitBash3D seller modular pieces](https://kitbash3d.com/cdn/shop/products/HW_WEB_SET_GALLERY_4.jpg?v=1742318948&width=1900)

* **Official listing:** https://kitbash3d.com/products/highways
* **Price:** **US $95** displayed; the product has Individual, Small Business and Enterprise tiers. Applicable tier and final price for Driving Lab are **not verified**.
* **Seller visual evidence:** [modular components](https://kitbash3d.com/cdn/shop/products/HW_WEB_SET_GALLERY_4.jpg?v=1742318948&width=1900), [gallery image 1](https://kitbash3d.com/cdn/shop/products/HW_WEB_SET_GALLERY_1.jpg?v=1742318948&width=1900), [gallery image 2](https://kitbash3d.com/cdn/shop/products/HW_WEB_SET_GALLERY_2.jpg?v=1742318948&width=1900), [complete seller gallery](https://kitbash3d.com/products/highways). The visible collection emphasizes modular elevated interchanges, barriers and markings. The appearance is professional in these promotional images, but original mesh detail and close-up asphalt realism remain unverified; no matched driver-eye evidence was established. Demo scenes are not included per seller.
* **What is offered:** 338 models, seller-reported 1.3 million polygons across the kit and 14 PBR materials; includes highway, curved and straight modules, ramps, interchanges, signs, lights and a highway drain. Texture resolution, exact per-piece complexity, shoulder widths and suitability for ground-level European carriageways are **UNKNOWN**. US-style signs/markings and overpasses are a mismatch for an Autobahn and should not be assumed reusable without adaptation. This is a geometry-rich collection overall, not proof of detailed road-surface geometry.
* **Formats and feasibility:** Seller lists Blender, FBX, OpenUSD and several DCC render pipelines and states purchased kits can be downloaded in offered formats. Blender/FBX to glTF is a practical candidate path; actual material conversion and selected-section cost remain untested. Seller recommends 8 GB VRAM / 32 GB system RAM for authoring entire kits, not a mobile runtime requirement; selection and measured optimization would be necessary.
* **License:** https://kitbash3d.com/pages/licenses says commercial games and modified assets are allowed under the proper tier, but resale/redistribution of assets is prohibited; tier depends on entity size. Confirm browser delivery, repository storage and access rights under the applicable EULA with KitBash3D before purchase.

## Comparison and next step

| | Road Essentials | Highway Streets | KitBash3D Highways |
|---|---|---|---|
| European highway fit | Highest by seller specifications | Possible; verify widths/markings | Lower: mostly elevated urban/freeway presentation |
| Six lanes | Seller lists six-lane Autobahn | UNKNOWN | UNKNOWN |
| Practical source | Unreal package only | FBX / OBJ / UE listed | Blender / FBX listed |
| Asset / texture complexity | UNKNOWN | Listed 2K/4K; actual cost UNKNOWN | 1.3m polys whole kit; per module UNKNOWN |
| Known blocker | UE export/material/decal conversion | Visual detail + license for web distribution | European fit, tier + visual detail |
| Recommended decision | Ask seller for exportable sample and close-up | Ask for close/driver preview and verify road-width/source details | Hold as high-end alternative |

**Rejected from consideration:** previous Grab3D road remains rejected; low-poly kits with schematic surfaces were not shortlisted. No new geometry, shader work, optimization, asset purchase or stable-game change was performed. Director approval is required for acquisition and subsequent original-file inspection.
