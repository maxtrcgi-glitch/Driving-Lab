"""Refine packed infrastructure scans in an existing R4.3d working copy."""
import argparse
import json
from pathlib import Path
import sys
import bpy

parser = argparse.ArgumentParser()
parser.add_argument('checkpoint', choices=['A', 'B'])
parser.add_argument('output', type=Path)
a = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
scene = bpy.data.scenes['C_STOCHASTIC_FINAL']
bpy.context.window.scene = scene

def copy_material(name, title):
    original = bpy.data.materials[name]
    original.use_fake_user = True
    mat = original.copy()
    mat.name = title
    # Collection instances reference the source meshes. Keep mesh data and UVs.
    for obj in bpy.data.objects:
        for slot in obj.material_slots:
            if slot.material == original:
                slot.material = mat
    return mat, mat.node_tree.nodes, mat.node_tree.links

def ramp(nodes, links, source, low, high):
    node = nodes.new('ShaderNodeValToRGB')
    node.color_ramp.elements[0].color = (*low, 1)
    node.color_ramp.elements[1].color = (*high, 1)
    links.new(source, node.inputs[0])
    return node.outputs[0]

if a.checkpoint == 'A':
    mat, nodes, links = copy_material('Formed precast concrete', 'R45 | Formed roadside concrete')
    shader = nodes.get('Principled BSDF')
    normal = next(n for n in nodes if n.type == 'NORMAL_MAP')
    normal.inputs['Strength'].default_value = .42
    color = shader.inputs['Base Color'].links[0].from_socket
    coord = nodes.new('ShaderNodeTexCoord')
    split = nodes.new('ShaderNodeSeparateXYZ')
    links.new(coord.outputs['Generated'], split.inputs[0])
    stain = ramp(nodes, links, split.outputs['Z'], (.76, .74, .70), (1, 1, 1))
    # Module-local height anchors restrained road-splash accumulation to the base.
    blend = nodes.new('ShaderNodeMixRGB')
    blend.blend_type = 'MULTIPLY'
    blend.inputs[0].default_value = 1
    links.new(color, blend.inputs[1]); links.new(stain, blend.inputs[2])
    links.new(blend.outputs[0], shader.inputs['Base Color'])
    links.new(ramp(nodes, links, color, (.73,)*3, (.89,)*3), shader.inputs['Roughness'])
    for name in ['Hot-dip galvanized steel', 'Hot-dip galvanized steel.001']:
        mat, nodes, links = copy_material(name, 'R45 | Galvanized steel' + ('.secondary' if name.endswith('.001') else ''))
        shader = nodes.get('Principled BSDF')
        shader.inputs['Metallic'].default_value = .98
        color = shader.inputs['Base Color'].links[0].from_socket
        links.new(ramp(nodes, links, color, (.36,)*3, (.58,)*3), shader.inputs['Roughness'])
        next(n for n in nodes if n.type == 'NORMAL_MAP').inputs['Strength'].default_value = .18
    mat, nodes, links = copy_material('Markings | weathered off-white', 'R45 | Mineral-filled marking paint')
    shader = nodes.get('Principled BSDF')
    tex = next(n for n in nodes if n.type == 'TEX_IMAGE' and 'rough' in n.image.name)
    links.new(ramp(nodes, links, tex.outputs['Color'], (.65,)*3, (.84,)*3), shader.inputs['Roughness'])
    next(n for n in nodes if n.type == 'NORMAL_MAP').inputs['Strength'].default_value = .12
else:
    for name in ['Verge | compacted gravel, muted', 'Verge | gravel to leafy grass', 'Verge | leafy grass']:
        mat, nodes, links = copy_material(name, 'R45 | ' + name)
        # Translate a secondary sample consistently across all PBR channels.
        # No rotations, so the existing tangent normal convention is retained.
        images = [n for n in nodes if n.type == 'TEX_IMAGE']
        for tex in images:
            if not tex.inputs['Vector'].is_linked:
                continue
            vector = tex.inputs['Vector'].links[0].from_socket
            add = nodes.new('ShaderNodeVectorMath'); add.operation = 'ADD'
            add.inputs[1].default_value = (.371, .619, 0)
            links.new(vector, add.inputs[0])
            other = nodes.new('ShaderNodeTexImage'); other.image = tex.image
            other.extension = tex.extension; other.interpolation = tex.interpolation
            links.new(add.outputs[0], other.inputs['Vector'])
            consumers = list(tex.outputs['Color'].links)
            mix = nodes.new('ShaderNodeMixRGB'); mix.inputs[0].default_value = .18
            links.new(tex.outputs['Color'], mix.inputs[1]); links.new(other.outputs['Color'], mix.inputs[2])
            for link in consumers:
                links.new(mix.outputs[0], link.to_socket)
        mat['R45_sampling'] = '82% original UV scan, 18% translated scan; coherent channel translation, no rotation'
        for node in nodes:
            if node.type == 'NORMAL_MAP': node.inputs['Strength'].default_value = .55
scene['R45_checkpoint'] = a.checkpoint
for mat in bpy.data.materials:
    if mat.name.startswith('R45 |'):
        mat.use_fake_user = True
        for i, node in enumerate(mat.node_tree.nodes):
            node.location = ((i % 6) * 240, -(i // 6) * 260)
a.output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(a.output.resolve()))
print('R45_SAVED', a.checkpoint, a.output, flush=True)
