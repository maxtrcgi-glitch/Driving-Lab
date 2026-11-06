import argparse
parser=argparse.ArgumentParser()
parser.add_argument("--source",required=True)
parser.add_argument("--lod0",required=True)
parser.add_argument("--output",required=True)
args=parser.parse_args()
from pathlib import Path
source=Path(args.source)
import json,struct,io,hashlib
import numpy as np
from PIL import Image
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
s=json.load(open(source/'tree_small_02_1k.gltf'));raw=open(source/'tree_small_02.bin','rb').read(); p=s['meshes'][0]['primitives'][1]
def acc(i):
 a=s['accessors'][i];v=s['bufferViews'][a['bufferView']];d={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']];n={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];off=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',np.dtype(d).itemsize*n);return np.ndarray((a['count'],n),dtype=d,buffer=raw,offset=off,strides=(stride,np.dtype(d).itemsize))
positions=acc(p['attributes']['POSITION']); normals=acc(p['attributes']['NORMAL']);uvs=acc(p['attributes']['TEXCOORD_0']);inds=acc(p['indices']).reshape(-1,3);n=len(positions)
row=np.r_[inds[:,0],inds[:,1]];col=np.r_[inds[:,1],inds[:,2]];adj=coo_matrix((np.ones(len(row),dtype=np.uint8),(row,col)),shape=(n,n)).tocsr();num,labels=connected_components(adj,directed=False)
# One representative point per connected leaf component, then farthest-point sampling.
_,first=np.unique(labels,return_index=True);centres=positions[first];centres=np.asarray(centres,dtype=np.float32); selected=[];dist=np.full(num,np.inf);rng=np.random.default_rng(21);idx=int(rng.integers(num))
for _ in range(400):
 selected.append(idx);dist=np.minimum(dist,np.sum((centres-centres[idx])**2,axis=1));idx=int(np.argmax(dist))
mask=np.isin(labels[inds[:,0]],selected);tris=inds[mask];uniq,inv=np.unique(tris,return_inverse=True);newinds=inv.astype('<u4')
path=args.lod0;glb=open(path,'rb').read();jslen=struct.unpack_from('<I',glb,12)[0];g=json.loads(glb[20:20+jslen]);binary=bytearray(glb[28+jslen:]);
def add(data,target=None):
 while len(binary)%4:binary.append(0)
 off=len(binary);binary.extend(data);bv={'buffer':0,'byteOffset':off,'byteLength':len(data)}
 if target:bv['target']=target
 g['bufferViews'].append(bv);return len(g['bufferViews'])-1
def accessor(a,typ,target):
 a=np.ascontiguousarray(a);view=add(a.tobytes(),target);item={'bufferView':view,'componentType':5125 if a.dtype==np.dtype('<u4') else 5126,'count':len(a),'type':typ}
 if typ=='VEC3':item.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
 g['accessors'].append(item);return len(g['accessors'])-1
leaf=g['meshes'][1]['primitives'][0];leaf['attributes']={'POSITION':accessor(positions[uniq].astype('<f4'),'VEC3',34962),'NORMAL':accessor(normals[uniq].astype('<f4'),'VEC3',34962),'TEXCOORD_0':accessor(uvs[uniq].astype('<f4'),'VEC2',34962)};leaf['indices']=accessor(newinds,'SCALAR',34963)
# Rebuild original colour/alpha faithfully, resize for candidate use.
rgb=Image.open(source/'textures/tree_small_02_leaves_diff_1k.jpg').convert('RGB');alpha=np.asarray(Image.open(source/'textures/tree_small_02_leaves_alpha_1k.png'),dtype=np.uint16);alpha8=Image.fromarray((alpha/257).round().astype('uint8'),'L');rgb.putalpha(alpha8);rgb=rgb.resize((512,512),Image.Resampling.LANCZOS);o=io.BytesIO();rgb.save(o,format='PNG',optimize=True);view=add(o.getvalue()); imageidx=g['textures'][g['materials'][1]['pbrMetallicRoughness']['baseColorTexture']['index']]['source'];g['images'][imageidx]['bufferView']=view;g['images'][imageidx]['mimeType']='image/png'
g['buffers'][0]['byteLength']=len(binary);j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary+=b'\x00'*((-len(binary))%4);out=struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(binary))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(binary),b'BIN\x00')+binary
open(args.output,'wb').write(out);print('components',num,'selected',len(selected),'leaf triangles',len(tris),'vertices',len(uniq),'file bytes',len(out),'sha256',hashlib.sha256(out).hexdigest());print('candidate total triangles',len(tris)+770+493)
