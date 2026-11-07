import hashlib,json,urllib.request,urllib.parse
from pathlib import Path
root=Path('experiments/asset-poc-r2/assets/asphalt-track');root.mkdir(parents=True,exist_ok=True)
with urllib.request.urlopen(urllib.request.Request('https://api.polyhaven.com/files/asphalt_track',headers={'User-Agent':'DrivingLab/1.0'}),timeout=60) as r:data=json.load(r)
urls=[]
def visit(x):
 if isinstance(x,dict):
  if isinstance(x.get('url'),str):urls.append(x['url'])
  for v in x.values():visit(v)
 elif isinstance(x,list):
  for v in x:visit(v)
visit(data)
manifest={'asset':'asphalt_track','source':'https://polyhaven.com/a/asphalt_track','author':'Dimitrios Savva','license':'CC0 1.0','physical_size_m':2,'files':[]}
for size in ['1k','2k']:
 for kind in ['diff','nor_gl','rough']:
  name=f'asphalt_track_{kind}_{size}.jpg';matches=[u for u in urls if urllib.parse.unquote(urllib.parse.urlparse(u).path).endswith('/'+name)]
  if len(matches)!=1:raise RuntimeError(f'Expected one URL for {name}, got {len(matches)}')
  with urllib.request.urlopen(urllib.request.Request(matches[0],headers={'User-Agent':'DrivingLab/1.0'}),timeout=180) as r:content=r.read()
  if content[:2]!=b'\xff\xd8':raise RuntimeError('not JPEG: '+name)
  (root/name).write_bytes(content);manifest['files'].append({'name':name,'source_url':matches[0],'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
