# R4.5 Roadside material library

Working review candidate. Director approval is pending.

## Recoverable sources

Base branch HEAD was verified as 8aedfeaf153b6e9739f06b8fc334b4f01cc4b221. The unedited R4.3d archive has SHA-256 145bf2b7e1d656784acc2b73dc7fb8e80216dc437af8a6d895026065f9c69409. Its packed C_STOCHASTIC_FINAL.blend is the rollback source. R4.5 uses that existing native scene and its original camera objects, lighting, exposure and geometry. Checkpoint A is separately recoverable as checkpoint-A.blend. The final working file retains all packed maps and editable nodes.

Infrastructure authoring source was committed as 2aafe9bea008ae6f63870a99433ca7c48bd7064f. The final delivery commit is reported with the review submission.

## Material definitions

| Category | Definition | Coordinates and channels |
| --- | --- | --- |
| Concrete | R45 Formed roadside concrete. Existing Innerscene precast diffuse and normal. Normal strength 0.42. Diffuse-driven roughness 0.73–0.89. Restrained lower-block splash tint. | Original module UVs retained. Generated local Z provides the base-to-top staining gradient. Existing casting details and joints remain. |
| Steel | R45 Galvanized steel and secondary steel. Existing zinc diffuse/normal. Metallic 0.98. Roughness 0.36–0.58 follows scan luminance. Normal strength 0.18. | Original module UVs and connections retained. Shared material response across repeated modules. No added corrosion masks. |
| Paint | R45 Mineral-filled marking paint. Existing off-white wear color retained. Roughness 0.65–0.84 from the existing roughness map. Normal strength 0.12. | Independent marking objects retained with original UVs. No opacity cutting or geometry removal. |
| Shoulder and gravel | R45 compacted gravel. Existing Poly Haven Gravel Road color, roughness and GL normal. Normal strength 0.55. | Existing surface-metres UVs retained at 1.55 m per tile in the median. A second sample translated by 0.371, 0.619 UV is selected by a shared world-space mask, consistently across channels. |
| Terrain | R45 leafy grass and gravel-to-grass transition. Existing Poly Haven Leafy Grass and Gravel Road scans, existing VergeGrass transition mask. | Existing terrain attributes and UVs retained at 1.9 m per verge tile and 2.2 m per distant-ground tile. Same secondary translation across color, roughness and normal, with no sample rotations. An 8.33 m world-space selection field is remapped through 0.43–0.57 thresholds. The existing Normal Map node decodes the blended normal. |

The ground treatment uses two coherent scan samples with a narrowed transition interval. Most selected regions retain one source sample. Transitions can still lose microcontrast and the source periodicity may remain visible. No measured anti-tiling reduction is claimed.

## Source and photographic references

The original scene manifests identify Innerscene Jersey Barrier and W-beam Guardrail, Poly Haven Gravel Road and Leafy Grass as CC0. All texture inputs are reused from the packed native master. No new scan downloads were required.

- https://www.innerscene.com/tools/library/3d-parts/jersey-barrier-5dc3eefe
- https://www.innerscene.com/tools/library/3d-parts/guardrail-4b2b2ff5
- https://polyhaven.com/a/gravel_road
- https://polyhaven.com/a/leafy_grass
- Existing A9 photograph, Kira Nerys, public domain, retained in the R4.1 reference manifest. It guides ordinary daylight, steel highlights and verge color relationships.
- https://galvanizeit.org/knowledgebase/article/examples-of-natural-weathering-on-hdg-appearance — photographic examples of zinc patina and aging. Reference only, not redistributed as a texture.
- https://commons.wikimedia.org/wiki/File:Concrete_barrier_20180625.jpg — concrete barrier surface reference. Reference only.

Original source provenance remains in the approved R4.3d archive and the R4.1 asset manifest. Provider-generated Innerscene maps are reused as supplied, without representing them as independently verified physical scans.

## Reproduction

Use Blender 4.3.2. Run author_materials.py with checkpoint A on the original native master, then checkpoint B on checkpoint-A.blend. Both commands take the output .blend path as the second argument. render_views.py takes an output directory and renders the three existing A/B/C cameras. assemble_review.py takes the directory containing before/ and after/.

The three camera images are 1152×648, 48 maximum Cycles samples, adaptive threshold 0.04. This installed Blender build lacks OpenImageDenoise, so all new before/after images use denoising disabled. Lighting, camera transforms and exposure remain unchanged. Grain limits microtexture assessment.

The contact sheet uses unretouched 1:1 crops from the original cameras. The concrete remains distant in those fixed views. Its pores and casting detail therefore require closer native inspection. The gravel crop contains adjacent barrier/road context and should not be treated as an isolated material swatch.

## Quality concerns

This is a conservative material refinement, not a completed photorealism approval. The concrete height gradient lacks localized rain streak masks. Fine aggregate scale, distant concrete pores, joint treatment and paint wear need additional art scrutiny. Ground transitions may retain periodicity and reduce microcontrast. No numeric anti-tiling improvement is claimed. Existing vegetation repetition remains visible. The Cycles images contain sampling grain. Ground transitions and aggregate scale require Director review at full resolution.

A .blend material graph is not automatically exportable to glTF/WebGL. Runtime conversion and full-scene mobile performance are outside this delivery.
