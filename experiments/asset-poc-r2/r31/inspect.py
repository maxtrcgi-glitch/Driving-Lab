import json,struct,hashlib,io
from pathlib import Path
from PIL import Image
for path in sorted(Path('experiments/asset-poc-r2/r31/assets').glob('*.glb')):
 b=path.read_bytes(); magic,version,total=struct.unpack_from('<4sII',b);assert magic==b'glTF' and version==2 and total==len(b)
 n,t=struct.unpack_from('<I4s',b,12);assert t==b'JSON';j=json.loads(b[20:20+n]);offset=20+n;bn,bt=struct.unpack_from('<I4s',b,offset);assert bt==b'BIN\0';binary=b[offset+8:offset+8+bn]
 out={'file':path.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'mesh_count':len(j.get('meshes',[])),'materials':j.get('materials',[]),'nodes':j.get('nodes',[]),'primitives':[],'images':[],'extensionsUsed':j.get('extensionsUsed',[])}
 for mesh in j.get('meshes',[]):
  for p in mesh['primitives']:
   ac=j['accessors'];idx=ac[p['indices']]['count'] if 'indices' in p else ac[p['attributes']['POSITION']]['count'];out['primitives'].append({'name':mesh.get('name'),'triangles':idx//3 if p.get('mode',4)==4 else None,'vertices':ac[p['attributes']['POSITION']]['count'],'position_bounds':{k:ac[p['attributes']['POSITION']].get(k) for k in ('min','max')},'uv': 'TEXCOORD_0' in p['attributes'],'material':p.get('material')})
 for im in j.get('images',[]):
  if 'bufferView' in im:
   v=j['bufferViews'][im['bufferView']];raw=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']];image=Image.open(io.BytesIO(raw));out['images'].append({'name':im.get('name'),'embedded':True,'mime':im.get('mimeType'),'size':image.size,'mode':image.mode,'sha256':hashlib.sha256(raw).hexdigest()})
  else:out['images'].append({'embedded':False,'uri':im.get('uri')})
 Path('reports/r31').mkdir(parents=True,exist_ok=True);Path('reports/r31/'+path.stem+'.json').write_text(json.dumps(out,indent=2));print(path.name,'bytes',len(b),'sha256',out['sha256'],'meshes',out['mesh_count'],'triangles',sum(p['triangles'] or 0 for p in out['primitives']),'images',out['images'],flush=True)
