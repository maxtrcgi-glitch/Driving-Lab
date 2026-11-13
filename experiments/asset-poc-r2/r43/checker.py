"""Render the old bake UV and the new metric UV against a common 2 m grid."""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

baseline, out = map(Path,sys.argv[sys.argv.index('--')+1:])
out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(baseline.resolve()))
scene = bpy.context.scene
road = [o for o in scene.objects if o.type=='MESH' and o.data.materials[0].name.startswith('Paving | Asphalt Track')]
assert len(road)==6
for o in list(scene.objects):
    if o not in road:
        bpy.data.objects.remove(o,do_unlink=True)
mat = bpy.data.materials.new('UV checker and 2 m world grid')
mat.use_nodes=True
nodes, links = mat.node_tree.nodes,mat.node_tree.links
emit=nodes.new('ShaderNodeEmission')
links.new(emit.outputs[0],nodes.get('Material Output').inputs[0])
metric = nodes.new('ShaderNodeTexCoord').outputs['Object']
uv = nodes.new('ShaderNodeUVMap')
check = nodes.new('ShaderNodeTexChecker')
check.inputs['Color1'].default_value=(.16,.23,.32,1)
check.inputs['Color2'].default_value=(.66,.75,.81,1)
links.new(uv.outputs[0],check.inputs['Vector'])
def math(op, socket, scalar):
    n=nodes.new('ShaderNodeMath')
    n.operation=op
    links.new(socket,n.inputs[0])
    n.inputs[1].default_value=scalar
    return n.outputs[0]
xy=nodes.new('ShaderNodeSeparateXYZ')
links.new(metric,xy.inputs[0])
grid = [math('LESS_THAN',math('FLOORED_MODULO',s,2.0),.035) for s in (xy.outputs['X'],xy.outputs['Y'])]
combine=nodes.new('ShaderNodeMath')
combine.operation='MAXIMUM'
for i,s in enumerate(grid):links.new(s,combine.inputs[i])
mix=nodes.new('ShaderNodeMixRGB')
mix.inputs[2].default_value=(.93,.38,.025,1)
links.new(combine.outputs[0],mix.inputs[0])
links.new(check.outputs[0],mix.inputs[1])
links.new(mix.outputs[0],emit.inputs[0])
for o in road:
    o.data.materials[0]=mat
    new=o.data.uv_layers.new(name='Metric checker')
    for l in o.data.loops:
        v=o.matrix_world @ o.data.vertices[l.vertex_index].co
        new.data[l.index].uv=(v.x/1.075,v.y/1.075)
camera_data=bpy.data.cameras.new('UV inspection')
camera=bpy.data.objects.new('UV inspection',camera_data)
scene.collection.objects.link(camera)
camera.location=(-3,49,100)
camera.rotation_euler=Vector((0,0,-1)).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=57
scene.camera=camera
scene.render.engine='CYCLES'
scene.cycles.samples=2
scene.cycles.use_denoising=False
scene.render.resolution_x=850
scene.render.resolution_y=850
scene.render.resolution_percentage=100
for suffix,scale in [('before',32),('after',1.075)]:
    uv.uv_map=road[0].data.uv_layers[1].name if suffix=='before' else 'Metric checker'
    check.inputs['Scale'].default_value=scale
    scene.render.filepath=str(out/f'checker-{suffix}.png')
    bpy.ops.render.render(write_still=True)
