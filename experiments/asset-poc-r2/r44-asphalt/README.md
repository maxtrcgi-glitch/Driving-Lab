# R4.4 mobile asphalt review

Serve this directory with the vendored Three.js r180 `vendor/` and `utils/` directories
from `../viewer/` alongside `index.html`. The R4.4 Actions workflow stages these
directories into the same layout used by the standalone deployment.

A and B use the same Blender pavement, independent lane-marking mesh, three
reference cameras, sun direction, exposure, pixels, 4 m scan repeat and aligned
2048 × 2048 mobile maps. B changes how the scan is sampled. The full reference
also includes other scans, mapped wear/inlays and the authored environment.

To reproduce the derived assets with Blender 4.3.2 and Pillow 13:

```bash
blender -b C_STOCHASTIC_FINAL.blend --python-exit-code 1 -P export_scene.py -- /tmp/r44-export
python pack_maps.py /tmp/r44-export assets scan-sources.json
cp /tmp/r44-export/{road.glb,scene.json} assets/
```

The approved R4.3d native archive contains the original packed CC0 [Poly Haven
Asphalt 04](https://polyhaven.com/a/asphalt_04) scans. The texture packing script
checks the hashes of all three originals before resizing and encoding. The
viewer checks the packaged asset sizes and SHA-256 digests from
`asset-manifest.json` at load time.
