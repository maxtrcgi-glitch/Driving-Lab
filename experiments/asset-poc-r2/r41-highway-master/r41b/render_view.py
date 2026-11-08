"""Render one unchanged R4.1 camera from the saved R4.1b checkpoint."""
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from edit_scene import SHOTS, camera_state

key, destination, audit_path = sys.argv[sys.argv.index("--") + 1:]
scene = bpy.context.scene
bpy.context.view_layer.update()
expected = json.loads(Path(audit_path).read_text())["camera_and_exposure"]
actual = camera_state(scene)
assert scene.render.engine == "CYCLES" and scene.cycles.samples == 64
assert all(im.packed_file for im in bpy.data.images if im.source == "FILE")
assert math.isclose(actual["exposure"], expected["exposure"], abs_tol=1e-6)
assert actual["view_transform"] == expected["view_transform"]
assert (scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage) == (1280, 720, 100)
for view in SHOTS:
    assert actual[view]["lens_mm"] == expected[view]["lens_mm"]
    assert actual[view]["sensor_width_mm"] == expected[view]["sensor_width_mm"]
    assert np.allclose(actual[view]["matrix_world"], expected[view]["matrix_world"], rtol=0, atol=1e-6)
scene.camera = bpy.data.objects[SHOTS[key]]
scene.render.filepath = destination
bpy.ops.render.render(write_still=True)
