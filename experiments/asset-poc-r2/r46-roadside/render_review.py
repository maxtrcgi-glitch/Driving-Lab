"""Matched main cameras and a transient road-edge inspection camera."""
import argparse
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector
p = argparse.ArgumentParser()
p.add_argument('output', type=Path)
p.add_argument('--view', choices=['driver', 'roadside', 'overview', 'edge', 'all'], default='all')
a = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
a.output.mkdir(parents=True, exist_ok=True)
s = bpy.data.scenes['C_STOCHASTIC_FINAL']
bpy.context.window.scene = s
shots = {name: next(o for o in s.objects if o.type == 'CAMERA' and o.name.startswith(prefix + ' |'))
         for prefix, name in zip('ABC', ['driver', 'roadside', 'overview'])}
if a.view in ['all', 'edge']:
    cam = bpy.data.objects.new('Temporary R46 edge inspection', bpy.data.cameras.new('Temporary edge lens'))
    s.collection.objects.link(cam)
    def point(station, lateral, lift):
        z = .014 * station + .55 * math.sin(station / 47) - .025 * 13.8
        return Vector(((630 + lateral) * math.cos(station / 630) - 630,
                       (630 + lateral) * math.sin(station / 630), z + lift))
    cam.location = point(13, 13.15, .95)
    cam.rotation_euler = (point(16.1, 14.7, .05) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 38
    shots['edge'] = cam
s.render.engine = 'CYCLES'
s.cycles.samples = 96
s.cycles.use_adaptive_sampling = True
s.cycles.adaptive_threshold = .025
s.cycles.use_denoising = True
s.cycles.denoiser = 'OPENIMAGEDENOISE'
s.render.resolution_x = 1152
s.render.resolution_y = 648
s.render.resolution_percentage = 100
s.render.image_settings.file_format = 'PNG'
for name, camera in shots.items():
    if a.view != 'all' and a.view != name:
        continue
    s.camera = camera
    s.render.filepath = str((a.output / (name + '.png')).resolve())
    bpy.ops.render.render(write_still=True)
