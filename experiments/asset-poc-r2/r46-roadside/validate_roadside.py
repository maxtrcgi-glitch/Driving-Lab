"""Snapshot protected state and check new instance contact against the edited verge."""
import hashlib
import json
import sys
from array import array
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

scene = bpy.data.scenes['C_STOCHASTIC_FINAL']
result = {'geometry': {}, 'uv': {}, 'objects': {}, 'materials': {}, 'cameras': {}, 'lights': {}}
def signature(value):
    return hashlib.sha256(repr(value).encode()).hexdigest()
for mesh in bpy.data.meshes:
    coords = array('f', [0]) * (len(mesh.vertices) * 3)
    indices = array('i', [0]) * len(mesh.loops)
    mesh.vertices.foreach_get('co', coords)
    mesh.loops.foreach_get('vertex_index', indices)
    digest = hashlib.sha256(coords.tobytes())
    digest.update(indices.tobytes())
    result['geometry'][mesh.name] = digest.hexdigest()
    if 'Surface metres' in mesh.uv_layers:
        values = array('f', [0]) * (len(mesh.loops) * 2)
        mesh.uv_layers['Surface metres'].data.foreach_get('uv', values)
        result['uv'][mesh.name] = hashlib.sha256(values.tobytes()).hexdigest()
for obj in bpy.data.objects:
    result['objects'][obj.name] = [obj.type, [list(row) for row in obj.matrix_world],
                                 obj.data.name if obj.data else None,
                                 [slot.material.name if slot.material else None for slot in obj.material_slots]]
    if obj.type == 'CAMERA':
        result['cameras'][obj.name] = [obj.data.lens, obj.data.sensor_width]
    if obj.type == 'LIGHT':
        result['lights'][obj.name] = [obj.data.type, obj.data.energy, list(obj.data.color)]
for mat in bpy.data.materials:
    if not mat.node_tree:
        continue
    values = [(node.name, node.bl_idname, [(i.name, tuple(i.default_value) if hasattr(i.default_value, '__len__') else i.default_value)
                                         for i in node.inputs if hasattr(i, 'default_value')]) for node in mat.node_tree.nodes]
    links = [(l.from_node.name, l.from_socket.name, l.to_node.name, l.to_socket.name) for l in mat.node_tree.links]
    result['materials'][mat.name] = signature((values, links))
result['exposure'] = scene.view_settings.exposure
result['world'] = scene.world.name
land = [o for o in scene.objects if o.type == 'MESH' and o.name.startswith('Outer verge and drainage swale')]
result['terrain_boundary'] = {}
for obj in land:
    edge = 13.8 if obj.name == 'Outer verge and drainage swale' else -17
    points = []
    for vertex in obj.data.vertices:
        point = obj.matrix_world @ vertex.co
        lateral = ((point.x + 630) ** 2 + point.y ** 2) ** .5 - 630
        if abs(lateral - edge) < .0001:
            points.append(list(point))
    result['terrain_boundary'][obj.name] = points
if 'Roadside_Detail_Instances' in bpy.data.collections:
    trees = [BVHTree.FromPolygons([o.matrix_world @ v.co for v in o.data.vertices],
                                 [tuple(p.vertices) for p in o.data.polygons]) for o in land]
    def height(point):
        hits = [tree.ray_cast((point.x, point.y, 100), (0, 0, -1), 200)[0] for tree in trees]
        points = [p for p in hits if p is not None]
        assert points
        return max(p.z for p in points)
    floating = []
    paved = []
    rooted = 0
    for obj in bpy.data.collections['Roadside_Detail_Instances'].objects:
        if obj.type == 'MESH':
            points = [obj.matrix_world @ v.co for v in obj.data.vertices]
            offsets = [p.z - height(p) for p in points]
            if min(offsets) > .001 or max(offsets) < -.001:
                floating.append(obj.name)
        else:
            rooted += 1
            if abs(obj.location.z - height(obj.location) + .009) > .001:
                floating.append(obj.name)
            points = [obj.location]
        if any(((p.x + 630) ** 2 + p.y ** 2) ** .5 - 630 < 13.8 for p in points):
            paved.append(obj.name)
    result['contact'] = {'floating_or_fully_buried': floating, 'paved_overlap': paved, 'rooted_instances': rooted}
    assert not floating and not paved, result['contact']
result['images'] = {i.name: {'resolution': list(i.size), 'colorspace': i.colorspace_settings.name,
                            'packed': bool(i.packed_file)} for i in bpy.data.images if i.source == 'FILE'}
Path(sys.argv[sys.argv.index('--') + 1]).write_text(json.dumps(result, indent=2))
