import bpy,json
from pathlib import Path
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath='/workspace/scratch/a3807d122d38/r2/source/unity/Assets/StreetCar/Mesh/StreetCar.fbx')
out=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 o.data.calc_loop_triangles()
 out.append(dict(name=o.name,triangles=len(o.data.loop_triangles),vertices=len(o.data.vertices),dimensions=list(o.dimensions),location=list(o.location),materials=[m.name if m else None for m in o.data.materials]))
print(json.dumps(out,indent=2));Path('/workspace/scratch/a3807d122d38/r2/reports/source_mesh.json').write_text(json.dumps(out,indent=2))
bpy.ops.wm.save_as_mainfile(filepath='/workspace/scratch/a3807d122d38/r2/source/inspected.blend')
