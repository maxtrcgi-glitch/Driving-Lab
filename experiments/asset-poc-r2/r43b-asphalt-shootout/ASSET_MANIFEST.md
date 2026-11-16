# R4.3b asphalt sources and photographic targets

The native input is `Golden-Highway.blend` from the [Golden Highway checkpoint](https://github.com/maxtrcgi-glitch/Driving-Lab/commit/60691ef61690a847be210c4accff1f1cec98a1a6). Input SHA-256 is `9a3f1aec28f16668ae6a2d387e298d2df9721d2f7950ca6eb4d21a05145fefc9`.

| Variant | Paving set | Physical pitch and nominal density | License |
| --- | --- | --- | --- |
| A · Clean Modern | [Poly Haven Asphalt Floor](https://polyhaven.com/a/asphalt_floor), eye-candy.xyz | 2,048 px / 2.3 m ≈ 890 px/m | CC0 |
| B · Lightly Worn | [Poly Haven Asphalt 01](https://polyhaven.com/a/asphalt_01), Charlotte Baglioni and Dario Barresi | 2,048 px / 2.1 m ≈ 975 px/m | CC0 |
| C · Slightly Aged / Repaired | [Poly Haven Asphalt 04](https://polyhaven.com/a/asphalt_04), Sergej Majboroda and Jenelle van Heerden. The B scan softens its repeating crack contrast. The A scan supplies the four localized repair areas. | 4,096 px / 4.0 m ≈ 1,024 px/m for the aged component. A/B inserts retain their own physical pitch. | CC0 |

[Poly Haven CC0 license](https://polyhaven.com/license). The nine packed source images are listed with URLs and SHA-256 values in [maps.json](maps.json). Each aligned set uses sRGB diffuse, Non-Color roughness and Non-Color OpenGL tangent normal. Scale follows the existing road-station UVs. The material graphs include weak metre-scale binder variation and C-only repair masks. The original separate marks, all mesh coordinates, other materials, lighting and environment assets are inherited unchanged.

## Photograph set

- [A9 north of Munich, Kira Nerys](https://commons.wikimedia.org/wiki/File:Auf_der_A_9_in_Richtung_Berlin.jpg). Driver-height target for the lighter paved shoulder, the subdued grain at normal viewing distance, and the boundary between the travelling surface and shoulder.
- [A9 near Eching, Flocci Nivis](https://commons.wikimedia.org/wiki/File:20230430_Bundesautobahn_9_01.jpg). Elevated, cloudy daylight comparison for medium grey, soft reflectance and occasional isolated repairs.
- [A8 Leinfelden-Echterdingen, H. Sellmoene](https://commons.wikimedia.org/wiki/File:Autobahn_A8_bei_Leinfelden-Echterdingen_mit_%C3%9Cberleitungs-_und_Ausf%C3%A4delungsfahrbahnen.jpg). Directional daylight for paving boundaries and the way dry asphalt reads away from shadows.
- [A9 near Ingolstadt, Ypsilonatshared](https://commons.wikimedia.org/wiki/File:Autobahn_A9.JPG). Lower, forward-view check for texture falling away into distance. The dark exposure makes it unsuitable as an absolute albedo target.

The photo set is visual guidance. Camera exposure and light vary between photographs, limiting reflectance estimates from the image values.
