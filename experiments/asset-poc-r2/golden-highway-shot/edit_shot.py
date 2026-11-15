"""Art-direct the native R4.1c master, preserving carriageway and barrier geometry."""
import argparse
import math
from pathlib import Path
import random
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path)
parser.add_argument("--pass", dest="pass_number", type=int, choices=(1, 2), default=1)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
scene = bpy.context.scene
rng = random.Random(2410)

def material(name):
    return bpy.data.materials[name]

def shader(mat):
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")

def image_node(mat, key):
    return next(n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE" and n.image and key in n.image.name)

def metric_mapping(mat, nodes, scale):
    graph = mat.node_tree
    mapping = graph.nodes.new("ShaderNodeVectorMath")
    mapping.operation = "SCALE"
    mapping.inputs["Scale"].default_value = scale
    coord = graph.nodes.new("ShaderNodeTexCoord")
    graph.links.new(coord.outputs["UV"], mapping.inputs[0])
    for node in nodes:
        graph.links.new(mapping.outputs[0], node.inputs["Vector"])

def asphalt():
    mat = material("Paving | Asphalt Track / wheel-path mask")
    graph = mat.node_tree
    bsdf = shader(mat)
    base, normal, rough = (image_node(mat,k) for k in ("track_diff", "track_nor", "track_rough"))
    for name in ("Attribute", "Attribute.001", "Attribute.002", "Vector Math", "Mix (Legacy)", "Math"):
        graph.nodes.remove(graph.nodes[name])
    metric_mapping(mat, (base, normal, rough), 1.45)
    color = graph.nodes.new("ShaderNodeMixRGB")
    color.label = "Scan / neutral binder balance"
    color.blend_type = "MIX"
    color.inputs[0].default_value = .23
    color.inputs[2].default_value = (.049,.048,.046,1)
    graph.links.new(base.outputs["Color"], color.inputs[1])
    vertex = graph.nodes.new("ShaderNodeAttribute")
    vertex.attribute_name = "Golden paving variation"
    multiply = graph.nodes.new("ShaderNodeMixRGB")
    multiply.label = "Shoulder weathering and broad wear"
    multiply.blend_type = "MULTIPLY"
    multiply.inputs[0].default_value = 1
    graph.links.new(color.outputs["Color"], multiply.inputs[1])
    graph.links.new(vertex.outputs["Color"], multiply.inputs[2])
    graph.links.new(multiply.outputs[0], bsdf.inputs["Base Color"])
    graph.links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
    graph.nodes.get("Normal Map").inputs["Strength"].default_value = .37
    for o in bpy.data.collections["01 | Pavement and paint"].objects:
        if o.type != "MESH" or not o.data.materials or o.data.materials[0] != mat:
            continue
        mesh = o.data
        shoulder = [v.value for v in mesh.attributes["R41bShoulder"].data]
        tone = mesh.color_attributes.new(name=vertex.attribute_name, type="FLOAT_COLOR", domain="POINT")
        for v in mesh.vertices:
            x, y, _ = v.co
            modulation = .055 * math.sin(y*.26+x*.6) + .04 * math.sin(y*.11-x*.43)
            edge = shoulder[v.index]
            value = 1.07 + modulation + edge*.13
            tone.data[v.index].color = (value,value*.99,value*.974,1)
    mat.name = "Golden | Asphalt Track scan"

def markings():
    mat = material("Markings | weathered off-white")
    graph = mat.node_tree
    bsdf = shader(mat)
    source = bpy.data.materials["Golden | Asphalt Track scan"]
    rough = graph.nodes.new("ShaderNodeTexImage")
    rough.image = image_node(source,"track_rough").image
    geo = graph.nodes.new("ShaderNodeNewGeometry")
    scale = graph.nodes.new("ShaderNodeVectorMath")
    scale.operation = "SCALE"
    scale.inputs["Scale"].default_value = .72
    graph.links.new(geo.outputs["Position"],scale.inputs[0])
    graph.links.new(scale.outputs[0],rough.inputs["Vector"])
    ramp = graph.nodes.new("ShaderNodeValToRGB")
    for element, position, value in zip(ramp.color_ramp.elements, (.73,.89), (.24,.57)):
        element.position = position
        element.color = (value,value*.98,value*.92,1)
    graph.links.new(rough.outputs[0],ramp.inputs[0])
    graph.links.new(ramp.outputs[0],bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = .71
    bsdf.inputs["Coat Weight"].default_value = 0
    graph.nodes.get("Normal Map").inputs["Strength"].default_value = .22

def daylight():
    # Retain the packed photographed cloud field and dim it as a source of
    # ambient light so the sun establishes one readable shadow direction.
    world = scene.world.node_tree
    bg = next(n for n in world.nodes if n.type == "BACKGROUND")
    bg.inputs["Strength"].default_value = .83
    source = bg.inputs["Color"].links[0].from_socket
    color = world.nodes.new("ShaderNodeHueSaturation")
    color.inputs["Saturation"].default_value = 1.11
    world.links.new(source,color.inputs["Color"])
    world.links.new(color.outputs[0],bg.inputs["Color"])
    lights = bpy.data.collections.new("Golden | Daylight")
    scene.collection.children.link(lights)
    data = bpy.data.lights.new("Golden | Afternoon sun", "SUN")
    data.energy = 1.45
    data.angle = math.radians(.6)
    data.color = (1.0,.945,.86)
    sun = bpy.data.objects.new(data.name, data)
    lights.objects.link(sun)
    sun.rotation_euler = Vector((.71,.28,-.61)).to_track_quat("-Z","Y").to_euler()

def ground_sampler():
    land = bpy.data.collections["03 | Verge and landform"]
    surfaces = [BVHTree.FromPolygons([o.matrix_world @ v.co for v in o.data.vertices],
                [tuple(p.vertices) for p in o.data.polygons]) for o in land.objects if o.type == "MESH"]
    def hit(x,y):
        hits = [b.ray_cast((x,y,80),(0,0,-1),120)[0] for b in surfaces]
        return max((p.z for p in hits if p is not None), default=None)
    return hit

def place(collection, source, x, y, z, scale, label):
    obj = bpy.data.objects.new(label,None)
    collection.objects.link(obj)
    obj.instance_type = "COLLECTION"
    obj.instance_collection = source
    obj.location = x,y,z
    obj.scale = scale
    obj.rotation_euler.z = rng.uniform(0,math.tau)
    obj.empty_display_size = .21

def verge():
    wood = bpy.data.collections["04 | Woodland"]
    grass = bpy.data.collections["04b | Cut verge and bank grasses"]
    planks = bpy.data.collections["02 | Road restraint systems"]
    ground = ground_sampler()
    rail = sorted((o.location.copy() for o in planks.objects if o.instance_collection and
                   "W-beam" in o.instance_collection.name),key=lambda p:p.y)
    broad = next(c for c in bpy.data.collections if c.name.startswith("R4.1b source | tree_small"))
    grass_sources = sorted((c for c in bpy.data.collections if c.name.startswith("R4.1c source | grass")),
                           key=lambda c:c.name)
    for o in wood.objects:
        if "pine" in o.instance_collection.name and o.location.x > 14 and o.location.y < 38:
            o.scale.z *= .83
    # Greener leaf volume behind the maintained strip, in separated groups.
    for y0, setback, count in ((21,5,10),(37,6.2,14),(67,5.5,18),(91,7,13),(138,9,14)):
        for _ in range(count):
            y = y0 + rng.uniform(-6,6)
            x = min(rail,key=lambda p:abs(p.y-y)).x + setback + rng.uniform(-1.4,3.0) - .06*max(0,y-50)
            z = ground(x,y)
            if z is not None:
                factor = rng.uniform(.16,.35)
                width = factor * rng.uniform(1.28,1.66)
                place(wood,broad,x,y,z-.085,(width,width,factor),"Golden | Broadleaf understorey")
    # Small, uneven grass clumps behind the rail and at the base of scrub.
    for index in range(280):
        y0 = rng.choice((14,23,34,47,57))
        y = y0 + rng.uniform(-5,5)
        x = min(rail,key=lambda p:abs(p.y-y)).x + rng.uniform(.65,4.2)
        z = ground(x,y)
        if z is not None:
            factor = rng.uniform(.65,1.18)
            place(grass,rng.choice(grass_sources),x,y,z-.045,(factor,factor,factor),
                  "Golden | Verge clump")
    leaf = shader(material("tree_small_02_leaves"))
    leaf.inputs["Subsurface Weight"].default_value = .045

def focused_correction():
    world = scene.world.node_tree
    source = next(n for n in world.nodes if n.type == "TEX_ENVIRONMENT")
    current_world = next(n for n in world.nodes if n.type == "BACKGROUND")
    output = next(n for n in world.nodes if n.type == "OUTPUT_WORLD")
    sky_color = world.nodes.new("ShaderNodeHueSaturation")
    sky_color.label = "Visible HDR sky colour"
    sky_color.inputs["Saturation"].default_value = 1.43
    sky_color.inputs["Value"].default_value = 1.08
    world.links.new(source.outputs["Color"],sky_color.inputs["Color"])
    visible = world.nodes.new("ShaderNodeBackground")
    visible.inputs["Strength"].default_value = .91
    world.links.new(sky_color.outputs[0],visible.inputs["Color"])
    ray = world.nodes.new("ShaderNodeLightPath")
    sky_mix = world.nodes.new("ShaderNodeMixShader")
    world.links.new(ray.outputs["Is Camera Ray"],sky_mix.inputs[0])
    world.links.new(current_world.outputs[0],sky_mix.inputs[1])
    world.links.new(visible.outputs[0],sky_mix.inputs[2])
    world.links.new(sky_mix.outputs[0],output.inputs["Surface"])
    current_world.inputs["Strength"].default_value = .72
    sun = bpy.data.objects["Golden | Afternoon sun"]
    sun.data.energy = 2.35
    sun.data.color = (1,.968,.914)
    sun.rotation_euler = Vector((-.75,.32,-.58)).to_track_quat("-Z","Y").to_euler()

    mat = material("Golden | Asphalt Track scan")
    graph = mat.node_tree
    bsdf = shader(mat)
    graph.nodes.get("Normal Map").inputs["Strength"].default_value = .53
    rough = graph.nodes.new("ShaderNodeMapRange")
    rough.label = "Scan response under direct daylight"
    for socket, value in (("From Min",.76),("From Max",.88),("To Min",.69),("To Max",.87)):
        rough.inputs[socket].default_value = value
    graph.links.new(image_node(mat,"track_rough").outputs["Color"],rough.inputs["Value"])
    graph.links.new(rough.outputs["Result"],bsdf.inputs["Roughness"])
    for o in bpy.data.collections["01 | Pavement and paint"].objects:
        if o.type != "MESH" or not o.data.materials or o.data.materials[0] != mat:
            continue
        shoulder = o.data.attributes["R41bShoulder"].data
        for i, point in enumerate(o.data.color_attributes["Golden paving variation"].data):
            edge = shoulder[i].value
            r,g,b,a = point.color
            point.color = (r+.115*edge,g+.107*edge,b+.091*edge,a)
    paint = material("Markings | weathered off-white")
    ramp = next(n.color_ramp for n in paint.node_tree.nodes if n.type == "VALTORGB")
    ramp.elements[1].color = (.48,.474,.455,1)

    wood = bpy.data.collections["04 | Woodland"]
    pine = [o for o in wood.objects if "pine" in o.instance_collection.name
            and o.location.x > 19 and 10 < o.location.y < 45]
    for o in pine:
        o.scale.z *= .73
    ground = ground_sampler()
    broad = next(c for c in bpy.data.collections if c.name.startswith("R4.1b source | tree_small"))
    for x,y,height,width in ((20,24,.49,.65),(22.4,26.2,.59,.68),(22.8,29,.42,.57),
                             (24.1,32,.63,.67),(21.4,36,.35,.53),(19.3,46,.42,.55)):
        z = ground(x,y)
        if z is not None:
            place(wood,broad,x,y,z-.085,(width,width,height),"Golden | Crown overlap")
    grass = bpy.data.collections["04b | Cut verge and bank grasses"]
    seedheads = sorted((c for c in bpy.data.collections
                        if c.name.startswith("R4.1c source | grass_medium")), key=lambda c:c.name)
    rail = [o.location.copy() for o in bpy.data.collections["02 | Road restraint systems"].objects
            if o.instance_collection and "W-beam" in o.instance_collection.name]
    for center in (16.5,20.3,28.7,33.8,43.1):
        for _ in range(15):
            y = center + rng.uniform(-1.6,1.6)
            x = min(rail,key=lambda p:abs(p.y-y)).x + rng.uniform(.9,2.25)
            z = ground(x,y)
            if z is not None:
                height = rng.uniform(.78,1.62)
                width = height * rng.uniform(.78,1.2)
                place(grass,rng.choice(seedheads),x,y,z-.043,(width,width,height),
                      "Golden | Verge seedheads")

if args.pass_number == 1:
    asphalt()
    markings()
    daylight()
    verge()
else:
    focused_correction()

scene.camera = next(o for o in scene.objects if o.type == "CAMERA" and o.name.startswith("A |"))
scene.render.engine = "CYCLES"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.cycles.samples = 96
scene.cycles.use_denoising = args.pass_number == 2
bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()),compress=True)
