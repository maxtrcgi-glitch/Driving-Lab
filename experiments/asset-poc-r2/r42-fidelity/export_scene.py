"""Export a representative R4.1c section from the saved Blender master."""
import bpy, json, math, os, sys
from mathutils import Matrix, Vector

out = os.path.abspath(sys.argv[sys.argv.index("--") + 1])
os.makedirs(out, exist_ok=True)
scene = bpy.context.scene
assert bpy.data.filepath.endswith("highway-master-r41c.blend")
bpy.context.view_layer.update()
camera = bpy.data.objects["A | Driver eye · 1.20 m"]
matrix = camera.matrix_world.copy()
camera_data = {
    "world_matrix": [list(row) for row in matrix],
    "yfov": 2 * math.atan((camera.data.sensor_width * 720 / 1280) / (2 * camera.data.lens)),
    "exposure_blender_ev": scene.view_settings.exposure,
}
groups = ["01 | Pavement and paint", "02 | Road restraint systems", "03 | Verge and landform"]
selected = []
for group in groups:
    selected.extend(o for o in bpy.data.collections[group].objects if o.type == "MESH")

# Collection instances are made real as linked-mesh duplicates only in memory.
# Keep the entire road and backdrop as camera context; sample vegetation through
# the first 80 m and a sparse distant ridge for representative fidelity.
wood = bpy.data.collections["04 | Woodland"]
grass = bpy.data.collections["04b | Cut verge and bank grasses"]
radius = 630.0
def station(obj):
    p = obj.matrix_world.translation
    return radius * math.atan2(p.y, p.x + radius)
def lateral(obj):
    p = obj.matrix_world.translation
    return math.hypot(p.x + radius, p.y) - radius

def bounded_sample(collection, predicate, maximum):
    candidates = sorted((o for o in collection.objects if o.instance_collection and predicate(o)),
                        key=lambda o: (station(o), lateral(o), o.name))
    if len(candidates) <= maximum:
        return candidates
    return [candidates[round(i * (len(candidates)-1) / (maximum-1))] for i in range(maximum)]

instances = []
instances += [o for o in bpy.data.collections["02 | Road restraint systems"].objects if o.instance_collection]
instances += bounded_sample(wood, lambda o: -15 <= station(o) <= 100 and -28 <= lateral(o) <= 40, 70)
instances += bounded_sample(wood, lambda o: station(o) >= 216 and -90 <= lateral(o) <= 95, 35)
instances += bounded_sample(grass, lambda o: -8 <= station(o) <= 75 and -22 <= lateral(o) <= 23, 120)
temp = bpy.data.collections.new("R4.2 export objects")
scene.collection.children.link(temp)
for instance in instances:
    source = instance.instance_collection
    for original in source.all_objects:
        if original.type != "MESH":
            continue
        clone = original.copy()
        clone.data = original.data
        clone.parent = None
        temp.objects.link(clone)
        clone.matrix_world = instance.matrix_world @ Matrix.Translation(-source.instance_offset) @ original.matrix_world
        selected.append(clone)
# Make export-only material copies for Blender node graphs that the glTF
# exporter cannot represent. Reconnect the original PBR maps without changing
# the saved source master; procedural terrain blends remain a known limitation.
material_map = {}
for obj in list(selected):
    if obj.type != "MESH" or not obj.data.materials:
        continue
    replacements = []
    for material in obj.data.materials:
        if material and material.name.startswith("Paving |"):
            stem = "asphalt_track"
        elif material and (material.name.startswith("Verge | gravel to") or
                           material.name.startswith("Verge | leafy")):
            stem = "grass"
        else:
            replacements.append(material)
            continue
        if material.name not in material_map:
            converted = material.copy()
            converted.name = "R4.2 PBR | " + material.name
            tree = converted.node_tree
            shader = tree.nodes.get("Principled BSDF")
            for input_name, token in (("Base Color", stem + ("_diff" if stem == "asphalt_track" else "-diff")),
                                      ("Roughness", stem + ("_rough" if stem == "asphalt_track" else "-rough"))):
                image = next((im for im in bpy.data.images if im.name.startswith(token)), None)
                if not image:
                    raise ValueError("Missing original PBR image " + token)
                node = tree.nodes.new("ShaderNodeTexImage")
                node.image = image
                tree.links.new(node.outputs["Color"], shader.inputs[input_name])
            material_map[material.name] = converted
        replacements.append(material_map[material.name])
    if any(a != b for a,b in zip(replacements, obj.data.materials)):
        copy = obj.copy()
        copy.data = obj.data.copy()
        temp.objects.link(copy)
        copy.matrix_world = obj.matrix_world.copy()
        for i,material in enumerate(replacements):
            copy.data.materials[i] = material
        selected.remove(obj)
        selected.append(copy)
print("R42 compatible PBR materials:", list(material_map), flush=True)
bpy.ops.object.select_all(action="DESELECT")
for obj in selected:
    obj.select_set(True)
bpy.context.view_layer.objects.active = selected[0]
print("R42 export objects", len(selected), "instances", len(instances), flush=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(out, "highway-r42.glb"),
    export_format="GLB", use_selection=True, export_apply=False,
    export_cameras=False, export_lights=False, export_yup=True)
camera_data["objects"] = len(selected)
camera_data["collection_instances"] = len(instances)
camera_data["blender"] = bpy.app.version_string
with open(os.path.join(out,"scene-info.json"),"w") as f:
    json.dump(camera_data,f,indent=2)
