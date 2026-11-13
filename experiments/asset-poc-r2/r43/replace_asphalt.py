"""Apply the Blender asphalt export to the exact existing R4.3 highway geometry."""
import argparse
from copy import deepcopy
import io
import json
from pathlib import Path
import struct

import numpy as np
from PIL import Image

def read_glb(path):
    data = path.read_bytes()
    magic, version, total, size, chunk = struct.unpack_from('<4sIIII',data)
    assert (magic,version,total,chunk) == (b'glTF',2,len(data),0x4E4F534A)
    return json.loads(data[20:20+size]), memoryview(data)[28+size:]

def view_bytes(doc, data, index):
    view = doc['bufferViews'][index]
    start = view.get('byteOffset',0)
    return data[start:start+view['byteLength']]

def write_glb(path, doc, data):
    raw = json.dumps(doc,separators=(',',':')).encode()
    raw += b' ' * (-len(raw)%4)
    header = struct.pack('<4sIIII',b'glTF',2,28+len(raw)+len(data),len(raw),0x4E4F534A)
    path.write_bytes(header+raw+struct.pack('<II',len(data),0x004E4942)+data)

def replace(baseline, asphalt, output):
    doc, data = read_glb(baseline)
    mat_doc, mat_data = read_glb(asphalt)
    material, = deepcopy(mat_doc['materials'])
    assert material['name'] == 'R4.3a | Asphalt Track'
    old_materials = [i for i,m in enumerate(doc['materials']) if m['name'].startswith('Paving | Asphalt Track')]
    assert len(old_materials) == 6

    view_payloads = [view_bytes(doc,data,i) for i in range(len(doc['bufferViews']))]
    def append_view(payload, target=None):
        index = len(view_payloads)
        view_payloads.append(payload)
        doc['bufferViews'].append({'buffer':0,'byteLength':len(payload)})
        if target:
            doc['bufferViews'][-1]['target'] = target
        return index

    def append_accessor(array, kind, component_type, normalized=False):
        index = len(doc['accessors'])
        doc['accessors'].append({
            'bufferView':append_view(array.tobytes(),34962),'componentType':component_type,
            'count':len(array),'type':kind,
        })
        if normalized:
            doc['accessors'][-1]['normalized'] = True
        return index

    texture_fields = [
        material['normalTexture'],
        material['pbrMetallicRoughness']['baseColorTexture'],
        material['pbrMetallicRoughness']['metallicRoughnessTexture'],
    ]
    for kind, field in zip(('normal','base','rough'), texture_fields):
        assert field.get('texCoord',0) in (0,1)
        tex = mat_doc['textures'][field['index']]
        img = mat_doc['images'][tex['source']]
        with Image.open(io.BytesIO(view_bytes(mat_doc,mat_data,img['bufferView']))) as image:
            packed = io.BytesIO()
            image.convert('RGB').save(packed,format='JPEG',quality=92 if kind!='rough' else 87,
                                      subsampling=0,optimize=True)
        index = len(doc['images'])
        doc['images'].append({'name':'R43a asphalt '+kind,'mimeType':'image/jpeg',
                              'bufferView':append_view(packed.getvalue())})
        sampler = len(doc['samplers'])
        doc['samplers'].append({'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497})
        field['index'] = len(doc['textures'])
        field.pop('texCoord',None)
        doc['textures'].append({'source':index,'sampler':sampler})

    corrected = []
    measured = []
    for node in doc['nodes']:
        if 'mesh' not in node:
            continue
        for prim in doc['meshes'][node['mesh']]['primitives']:
            if prim.get('material') not in old_materials:
                continue
            assert not set(node) & {'matrix','scale','translation','rotation'}
            at = prim['attributes']
            position = doc['accessors'][at['POSITION']]
            assert position['type']=='VEC3' and position['componentType']==5126 and not position.get('byteOffset')
            coords = np.frombuffer(view_payloads[position['bufferView']],'<f4').reshape((-1,3))
            x,y = coords[:,0], -coords[:,2]  # glTF +Y up, Blender +Z up.
            uv = np.column_stack((x/1.075,1-y/1.075)).astype('<f4')
            tone = .972 + .013*np.sin(x*.37+y*.19) + .011*np.cos(y*.29-x*.21)
            rgba = np.ones((len(coords),4),dtype=np.float32)
            rgba[:,:3] = tone[:,None]
            at['TEXCOORD_0'] = append_accessor(uv,'VEC2',5126)
            at['COLOR_0'] = append_accessor(np.rint(rgba*65535).astype('<u2'),'VEC4',5123,True)
            at.pop('TEXCOORD_1',None)
            at.pop('COLOR_1',None)
            at.pop('COLOR_2',None)
            prim['material'] = len(doc['materials'])
            corrected.append(node['name'])
            dim = 1024 if '48 m art study' in node['name'] else 512
            measured.append({'object':node['name'],'r43_baked_px_per_m_xy':
                             (dim*.98/np.array([np.ptp(x),np.ptp(y)])).round(2).tolist(),
                             'r43_normal_nominal_px_per_m':round(512/2.15,2),
                             'r43a_all_channels_px_per_m_xy':round(1024/1.075,2)})
    assert len(corrected)==6
    doc['materials'].append(material)

    # Remove obsolete road materials, maps and UV/color data. Preserve other
    # scene primitives and binary payloads byte for byte.
    def compact(key, used):
        mapping = {old:new for new,old in enumerate(sorted(used))}
        doc[key] = [doc[key][i] for i in mapping]
        return mapping
    all_prims = [p for m in doc['meshes'] for p in m['primitives']]
    material_map = compact('materials',{p['material'] for p in all_prims if 'material' in p})
    for prim in all_prims:
        if 'material' in prim:
            prim['material'] = material_map[prim['material']]
    def map_fields(item):
        for key,value in item.items():
            if isinstance(value,dict):
                if key.lower().endswith('texture') and 'index' in value:
                    yield value
                else:
                    yield from map_fields(value)
    fields = [f for m in doc['materials'] for f in map_fields(m)]
    texture_map = compact('textures',{f['index'] for f in fields})
    for f in fields:
        f['index'] = texture_map[f['index']]
    image_map = compact('images',{t['source'] for t in doc['textures']})
    for t in doc['textures']:
        t['source'] = image_map[t['source']]
    assert not any(k in doc for k in ('animations','skins')) and all('targets' not in p for p in all_prims)
    used = {i for p in all_prims for i in p['attributes'].values()} | {p['indices'] for p in all_prims if 'indices' in p}
    accessor_map = compact('accessors',used)
    for p in all_prims:
        p['attributes'] = {k:accessor_map[v] for k,v in p['attributes'].items()}
        if 'indices' in p:
            p['indices'] = accessor_map[p['indices']]
    entries = doc['accessors'] + doc['images']
    views = compact('bufferViews',{e['bufferView'] for e in entries})
    for entry in entries:
        entry['bufferView'] = views[entry['bufferView']]
    binary = bytearray()
    for old,new in views.items():
        v = doc['bufferViews'][new]
        v['byteOffset'] = len(binary)
        binary.extend(view_payloads[old])
        binary.extend(b'\0' * (-len(binary)%4))
    doc['buffers'][0]['byteLength'] = len(binary)
    write_glb(output,doc,binary)
    return measured

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for name in ('baseline','asphalt','output'):
        parser.add_argument(name,type=Path)
    args = parser.parse_args()
    measurements = replace(args.baseline,args.asphalt,args.output)
    args.output.with_name('asphalt-density.json').write_text(json.dumps(measurements,indent=2)+'\n')
    print(json.dumps(measurements,indent=2))
