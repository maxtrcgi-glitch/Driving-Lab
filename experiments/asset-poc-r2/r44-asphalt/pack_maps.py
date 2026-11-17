"""Pack the approved Asphalt 04 scan for the unchanged Two-texture shader."""
import hashlib
import json
from pathlib import Path
import sys

from PIL import Image

source, output, maps_path = map(Path, sys.argv[1:])
output.mkdir(parents=True, exist_ok=True)
approved = {entry["file"]: entry["sha256"] for entry in json.loads(maps_path.read_text())}
images = {}
for key in ("diff", "nor_gl", "rough"):
    path = source / f"asphalt_04_{key}_4k.jpg"
    assert hashlib.sha256(path.read_bytes()).hexdigest() == approved[path.name], path
    image = Image.open(path).convert("RGB")
    assert image.size == (4096, 4096), path
    images[key] = image.resize((2048, 2048), Image.Resampling.LANCZOS)

images["diff"].save(output / "scan-color.webp", quality=94, method=6)
normal_x, normal_y, _ = images["nor_gl"].split()
roughness = images["rough"].getchannel("R")
packed = Image.merge("RGB", (normal_x, normal_y, roughness))
# Two lossless images keep each static object small and preserve all channel values.
width, height = packed.size
for number in range(2):
    packed.crop((0, number * height // 2, width, (number + 1) * height // 2)).save(
        output / f"scan-data-{number}.webp", lossless=True, method=4,
    )
