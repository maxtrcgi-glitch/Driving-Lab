"""Prepare the shared asphalt from packed source maps and review in Blender."""
import argparse
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
parser.add_argument('--source-only', action='store_true')
parser.add_argument('--baseline', type=Path)
parser.add_argument('--skip-review', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
tile = 1.075
road = [o for o in scene.objects if o.type == 'MESH' and o.data.materials
        and o.data.materials[0].name.startswith('Paving | Asphalt Track')]
assert len(road) == 6, len(road)
source = road[0].data.materials[0]
for node in source.node_tree.nodes:
    if node.type == 'TEX_IMAGE':
        (out / node.image.name).write_bytes(node.image.packed_file.data)
if args.source_only:
    sys.exit(0)

def apply_material(objects, material):
    for obj in objects:
        mesh = obj.data
        # One metric mapping on a single coordinate system across both carriageways.
        uv = mesh.uv_layers.get('Asphalt metres') or mesh.uv_layers.new(name='Asphalt metres')
        mesh.uv_layers.active = uv
        uv.active_render = True
        macro = mesh.color_attributes.get('Asphalt variation') or mesh.color_attributes.new(
            name='Asphalt variation', type='FLOAT_COLOR', domain='POINT')
        mesh.color_attributes.active_color = macro
        for vertex in mesh.vertices:
            x, y, _ = obj.matrix_world @ vertex.co
            tone = .972 + .013 * math.sin(x*.37 + y*.19) + .011 * math.cos(y*.29 - x*.21)
            macro.data[vertex.index].color = (tone,tone,tone,1)
        for loop in mesh.loops:
            x, y, _ = obj.matrix_world @ mesh.vertices[loop.vertex_index].co
            uv.data[loop.index].uv = (x/tile,y/tile)
        mesh.materials[0] = material

mat = bpy.data.materials.new('R4.3a | Asphalt Track')
mat.use_nodes = True
nodes, links = mat.node_tree.nodes, mat.node_tree.links
shader = nodes.get('Principled BSDF')
shader.inputs['IOR'].default_value = 1.45
uv = nodes.new('ShaderNodeUVMap')
uv.uv_map = 'Asphalt metres'
maps = {}
for key, suffix, space in [('base','base','sRGB'),('rough','rough','Non-Color'),('normal','normal','Non-Color')]:
    node = nodes.new('ShaderNodeTexImage')
    node.label = key
    node.image = bpy.data.images.load(str(out / f'asphalt-{suffix}.png'))
    node.image.colorspace_settings.name = space
    links.new(uv.outputs[0],node.inputs['Vector'])
    maps[key] = node
variation = nodes.new('ShaderNodeVertexColor')
variation.layer_name = 'Asphalt variation'
mix = nodes.new('ShaderNodeMixRGB')
mix.blend_type = 'MULTIPLY'
mix.inputs[0].default_value = 1
links.new(variation.outputs['Color'],mix.inputs[1])
links.new(maps['base'].outputs['Color'],mix.inputs[2])
links.new(mix.outputs[0],shader.inputs['Base Color'])
links.new(maps['rough'].outputs['Color'],shader.inputs['Roughness'])
normal = nodes.new('ShaderNodeNormalMap')
normal.uv_map = uv.uv_map
normal.inputs['Strength'].default_value = .23
links.new(maps['normal'].outputs['Color'],normal.inputs['Color'])
links.new(normal.outputs[0],shader.inputs['Normal'])

if not args.skip_review:
    # Reuse the exact cropped scene from the R4.3 GLB for paired renders.
    # Its native R4.1c world, light and camera settings remain in this session.
    original_collections = list(scene.collection.children)
    original_objects = set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(args.baseline.resolve()))
    imported = [o for o in scene.objects if o not in original_objects]
    bpy.context.view_layer.update()
    imported_road = [o for o in imported if o.type == 'MESH' and o.data.materials
                     and o.data.materials[0].name.startswith('Paving | Asphalt Track')]
    assert len(imported_road) == 6
    for col in original_collections:
        if col.name.startswith(('01 |','02 |','03 |','04')):
            scene.collection.children.unlink(col)
    bpy.context.view_layer.update()
    driver, overview = [next(o for o in scene.objects if o.type == 'CAMERA' and o.name.startswith(p))
                        for p in ('A |','C |')]
    close = driver.copy()
    close.data = driver.data.copy()
    scene.collection.objects.link(close)
    close.location = (8.85, 5.1, .65)
    close.rotation_euler = Vector((-.12,.78,-.62)).to_track_quat('-Z','Y').to_euler()
    close.data.lens = 43
    sun_data = bpy.data.lights.new("Review sun", "SUN")
    sun = bpy.data.objects.new("Review sun", sun_data)
    scene.collection.objects.link(sun)
    sun_rotation = sun.rotation_euler.copy()
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 16
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 768
    scene.render.resolution_y = 432
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    def capture(camera, name):
        scene.camera = camera
        scene.render.filepath = str(out / (name + '.png'))
        bpy.ops.render.render(write_still=True)
    for version in ('before','after'):
        for camera, name in [(driver,'driver'),(overview,'overview'),(close,'close'),(driver,'raking')]:
            sun.rotation_euler = (math.radians(75),0,math.radians(-32)) if name == 'raking' else sun_rotation
            sun_data.energy = 2.0 if name == "raking" else 0.0
            capture(camera, f'blender-{version}-{name}')
        if version == 'before':
            apply_material(imported_road,mat)
    sun.rotation_euler = sun_rotation
    scene.camera = driver

# Native material export uses only the six original road meshes.
# Export on this unchanged master without a new vegetation conversion.
if not args.skip_review:
    for col in original_collections:
        if col.name.startswith('01 |'):
            scene.collection.children.link(col)
bpy.context.view_layer.update()
apply_material(road,mat)
bpy.ops.object.select_all(action='DESELECT')
for obj in road:
    obj.select_set(True)
bpy.context.view_layer.objects.active = road[0]
bpy.ops.export_scene.gltf(filepath=str(out/'asphalt-material.glb'),export_format='GLB',use_selection=True)
