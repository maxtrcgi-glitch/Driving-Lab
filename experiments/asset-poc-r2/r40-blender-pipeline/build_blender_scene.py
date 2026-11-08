import bpy, json, os, sys, hashlib, math
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
source=os.path.abspath(args[0]); out=os.path.abspath(args[1]); os.makedirs(out,exist_ok=True)
print('BLENDER',bpy.app.version_string,'SOURCE',source,flush=True)
assert hasattr(bpy.ops.import_scene,'gltf') and hasattr(bpy.ops.export_scene,'gltf'), 'glTF import/export unavailable'
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
with open(source,'rb') as f: sha=hashlib.sha256(f.read()).hexdigest()
bpy.ops.import_scene.gltf(filepath=source)
imported=list(bpy.context.selected_objects)
meshes=[o for o in imported if o.type=='MESH']; assert meshes, 'no imported meshes'
collection=bpy.data.collections.new('Original Guardrail'); bpy.context.scene.collection.children.link(collection)
for obj in imported:
 for c in list(obj.users_collection): c.objects.unlink(obj)
 collection.objects.link(obj)
# A real nonidentity scene transform; export includes this parent and children.
parent=bpy.data.objects.new('Guardrail_Assembly',None); collection.objects.link(parent); parent.location=(0,0,0.05)
for obj in imported:
 if obj.parent is None: obj.parent=parent
bpy.context.view_layer.update()
points=[o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo=Vector([min(p[i] for p in points) for i in range(3)]); hi=Vector([max(p[i] for p in points) for i in range(3)]); center=(lo+hi)*.5
for ob in meshes: assert len(ob.data.uv_layers)>0, 'missing UV '+ob.name
materials={m.name for o in meshes for m in o.data.materials if m}; assert materials
images={im.name:{'size':list(im.size),'source':im.source,'packed':bool(im.packed_file)} for im in bpy.data.images if im.size[0]>0}
for im in bpy.data.images:
 if im.source=='FILE' and not im.packed_file:
  try: im.pack()
  except RuntimeError as e: print('PACK_WARNING',im.name,str(e),flush=True)
# Ground is inspection-only, with an ordinary Principled material.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0))
ground=bpy.context.object;ground.name='Inspection Ground (not exported)'
mat=bpy.data.materials.new('Neutral ground PBR');mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.24,.25,.24,1);bsdf.inputs['Roughness'].default_value=.85
ground.data.materials.append(mat)
world=bpy.context.scene.world or bpy.data.worlds.new('Daylight');bpy.context.scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.55,.65,.8,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
bpy.ops.object.light_add(type='SUN',location=(0,-5,8)); sun=bpy.context.object;sun.name='Daylight Sun';sun.data.energy=2.0;sun.rotation_euler=(math.radians(28),math.radians(-25),math.radians(-28));sun.data.angle=math.radians(3)
def camera(name,location,target,lens):
 bpy.ops.object.camera_add(location=location);c=bpy.context.object;c.name=name;c.data.lens=lens;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();return c
# Source X is 12m long; inspect both beam face and posts.
full=camera('Camera Full',(8,-12,5.0),center,42)
close=camera('Camera Close',(1,-2.7,1.6),(0,0,center.z),42)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=16
scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.camera=full
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'guardrail-master.blend'))
for cam,name in [(full,'blender-full.png'),(close,'blender-close.png')]:
 scene.camera=cam;scene.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
# Only the imported asset and its assembly parent leave Blender.
bpy.ops.object.select_all(action='DESELECT')
for obj in imported+[parent]: obj.select_set(True)
bpy.context.view_layer.objects.active=parent
export=os.path.join(out,'guardrail-export.glb')
bpy.ops.export_scene.gltf(filepath=export,export_format='GLB',use_selection=True,export_apply=False)
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
report={'blender':bpy.app.version_string,'source_sha256':sha,'source_bytes':os.path.getsize(source),'export_bytes':os.path.getsize(export),'imported_objects':len(imported),'mesh_objects':len(meshes),'triangles':triangles,'dimensions_m':[round(float(x),6) for x in hi-lo],'materials':sorted(materials),'images':images,'camera_full':list(full.location),'camera_full_target':list(center),'camera_full_fov_deg':math.degrees(full.data.angle_y),'bounds_min':list(lo),'bounds_max':list(hi),'cycles_available':True}
with open(os.path.join(out,'blender-stats.json'),'w') as f:json.dump(report,f,indent=2)
print('BLENDER_PIPELINE_COMPLETE',json.dumps(report),flush=True)
