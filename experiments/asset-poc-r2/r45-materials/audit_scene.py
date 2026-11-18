"""Snapshot geometry, transforms, cameras, lighting and approved asphalt graph."""
import bpy, hashlib, json, sys
from array import array
from pathlib import Path
s=bpy.data.scenes['C_STOCHASTIC_FINAL']
def digest(values):
    return hashlib.sha256(repr(values).encode()).hexdigest()
geometry = {}
for mesh in bpy.data.meshes:
    coords = array('f', [0]) * (len(mesh.vertices) * 3)
    indices = array('i', [0]) * len(mesh.loops)
    mesh.vertices.foreach_get('co', coords)
    mesh.loops.foreach_get('vertex_index', indices)
    h = hashlib.sha256(coords.tobytes()); h.update(indices.tobytes())
    geometry[mesh.name] = h.hexdigest()
# Flatten matrices into plain JSON values.
objects={o.name:[o.type,[list(row) for row in o.matrix_world],o.data.name if o.data else None] for o in bpy.data.objects}
material=bpy.data.materials['C_STOCHASTIC_FINAL']
shader=digest([(n.name,n.bl_idname,[(i.name,str(tuple(i.default_value) if hasattr(i.default_value, '__len__') else i.default_value)) for i in n.inputs if hasattr(i,'default_value')]) for n in material.node_tree.nodes]+[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name) for l in material.node_tree.links])
result={'geometry':geometry,'objects':objects,'asphalt_graph':shader,'exposure':s.view_settings.exposure,'world':s.world.name,'cameras':{o.name:[o.data.lens,o.data.sensor_width] for o in s.objects if o.type=='CAMERA'},'lights':{o.name:[o.data.type,o.data.energy,list(o.data.color)] for o in s.objects if o.type=='LIGHT'}}
Path(sys.argv[sys.argv.index('--')+1]).write_text(json.dumps(result,indent=2))
