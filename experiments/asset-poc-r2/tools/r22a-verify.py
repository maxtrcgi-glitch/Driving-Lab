import hashlib,json
from pathlib import Path
root=Path('experiments/asset-poc-r2/assets/asphalt-track')
manifest=json.loads((root/'manifest.json').read_text())
assert len(manifest['files'])==6
for f in manifest['files']:
 data=(root/f['name']).read_bytes()
 assert len(data)==f['bytes'] and hashlib.sha256(data).hexdigest()==f['sha256'], f['name']
 print('OK',f['name'],f['sha256'])
