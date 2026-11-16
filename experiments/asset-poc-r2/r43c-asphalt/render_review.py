"""Render matched main views and temporary inspection rigs without saving rig changes."""
import argparse
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

parser=argparse.ArgumentParser()
parser.add_argument("output",type=Path)
parser.add_argument("--primary-only",action="store_true")
parser.add_argument("--inspection-only",action="store_true")
args=parser.parse_args(sys.argv[sys.argv.index("--")+1:])
out=args.output.resolve()
out.mkdir(parents=True,exist_ok=True)
candidate=bpy.data.scenes["C_FINAL_CANDIDATE"]
old=next(s for s in bpy.data.scenes if s.name.startswith("C — "))

def render(scene,camera,name,width=1152,height=648,samples=48,adaptive=.04):
    bpy.context.window.scene=scene
    scene.camera=camera
    scene.render.engine="CYCLES"
    scene.render.resolution_x=width
    scene.render.resolution_y=height
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="PNG"
    scene.render.use_persistent_data=True
    scene.cycles.samples=samples
    scene.cycles.use_adaptive_sampling=True
    scene.cycles.adaptive_threshold=adaptive
    scene.cycles.use_denoising=True
    scene.cycles.denoiser="OPENIMAGEDENOISE"
    scene.render.filepath=str(out/(name+".png"))
    bpy.ops.render.render(write_still=True)

existing={p:next(o for o in candidate.objects if o.type=="CAMERA" and o.name.startswith(p+" |"))
          for p in "ABC"}
if not args.inspection_only:
    for p,name in zip("ABC",("driver","roadside","overview")):
        render(candidate,existing[p],name)
if args.primary_only:
    raise SystemExit(0)

# An additional image deliberately shows a long section at a fixed scale.
inspect_bpy=bpy.data.cameras.new("Temporary repeat-check lens")
inspect_cam=bpy.data.objects.new("Temporary repeat-check camera",inspect_bpy)
candidate.collection.objects.link(inspect_cam)
inspect_cam.location=(-4,57,105)
inspect_cam.rotation_euler=(0,0,-math.pi/2)
inspect_bpy.type="ORTHO"
inspect_bpy.ortho_scale=138
render(candidate,inspect_cam,"long-overview",1536,720,48)

# Keep the existing Roadside camera for the sunlight-only inspection. The
# diagnostic camera is separate and uses exactly the same raking rig for A/B.
sun=next(o for o in candidate.objects if o.type=="LIGHT" and o.data.type=="SUN")
sun.rotation_euler=Vector((-.61,.77,-.20)).to_track_quat("-Z","Y").to_euler()
render(candidate,existing["B"],"low-angle",1280,720,64,.032)

paving=[o for o in candidate.objects if o.type=="MESH" and o.material_slots
        and o.material_slots[0].material.name=="C_FINAL_CANDIDATE"]
grids=[BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],
       [tuple(p.vertices) for p in o.data.polygons]) for o in paving]

def road_point(s,x,lift):
    y=(630+x)*math.sin(s/630)
    world_x=(630+x)*math.cos(s/630)-630
    hit=[b.ray_cast((world_x,y,30),(0,0,-1),60)[0] for b in grids]
    z=max(p.z for p in hit if p is not None)
    return Vector((world_x,y,z+lift))

lens=bpy.data.cameras.new("Temporary macro inspection lens")
macro=bpy.data.objects.new("Temporary macro inspection camera",lens)
candidate.collection.objects.link(macro)
old.collection.objects.link(macro)
macro.location=road_point(17.0,9.75,.38)
target=road_point(19.10,10.32,0)
macro.rotation_euler=(target-macro.location).to_track_quat("-Z","Y").to_euler()
lens.lens=42
render(candidate,macro,"diagnostic-after",1280,720,80,.026)
candidate.render.use_persistent_data=False
render(old,macro,"diagnostic-before",1280,720,80,.026)
