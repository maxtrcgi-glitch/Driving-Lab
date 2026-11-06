import hashlib,json,os,urllib.request,urllib.parse
from pathlib import Path
root=Path('experiments/asset-poc-r2/source-r21e');root.mkdir(parents=True,exist_ok=True)
req=urllib.request.Request('https://api.polyhaven.com/files/tree_small_02',headers={'User-Agent':'DrivingLabResearch/1.0'})
with urllib.request.urlopen(req,timeout=60) as r: data=json.load(r)
urls=[]
def visit(o):
 if isinstance(o,dict):
  if isinstance(o.get('url'),str): urls.append(o['url'])
  for v in o.values():visit(v)
 elif isinstance(o,list):
  for v in o:visit(v)
visit(data)
def get(name):
 matches=[u for u in urls if urllib.parse.unquote(urllib.parse.urlparse(u).path).endswith('/'+name)]
 if not matches: raise RuntimeError('Missing file in Poly Haven API: '+name)
 target=root/('textures/'+name if name not in ('tree_small_02_1k.gltf','tree_small_02.bin') else name);target.parent.mkdir(exist_ok=True)
 print('Downloading',name,flush=True)
 with urllib.request.urlopen(urllib.request.Request(matches[0],headers={'User-Agent':'DrivingLabResearch/1.0'}),timeout=180) as res, open(target,'wb') as f:
  while chunk:=res.read(1048576): f.write(chunk)
 return target
p=get('tree_small_02_1k.gltf');j=json.loads(p.read_text());get('tree_small_02.bin')
h=hashlib.sha256((root/'tree_small_02.bin').read_bytes()).hexdigest();print('SOURCE_BIN_SHA256',h,flush=True)
if h!='8da6c3c389ad8748286d1b7488cd827f75ebdad9d8f59ef7dfb0916df5edc634':raise RuntimeError('Source BIN does not match attached archive')
for image in j['images']:get(Path(image['uri']).name)
get('tree_small_02_leaves_alpha_1k.png')
