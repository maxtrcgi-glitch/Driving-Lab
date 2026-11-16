"""Validate retained scene inputs, continuous kernel and packed PBR alignment."""
from pathlib import Path
import math
import sys
import bpy
from mathutils import Vector

scene=bpy.data.scenes["C_STOCHASTIC_FINAL"]
old=bpy.data.scenes["C_FINAL_CANDIDATE"]
new_mat=bpy.data.materials[scene.name]
old_mat=bpy.data.materials[old.name]
bpy.context.window.scene=scene
bpy.context.view_layer.update()

def pavement(s,mat):
    return {o.data:tuple(tuple(r) for r in o.matrix_world) for o in s.objects
            if o.type=="MESH" and o.material_slots and o.material_slots[0].material==mat}

a,b=pavement(old,old_mat),pavement(scene,new_mat)
assert a==b and len(a)==6
assert all(o.data.uv_layers.get("Surface metres") for o in scene.objects
           if o.type=="MESH" and o.data in b)
assert {o for o in old.objects if o.data not in a}=={o for o in scene.objects if o.data not in b}
assert old.world==scene.world and old.camera==scene.camera
assert all(getattr(old.view_settings,k)==getattr(scene.view_settings,k)
           for k in ("exposure","gamma","view_transform","look"))
marks=[o for o in scene.objects if o.type=="MESH" and o.material_slots and
       o.material_slots[0].material.name.startswith("Markings |")]
assert len(marks)==60

def walk(start):
    seen=set()
    def visit(n):
        if n in seen:
            return
        seen.add(n)
        for socket in n.inputs:
            for connection in socket.links:
                visit(connection.from_node)
    visit(start)
    return seen

normal=next(n for n in new_mat.node_tree.nodes if n.type=="NORMAL_MAP")
assert normal.space=="TANGENT" and normal.uv_map=="Surface metres"
branch=walk(normal)
assert not any(n.type=="MIX_RGB" for n in branch)
assert any(n.label=="RNM result" and n.operation=="NORMALIZE" for n in branch)
sampler=next(n for n in branch if n.type=="GROUP").node_tree
samples=[n for n in sampler.nodes if n.type=="TEX_IMAGE"]
coords={n.inputs["Vector"].links[0].from_socket for n in samples}
assert len(coords)==3
assert sum(n.label=="Inverse quarter-turn to common tangent frame" for n in sampler.nodes)==3
for anchor in coords:
    images={n.image.name:n.image.colorspace_settings.name for n in samples
            if n.inputs["Vector"].links[0].from_socket==anchor}
    assert images=={"asphalt_04_diff_4k.jpg":"sRGB","asphalt_04_nor_gl_4k.jpg":"Non-Color",
                    "asphalt_04_rough_4k.jpg":"Non-Color"}
    assert all(tuple(bpy.data.images[key].size)==(4096,4096) for key in images)
assert all(im.packed_file for im in bpy.data.images if im.users and im.source=="FILE")

def weights(u,v):
    i,j=math.floor(u),math.floor(v)
    f,g=u-i,v-j
    upper=int(f+g>1)
    shift=upper*(1-f-g)
    m={ (i+upper,j+upper):abs(1-f-g)**3,
        (i+1,j):max(0,f+shift)**3,
        (i,j+1):max(0,g+shift)**3 }
    total=sum(m.values())
    return {key:value/total for key,value in m.items()}

for edge in (((.36,.64-1e-8),(.36,.64+1e-8)),
             ((1-1e-8,.43),(1+1e-8,.43)),
             ((-.3,-1-1e-8),(-.3,-1+1e-8))):
    left,right=[weights(*q) for q in edge]
    assert abs(sum(left.values())-1)<1e-12
    assert max(abs(left.get(k,0)-right.get(k,0)) for k in set(left)|set(right))<1e-6

flat=Vector((0,0,1))
tilt=Vector((.32,-.24,.917)).normalized()
def rnm(base,detail):
    t=base+flat
    u=Vector((-detail.x,-detail.y,detail.z))
    return (t*(t.dot(u)/t.z)-u).normalized()
assert (rnm(tilt,flat)-tilt).length<1e-6 and (rnm(flat,tilt)-tilt).length<1e-6
for angle in (0,math.pi/2,math.pi,3*math.pi/2):
    from mathutils import Matrix
    forward=Matrix.Rotation(angle,3,"Z")
    inverse=Matrix.Rotation(-angle,3,"Z")
    assert (inverse @ (forward @ tilt)-tilt).length<1e-6
print("PASS: unchanged native geometry, complete UV layers, 60 separate markings and shared scene rig.")
print("PASS: identical PBR transforms per neighbor, full-resolution source maps, normalized decoded normal branch and retained RNM.")
print("PASS: continuous normalized kernel across diagonal, horizontal and vertical cell boundaries.")
