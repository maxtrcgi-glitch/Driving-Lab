"""R4.3 derived working copy. Run with Blender on the verified R4.1c master."""
import argparse
import json
import math
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path)
parser.add_argument("--stage", choices=("a", "b", "c"), required=True)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
pavement, restraints, terrain, woodland = [
    bpy.data.collections[name] for name in ("01 | Pavement and paint", "02 | Road restraint systems",
    "03 | Verge and landform", "04 | Woodland")]
cameras = {k: next(o for o in scene.objects if o.type == "CAMERA" and o.name.startswith(p))
           for k, p in zip(("driver", "roadside", "overview"), ("A |", "B |", "C |"))}
bpy.context.view_layer.update()
work = bpy.data.collections.new("R4.3 export")
scene.collection.children.link(work)
ymin, ymax = (-3, 29) if args.stage == "a" else (-16, 108)
limit = 34 if args.stage == "a" else 66
surface_objects, placed, source_meshes = [], [], {}
stats = {}

def select(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]

def crop(obj, xmax):
    clone = obj.copy()
    clone.data = obj.data.copy()
    work.objects.link(clone)
    bm = bmesh.new()
    bm.from_mesh(clone.data)
    for point, normal in (((0,ymin,0),(0,-1,0)), ((0,ymax,0),(0,1,0)),
                          ((-xmax,0,0),(-1,0,0)), ((xmax,0,0),(1,0,0))):
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
                              dist=0.0001, plane_co=point, plane_no=normal, clear_outer=True)
    bm.to_mesh(clone.data)
    bm.free()
    if not clone.data.polygons:
        bpy.data.objects.remove(clone, do_unlink=True)
        return None
    return clone

def triangle_count(mesh):
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)

def source_parts(collection):
    return sorted((o for o in collection.all_objects if o.type == "MESH"), key=lambda o:o.name)

def place(inst, optimized=False):
    source = inst.instance_collection
    for original in source_parts(source):
        key = (source.name, original.data.name)
        matrix = inst.matrix_world @ Matrix.Translation(-source.instance_offset) @ original.matrix_world
        if key not in source_meshes:
            clone = original.copy()
            clone.parent = None
            clone.data = original.data.copy()
            work.objects.link(clone)
            clone.matrix_world = matrix
            before = triangle_count(clone.data)
            if optimized and before > 16000:
                target = 22000 if "tree_small" in source.name else 12000
                modifier = clone.modifiers.new("R4.3 silhouette reduction", "DECIMATE")
                modifier.ratio = min(1, target / before)
                select([clone])
                bpy.ops.object.modifier_apply(modifier=modifier.name)
            for mat in clone.data.materials:
                if mat and mat.use_nodes:
                    mat.use_backface_culling = False
            source_meshes[key] = clone
            stats[clone.name] = {"family":source.name, "sourceTriangles":before,
                                 "exportTriangles":triangle_count(clone.data)}
        else:
            clone = source_meshes[key].copy()
            work.objects.link(clone)
            clone.matrix_world = matrix
        placed.append(clone)

for o in list(pavement.objects)+list(terrain.objects):
    if o.type != "MESH":
        continue
    clone = crop(o,limit)
    if clone:
        surface_objects.append(clone)

for o in restraints.objects:
    if o.instance_collection and ymin-5 < o.location.y < ymax+5:
        place(o)

trees = [o for o in woodland.objects if o.instance_collection
         and ymin < o.location.y < ymax and abs(o.location.x) < limit]
trees.sort(key=lambda o: (abs(o.location.y-16),abs(o.location.x-20),o.name))
if args.stage == "a":
    tree = next(o for o in trees if "pine" in o.instance_collection.name.lower())
    place(tree,True)
else:
    for o in trees:
        place(o,True)
    for i,o in enumerate(bpy.data.collections["04b | Cut verge and bank grasses"].objects):
        if i % 4 == 0 and o.instance_collection and ymin < o.location.y < 66 and abs(o.location.x)<40:
            place(o,True)

bpy.context.view_layer.update()
for col in list(scene.collection.children):
    if col != work and col.name != "05 | Art review cameras":
        scene.collection.children.unlink(col)

def render_reference():
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 12
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.camera = cameras["driver"]
    scene.render.filepath = str(out / "blender-driver.png")
    bpy.ops.render.render(write_still=True)

# Preserve the actual UVs for the original tiled shader. Bake only unsupported
# channel graphs as emissive evaluations, excluding all world and light terms.
def bake_surface(obj):
    source = obj.data.materials[0]
    if not source or not source.name.startswith(("Paving |","Verge |")):
        return
    mat = source.copy()
    obj.data.materials[0] = mat
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    output = next(n for n in nodes if n.type == "OUTPUT_MATERIAL")
    old = obj.data.uv_layers.active.name
    tiled = nodes.new("ShaderNodeUVMap")
    tiled.uv_map = old
    for n in list(nodes):
        if n.type == "TEX_IMAGE" and (not n.inputs["Vector"].is_linked or
                                      n.inputs["Vector"].links[0].from_socket.name == "UV"):
            links.new(tiled.outputs[0], n.inputs["Vector"])
    uv = obj.data.uv_layers.new(name="R43 baked")
    lo = [min(v.co[i] for v in obj.data.vertices) for i in (0,1)]
    hi = [max(v.co[i] for v in obj.data.vertices) for i in (0,1)]
    for loop in obj.data.loops:
        p = obj.data.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = tuple(.01 + .98*(p[i]-lo[i])/max(hi[i]-lo[i],.001) for i in (0,1))
    obj.data.uv_layers.active = uv
    obj.data.uv_layers[old].active_render = True
    baked_uv = nodes.new("ShaderNodeUVMap")
    baked_uv.uv_map = uv.name
    emit = nodes.new("ShaderNodeEmission")
    select([obj])
    for channel, suffix in (("Base Color","base"),("Roughness","rough")):
        socket = shader.inputs[channel]
        if not socket.is_linked:
            continue
        name = f"{obj.name.replace(' | ','-').replace('/','-')}-{suffix}"
        size = 1024 if args.stage == "a" else 1536
        image = bpy.data.images.new(name,width=size,height=size,alpha=False)
        image.colorspace_settings.name = "sRGB" if suffix == "base" else "Non-Color"
        target = nodes.new("ShaderNodeTexImage")
        target.image = image
        original = socket.links[0].from_socket
        links.new(original, emit.inputs["Color"])
        links.new(emit.outputs[0], output.inputs["Surface"])
        nodes.active = target
        scene.cycles.samples = 1
        bpy.ops.object.bake(type="EMIT", uv_layer=uv.name, margin=8)
        image.filepath_raw = str(out / (name+".png"))
        image.file_format = "PNG"
        image.save()
        links.new(baked_uv.outputs[0],target.inputs["Vector"])
        links.new(target.outputs[0], socket)
    links.new(shader.outputs[0], output.inputs["Surface"])
    # Preserve the tiled normal input, selecting the grass normal where Blender
    # mixes multiple normal images using a procedural terrain mask.
    normal = shader.inputs["Normal"]
    if normal.is_linked:
        normal_map = normal.links[0].from_node
        if normal_map.type == "NORMAL_MAP" and normal_map.inputs["Color"].is_linked:
            upstream = normal_map.inputs["Color"].links[0].from_node
            if upstream.type != "TEX_IMAGE":
                grass_normal = next((n for n in nodes if n.type=="TEX_IMAGE" and n.image
                                     and n.image.name.startswith("grass-nor")),None)
                if grass_normal:
                    links.new(grass_normal.outputs[0], normal_map.inputs["Color"])
        if normal_map.type == "NORMAL_MAP":
            normal_map.uv_map = old

render_reference()
for o in surface_objects:
    bake_surface(o)
select(surface_objects + placed)
bpy.ops.export_scene.gltf(filepath=str(out/"highway.glb"),export_format="GLB",
                           use_selection=True, export_gpu_instances=True)
camera_info = {k:{"matrix":[list(row) for row in o.matrix_world],
                 "fov":math.degrees(2*math.atan(o.data.sensor_width*9/16/(2*o.data.lens)))}
               for k,o in cameras.items()}
(out/"scene.json").write_text(json.dumps({"cameras":camera_info,"meshes":stats,
    "placedParts":len(placed),"surfaceTriangles":sum(triangle_count(o.data) for o in surface_objects),
    "stage":args.stage},indent=2))
