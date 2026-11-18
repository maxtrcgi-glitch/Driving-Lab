"""Render existing cameras without changing their transforms or lighting."""
from pathlib import Path
import sys
import bpy
out = Path(sys.argv[sys.argv.index('--') + 1]); out.mkdir(parents=True, exist_ok=True)
s = bpy.data.scenes['C_STOCHASTIC_FINAL']; bpy.context.window.scene = s
for prefix, name in zip('ABC', ['driver', 'roadside', 'overview']):
    s.camera = next(o for o in s.objects if o.type == 'CAMERA' and o.name.startswith(prefix + ' |'))
    s.render.engine = 'CYCLES'; s.cycles.samples = 48
    s.cycles.use_denoising = False; s.cycles.adaptive_threshold = .04
    s.render.resolution_x = 1152; s.render.resolution_y = 648; s.render.resolution_percentage = 100
    s.render.image_settings.file_format = 'PNG'
    s.render.filepath = str((out / (name + '.png')).resolve())
    bpy.ops.render.render(write_still=True)
