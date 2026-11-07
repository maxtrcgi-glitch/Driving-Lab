"""Verify originals and enumerate asset dimensions without modifying them."""
import hashlib
import io
import json
from pathlib import Path
import struct
from PIL import Image

root = Path(__file__).resolve().parent
output = Path('reports/r34')
output.mkdir(parents=True, exist_ok=True)
result = {}
manifest = json.loads((root / "assets/manifest.json").read_text())
for path in sorted([*(root / 'assets').glob('*.jpg'), *(root / 'assets').glob('*.glb'),
                    root.parent / 'r31/assets/guardrail.glb',
                    *(root.parent / 'assets/asphalt-track').glob('*_1k.jpg')]):
    data = path.read_bytes()
    record = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    result[path.name] = record
    if path.name in manifest:
        assert all(record[key] == manifest[path.name][key] for key in ("bytes", "sha256")), path.name
    if path.suffix == '.jpg':
        with Image.open(io.BytesIO(data)) as image:
            image.load()
            assert image.size == (1024, 1024)
            record.update(size=image.size, mode=image.mode)
        continue
    magic, version, length, json_length, chunk = struct.unpack_from('<4sIIII', data)
    assert (magic, version, length, chunk) == (b'glTF', 2, len(data), 0x4E4F534A)
    gltf = json.loads(data[20:20 + json_length])
    binary_start = 28 + json_length
    record['copyright'] = gltf['asset'].get('copyright')
    record['primitives'] = []
    for mesh in gltf['meshes']:
        for primitive in mesh['primitives']:
            assert primitive.get('mode', 4) == 4
            position = gltf['accessors'][primitive['attributes']['POSITION']]
            indices = gltf['accessors'][primitive['indices']]
            record['primitives'].append({
                'name': mesh.get('name'), 'vertices': position['count'],
                'triangles': indices['count'] // 3, 'min': position['min'], 'max': position['max']
            })
    record['images'] = []
    for source in gltf['images']:
        view = gltf['bufferViews'][source['bufferView']]
        offset = binary_start + view.get('byteOffset', 0)
        with Image.open(io.BytesIO(data[offset:offset + view['byteLength']])) as image:
            image.load()
            record['images'].append({'name': source.get('name'), 'size': image.size, 'mode': image.mode})
(output / 'assets.json').write_text(json.dumps(result, indent=2) + '\n')
