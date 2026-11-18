"""Existing main views or a temporary roadside inspection camera; never save rig changes."""
import bpy, sys, math
from pathlib import Path
from mathutils import Vector
out = Path(sys.argv[sys.argv.index('--') + 1])
out.mkdir(parents=True, exist_ok=True)
s = bpy.data.scenes['C_STOCHASTIC_FINAL']
bpy.context.window.scene = s
s.render.engine = 'CYCLES'
s.cycles.samples = 64
s.cycles.use_denoising = False
s.cycles.adaptive_threshold = 0.035
s.render.resolution_x = 1152
s.render.resolution_y = 648
s.render.resolution_percentage = 100
s.render.image_settings.file_format = 'PNG'
if '--close' in sys.argv:
    cam = bpy.data.objects.new('Temporary R451 transition inspection', bpy.data.cameras.new('Temporary inspection lens'))
    s.collection.objects.link(cam)

    def point(station, x, lift):
        z = 0.014 * station + 0.55 * math.sin(station / 47) - 0.025 * 13.8
        return Vector(((630 + x) * math.cos(station / 630) - 630, (630 + x) * math.sin(station / 630), z + lift))
    cam.location = point(13, 13.15, 0.95)
    cam.rotation_euler = (point(16.1, 14.7, 0.05) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 38
    shots = [('transition-close', cam)]
else:
    shots = [(name, next((o for o in s.objects if o.type == 'CAMERA' and o.name.startswith(prefix + ' |')))) for prefix, name in zip('AB', ['driver', 'roadside'])]
for name, cam in shots:
    s.camera = cam
    s.render.filepath = str((out / (name + '.png')).resolve())
    bpy.ops.render.render(write_still=True)
