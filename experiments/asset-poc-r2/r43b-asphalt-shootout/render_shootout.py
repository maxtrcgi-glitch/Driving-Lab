"""Render the nine comparisons from saved shootout scenes with one settings preset."""
import argparse
from pathlib import Path
import sys

import bpy

parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path)
parser.add_argument("--variants", default="ABC")
parser.add_argument("--views", nargs="+", choices=("driver","roadside","overview"), default=("driver","roadside","overview"))
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
args.output.mkdir(parents=True, exist_ok=True)
views = {"A |":"driver", "B |":"roadside", "C |":"overview"}
for variant in args.variants:
    scene = next(s for s in bpy.data.scenes if s.name.startswith(f"{variant} — "))
    bpy.context.window.scene = scene
    scene.render.engine = "CYCLES"
    scene.render.resolution_x = 1152
    scene.render.resolution_y = 648
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.use_persistent_data = True
    scene.cycles.samples = 48
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = .04
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    for prefix, view in views.items():
        if view not in args.views:
            continue
        scene.camera = next(o for o in scene.objects if o.type == "CAMERA" and o.name.startswith(prefix))
        scene.render.filepath = str(args.output.resolve() / f"{variant}-{view}.png")
        bpy.ops.render.render(write_still=True)
    scene.render.use_persistent_data = False
