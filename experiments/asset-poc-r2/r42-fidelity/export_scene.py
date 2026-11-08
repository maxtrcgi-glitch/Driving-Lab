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
