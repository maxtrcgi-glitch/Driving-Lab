"""Author and render the R4.1 motorway study in Blender, in metric units."""
import hashlib
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

repo, inputs, output = map(Path, sys.argv[sys.argv.index("--") + 1:])
output.mkdir(parents=True, exist_ok=True)
base = repo / "experiments/asset-poc-r2"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
rng = random.Random(410)
radius = 630.0
start, end = -24, 216
inner, outer = -1.0, 13.8
opposite_edge = -17.0
local_inputs = set()


def collection(name):
    group = bpy.data.collections.new(name)
    scene.collection.children.link(group)
    return group


pavement = collection("01 | Pavement and paint")
safety = collection("02 | Road restraint systems")
landscape = collection("03 | Verge and landform")
vegetation = collection("04 | Woodland")
shots = collection("05 | Art review cameras")


def route(s, x, z):
    theta = s / radius
    return ((radius + x) * math.cos(theta) - radius,
            (radius + x) * math.sin(theta), z)


def grade(s):
    return 0.014 * s + 0.55 * math.sin(s / 47.0)


def road_z(s, x):
    return grade(s) - 0.025 * x if x >= inner else grade(s) + 0.025 * (x + 2)


def land_z(s, x):
    edge = outer if x >= outer else opposite_edge
    d = abs(x - edge)
    toe = -0.62 * math.sin(min(d, 9) / 9 * math.pi)
    relief = min(d / 10, 1) * (0.33 * math.sin(s / 18 + d / 11))
    bank = min(d / 18, 1) * (1.45 + 0.58 * math.sin(s / 24 + d / 19))
    return road_z(s, edge) - 0.018 + toe + relief + bank


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat, bsdf


def texture_mat(name, paths, tint, normal_strength, lane_tone=False):
    mat, shader = material(name, (0.22, 0.22, 0.22), 0.8)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    uv = nodes.new("ShaderNodeTexCoord")
    textures = []
    for index, path in enumerate(paths):
        if path.is_relative_to(repo):
            local_inputs.add(path)
        image = bpy.data.images.load(str(path), check_existing=True)
        image.colorspace_settings.name = "sRGB" if index == 0 else "Non-Color"
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = image
        tex.location = (-620, 260 - 285 * index)
        links.new(uv.outputs["UV"], tex.inputs["Vector"])
        textures.append(tex)
    color = nodes.new("ShaderNodeMixRGB")
    color.label = "Source diffuse with restrained surface tone"
    color.blend_type = "MULTIPLY"
    color.inputs[0].default_value = 1
    color.inputs[2].default_value = (*tint, 1)
    links.new(textures[0].outputs["Color"], color.inputs[1])
    if lane_tone:
        tone = nodes.new("ShaderNodeAttribute")
        tone.attribute_name = "PavementTone"
        links.new(tone.outputs["Color"], color.inputs[2])
    links.new(color.outputs[0], shader.inputs["Base Color"])
    normal = nodes.new("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = normal_strength
    links.new(textures[1].outputs["Color"], normal.inputs["Color"])
    links.new(normal.outputs["Normal"], shader.inputs["Normal"])
    links.new(textures[2].outputs["Color"], shader.inputs["Roughness"])
    return mat


def maps(folder, stem, res):
    return [folder / f"{stem}_{kind}_{res}.jpg" for kind in ("diff", "nor_gl", "rough")]


asphalt = texture_mat("Paving | Asphalt Track / wheel-path mask",
                       maps(base / "assets/asphalt-track", "asphalt_track", "2k"),
                       (1, 1, 1), 0.36, True)
gravel = texture_mat("Verge | compacted gravel, muted",
                     maps(base / "r34/assets", "gravel_road", "1k"),
                     (0.63, 0.64, 0.62), 0.46)
grass = texture_mat("Verge | leafy grass", [next(inputs.glob(f"grass-{k}.*"))
                    for k in ("diff", "nor_gl", "rough")], (0.74, 0.84, 0.72), 0.48)
paint, paint_shader = material("Markings | weathered off-white", (0.66, 0.66, 0.61), 0.76)
source_normal = next(n.image for n in asphalt.node_tree.nodes
                     if n.type == "TEX_IMAGE" and "_nor_gl_" in n.image.name)
paint_nodes, paint_links = paint.node_tree.nodes, paint.node_tree.links
paint_texture = paint_nodes.new("ShaderNodeTexImage")
paint_texture.image = source_normal
paint_normal = paint_nodes.new("ShaderNodeNormalMap")
paint_normal.inputs["Strength"].default_value = 0.16
paint_links.new(paint_texture.outputs["Color"], paint_normal.inputs["Color"])
paint_links.new(paint_normal.outputs["Normal"], paint_shader.inputs["Normal"])
# A small real-texture blend breaks up the gravel/grass boundary.
verge = grass.copy()
verge.name = "Verge | gravel to leafy grass"
nodes, links = verge.node_tree.nodes, verge.node_tree.links
verge_shader = nodes.get("Principled BSDF")
grass_color = verge_shader.inputs["Base Color"].links[0].from_socket
gravel_tex = nodes.new("ShaderNodeTexImage")
gravel_tex.image = bpy.data.images.load(str(maps(base / "r34/assets", "gravel_road", "1k")[0]), check_existing=True)
gravel_tint = nodes.new("ShaderNodeMixRGB")
gravel_tint.blend_type = "MULTIPLY"
gravel_tint.inputs[0].default_value = 1
gravel_tint.inputs[2].default_value = (0.63, 0.64, 0.62, 1)
links.new(gravel_tex.outputs["Color"], gravel_tint.inputs[1])
blend_mask = nodes.new("ShaderNodeAttribute")
blend_mask.attribute_name = "VergeGrass"
blend = nodes.new("ShaderNodeMixRGB")
links.new(blend_mask.outputs["Fac"], blend.inputs[0])
links.new(gravel_tint.outputs[0], blend.inputs[1])
links.new(grass_color, blend.inputs[2])
links.new(blend.outputs[0], verge_shader.inputs["Base Color"])


def grid(name, group, mat, rows, scale, tone=None, mask=None):
    count = len(rows[0])
    coordinates = [item for row in rows for item in row]
    verts = [route(*item) for item in coordinates]
    faces = [(i * count + j, i * count + j + 1, (i + 1) * count + j + 1,
              (i + 1) * count + j) for i in range(len(rows) - 1) for j in range(count - 1)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name="Surface metres")
    for poly in mesh.polygons:
        poly.use_smooth = True
        for loop in poly.loop_indices:
            s, x, _ = coordinates[mesh.loops[loop].vertex_index]
            uv.data[loop].uv = (x / scale, s / scale)
    if tone:
        attr = mesh.color_attributes.new(name="PavementTone", type="FLOAT_COLOR", domain="POINT")
        for sample, (s, x, _) in zip(attr.data, coordinates):
            value = tone(s, x)
            sample.color = (value, value, value, 1)
    if mask:
        attr = mesh.attributes.new(name="VergeGrass", type="FLOAT", domain="POINT")
        for sample, (s, x, _) in zip(attr.data, coordinates):
            sample.value = mask(s, x)
    obj = bpy.data.objects.new(name, mesh)
    group.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def pavement_tone(s, x):
    if x < inner:
        x = -5.5 - x
    if x > 10.75:
        return 0.91 + 0.024 * math.sin(s * 0.11)
    if x < 0:
        return 0.95
    tracks = [c + offset for c in (1.75, 5.25, 8.875) for offset in (-0.77, 0.77)]
    wear = max(math.exp(-((x - track) / 0.31) ** 2) for track in tracks)
    return 0.91 + wear * (0.065 + 0.019 * math.sin(s / 19 + x))


def surface_rows(a, b, xs, step=1.0, lift=0.0):
    divisions = max(1, math.ceil((b - a) / step))
    return [[(s, x, road_z(s, x) + lift) for x in xs]
            for s in (a + (b - a) * i / divisions for i in range(divisions + 1))]


for name, a, b in (("Northbound asphalt", inner, outer),
                   ("Southbound context", opposite_edge, -3.9)):
    xs = [a + (b - a) * i / 74 for i in range(75)]
    grid(name + " | context approach", pavement, asphalt,
         surface_rows(start, 0, xs), 2.15, pavement_tone)
    grid(name + " | 48 m art study", pavement, asphalt,
         surface_rows(0, 48, xs), 2.15, pavement_tone)
    grid(name + " | sightline continuation", pavement, asphalt,
         surface_rows(48, end, xs), 2.15, pavement_tone)


def marking(name, offset, width, a, b):
    grid(name, pavement, paint,
         surface_rows(a, b, [offset - width / 2, offset + width / 2], 0.75, 0.004), 2.15)


for offset, width in [(0, .15), (10.75, .30), (-4.5, .15), (-14.75, .30)]:
    marking("Continuous edge", offset, width, start, end)
for offset in (3.5, 7.0, -8.0, -11.5):
    for a in range(-19, end, 18):
        marking("Lane division | 6 m / 12 m", offset, .15, a, min(a + 6, end))

for edge, side in [(outer, 1), (opposite_edge, -1)]:
    sections = [0, .12, .32, .64, .95, 1.3, 1.7, 2.2, 3, 4, 6, 8, 11, 15,
                21, 29, 40, 55, 78, 105]
    xs = sorted(edge + side * d for d in sections)
    rows = [[(s, x, land_z(s, x)) for x in xs] for s in range(start, end + 1)]
    grid("Outer verge and drainage swale", landscape, verge, rows, 1.9,
         mask=lambda s, x: min(1, max(0, (abs(x - edge) - .54
                                          + .18 * math.sin(s * 1.77)
                                          + .12 * math.sin(s * .42)) / .92)))
grid("Median gravel bed", landscape, gravel,
     [[(s, x, grade(s) - .075) for x in (-3.9, -3.4, -2.7, -2.0, -1.5, inner)]
      for s in range(start, end + 1)], 1.55)


def import_asset(path, name):
    if path.is_relative_to(repo):
        local_inputs.add(path)
    previous = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    objects = set(bpy.data.objects) - previous
    bpy.context.view_layer.update()
    points = [o.matrix_world @ Vector(p) for o in objects if o.type == "MESH" for p in o.bound_box]
    if not points:
        raise RuntimeError(f"No mesh geometry in {path}")
    low = Vector([min(p[i] for p in points) for i in range(3)])
    high = Vector([max(p[i] for p in points) for i in range(3)])
    group = bpy.data.collections.new(name)
    for obj in objects:
        for old in list(obj.users_collection):
            old.objects.unlink(obj)
        group.objects.link(obj)
    group.instance_offset = ((low.x + high.x) / 2, (low.y + high.y) / 2, low.z)
    return group, high - low


def instance(name, group, source, s, x, z, angle, scale=1):
    obj = bpy.data.objects.new(name, None)
    group.objects.link(obj)
    obj.instance_type = "COLLECTION"
    obj.instance_collection = source
    obj.location = route(s, x, z)
    obj.rotation_euler.z = angle
    obj.scale = (scale,) * 3
    obj.empty_display_size = 0.3
    return obj


rail, rail_size = import_asset(base / "r31/assets/guardrail.glb", "SOURCE | Innerscene W-beam")
jersey, jersey_size = import_asset(base / "r34/assets/jersey-barrier.glb", "SOURCE | Innerscene Jersey")
for source, size, x, is_rail in ((rail, rail_size, 15.05, True),
                                (jersey, jersey_size, -2.45, False)):
    long_axis_x = size.x > size.y
    length = max(size.x, size.y)
    pitch = length / (1 + x / radius)
    for i in range(math.ceil((end - start) / pitch)):
        s = start + (i + .5) * pitch
        angle = math.pi / 2 + s / radius - (0 if long_axis_x else math.pi / 2)
        if is_rail:
            # The source beam is on local -Y. Face it inward, toward traffic.
            angle += math.pi
        z = (land_z(s, x) - .035) if is_rail else (grade(s) - .075)
        obj = instance(source.name[9:], safety, source, s, x, z, angle)
        dz = (grade(s + 0.5) - grade(s - 0.5)) / (1 + x / radius)
        if long_axis_x:
            obj.rotation_euler.y = math.atan(dz) * (1 if is_rail else -1)
        else:
            obj.rotation_euler.x = math.atan(dz) * (-1 if is_rail else 1)

trees = [import_asset(inputs / asset / "source.gltf", "SOURCE | Poly Haven " + asset)[0]
         for asset in ("tree_small_02", "pine_sapling_medium")]
for side, edge in ((1, outer), (-1, opposite_edge)):
    for layer in range(3):
        s = start + rng.uniform(-1, 4)
        while s < end:
            d = rng.uniform(5, 10) + layer * rng.uniform(4.8, 8.0)
            d += 1.7 * math.sin(s / 13)
            x = edge + side * d
            kind = rng.choices((0, 1), (8, 3))[0]
            height = rng.uniform(.75, 1.42) if kind == 0 else rng.uniform(.85, 1.7)
            instance("Woodland | broadleaf" if kind == 0 else "Woodland | pine",
                     vegetation, trees[kind], s, x, land_z(s, x) - .04,
                     rng.uniform(0, math.tau), height)
            s += rng.uniform(3.4, 8.7)


def camera(name, s, x, height, target_s, target_x, target_height, lens):
    pos = route(s, x, road_z(s, x) + height)
    target = route(target_s, target_x, road_z(target_s, target_x) + target_height)
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = 36
    data.clip_end = 800
    cam = bpy.data.objects.new(name, data)
    shots.objects.link(cam)
    cam.location = pos
    cam.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    return cam


cameras = {
    "driver": camera("A | Driver eye · 1.20 m", 5, 8.875, 1.2, 76, 8.7, 0.9, 34),
    "roadside": camera("B | Shoulder and restraint", 13, 15.85, 0.75, 28, 11.5, 0.7, 34),
    "overview": camera("C | Carriageway cross-section", 1, 29, 16.0, 34, 5.2, 0.05, 43),
}

scene.world.use_nodes = True
nodes, links = scene.world.node_tree.nodes, scene.world.node_tree.links
environment = nodes.new("ShaderNodeTexEnvironment")
environment.image = bpy.data.images.load(str(next(inputs.glob("daylight.*"))))
environment.label = "Poly Haven | Kloppenheim 03 pure sky"
background = nodes.get("Background")
links.new(environment.outputs["Color"], background.inputs["Color"])
background.inputs["Strength"].default_value = 0.85
scene.view_settings.view_transform = "AgX"
scene.render.engine = "CYCLES"
scene.cycles.samples = 28
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.065
# The verified Ubuntu package lacks the Cycles denoiser.
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 6
scene.cycles.transparent_max_bounces = 12
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.camera = cameras["driver"]
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_perspective = "CAMERA"
bpy.ops.file.pack_all()
unpacked = [im.name for im in bpy.data.images if im.source == "FILE" and not im.packed_file]
if unpacked:
    raise RuntimeError(f"Unpacked source textures: {unpacked}")
scene.render.filepath = "//driver.png"
bpy.ops.wm.save_as_mainfile(filepath=str(output / "highway-master.blend"), compress=True)
stats = {
    "blender": bpy.app.version_string,
    "engine": scene.render.engine,
    "resolution": [1280, 720],
    "samples_max": scene.cycles.samples,
    "study_length_m": 48,
    "lane_widths_m": [3.5, 3.5, 3.75],
    "right_shoulder_m": 3.05,
    "crossfall_pct": 2.5,
    "radius_m": radius,
    "guardrail_bounds_m": list(rail_size),
    "jersey_bounds_m": list(jersey_size),
    "tree_instances": len(vegetation.objects),
    "packed_images": sum(bool(im.packed_file) for im in bpy.data.images),
    "cameras": {name: {"horizontal_fov_degrees": math.degrees(cam.data.angle_x),
                      "location_m": list(cam.location)} for name, cam in cameras.items()},
    "repo_inputs": {str(p.relative_to(repo)): hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in sorted(local_inputs)},
}
(output / "scene-stats.json").write_text(json.dumps(stats, indent=2) + "\n")
for name, cam in cameras.items():
    print("RENDER", name, flush=True)
    scene.camera = cam
    scene.render.filepath = str(output / f"{name}.png")
    bpy.ops.render.render(write_still=True)
