"""Author C_FINAL_CANDIDATE on the verified native R4.3b Blender master."""
import argparse
import json
import math
from pathlib import Path
import struct
import sys
import zlib

import bpy
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path)
parser.add_argument("history", type=Path)
args = parser.parse_args(sys.argv[sys.argv.index("--")+1:])
history = json.loads(args.history.read_text())
output = args.output.resolve()
output.parent.mkdir(parents=True, exist_ok=True)
baseline = next(s for s in bpy.data.scenes if s.name.startswith("C — "))
pavement = next(c for c in baseline.collection.children if c.name.startswith("01 | Pavement"))
road = [o for o in pavement.objects if o.type=="MESH" and o.material_slots
        and o.material_slots[0].material.name.startswith("R4.3b C |")]
marks = [o for o in pavement.objects if o.type=="MESH" and o.material_slots
         and o.material_slots[0].material.name.startswith("Markings |")]
assert len(road)==6 and len(marks)==60
UV_NAME = "Surface metres"
UV_METRES = 2.15

def uv_data(o):
    layer = o.data.uv_layers[UV_NAME]
    uv = np.empty(len(layer.data)*2, dtype=np.float32)
    layer.data.foreach_get("uv",uv)
    return uv.reshape(-1,2)*UV_METRES

mark_x = sorted({round(float(uv_data(o)[:,0].mean()),3) for o in marks})
uvals = [uv_data(o) for o in road]
lane_bounds = []
for group in (False,True):
    values = np.concatenate([u[:,0] for u in uvals if bool(u[:,0].mean()>0)==group])
    lo,hi = float(values.min()),float(values.max())
    cuts = [x for x in mark_x if lo < x < hi]
    lane_bounds.append({"road_min":lo,"road_max":hi,"lane_edges":cuts})
assert all(len(c["lane_edges"])>=2 for c in lane_bounds)
u_all = np.concatenate(uvals)
minimum = np.floor(u_all.min(axis=0))-1
maximum = np.ceil(u_all.max(axis=0))+1
size = maximum-minimum
density = history["mask_density_px_per_m"]
w,h = map(int,size*density)
xx=(minimum[0]+(np.arange(w,dtype=np.float32)+.5)/density)[None,:]
yy=(minimum[1]+(np.arange(h,dtype=np.float32)+.5)/density)[:,None]

def smooth(value):
    t=np.clip(value,0,1)
    return t*t*(3-2*t)

def segment_dist(x,y,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    f=np.clip(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1)
    return np.hypot(x-a[0]-f*dx,y-a[1]-f*dy)

mask=np.zeros((h,w,4),dtype=np.float32)
dust=np.zeros((h,w),dtype=np.float32)
wear=history["wear"]
for carriageway in lane_bounds:
    cuts=carriageway["lane_edges"]
    for j,(left,right) in enumerate(zip(cuts,cuts[1:])):
        # Independent lane delimiters determine the wheel pair for each lane.
        center=(left+right)/2
        half=min(wear["track_half_spacing_m"],(right-left)*.27)
        profile=np.zeros((h,1),dtype=np.float32)
        for i,(s,width,strength) in enumerate(wear["station_envelopes_m"]):
            shift=(j-1)*((i%3)*1.6-1.6)
            profile=np.maximum(profile,strength*np.exp(-((yy-s-shift)/width)**2))
        for side in (-1,1):
            track=np.exp(-((xx-center-side*half)/wear["track_sigma_m"])**2)
            mask[:,:,0]=np.maximum(mask[:,:,0],profile*track)
    # Edge contamination lies on shoulder pavement, away from wheel trajectories.
    outer=carriageway["road_max"] if cuts[-1]>0 else carriageway["road_min"]
    shoulder=np.exp(-((np.abs(xx-outer)-.13)/.44)**2)
    pockets=np.maximum.reduce([np.exp(-((yy-s)/width)**2)*v
                               for s,width,v in ((13.3,6,.50),(39,9,.72),(79,13,.34),(124,22,.46),(190,18,.29))])
    np.maximum(dust,shoulder*pockets,out=dust)

def local_grid(points, margin):
    points=np.array(points)
    lo=np.maximum(0,np.floor((points.min(0)-margin-minimum)*density).astype(int))
    hi=np.minimum([w,h],np.ceil((points.max(0)+margin-minimum)*density).astype(int))
    sy,sx=slice(lo[1],hi[1]),slice(lo[0],hi[0])
    return sy,sx,xx[:,sx],yy[sy,:]

for repair in history["repairs"]:
    points=repair["polygon"]
    feather=repair["feather_m"]
    sy,sx,x,y=local_grid(points,feather)
    inside=np.zeros((y.size,x.size),bool)
    distance=np.full(inside.shape,np.inf,dtype=np.float32)
    for a,b in zip(points,points[1:]+points[:1]):
        if a[1]!=b[1]:
            inside^=((a[1]>y)!=(b[1]>y)) & (x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])
        distance=np.minimum(distance,segment_dist(x,y,a,b))
    S=np.where(inside,distance,-distance)
    channel=1 if repair["kind"]=="recent" else 2
    mask[sy,sx,channel]=smooth(.5+S/(2*feather))

for seam in history["seams"]:
    points,width=seam["line"],seam["half_width_m"]
    sy,sx,x,y=local_grid(points,width*3)
    value=np.zeros((y.size,x.size),dtype=np.float32)
    for a,b in zip(points,points[1:]):
        value=np.maximum(value,1-smooth((segment_dist(x,y,a,b)-width*.28)/(width*1.6)))
    np.maximum(mask[sy,sx,3],value,out=mask[sy,sx,3])

def packed_png(name, rows, channels):
    target=output.parent / (name+".png")
    height,width=rows.shape[:2]
    data=(np.clip(rows,0,1)*255+.5).astype(np.uint8)
    # PNG rows are top-down, opposite the UV station grid.
    z=zlib.compress(b"".join(b"\0"+row.tobytes() for row in data[::-1]),6)
    def chunk(kind, value):
        return struct.pack(">I",len(value))+kind+value+struct.pack(">I",zlib.crc32(kind+value))
    target.write_bytes(b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack(">IIBBBBB",
                       width,height,8,channels,0,0,0))+chunk(b"IDAT",z)+chunk(b"IEND",b""))
    image=bpy.data.images.load(str(target))
    image.colorspace_settings.name="Non-Color"
    if channels==6:
        image.alpha_mode="CHANNEL_PACKED"
    image.pack()
    return image

history_image=packed_png("C_Surface_History",mask,6)
dust_image=packed_png("C_Shoulder_Edge_Dust",dust,0)
del mask,dust

# Measure mapped edge lengths and compare duplicate boundary positions across
# the native pieces. The original road-station UVs are used unmodified.
joins={}
errors=[]
for o,uv in zip(road,uvals):
    mesh=o.data
    lm={}
    for loop,p in zip(mesh.loops,uv):
        lm[loop.vertex_index]=p
    for edge in mesh.edges:
        a,b=edge.vertices
        du=lm[b]-lm[a]
        nominal=float(np.linalg.norm(du))
        if nominal>0.001:
            actual=(o.matrix_world@mesh.vertices[b].co-o.matrix_world@mesh.vertices[a].co).length
            errors.append([abs(float(du[0]))>abs(float(du[1])),actual/nominal])
    for v,p in lm.items():
        if min(abs(float(p[1])),abs(float(p[1])-48))<.002:
            key=tuple(round(float(x),3) for x in p)
            joins.setdefault(key,[]).append(o.matrix_world@mesh.vertices[v].co)
seams=[(points[0]-points[-1]).length for points in joins.values() if len(points)>1]
assert seams and max(seams)<.0001
ranges={}
for label,lateral in [("lateral",True),("longitudinal",False)]:
    a=np.array([x for side,x in errors if side==lateral])
    ranges[label]=dict(min=float(a.min()),median=float(np.median(a)),max=float(a.max()))

mat=bpy.data.materials.new("C_FINAL_CANDIDATE")
mat.use_nodes=True
tree=mat.node_tree

def node(kind,label):
    n=tree.nodes.new(kind)
    n.label=label
    return n

def bind(n,key,value):
    socket=n.inputs[key]
    if isinstance(value,(float,int,tuple,list)):
        socket.default_value=value
    else:
        tree.links.new(value,socket)

def vec(op,a,b=None,label=""):
    n=node("ShaderNodeVectorMath",label)
    n.operation=op
    bind(n,0,a)
    if b is not None:
        bind(n,"Scale" if op=="SCALE" else 1,b)
    return n.outputs["Value" if op in ("DOT_PRODUCT","LENGTH") else "Vector"]

def calc(op,a,b,label=""):
    n=node("ShaderNodeMath",label)
    n.operation=op
    bind(n,0,a)
    bind(n,1,b)
    return n.outputs[0]

def mix(fac,a,b,label=""):
    n=node("ShaderNodeMixRGB",label)
    for i,value in enumerate((fac,a,b)):
        bind(n,i,value)
    return n.outputs[0]

def value_mix(f,a,b):
    return calc("ADD",a,calc("MULTIPLY",f,calc("SUBTRACT",b,a)))

def remap(value,a,b,c,d,label):
    n=node("ShaderNodeMapRange",label)
    n.interpolation_type="SMOOTHERSTEP"
    for key,val in zip(("Value","From Min","From Max","To Min","To Max"),(value,a,b,c,d)):
        bind(n,key,val)
    return n.outputs["Result"]

def image_sample(image,coords,label,extend="REPEAT"):
    n=node("ShaderNodeTexImage",label)
    n.image=image
    n.extension=extend
    bind(n,"Vector",coords)
    return n

def existing(stem,suffix):
    image=next(i for i in bpy.data.images if i.name.startswith(stem+"_"+suffix+"_"))
    assert image.packed_file
    return image

def transform_uv(metres,pitch,rotation=False):
    sample=vec("SCALE",metres,1/pitch)
    if rotation:
        n=node("ShaderNodeVectorRotate","90 degree decorrelation")
        n.rotation_type="Z_AXIS"
        bind(n,"Vector",sample)
        bind(n,"Angle",math.pi/2)
        sample=vec("ADD",n.outputs[0],(.31,.69,0))
    return sample

def scan(stem,sample):
    return [image_sample(existing(stem,channel),sample,stem+" "+channel).outputs["Color"]
            for channel in ("diff","rough","nor_gl")]

def tint(color,value,saturation):
    n=node("ShaderNodeHueSaturation","Binder tone")
    bind(n,"Color",color)
    bind(n,"Value",value)
    bind(n,"Saturation",saturation)
    return n.outputs[0]

def component(v,key):
    n=node("ShaderNodeSeparateXYZ","Tangent component")
    bind(n,0,v)
    return n.outputs[key]

def signed_normal(encoded):
    return vec("NORMALIZE",vec("SUBTRACT",vec("SCALE",encoded,2),(1,1,1)))

flat=(0,0,1)
def weighted_normal(first,second,f,label):
    # Interpolate decoded tangent vectors on the upper hemisphere, then
    # renormalize. This is a crossfade between mutually exclusive patches.
    delta=vec("SUBTRACT",second,first)
    return vec("NORMALIZE",vec("ADD",first,vec("SCALE",delta,f)),label=label)

def restore_frame(v):
    n=node("ShaderNodeVectorRotate","Return normal to mesh tangent frame")
    n.rotation_type="Z_AXIS"
    bind(n,"Vector",v)
    bind(n,"Angle",-math.pi/2)
    return n.outputs[0]

def rnm(base,detail):
    # Reoriented normal mapping. Base/detail are normalized OpenGL vectors.
    t=vec("ADD",base,(0,0,1))
    u=vec("MULTIPLY",detail,(-1,-1,1))
    ratio=calc("DIVIDE",vec("DOT_PRODUCT",t,u),component(t,"Z"))
    return vec("NORMALIZE",vec("SUBTRACT",vec("SCALE",t,ratio),u),label="RNM result")

uv=node("ShaderNodeUVMap","Original road station and offset")
uv.uv_map=UV_NAME
meters=vec("SCALE",uv.outputs[0],UV_METRES,"Road coordinates in metres")
mask_uv=vec("MULTIPLY",vec("SUBTRACT",meters,(*map(float,minimum),0)),
            (float(1/size[0]),float(1/size[1]),0),"Nonperiodic authored location atlas")
mapped=image_sample(history_image,mask_uv,"Wear, recent inlay, old inlay and sealed joint","CLIP")
split=node("ShaderNodeSeparateColor","Independent location masks")
bind(split,0,mapped.outputs["Color"])
wheel,recent,old=(split.outputs[n] for n in ("Red","Green","Blue"))
joint=mapped.outputs["Alpha"]
dust=image_sample(dust_image,mask_uv,"Intermittent shoulder contamination","CLIP").outputs["Color"]

# This slow field controls which real scan sample contributes. It never adds
# synthetic grain or noise directly to the pavement.
blend=node("ShaderNodeTexNoise","Decorrelated sample weights only")
bind(blend,"Vector",meters)
bind(blend,"Scale",.127)
bind(blend,"Detail",1.0)
weight=remap(blend.outputs["Fac"],.25,.75,.06,.94,"Soft scan selection")
c0,r0,n0=scan("asphalt_04",transform_uv(meters,4.0))
c1,r1,n1=scan("asphalt_04",transform_uv(meters,4.0,True))
cb,rb,nb=scan("asphalt_01",transform_uv(meters,2.1))
ca,ra,na=scan("asphalt_floor",transform_uv(meters,2.3))
base_color=mix(.38,tint(mix(weight,c0,c1),.44,.24),tint(cb,.88,.31),"Aged binder and lighter mineral exposure")
base_color=mix(calc("MULTIPLY",wheel,.11),base_color,tint(cb,.96,.27),"Subtle polishing, no dark stripe")
base_color=mix(calc("MULTIPLY",recent,.72),base_color,tint(ca,.27,.27),"Newer narrow inlay")
base_color=mix(calc("MULTIPLY",old,.64),base_color,tint(cb,1.21,.24),"Older lighter inlay")
base_color=mix(calc("MULTIPLY",dust,.23),base_color,(.101,.089,.069,1),"Dust on paved edge")
base_color=mix(calc("MULTIPLY",joint,.28),base_color,(.033,.030,.028,1),"Sealant tint")

rough=value_mix(.37,value_mix(weight,r0,r1),rb)
rough=remap(rough,.19,.98,.59,.88,"Dry pavement response")
rough=calc("SUBTRACT",rough,calc("MULTIPLY",wheel,.075),"Wheel path polishing")
rough=value_mix(calc("MULTIPLY",recent,.70),rough,remap(ra,.20,.98,.59,.81,"Fresh inlay roughness"))
rough=value_mix(calc("MULTIPLY",old,.55),rough,.84)
rough=value_mix(calc("MULTIPLY",dust,.28),rough,.91)
rough=value_mix(calc("MULTIPLY",joint,.54),rough,.66)

c_normal=weighted_normal(signed_normal(n0),restore_frame(signed_normal(n1)),weight,"Normalized scan crossfade")
b_normal=weighted_normal(flat,signed_normal(nb),.31,"Fine aggregate detail")
base_normal=weighted_normal(flat,c_normal,.52,"Aged scan relief")
normal=rnm(base_normal,b_normal)
normal=weighted_normal(normal,weighted_normal(flat,signed_normal(na),.43,"Newer inlay relief"),
                       calc("MULTIPLY",recent,.78),"Normalized new inlay transition")
normal=weighted_normal(normal,weighted_normal(flat,signed_normal(nb),.53,"Weathered inlay relief"),
                       calc("MULTIPLY",old,.69),"Normalized worn inlay transition")
encoded=vec("ADD",vec("SCALE",normal,.5),(.5,.5,.5),"Encode once for Blender tangent basis")
normal_map=node("ShaderNodeNormalMap","OpenGL, exact road UV tangent")
normal_map.uv_map=UV_NAME
bind(normal_map,"Color",encoded)
bump=node("ShaderNodeBump","Shallow isolated seams")
bind(bump,"Strength",.33)
bind(bump,"Distance",.002)
bind(bump,"Height",calc("SUBTRACT",1,joint))
bind(bump,"Normal",normal_map.outputs["Normal"])
bsdf=tree.nodes.get("Principled BSDF")
bind(bsdf,"Base Color",base_color)
bind(bsdf,"Roughness",rough)
bind(bsdf,"Normal",bump.outputs["Normal"])
bind(bsdf,"IOR",1.46)

# Lay the graph out by output distance instead of leaving generated nodes stacked.
depth={}
def visit(n,level):
    if depth.get(n,-1)>=level:
        return
    depth[n]=level
    for socket in n.inputs:
        for link in socket.links:
            visit(link.from_node,level+1)
visit(tree.nodes.get("Material Output"),0)
ranks={}
for n,d in depth.items():
    n.location=(-d*235,-ranks.get(d,0)*180)
    ranks[d]=ranks.get(d,0)+1

scene=baseline.copy()
scene.name="C_FINAL_CANDIDATE"
scene.use_fake_user=True
branch=bpy.data.collections.new("01 | Pavement and paint — C_FINAL_CANDIDATE")
scene.collection.children.unlink(pavement)
scene.collection.children.link(branch)
for o in pavement.objects:
    if o not in road:
        branch.objects.link(o)
        continue
    copy=o.copy()
    copy.name=o.name+" — C_FINAL"
    branch.objects.link(copy)
    copy.material_slots[0].link="OBJECT"
    copy.material_slots[0].material=mat
bpy.context.window.scene=scene
evidence={"carriageways":lane_bounds,"texture_dimensions_m":{"asphalt_04":4,"asphalt_01":2.1,"asphalt_floor":2.3},
          "px_per_m_nominal":{"asphalt_04":1024,"asphalt_01":2048/2.1,"asphalt_floor":2048/2.3},
          "uv_extent_m":[minimum.tolist(),maximum.tolist()],"mask_density_px_per_m":density,
          "matched_join_texels":len(seams),"max_join_displacement_m":max(seams),"actual_per_uv_m":ranges,
          "marking_objects":len(marks),"road_meshes":len(road)}
(output.parent/"surface_measurements.json").write_text(json.dumps(evidence,indent=2)+"\n")
bpy.ops.wm.save_as_mainfile(filepath=str(output),compress=True)
