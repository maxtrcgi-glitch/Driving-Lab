"""Build three linked native Blender scenes from the Golden Highway master."""
import argparse
from pathlib import Path
import sys

import bpy

parser = argparse.ArgumentParser()
parser.add_argument("maps", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
master = bpy.context.scene
pavement = bpy.data.collections["01 | Pavement and paint"]
original = bpy.data.materials["Golden | Asphalt Track scan"]
asphalt = [o for o in pavement.objects if o.type == "MESH"
           and o.material_slots and o.material_slots[0].material == original]
assert len(asphalt) == 6, len(asphalt)

def scalar(tree, op, x, y, label=""):
    node = tree.nodes.new("ShaderNodeMath")
    node.operation = op
    node.label = label
    for socket, value in zip(node.inputs, (x, y)):
        if isinstance(value, (float, int)):
            socket.default_value = value
        else:
            tree.links.new(value, socket)
    return node.outputs[0]

def remap(tree, source, old_range, new_range, label):
    node = tree.nodes.new("ShaderNodeMapRange")
    node.label = label
    tree.links.new(source,node.inputs["Value"])
    for name, val in zip(("From Min","From Max","To Min","To Max"),(*old_range,*new_range)):
        node.inputs[name].default_value = val
    return node.outputs[0]

def mix_color(tree, factor, first, second, label):
    node = tree.nodes.new("ShaderNodeMixRGB")
    node.label = label
    for socket, value in zip(node.inputs,(factor,first,second)):
        if isinstance(value,(tuple,float,int)):
            socket.default_value = value
        else:
            tree.links.new(value,socket)
    return node.outputs[0]

def map_set(tree, uv, stem, resolution, pitch):
    scale = tree.nodes.new("ShaderNodeVectorMath")
    scale.operation = "SCALE"
    scale.label = f"{pitch:g} m scan tile"
    # 'Surface metres' inherited from the original continuous alignment
    # stores 1 UV unit per 2.15 m on the nominal road station grid.
    scale.inputs["Scale"].default_value = 2.15 / pitch
    tree.links.new(uv,scale.inputs[0])
    result = []
    for suffix, space, label in (("diff","sRGB","Scan albedo"),
                                ("rough","Non-Color","Scan roughness"),
                                ("nor_gl","Non-Color","Scan tangent normal")):
        path = args.maps.resolve() / f"{stem}_{suffix}_{resolution}.jpg"
        image = bpy.data.images.load(str(path),check_existing=True)
        assert tuple(image.size)==(int(resolution[:-1])*1024,)*2, path
        image.colorspace_settings.name = space
        image.pack()
        node = tree.nodes.new("ShaderNodeTexImage")
        node.image = image
        node.label = label
        node.interpolation = "Linear"
        tree.links.new(scale.outputs[0],node.inputs["Vector"])
        result.append(node.outputs["Color"])
    return result

def polish(tree, base, gain, saturation):
    node = tree.nodes.new("ShaderNodeHueSaturation")
    node.label = "Neutral binder balance"
    node.inputs["Value"].default_value = gain
    node.inputs["Saturation"].default_value = saturation
    tree.links.new(base,node.inputs["Color"])
    return node.outputs[0]

def varying_gain(tree, base, world, amplitude):
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.label = "Broad, weak binder variation"
    noise.inputs["Scale"].default_value = .19
    noise.inputs["Detail"].default_value = 1.2
    tree.links.new(world,noise.inputs["Vector"])
    strength = remap(tree,noise.outputs["Fac"],(.2,.8),(1-amplitude,1+amplitude),"Dry-weather envelope")
    multiply = tree.nodes.new("ShaderNodeMixRGB")
    multiply.blend_type = "MULTIPLY"
    multiply.inputs[0].default_value = 1
    tree.links.new(base,multiply.inputs[1])
    tree.links.new(strength,multiply.inputs[2])
    return multiply.outputs[0]

def repair_mask(tree, world):
    xyz = tree.nodes.new("ShaderNodeSeparateXYZ")
    tree.links.new(world,xyz.inputs[0])
    masks = []
    for x,y,w,l in ((8.2,18.9,.62,1.34),(11.7,34.8,.68,2.8),(.9,43.9,.78,1.25),(1.8,73.2,.6,2.3)):
        dx = scalar(tree,"SUBTRACT",xyz.outputs["X"],x)
        dy = scalar(tree,"SUBTRACT",xyz.outputs["Y"],y)
        # Localized resurfacing follows the road with a slight diagonal edge.
        skew = scalar(tree,"ADD",dx,scalar(tree,"MULTIPLY",dy,.074))
        ax = scalar(tree,"ABSOLUTE",skew,0)
        ay = scalar(tree,"ABSOLUTE",dy,0)
        xfade = remap(tree,ax,(w*.78,w),(1,0),"Repair width")
        yfade = remap(tree,ay,(l*.82,l),(1,0),"Repair length")
        masks.append(scalar(tree,"MULTIPLY",xfade,yfade))
    merged = masks[0]
    for mask in masks[1:]:
        merged = scalar(tree,"MAXIMUM",merged,mask)
    return scalar(tree,"MULTIPLY",merged,.36,"Soft, low-contrast repairs")

settings = {
    "A": ("Clean Modern Highway","asphalt_floor","2k",2.3,.39,.18,.29,.035),
    "B": ("Lightly Worn Highway","asphalt_01","2k",2.1,1.38,.23,.46,.073),
    "C": ("Slightly Aged / Repaired Highway","asphalt_04","4k",4.0,.72,.23,.39,.09),
}

def make_material(letter):
    name, stem, res, pitch, gain, saturation, strength, macro = settings[letter]
    mat = bpy.data.materials.new(f"R4.3b {letter} | {name}")
    mat.use_nodes = True
    tree = mat.node_tree
    uv = tree.nodes.new("ShaderNodeUVMap")
    uv.uv_map = "Surface metres"
    world = tree.nodes.new("ShaderNodeNewGeometry").outputs["Position"]
    color, rough, normal = map_set(tree,uv.outputs[0],stem,res,pitch)
    base = polish(tree,color,gain,saturation)
    roughness = remap(tree,rough,(.20,.98),(.52,.89),"Matched dry asphalt response")
    if letter == "C":
        # Confine the cracked scan to the aged substrate blend and selected
        # locations. A cleaner scan tempers the repeated crack contrast.
        floor, floor_rough, floor_norm = map_set(tree,uv.outputs[0],"asphalt_floor","2k",2.3)
        worn, worn_rough, worn_norm = map_set(tree,uv.outputs[0],"asphalt_01","2k",2.1)
        base = mix_color(tree,.52,polish(tree,worn,1.47,.24),base,"Restrained aged scan")
        normal = mix_color(tree,.52,worn_norm,normal,"Restrained aged normals")
        roughness = mix_color(tree,.52,remap(tree,worn_rough,(.20,.98),(.56,.93),"Worn binder"),
                              roughness,"Aged roughness")
        repair = repair_mask(tree,world)
        base = mix_color(tree,repair,base,polish(tree,floor,.43,.20),"Local resurfacing")
        roughness = mix_color(tree,repair,roughness,remap(tree,floor_rough,(.20,.98),(.50,.86),
                                                        "Repair roughness"),"Repair response")
        normal = mix_color(tree,repair,normal,floor_norm,"Repair normal response")
    base = varying_gain(tree,base,world,macro)
    bsdf = tree.nodes.get("Principled BSDF")
    bsdf.inputs["IOR"].default_value = 1.46
    bsdf.inputs["Metallic"].default_value = 0
    normal_node = tree.nodes.new("ShaderNodeNormalMap")
    normal_node.uv_map = uv.uv_map
    normal_node.inputs["Strength"].default_value = strength
    tree.links.new(normal,normal_node.inputs["Color"])
    for output,channel in ((base,"Base Color"),(roughness,"Roughness"),
                           (normal_node.outputs[0],"Normal")):
        tree.links.new(output,bsdf.inputs[channel])
    bsdf.location=(540,240)
    tree.nodes.get("Material Output").location=(900,240)
    return mat

variants = {k:make_material(k) for k in settings}
scenes = {"A": master}
for letter in ("B","C"):
    child = master.copy()
    branch = bpy.data.collections.new(f"01 | Pavement and paint — {letter}")
    child.collection.children.unlink(pavement)
    child.collection.children.link(branch)
    for obj in pavement.objects:
        if obj in asphalt:
            copy = obj.copy()
            copy.name = f"{obj.name} — {letter}"
            branch.objects.link(copy)
            copy.material_slots[0].link = "OBJECT"
            copy.material_slots[0].material = variants[letter]
        else:
            branch.objects.link(obj)
    scenes[letter]=child
for obj in asphalt:
    obj.material_slots[0].link = "OBJECT"
    obj.material_slots[0].material = variants["A"]
for letter, scene in scenes.items():
    scene.name = f"{letter} — {settings[letter][0]}"
    scene["Shootout asphalt"] = variants[letter].name
    assert scene.camera == master.camera and scene.world == master.world
    assert all(o.data in [a.data for a in asphalt] for o in scene.objects
               if o.type == "MESH" and o.material_slots and o.material_slots[0].material == variants[letter])
bpy.context.window.scene = scenes["B"]
bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()),compress=True)
