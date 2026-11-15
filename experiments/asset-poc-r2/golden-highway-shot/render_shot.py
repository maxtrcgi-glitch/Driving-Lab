"""Render Driver Eye and Roadside from a saved Golden Highway checkpoint."""
import argparse
from pathlib import Path
import sys

import bpy

parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path)
parser.add_argument("--samples", type=int, default=80)
parser.add_argument("--width", type=int, default=1280)
parser.add_argument("--driver-only", action="store_true")
parser.add_argument("--denoise", action="store_true")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
args.output.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = args.samples
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .029
scene.cycles.use_denoising = args.denoise
if args.denoise:
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.render.resolution_x = args.width
scene.render.resolution_y = round(args.width * 9 / 16)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
for prefix, label in [("A |", "driver"), ("B |", "roadside")][:1 if args.driver_only else 2]:
    scene.camera = next(o for o in scene.objects if o.type == "CAMERA" and o.name.startswith(prefix))
    scene.render.filepath = str(args.output.resolve() / (label + ".png"))
    bpy.ops.render.render(write_still=True)
