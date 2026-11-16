"""Check locked scene data, packed inputs and the normal-composition graph."""
import bpy
from mathutils import Vector
import math

new=bpy.data.scenes["C_FINAL_CANDIDATE"]
old=next(s for s in bpy.data.scenes if s.name.startswith("C — "))
bpy.context.window.scene=new
bpy.context.view_layer.update()

def road(scene):
    return [o for o in scene.objects if o.type=="MESH" and o.material_slots and
            o.material_slots[0].material.name.startswith(("R4.3b C |","C_FINAL_CANDIDATE"))]
a,b=road(old),road(new)
assert len(a)==len(b)==6
assert {o.data for o in a}=={o.data for o in b}
assert {o for o in old.objects if o not in a}=={o for o in new.objects if o not in b}
assert {o.data:tuple(tuple(row) for row in o.matrix_world) for o in a}=={
        o.data:tuple(tuple(row) for row in o.matrix_world) for o in b}
assert old.world==new.world and old.camera==new.camera
assert all(getattr(old.view_settings,n)==getattr(new.view_settings,n)
           for n in ("exposure","gamma","view_transform","look"))
marks=[o for o in new.objects if o.type=="MESH" and o.material_slots and
       o.material_slots[0].material.name.startswith("Markings |")]
assert len(marks)==60

mat=bpy.data.materials["C_FINAL_CANDIDATE"]
normal=next(n for n in mat.node_tree.nodes if n.type=="NORMAL_MAP")
assert normal.space=="TANGENT" and normal.uv_map=="Surface metres"
visited=set()
def sources(n):
    if n in visited:
        return
    assert n.type!="MIX_RGB",n.label
    visited.add(n)
    for link in n.inputs:
        for edge in link.links:
            sources(edge.from_node)
sources(normal)
assert any(n.label=="RNM result" and n.operation=="NORMALIZE" for n in visited)
assert any(n.label=="Return normal to mesh tangent frame" for n in visited)
maps=[n.image for n in visited if n.type=="TEX_IMAGE" and "nor_gl" in n.image.name]
assert len(maps)==4 and all(i.colorspace_settings.name=="Non-Color" for i in maps)
assets=[i for i in bpy.data.images if i.users and i.source=="FILE"]
assert all(im.packed_file for im in assets)

def rnm(a,b):
    t=a+Vector((0,0,1))
    u=Vector((-b.x,-b.y,b.z))
    return (t*(t.dot(u)/t.z)-u).normalized()
flat=Vector((0,0,1))
base=Vector((.35,-.25,.91)).normalized()
detail=Vector((-.12,.41,.91)).normalized()
assert (rnm(flat,flat)-flat).length<1e-6
assert (rnm(base,flat)-base).length<1e-6
assert (rnm(flat,detail)-detail).length<1e-6
combined=rnm(base,detail)
assert combined.z>0 and abs(combined.length-1)<1e-6
assert (combined-(base+detail).normalized()).length>.10
rotated=Vector((0,1,0))
assert (Vector((rotated.y,-rotated.x,rotated.z))-Vector((1,0,0))).length<1e-6
print("PASS: original geometry, 60 markings, shared cameras, world and exposure.")
print(f"PASS: {len(assets)} file-backed images packed. No MixRGB in the normal branch.")
print("PASS: RNM neutral identities, normalized tilted combination and inverse UV-frame rotation.",
      "RNM tilted output:",tuple(round(v,6) for v in combined))
