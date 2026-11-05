# HIGHWAY_VISUAL_CONTRACT — v1.0.0 / stage A.5.0

## Status and source

This is an integration contract and detached working example. **No Highway World2.0 gameplay implementation or publication occurs in A.5.0.** Director reports the A.4.2 camera accepted on iPhone. All dist files remain byte-identical to accepted source93e5e260977ca0b079ccd198e12ac9cc97fafa28, runtime release5d7bc6f99bfebaf75832117e3804d2ccdba4881c, buildv014a42-5e80bbad66f5. Prior verified publication: https://max-driving-lab.maxtrcgi.chatgpt.site, native25; this stage does not claim a fresh HTTP/browser check.

Sources are the actual A.4.2 archive, full Git history, PROJECT_STATE, RELEASE_RECEIPT, highway.js/highway-world.js, app.js/world.js and camera-road.js. Original modules are included under reference/ with hashes. No external simulation research or unverified physiological/performance claims.

## Existing renderer and road

Highway owns centreline/elevation, projection, traffic, collisions and floating origin. buildHighwayWorld creates eight200m chunks keyed k−2…k+5,9 swept strips and5 instanced batches per chunk, and6 global NPC batches. Strip sample interval5 in s, terrain generated at ±160m. Chunks removed outside the window, then missing chunks rebuilt; geometry is not currently a true pooled ring. Per-seed changes call clear; switching to track just hides Highway root and retains chunks/resources. Reset with same geometry seed relocates existing groups. Grass/shoulder/asphalt/median/solid lines, dashed line boxes, four barrier strips, reflector posts and26 trees/trunks per chunk exist. Real roadside signboards, lamp poles and bridges do not exist yet.

Road already curves and rises/descends. Height currently depends only on s, not t. Instances are yaw-only upright; road strips are swept over the profile. Visible wall boxes and simplified physical barriers differ slightly in height; collisions remain host-owned. The source is not a bridge/terrain graph engine.

## Ownership / minimal API

Visual Developer supplies asset descriptions and render parts; Developer host selects global anchors, slots, density/seed/LOD, creates instances, owns all lifecycle and floating-origin handling. Resources must not read player inputs or mutate road, vehicle, AI, camera or transmission. No independent requestAnimationFrame/update loop, lights, physics bodies, loaders or random generation inside an asset factory.

```
createAsset(THREE) -> {descriptor, parts}
registry.register(descriptor, parts)
adapter.sampleFrame(out, s, t, {alignment, facing})
adapter.toSegmentLocal(out, frame, segment)
createSegmentVisuals(adapter, registry, segment, anchors)
visual.rebase() // origin already updated by host
visual.release()
registry.dispose() // final host shutdown only
```

Reference implementation in VISUAL_INTEGRATION_EXAMPLE.js actually implements these methods, including matrix baking of part.localMatrix and instancing. No runtime hook is installed. Host integration hook in a future stage: after creation of each chunk, add visual.root to highwayWorld.root as a sibling using the documented world-Z group convention; on each chunk retirement release that key; after origin change call rebase; seed/reset clear placements. Never add to a chunk with a second identical translation. Event ordering remains Developer responsibility; exported highwayWorld currently has update/clear/chunks, no extension callbacks, so the final hook awaits A.5.1 approval.

## Asset delivery

Use metres; local+X right, +Y up, +Z front; pivot at ground contact/footprint centre. Freeze scale and bake exporter conversion once; never use negative scale. Include bounds/dimensions, triangle counts per LOD, material/texture inventory, colour-space declarations and original/licensed source metadata. Material textures are local relative paths, no CDN. Albedo/emissive use SRGBColorSpace; normal/roughness/metalness are linear data. Prefer opaque single-material instanced geometry with shared atlases. glTF/GLB may be an interchange deliverable, but a GLTFLoader/compression decoder is **not** present in A.4.2 and is not promised by this contract. For immediately runnable delivery use createAsset(THREE) returning standard BufferGeometry/material parts. Do not bundle a second Three.js. Local pivot already baked in geometry; localMatrix is optional for multi-part assets.

VISUAL_ASSET_SLOTS.json is the machine-readable catalog and manifest example. `status` differentiates existing/core slots from proposed ones. Slots do not authorize silent replacement of gameplay-owned geometry/colliders. A registry entry contains geometry/material resources; instance count and placements are supplied by host. LOD metadata specifies proposed levels/distances, but the minimal example implements LOD0 only; host LOD switching is deferred. Submit at least LOD0/1/2 resources or justify a one-level cheap asset. Batch count equals material/geometry parts times active segments, not number of objects.

## Placement rules by type

- Road and long solid marking: host sweeps geometry from frame samples and material UV contract. Texture repeat length measured in declared s units for legacy; future arc mapping versioned. No flat long tile or overlapping road layer.
- Dashes: short thin geometry aligned to surface, slight lift; global periodic anchors in proposed planner. Current A.4.2 phase resets per chunk; unchanged. Avoid double edges and z-fighting.
- Guardrails: preserve current lateral collision envelope and height review; do not visually move a rail away from its collider. Posts/rails can share instanced batches; curved rails sweep or use short modules. Visual changes cannot remove collision protection.
- Signs: outside shoulder with full ground footprint |t|≥16; face local+Z toward approaching flow using facing=−direction. Don't invent exits for unsupported road branches.
- Lamps: grounded upright beyond shoulder. Emissive surfaces suffice for first iteration; no per-lamp point lights/shadows. Fixtures authored with localMatrix if needed.
- Bridge/overpass: unique host event with owner segment and span bounds. Clear deck underside≥5.5m is a provisional project target; supports outside occupied corridor. No driveable deck, clearance collision change or newly obstructing support without approval. A span crossing segment boundaries must be pinned to its owner until the entire span leaves the retained window; ordinary anchor-only release is insufficient. The example does not implement bridge span pinning.
- Vegetation: seeded anchor fields24–134m away, with full bounds avoiding shoulder. Near/far resources, distant silhouettes, opaque cutouts preferred. Avoid alpha-blended billboard forests and duplicate shadows. Terrain under foliage is current Highway.height(s); future terrain provider must be explicit.

## Lifecycle

Asset loading is once per catalog. Deterministic anchor planning is separate, keyed by world seed+roadId+segmentKey+slot+index; recycling must not call Math.random. Normal restart traffic seed is independent of geometry seed. Half-open[s0,s1) owns repeat anchor centres; intervals are global to avoid duplicates/unequal seam gaps. Long assets supply bounds so visibility/retirement uses their extent, not just centre. Keep compact placement data/global IDs; release obsolete object references.

Create: acquire cached resources → plan anchors → make segment-owned instance buffers/bounds → attach. Update: only origin transform and host-selected coarse LOD/visibility, no rebuilding static matrices each RAF. Rebase: update parent once, no resampling/no new IDs. Retire: detach, dispose InstancedMesh instance-owned data; never dispose shared geometry/material/texture in the segment callback. Final shutdown: registry/cache disposes unique geometries/materials/textures once after all users have released. Reference release is idempotent. Asset cache owns its resources exclusively in this example; shared external cache needs reference counting.

A future pool can reuse batch buffers instead of disposing/recreating; not implemented now. Limits must remain bounded during reverse movement, reset, seed change and100km traversal. Build deterministic adjacent chunks from the same road provider, include s1 boundary sample for ribbons, and compare shared boundary positions/normals/UV phase. Allocation, texture growth and stale instance bounds are explicit review gates.

## Acceptance / parallel work

Visual Developer may produce placeholder replacements for posts, lamps, signs, vegetation and materials according to slots. Do not modify highway.js, physics.js, app loop, traffic, cameras or controls. Return manifest, resources, screenshots from a local preview if available, licence inventory and measured mesh/texture counts. Developer alone integrates after review and approval. Assets needing new loaders/shaders/colliders or extra lights must be declared before implementation.

Run `node tests/contract.mjs` from this folder (package.json marks ESM), and optionally `python -m http.server 8000` then open example.html on a browser. Demo is read-only A.4.2 road plus placeholder posts; not a gameplay build or camera validation. Node tests cover exact positions, handedness, facing, actual graded surface derivative, origin changes and bounded lifecycle. CPU scene counts and budgets are separate from real iPhone renderer statistics. No browser/GPU execution was available in this stage.
