"""Assert unchanged GLB scene geometry and verify all asphalt texture bindings."""
from pathlib import Path
import sys

import numpy as np
from replace_asphalt import read_glb, view_bytes

before, after = [read_glb(Path(p)) for p in sys.argv[1:]]
old, new = before[0], after[0]
assert old['nodes'] == new['nodes'] and old['scenes'] == new['scenes']
def accessor(glb, index):
    doc, binary = glb
    info = doc['accessors'][index].copy()
    view = info.pop('bufferView')
    return info, view_bytes(doc,binary,view)
road = 0
for a,b in zip(old['meshes'],new['meshes'],strict=True):
    for pa,pb in zip(a['primitives'],b['primitives'],strict=True):
        ma,mb = old['materials'][pa['material']],new['materials'][pb['material']]
        asphalt = ma['name'].startswith('Paving | Asphalt Track')
        if asphalt:
            road += 1
            assert mb['name']=='R4.3a | Asphalt Track'
            for tex in [mb['normalTexture'],mb['pbrMetallicRoughness']['baseColorTexture'],
                        mb['pbrMetallicRoughness']['metallicRoughnessTexture']]:
                assert tex.get('texCoord',0)==0
                sampler = new['samplers'][new['textures'][tex['index']]['sampler']]
                assert sampler['wrapS']==sampler['wrapT']==10497
            pos=np.frombuffer(accessor(after,pb['attributes']['POSITION'])[1],'<f4').reshape(-1,3)
            uv=np.frombuffer(accessor(after,pb['attributes']['TEXCOORD_0'])[1],'<f4').reshape(-1,2)
            np.testing.assert_allclose(uv,np.column_stack((pos[:,0]/1.075,1+pos[:,2]/1.075)))
            color_info,color_data=accessor(after,pb['attributes']['COLOR_0'])
            colors=np.frombuffer(color_data,'<u2').reshape(-1,4)
            assert color_info['normalized'] and (colors[:,3]==65535).all()
            assert colors[:,:3].min()>=round(.948*65535)
            assert colors[:,:3].max()<=round(.996*65535)
        else:
            assert ma['name']==mb['name'] and pa['attributes'].keys()==pb['attributes'].keys()
        for key in pa['attributes']:
            if not asphalt or key in ('POSITION','NORMAL','TANGENT'):
                assert accessor(before,pa['attributes'][key])==accessor(after,pb['attributes'][key])
        if 'indices' in pa:
            assert accessor(before,pa['indices'])==accessor(after,pb['indices'])
assert road==6
print('Verified six road primitives, common repeating UV0, restrained vertex tone, unchanged vertex positions, normals and indices.')
