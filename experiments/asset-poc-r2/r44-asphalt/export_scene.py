"""Extract the R4.4 test scene from the approved Blender master without saving it.

blender -b C_STOCHASTIC_FINAL.blend --python-exit-code 1 -P export_scene.py -- OUTPUT
"""
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

output = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
output.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes["C_STOCHASTIC_FINAL"]
bpy.context.window.scene = scene

# The source object positions, triangle corners, split normals and station UVs
# are carried across. Batch only by material to keep submission cost small.
pavement = next(c for c in scene.collection.children if c.name.startswith("01 | Pavement"))
batches = {"Asphalt": {}, "Lane markings": {}}
for obj in pavement.all_objects:
    if obj.type != "MESH" or obj.hide_render:
        continue
    mesh = obj.data
    mesh.calc_loop_triangles()
    uv = mesh.uv_layers["Surface metres"].data
    world = obj.matrix_world
    normal_transform = world.to_3x3().inverted().transposed()
    for tri in mesh.loop_triangles:
        material = obj.material_slots[tri.material_index].material
        key = "Asphalt" if material.name == scene.name else "Lane markings"
        batch = batches[key].setdefault(material.name, [material, [], [], {}, []])
        _, positions, faces, index_by_corner, corner_attributes = batch
        index = []
        for loop, vertex in zip(tri.loops, tri.vertices):
            coords = tuple(world @ mesh.vertices[vertex].co)
            normal = tuple((normal_transform @ mesh.corner_normals[loop].vector).normalized())
            station_uv = tuple(uv[loop].uv)
            corner = (coords, normal, station_uv)
            if corner not in index_by_corner:
                index_by_corner[corner] = len(positions)
                positions.append(coords)
                corner_attributes.append((normal, station_uv))
            index.append(index_by_corner[corner])
        faces.append(index)

bpy.ops.object.select_all(action="DESELECT")
for name, materials in batches.items():
    assert len(materials) == 1, (name, list(materials))
    material, positions, faces, _, corners = next(iter(materials.values()))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(positions, [], faces)
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    mesh.normals_split_custom_set_from_vertices([normal for normal, _ in corners])
    layer = mesh.uv_layers.new(name="Surface metres")
    for loop in mesh.loops:
        layer.data[loop.index].uv = corners[loop.vertex_index][1]
    # The viewer supplies both comparison materials and simple lane paint.
    mesh.materials.append(bpy.data.materials.new(name))
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.select_set(True)

bpy.ops.export_scene.gltf(filepath=str(output / "road.glb"), export_format="GLB",
                         use_selection=True, export_materials="EXPORT")

cameras = {}
for prefix, label in zip("ABC", ("driver", "roadside", "overview")):
    obj = next(o for o in scene.objects if o.type == "CAMERA" and o.name.startswith(prefix + " |"))
    cameras[label] = {
        "matrix": [list(row) for row in obj.matrix_world],
        "fov": math.degrees(2 * math.atan(math.tan(obj.data.angle_x / 2) / (16 / 9))),
    }
sun = next(o for o in scene.objects if o.type == "LIGHT" and o.data.type == "SUN")
sun_direction = sun.matrix_world.to_3x3() @ Vector((0, 0, 1))
(output / "scene.json").write_text(json.dumps({
    "cameras": cameras,
    "sunDirection": list(sun_direction),
    "sunEnergy": sun.data.energy,
    "sunColor": list(sun.data.color),
}, indent=2) + "\n")

for suffix in ("diff", "nor_gl", "rough"):
    name = f"asphalt_04_{suffix}_4k.jpg"
    (output / name).write_bytes(bpy.data.images[name].packed_file.data)
