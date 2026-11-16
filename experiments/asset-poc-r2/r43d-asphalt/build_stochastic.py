"""Insert a shared three-neighbor Asphalt 04 sampler into the saved C material."""
import argparse
import json
import math
from pathlib import Path
import sys
import bpy

p=argparse.ArgumentParser()
p.add_argument("output",type=Path)
p.add_argument("history_mask",type=Path)
a=p.parse_args(sys.argv[sys.argv.index("--")+1:])
old=bpy.data.scenes["C_FINAL_CANDIDATE"]
original=bpy.data.materials["C_FINAL_CANDIDATE"]
mat=original.copy()
mat.name="C_STOCHASTIC_FINAL"
tree=mat.node_tree

def labelled(key):
    nodes=[n for n in tree.nodes if n.label==key]
    assert len(nodes)==1,(key,len(nodes))
    return nodes[0]

def link_from(n,key):
    return n.inputs[key].links[0].from_node

def rewire(out,new):
    for link in list(out.links):
        tree.links.new(new,link.to_socket)

# Locate the exact previous mixing stage before adding any new nodes.
color_mix=link_from(link_from(labelled("Aged binder and lighter mineral exposure"),1),"Color")
normal_mix=labelled("Normalized scan crossfade")
roughs=[n for n in tree.nodes if n.label=="asphalt_04 rough"]
base_sample=next(n for n in roughs if link_from(n,"Vector").operation=="SCALE")
rough_mix=next(edge.to_node for edge in base_sample.outputs[0].links
               if edge.to_node.operation=="ADD" and edge.to_socket==edge.to_node.inputs[0])
metres=labelled("Road coordinates in metres").outputs[0]
history=labelled("Wear, recent inlay, old inlay and sealed joint")
history.image=bpy.data.images.load(str(a.history_mask.resolve()))
history.image.colorspace_settings.name="Non-Color"
history.image.alpha_mode="CHANNEL_PACKED"
history.image.pack()

group=bpy.data.node_groups.new("Asphalt 04 · 3 continuous station neighbors","ShaderNodeTree")
for name, direction, kind in (
    ("Road metres","INPUT","NodeSocketVector"),
    ("Albedo","OUTPUT","NodeSocketColor"),
    ("Roughness","OUTPUT","NodeSocketFloat"),
    ("Signed normal","OUTPUT","NodeSocketVector")):
    group.interface.new_socket(name=name,in_out=direction,socket_type=kind)

def create(k,label):
    n=group.nodes.new(k)
    n.label=label
    return n

def gbind(n,key,value):
    if isinstance(value,(int,float,tuple)):
        n.inputs[key].default_value=value
    else:
        group.links.new(value,n.inputs[key])

def calc(op,x,y=0):
    n=create("ShaderNodeMath",op)
    n.operation=op
    gbind(n,0,x)
    gbind(n,1,y)
    return n.outputs[0]

def vec(op,x,y=None):
    n=create("ShaderNodeVectorMath",op)
    n.operation=op
    gbind(n,0,x)
    if y is not None:
        gbind(n,"Scale" if op=="SCALE" else 1,y)
    return n.outputs[0]

def combine(x,y):
    n=create("ShaderNodeCombineXYZ","Cell vertex index")
    gbind(n,"X",x)
    gbind(n,"Y",y)
    return n.outputs[0]

def rotate_z(value,angle,label):
    n=create("ShaderNodeVectorRotate",label)
    n.rotation_type="Z_AXIS"
    gbind(n,"Vector",value)
    gbind(n,"Angle",angle)
    return n.outputs[0]

inputs=create("NodeGroupInput","Original station coordinates")
outputs=create("NodeGroupOutput","Coherent Asphalt 04 contribution")
road=inputs.outputs["Road metres"]
# Rotate the cell lattice 17.8 degrees away from the road axes. This does
# not rotate, stretch or rescale any PBR image sample.
rot=create("ShaderNodeVectorRotate","Rotate neighborhood lattice only")
rot.rotation_type="Z_AXIS"
gbind(rot,"Vector",road)
gbind(rot,"Angle",.31)
separate=create("ShaderNodeSeparateXYZ","Triangular lattice inputs")
gbind(separate,0,rot.outputs[0])
x,y=separate.outputs["X"],separate.outputs["Y"]
spacing=6.1
u=calc("MULTIPLY",calc("SUBTRACT",x,calc("MULTIPLY",y,1/3**.5)),1/spacing)
v=calc("MULTIPLY",y,2/(3**.5*spacing))
ix,iy=calc("FLOOR",u),calc("FLOOR",v)
fx,fy=calc("FRACT",u),calc("FRACT",v)
s=calc("ADD",fx,fy)
upper=calc("GREATER_THAN",s,1)
# The shared two vertices have matching weights as either side approaches
# the diagonal. The non-shared vertex has zero weight at the diagonal.
ids=(combine(calc("ADD",ix,upper),calc("ADD",iy,upper)),
     combine(calc("ADD",ix,1),iy),combine(ix,calc("ADD",iy,1)))
a0=calc("ABSOLUTE",calc("SUBTRACT",1,s))
# w1 = fx + upper*(1-fx-fy), w2 = fy + upper*(1-fx-fy).
shift=calc("MULTIPLY",upper,calc("SUBTRACT",1,s))
raw=(a0,calc("ADD",fx,shift),calc("ADD",fy,shift))
sharpened=[calc("POWER",calc("MAXIMUM",weight,0),3.0) for weight in raw]
total=calc("ADD",calc("ADD",*sharpened[:2]),sharpened[2])
weights=[calc("DIVIDE",weight,total) for weight in sharpened]

maps=[bpy.data.images[name] for name in ("asphalt_04_diff_4k.jpg","asphalt_04_rough_4k.jpg","asphalt_04_nor_gl_4k.jpg")]
assert [im.colorspace_settings.name for im in maps]==["sRGB","Non-Color","Non-Color"]
base_uv=vec("SCALE",road,.25)
results=[]
for identity,weight in zip(ids,weights):
    hash_node=create("ShaderNodeTexWhiteNoise","Deterministic sub-tile offset")
    hash_node.noise_dimensions="2D"
    gbind(hash_node,"Vector",identity)
    hash_axes=create("ShaderNodeSeparateColor","Offset and quarter-turn selector")
    gbind(hash_axes,0,hash_node.outputs["Color"])
    quadrant=calc("FLOOR",calc("MULTIPLY",hash_axes.outputs["Blue"],4))
    theta=calc("MULTIPLY",quadrant,math.pi/2)
    uv=vec("ADD",rotate_z(base_uv,theta,"Rotate all three PBR channel coordinates"),
           hash_node.outputs["Color"])
    sampled=[]
    for im in maps:
        n=create("ShaderNodeTexImage",im.name)
        n.image=im
        gbind(n,"Vector",uv)
        sampled.append(n.outputs["Color"])
    signed=vec("NORMALIZE",vec("SUBTRACT",vec("SCALE",sampled[2],2),(1,1,1)))
    normal=rotate_z(signed,calc("MULTIPLY",theta,-1),"Inverse quarter-turn to common tangent frame")
    rough=create("ShaderNodeSeparateColor","Linear roughness channel")
    gbind(rough,0,sampled[1])
    results.append((vec("SCALE",sampled[0],weight),calc("MULTIPLY",rough.outputs["Red"],weight),
                    vec("SCALE",normal,weight)))
colors,roughness,normals=zip(*results)
def sum_vec(items):
    return vec("ADD",vec("ADD",*items[:2]),items[2])
gbind(outputs,"Albedo",sum_vec(colors))
gbind(outputs,"Roughness",calc("ADD",calc("ADD",*roughness[:2]),roughness[2]))
gbind(outputs,"Signed normal",vec("NORMALIZE",sum_vec(normals)))

node=tree.nodes.new("ShaderNodeGroup")
node.node_tree=group
node.label="Three continuous neighbors, 4 m PBR scale"
tree.links.new(metres,node.inputs[0])
rewire(color_mix.outputs[0],node.outputs["Albedo"])
rewire(rough_mix.outputs[0],node.outputs["Roughness"])
rewire(normal_mix.outputs[0],node.outputs["Signed normal"])
# Keep the old inlay restrained and tie its roughness to the same worn scan
# that contributes aggregate to its diffuse and normalized tangent normal.
older=labelled("Older lighter inlay")
tint=link_from(older,2)
tint.inputs["Value"].default_value=.965
worn_rough=next(n for n in tree.nodes if n.label=="asphalt_01 rough").outputs["Color"]
rough_stage=tree.nodes.new("ShaderNodeMapRange")
rough_stage.label="Worn inlay scan response"
for k,v0 in (("From Min",.20),("From Max",.98),("To Min",.67),("To Max",.91)):
    rough_stage.inputs[k].default_value=v0
tree.links.new(worn_rough,rough_stage.inputs["Value"])
# Trace the original .84 roughness target via the unique old-mask .55 factor.
oldmask=labelled("Independent location masks").outputs["Blue"]
factor=next(l.to_node for l in oldmask.links if l.to_node.type=="MATH"
            and abs(l.to_node.inputs[1].default_value-.55)<1e-5)
subtract=next(l.to_node for l in factor.outputs[0].links
              if l.to_node.type=="MATH" and l.to_node.operation=="MULTIPLY").inputs[1].links[0].from_node
assert subtract.operation=="SUBTRACT" and abs(subtract.inputs[0].default_value-.84)<1e-5
tree.links.new(rough_stage.outputs[0],subtract.inputs[0])

def layout(graph,output,prune=False):
    depth={}
    def visit(n,d):
        if depth.get(n,-1)>=d:
            return
        depth[n]=d
        for socket in n.inputs:
            for link in socket.links:
                visit(link.from_node,d+1)
    visit(output,0)
    if prune:
        for n in list(graph.nodes):
            if n not in depth:
                graph.nodes.remove(n)
    rank={}
    for n,d in depth.items():
        n.location=(-d*238,-rank.get(d,0)*177)
        rank[d]=rank.get(d,0)+1

layout(group,outputs)
layout(tree,tree.nodes.get("Material Output"),True)
scene=old.copy()
scene.name=mat.name
scene.use_fake_user=True
paving=next(c for c in old.collection.children if c.name.startswith("01 | Pavement"))
new=bpy.data.collections.new("01 | Pavement and paint — C_STOCHASTIC_FINAL")
scene.collection.children.unlink(paving)
scene.collection.children.link(new)
for obj in paving.objects:
    if not (obj.type=="MESH" and obj.material_slots and obj.material_slots[0].material==original):
        new.objects.link(obj)
        continue
    copy=obj.copy()
    copy.name=obj.name.replace(" — C_FINAL","")+" — stochastic"
    new.objects.link(copy)
    copy.material_slots[0].link="OBJECT"
    copy.material_slots[0].material=mat

found=[o for o in new.objects if o.type=="MESH" and o.material_slots and o.material_slots[0].material==mat]
ref=[o for o in paving.objects if o.type=="MESH" and o.material_slots and o.material_slots[0].material==original]
assert len(found)==len(ref)==6 and {o.data for o in ref}=={o.data for o in found}
assert scene.world==old.world and scene.camera==old.camera
bpy.context.window.scene=scene
a.output.parent.mkdir(parents=True,exist_ok=True)
(a.output.parent/"material_inventory.json").write_text(json.dumps({
    "baseline_nodes":len(original.node_tree.nodes),
    "candidate_top_level_nodes":len(tree.nodes),"stochastic_group_nodes":len(group.nodes),
    "baseline_image_nodes":sum(n.type=="TEX_IMAGE" for n in original.node_tree.nodes),
    "candidate_image_nodes":sum(n.type=="TEX_IMAGE" for n in (*tree.nodes,*group.nodes)),
    "unique_pbr_maps":9,"unique_history_maps":2},indent=2)+"\n")
bpy.ops.wm.save_as_mainfile(filepath=str(a.output.resolve()),compress=True)
