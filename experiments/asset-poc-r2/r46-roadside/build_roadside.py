"""Two recoverable edits of the native R4.5.1 scene. All distances are metres."""
import argparse
import hashlib
import json
import math
import random
import sys
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT.parent / 'r41-highway-master/r41b'))
from edit_scene import noise_at, smoothstep, uv_metres, world_xy

parser = argparse.ArgumentParser()
parser.add_argument('checkpoint', choices=['A', 'B'])
parser.add_argument('output', type=Path)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
scene = bpy.data.scenes['C_STOCHASTIC_FINAL']
bpy.context.window.scene = scene
land = [o for o in scene.objects if o.type == 'MESH' and o.name.startswith('Outer verge and drainage swale')]

def coverage(station, distance):
    width = .68 + .34 * noise_at(station, distance, 3.2, 1.4)
    cover = smoothstep(.13, width, distance)
    gaps = .24 * max(0, noise_at(station + 8, distance, 2.1, .7))
    return max(0, min(1, cover - gaps * (1 - smoothstep(1.4, 2.8, distance))))

def distance_from_edge(lateral):
    return lateral - 13.8 if lateral > 0 else -17 - lateral

stats = {'checkpoint': args.checkpoint, 'seed': 4601}
if args.checkpoint == 'A':
    profile = bpy.data.collections.new('Roadside_Profile_Correction')
    scene.collection.children.link(profile)
    max_delta = 0
    for obj in land:
        profile.objects.link(obj)
        attr = obj.data.attributes.new('R46_Cover', 'FLOAT', 'POINT')
        for vertex, sample in zip(obj.data.vertices, attr.data):
            station, lateral = uv_metres(obj.matrix_world @ vertex.co)
            distance = distance_from_edge(lateral)
            sample.value = coverage(station, distance)
            fade = smoothstep(0, .22, distance) * (1 - smoothstep(1.2, 2.2, distance))
            delta = .016 * noise_at(station, distance, 1.6, .45) * fade
            vertex.co.z += delta
            max_delta = max(max_delta, abs(delta))
        obj.data.update()
    for kind in ['diff', 'rough', 'nor_gl']:
        name = f'gravel_stones_{kind}_2k.jpg'
        image = bpy.data.images.load(str(ROOT / 'assets' / name), check_existing=True)
        image.colorspace_settings.name = 'sRGB' if kind == 'diff' else 'Non-Color'
        image.pack()
    from materials import build
    build('R451 | verge transition', 'mineral and low cover')
    stats['maximum_profile_delta_m'] = max_delta
else:
    detail = bpy.data.collections.new('Roadside_Detail_Instances')
    scene.collection.children.link(detail)
    sources = bpy.data.collections.new('Roadside_Detail_Sources')
    sources.use_fake_user = True
    # Source meshes remain unlinked from the scene, rendered through shared data.
    material = bpy.data.materials.new('R46 | Mineral fragments')
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = .83
    coord = nodes.new('ShaderNodeTexCoord')
    color = nodes.new('ShaderNodeTexImage')
    color.image = bpy.data.images['gravel_stones_diff_2k.jpg']
    color.projection = 'BOX'
    color.projection_blend = .18
    mapping = nodes.new('ShaderNodeVectorMath')
    mapping.operation = 'MULTIPLY_ADD'
    mapping.inputs[1].default_value = (.04, .04, .04)
    mapping.inputs[2].default_value = (.33, .21, .17)
    links.new(coord.outputs['Generated'], mapping.inputs[0])
    links.new(mapping.outputs[0], color.inputs['Vector'])
    links.new(color.outputs['Color'], shader.inputs['Base Color'])
    prototypes = []
    rng = random.Random(4601)
    for index in range(4):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1)
        source = bpy.context.object
        for col in list(source.users_collection):
            col.objects.unlink(source)
        sources.objects.link(source)
        source.name = f'R46 fragment source {index}'
        for vertex in source.data.vertices:
            vertex.co.x *= rng.uniform(.8, 1.2)
            vertex.co.y *= rng.uniform(.8, 1.2)
            vertex.co.z *= rng.uniform(.42, .65)
        source.data.materials.append(material)
        prototypes.append(source)
    grass = [bpy.data.collections['R4.1c source | ' + name] for name in
             ['grass_bermuda_01_seedling_a', 'grass_bermuda_01_seedling_b', 'grass_medium_02_a']]
    dry_source = grass[-1]
    dry = bpy.data.collections.new('R46 source | dry low growth')
    dry.instance_offset = dry_source.instance_offset
    for old in dry_source.objects:
        obj = old.copy()
        dry.objects.link(obj)
        for slot in obj.material_slots:
            if slot.material:
                slot.link = 'OBJECT'
                mat = slot.material.copy()
                mat.name = 'R46 | Dry growth'
                shader = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
                input_socket = shader.inputs['Base Color']
                prior = input_socket.links[0].from_socket
                tint = mat.node_tree.nodes.new('ShaderNodeMixRGB')
                tint.blend_type = 'MULTIPLY'
                tint.inputs[0].default_value = 1
                tint.inputs[2].default_value = (.82, .67, .43, 1)
                mat.node_tree.links.new(prior, tint.inputs[1])
                mat.node_tree.links.new(tint.outputs[0], input_socket)
                slot.material = mat
    surfaces = [BVHTree.FromPolygons([o.matrix_world @ v.co for v in o.data.vertices],
                                   [tuple(p.vertices) for p in o.data.polygons]) for o in land]
    def surface(station, lateral):
        x, y = world_xy(station, lateral)
        hits = [tree.ray_cast((x, y, 100), (0, 0, -1), 200)[0] for tree in surfaces]
        points = [p for p in hits if p is not None]
        assert points
        return max(points, key=lambda p: p.z)
    records = []
    counts = {'small_stone': 0, 'large_stone': 0, 'grass': 0, 'dry': 0}
    for attempt in range(17000):
        station = rng.uniform(-18, 210)
        distance = rng.uniform(.035, 2.6)
        # Most silhouette detail is reserved for the inspected near-road section.
        lod = 1 if station < 65 else .12
        if rng.random() > lod:
            continue
        cover = coverage(station, distance)
        clustered = .5 + .45 * noise_at(station, distance, 1.9, .55)
        if rng.random() > clustered:
            continue
        lateral = 13.8 + distance
        point = surface(station, lateral)
        roll = rng.random()
        if roll > cover:
            large = rng.random() < .025 and distance > .22
            radius = rng.uniform(.035, .065) if large else rng.uniform(.008, .026)
            radius = min(radius, distance / 1.56 * .85)
            obj = bpy.data.objects.new('R46 | embedded mineral', rng.choice(prototypes).data)
            detail.objects.link(obj)
            obj.scale = (radius * rng.uniform(.8, 1.3), radius, radius)
            obj.location = point + Vector((0, 0, radius * .10))
            obj.rotation_euler = (rng.uniform(-.2, .2), rng.uniform(-.2, .2), rng.uniform(0, math.tau))
            kind = 'large_stone' if large else 'small_stone'
        elif distance > .36 and rng.random() < .18:
            kind = 'dry' if rng.random() < .14 else 'grass'
            group = dry if kind == 'dry' else rng.choice(grass)
            obj = bpy.data.objects.new('R46 | rooted ' + kind, None)
            detail.objects.link(obj)
            obj.instance_type = 'COLLECTION'
            obj.instance_collection = group
            size = rng.uniform(.6, 1.25)
            obj.scale = (size, size, size * rng.uniform(.65, .9))
            obj.location = point - Vector((0, 0, .009))
            obj.rotation_euler.z = rng.uniform(0, math.tau)
        else:
            continue
        assert distance >= .035
        counts[kind] += 1
        records.append((kind, obj.data.name if obj.data else obj.instance_collection.name, tuple(obj.location), tuple(obj.scale), tuple(obj.rotation_euler)))
    stats['instances'] = counts
    stats['placement_sha256'] = hashlib.sha256(repr(records).encode()).hexdigest()
    stats['stone_unique_triangles'] = sum(len(p.data.polygons) for p in prototypes)
    stats['stone_evaluated_triangles'] = (counts['small_stone'] + counts['large_stone']) * 20
    grass_triangles = 0
    for obj in detail.objects:
        if obj.instance_collection:
            grass_triangles += sum(sum(len(poly.vertices) - 2 for poly in mesh.data.polygons)
                                   for mesh in obj.instance_collection.objects if mesh.type == 'MESH')
    stats['vegetation_evaluated_triangles'] = grass_triangles
    stats['additional_evaluated_triangles'] = stats['stone_evaluated_triangles'] + grass_triangles
    stats['unique_assets'] = 8
    stats['additional_materials_checkpoint_B'] = 2
bpy.ops.file.pack_all()
args.output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()))
args.output.with_suffix('.json').write_text(json.dumps(stats, indent=2))
print('R46_CHECKPOINT', json.dumps(stats), flush=True)
