# R4.1 asset and reference manifest

Repository inputs are read from the exact workflow checkout. No existing asset is overwritten.

| Input | Source / use | License |
| --- | --- | --- |
| `r31/assets/guardrail.glb` | [Innerscene W-beam guardrail](https://www.innerscene.com/tools/library/3d-parts/guardrail-4b2b2ff5), full source modules | CC0 |
| `r34/assets/jersey-barrier.glb` | [Innerscene Jersey Barrier](https://www.innerscene.com/tools/library/3d-parts/jersey-barrier-5dc3eefe), full source modules | CC0 |
| `assets/asphalt-track/*_2k.jpg` | [Poly Haven Asphalt Track](https://polyhaven.com/a/asphalt_track), diffuse, GL normal, roughness | CC0 |
| `r34/assets/gravel_road_*_1k.jpg` | [Poly Haven Gravel Road](https://polyhaven.com/a/gravel_road), compacted verge and median | CC0 |
| `tree_small_02` | [Poly Haven Tree Small 02](https://polyhaven.com/a/tree_small_02), original provider glTF with 1K maps | CC0 |
| `pine_sapling_medium` | [Poly Haven Pine Sapling Medium](https://polyhaven.com/a/pine_sapling_medium), original provider glTF with 1K maps | CC0 |
| `leafy_grass` | [Poly Haven Leafy Grass](https://polyhaven.com/a/leafy_grass), 2K ground textures | CC0 |
| `kloppenheim_03_puresky` | [Poly Haven Kloppenheim 03 (Pure Sky)](https://polyhaven.com/a/kloppenheim_03_puresky), 4K HDRI | CC0 |

Asset downloads powered by Poly Haven. The workflow artifact records provider URLs and SHA-256 values in `download-manifest.json` and repository input hashes in `scene-stats.json`.

## Photographic references

- Primary: [A9 north of Munich, toward Berlin](https://commons.wikimedia.org/wiki/File:Auf_der_A_9_in_Richtung_Berlin.jpg), Kira Nerys, public domain. Use the forward road-level perspective, dry asphalt, three-lane rhythm, green horizon and ordinary summer daylight.
- [A9 before the Potsdam interchange](https://commons.wikimedia.org/wiki/File:Autobahn-A9-Mai-2007.jpg), Botaurus, public domain. Secondary cross-section and verge context.
- [A5 north of Frankfurt](https://commons.wikimedia.org/wiki/File:A5,_Frankfurt_am_Main_(LRM_20241002_174638).jpg), Matti Blume, CC BY-SA 4.0. Secondary lane and shoulder proportions.
- [A5 near Bühl](https://commons.wikimedia.org/wiki/File:Landkreis_Rastatt-Autobahn_A5-20-bei_Buehl-2023-gje.jpg). Secondary landscape context.

The reference composition guides the scene. The build uses a 48 m study with an approach and a simplified continuation for the sightline. Lane dimensions and dash rhythm are informed by [RMS Part A](https://www.umwelt-online.de/regelwerk/bau/strassen/rms20.htm). This is a composite setting, not a surveyed reconstruction.
