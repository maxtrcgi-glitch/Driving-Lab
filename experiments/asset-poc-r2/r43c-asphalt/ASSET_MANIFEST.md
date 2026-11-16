# R4.3c scan sources and visual reference

The input is the [verified R4.3b Blender master](https://chatgpt.com/library?file_id=libfile_bb966065d4c48191a5f5c9df497a6493&account_id=personal), native SHA-256 `85735250f747f08636a0dcfcb25e3deedde821cd56fb5841b1b656841b6a5bb9`. The source file is preserved. See the [original packed scan URLs and checksums](https://github.com/maxtrcgi-glitch/Driving-Lab/blob/8c1fb613018e7ed3bf51cb44839321147af8e225/experiments/asset-poc-r2/r43b-asphalt-shootout/maps.json).

| Scan | Use | Pitch and nominal density | License |
| --- | --- | --- | --- |
| [Poly Haven Asphalt 04](https://polyhaven.com/a/asphalt_04) | Aged binder and relief. Two decorrelated samples of the same map set. | 4.0 m, 1,024 px/m | CC0 |
| [Poly Haven Asphalt 01](https://polyhaven.com/a/asphalt_01) | Fine aggregate, lighter older inlays and secondary roughness. | 2.1 m, 975 px/m | CC0 |
| [Poly Haven Asphalt Floor](https://polyhaven.com/a/asphalt_floor) | Darker recent shoulder inlay with distinct response. | 2.3 m, 890 px/m | CC0 |

All three aligned sets use sRGB diffuse, Non-Color roughness and Non-Color OpenGL tangent normals. [Poly Haven CC0 license](https://polyhaven.com/license). The authoring masks are generated from `surface_history.json` and the existing road marking coordinates. The reference photographs were used for review.

- [A9 north of Munich, Kira Nerys](https://commons.wikimedia.org/wiki/File:Auf_der_A_9_in_Richtung_Berlin.jpg). Fine aggregate mostly resolves at the foreground and the shoulder is visually distinct.
- [A9 near Eching, Flocci Nivis](https://commons.wikimedia.org/wiki/File:20230430_Bundesautobahn_9_01.jpg). Elevated visual target for soft grey tone and widely spaced small repairs.
- [Highways Agency M1 low-noise surfacing photographs](https://assets.highways.gov.uk.s3.amazonaws.com/roads/road-projects/m1-junctions-32-35a-managed-motorway/M1%20J28-31%20%26%2032-35a%20PIE%20boards%20New.pdf). The compared close-ups show coarse mineral chips among darker binder with different packing for the two surface courses.
- [Bury Council photographed asphalt repair sequence](https://www.bury.gov.uk/roads-travel-and-parking/highways-keep-bury-moving/pothole-repairs). Useful for inlay edge and sealant detail. The photographs show road maintenance, while the A9 photographs set the motorway context.
- [Blending in Detail, Barré-Brisebois and Hill](https://blog.selfshadow.com/publications/blending-in-detail/). Reference for reoriented normal mapping.
