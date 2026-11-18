"""Retrieve only the three pinned 2K CC0 maps used by R4.6."""
import hashlib
import json
from pathlib import Path
import urllib.request
root = Path(__file__).resolve().parent / 'assets'
manifest = json.loads((root / 'manifest.json').read_text())
for name, item in manifest['files'].items():
    path = root / name
    if not path.exists():
        path.write_bytes(urllib.request.urlopen(item['url'], timeout=90).read())
    data = path.read_bytes()
    if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
        raise RuntimeError(f'Pinned scan verification failed for {name}')
    print('VERIFIED', name, item['sha256'])
