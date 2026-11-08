"""Edit the R4.1b native checkpoint without rebuilding the road or cameras."""
import hashlib
import json
import math
import random
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Quaternion, Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "r41b"))
from edit_scene import camera_state, noise_at, smoothstep, source_positions, uv_metres, world_xy

OUTER = 13.8
OPPOSITE = -17.0
LANDSCAPE = "03 | Verge and landform"
WOODLAND = "04 | Woodland"
ASSETS = ("grass_medium_02", "grass_bermuda_01")


def protection_signature():
    """Record geometry, material bindings and transforms for the road and restraints."""
    digest = hashlib.sha256()
    groups = ("01 | Pavement and paint", "02 | Road restraint systems",
              "SOURCE | Innerscene W-beam", "SOURCE | Innerscene Jersey")
    for group in groups:
        for obj in sorted(bpy.data.collections[group].objects, key=lambda o: o.name):
            digest.update(repr((obj.name, list(map(tuple, obj.matrix_world)),
                                obj.instance_collection.name if obj.instance_collection else None)).encode())
            if obj.type != "MESH":
                continue
            mesh = obj.data
            for sequence, key, width, dtype in ((mesh.vertices, "co", 3, np.float32),
                                                 (mesh.loops, "vertex_index", 1, np.int32),
                                                 (mesh.polygons, "loop_start", 1, np.int32),
                                                 (mesh.polygons, "material_index", 1, np.int32)):
                values = np.empty(len(sequence) * width, dtype=dtype)
                sequence.foreach_get(key, values)
                digest.update(values.tobytes())
            for mat in mesh.materials:
                digest.update(mat.name.encode())
                if mat.node_tree:
                    digest.update(repr([(n.name, n.type) for n in mat.node_tree.nodes]).encode())
                    digest.update(repr([(l.from_node.name, l.from_socket.name, l.to_node.name,
                                         l.to_socket.name) for l in mat.node_tree.links]).encode())
    return digest.hexdigest()


def edge_distance(x):
    return x - OUTER if x > 0 else OPPOSITE - x


def terrain_art(land):
    max_edit = 0
    corridor_vertices = 0
    for obj in land.objects:
        if obj.type != "MESH":
            continue
        outer = obj.name.startswith("Outer verge and drainage swale")
        ridge = obj.name.startswith("Distant rolling land")
        if not (outer or ridge):
            continue
        tones = obj.data.attributes["R41bGroundTone"].data
        for vert, tone in zip(obj.data.vertices, tones):
            s, x = uv_metres(vert.co)
            d = edge_distance(x)
            if outer and d <= 2.24:
                corridor_vertices += 1
                continue
            if outer:
                fade = smoothstep(2.24, 5.6, d)
                swell = .49 * noise_at(s, x, 15, 6) + .24 * noise_at(s, x, 5, 3)
                cut = -.16 * math.exp(-((d - 4.2 - 1.6 * noise_at(s, x, 12, 7)) / 1.5) ** 2)
                change = fade * (swell + cut)
                tone.value = .83 + .22 * noise_at(s, x, 13, 5) + .15 * noise_at(s, x, 4, 2.3)
                tone.value -= .12 * smoothstep(3.7, 10, d)
            else:
                change = smoothstep(216, 251, s) * (1.65 * noise_at(s, x, 29, 20)
                                                     + .81 * noise_at(s, x, 14, 11))
                tone.value = .54 + .24 * noise_at(s, x, 22, 13) + .12 * noise_at(s, x, 9, 8)
            vert.co.z += change
            max_edit = max(max_edit, abs(change))
        obj.data.update()
    assert corridor_vertices and max_edit > .2
    return corridor_vertices, max_edit


def terrain_hit(land):
    trees = [BVHTree.FromPolygons([obj.matrix_world @ v.co for v in obj.data.vertices],
                                 [tuple(p.vertices) for p in obj.data.polygons])
             for obj in land.objects if obj.type == "MESH"]

    def hit(x, y):
        samples = [bvh.ray_cast((x, y, 100), (0, 0, -1), 200) for bvh in trees]
        valid = [(p, n) for p, n, _, _ in samples if p is not None]
        if not valid:
            raise ValueError(f"No roadside terrain under ({x:.2f}, {y:.2f})")
        p, n = max(valid, key=lambda item: item[0].z)
        return p.z, n if n.z >= 0 else -n
    return hit


def model_height(collection):
    mesh = next(o for o in collection.objects if o.type == "MESH")
    box = [mesh.matrix_world @ Vector(corner) for corner in mesh.bound_box]
    return max(p.z for p in box) - collection.instance_offset.z


def grass_sources(inputs):
    result = {}
    for asset in ASSETS:
        old_objects = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(inputs / asset / "source.gltf"))
        imported = set(bpy.data.objects) - old_objects
        bpy.context.view_layer.update()
        meshes = sorted((o for o in imported if o.type == "MESH" and len(o.data.vertices) > 40),
                        key=lambda o: o.name)
        preferred = [o for o in meshes if "lod0" in o.name.lower()]
        # Each collection holds an individual provider model, never the showroom layout.
        sources = (preferred or meshes)[:3]
        if not sources:
            raise RuntimeError(f"No source grass mesh in {asset}")
        variants = []
        for mesh in sources:
            if mesh.parent:
                world = mesh.matrix_world.copy()
                mesh.parent = None
                mesh.matrix_world = world
                bpy.context.view_layer.update()
            positions = source_positions(mesh)
            lo, hi = positions.min(axis=0), positions.max(axis=0)
            if (hi - lo).min() < .02 or (hi - lo).max() > 25:
                raise RuntimeError(f"Unexpected model bounds for {mesh.name}: {hi - lo}")
            root = np.median(positions[positions[:, 2] < lo[2] + .06, :2], axis=0)
            group = bpy.data.collections.new(f"R4.1c source | {mesh.name}")
            group.objects.link(mesh)
            group.instance_offset = (float(root[0]), float(root[1]), float(lo[2]))
            variants.append((group, tuple(float(v) for v in hi - lo)))
            print(asset, mesh.name, "world extent (m)", hi - lo, flush=True)
        for obj in imported:
            for group in list(obj.users_collection):
                if not group.name.startswith("R4.1c source |"):
                    group.objects.unlink(obj)
        result[asset] = variants
    return result


def instance(parent, label, source):
    obj = bpy.data.objects.new(label, None)
    parent.objects.link(obj)
    obj.instance_type = "COLLECTION"
    obj.instance_collection = source
    obj.empty_display_size = .22
    return obj


def plant_tree(obj, s, x, height, width, ground, rng):
    xx, yy = world_xy(s, x)
    z, _ = ground(xx, yy)
    size = height / model_height(obj.instance_collection)
    obj.location = (xx, yy, z - min(.095, .04 + .02 * height))
    obj.rotation_euler = (0, 0, rng.uniform(0, math.tau))
    obj.scale = (size * width * rng.uniform(.87, 1.14), size * width * rng.uniform(.86, 1.13), size)
    return obj.location.z - z


def stage_tree_layers(wood, ground, rng):
    broad, *pines = sorted((c for c in bpy.data.collections if c.name.startswith("R4.1b source | ")),
                           key=lambda c: ("tree_small_02" not in c.name, c.name))
    assert "tree_small_02" in broad.name and len(pines) == 3
    gaps = []
    for obj in sorted(wood.objects, key=lambda item: item.name):
        z, _ = ground(obj.location.x, obj.location.y)
        obj.location.z = z - (.045 if obj.name.startswith("Verge") else .095)
        gaps.append(obj.location.z - z)
    added = dict(scrub=0, middle=0, ridge=0)
    for cs, d, count in ((10, 5.8, 9), (23, 4.8, 18), (40, 7, 15), (56, 5.1, 11),
                          (74, 8.5, 17), (91, 6.4, 12), (117, 10.5, 13),
                          (145, 8.6, 11), (171, 9.4, 9), (195, 7.5, 8)):
        for _ in range(count):
            s = cs + rng.uniform(-5, 6)
            x = OUTER + max(3.15, d + rng.uniform(-2.4, 2.8))
            obj = instance(wood, "R4.1c | Scrub pocket", broad)
            h = rng.uniform(.60, 1.42) if x - OUTER < 5.5 else rng.uniform(.70, 2.05)
            gaps.append(plant_tree(obj, s, x, h, rng.uniform(1.32, 1.84), ground, rng))
            added["scrub"] += 1
    for sign, edge, groups in ((1, OUTER, ((17, 18, 10), (38, 16, 13), (71, 15, 14),
                                           (98, 21, 12), (133, 19, 14), (175, 18, 14), (197, 21, 10))),
                                (-1, OPPOSITE, ((25, 18, 10), (62, 17, 13), (104, 23, 15),
                                                 (150, 20, 15), (189, 22, 12)))):
        for cs, d, count in groups:
            for _ in range(count):
                s = cs + rng.uniform(-9, 9)
                x = edge + sign * (d + rng.uniform(-5, 7))
                src = rng.choice(pines) if rng.random() < .36 else broad
                obj = instance(wood, "R4.1c | Middle woodland", src)
                gaps.append(plant_tree(obj, s, x, rng.uniform(3.1, 10.2) if src == broad
                                       else rng.uniform(6.0, 13.1), rng.uniform(.80, 1.15), ground, rng))
                added["middle"] += 1
    ridge_groups = ((-104, 271, 24), (-79, 291, 22), (-48, 275, 25), (-19, 295, 29),
                    (5, 265, 23), (30, 289, 32), (52, 270, 28), (77, 296, 34), (105, 292, 31),
                    (-55, 337, 26), (-12, 347, 23), (44, 339, 26), (92, 331, 24))
    for cx, cs, count in ridge_groups:
        for _ in range(count):
            s = cs + rng.uniform(-16, 16)
            x = cx + rng.uniform(-15, 15)
            src = rng.choice(pines) if rng.random() < .44 else broad
            obj = instance(wood, "R4.1c | Distant woodland stand", src)
            h = rng.uniform(3.4, 8.6) if src == broad else rng.uniform(5.5, 12.5)
            gaps.append(plant_tree(obj, s, x, h, rng.uniform(.86, 1.30), ground, rng))
            added["ridge"] += 1
    assert max(gaps) < -.03 and min(gaps) > -.10
    return added, [min(gaps), max(gaps)]


def grass_layers(scene, sources, ground, rng):
    group = bpy.data.collections.new("04b | Cut verge and bank grasses")
    scene.collection.children.link(group)
    counts = {"cut_verge": 0, "bank": 0}
    gap_range = [0, -.10]

    def grass(asset, s, x, height, width, kind):
        d = edge_distance(x)
        assert d > .35 and (kind == "cut_verge" or d >= 1.92)
        group_model, dims = rng.choice(sources[asset])
        xx, yy = world_xy(s, x)
        z, n = ground(xx, yy)
        obj = instance(group, "R4.1c | " + kind, group_model)
        burial = .018 if kind == "cut_verge" else .034
        obj.location = (xx, yy, z - burial)
        obj.rotation_mode = "QUATERNION"
        obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(n) @ Quaternion((0, 0, 1), rng.uniform(0, math.tau))
        spread = width / max(dims[:2])
        obj.scale = (spread * rng.uniform(.83, 1.15), spread * rng.uniform(.84, 1.16), height / dims[2])
        gap = obj.location.z - z
        gap_range[:] = [min(gap_range[0], gap), max(gap_range[1], gap)]
        counts[kind] += 1

    for cs, count in ((9, 29), (17, 42), (29, 28), (39, 43), (53, 27), (67, 32), (86, 25),
                      (101, 33), (125, 25), (151, 26), (179, 25)):
        for _ in range(count):
            s = cs + rng.uniform(-5, 5)
            d = rng.uniform(.42, 1.55)
            grass(ASSETS[1], s, OUTER + d, rng.uniform(.055, .135), rng.uniform(.23, .54), "cut_verge")
    for cs, centre_d, count in ((9, 3.7, 48), (18, 4.7, 73), (28, 3.6, 81), (43, 4.8, 64),
                                 (55, 3.3, 45), (68, 6.1, 48), (83, 4.2, 53), (101, 6.3, 47),
                                 (119, 4.6, 41), (146, 6.8, 40), (174, 4.6, 39), (196, 7, 33)):
        for _ in range(count):
            s = cs + rng.uniform(-6, 6.5)
            d = max(1.94, centre_d + rng.uniform(-2.8, 3.7))
            asset = ASSETS[0] if rng.random() < .68 else ASSETS[1]
            tall = smoothstep(1.94, 4, d)
            grass(asset, s, OUTER + d, rng.uniform(.15, .31) + tall * rng.uniform(.01, .22),
                  rng.uniform(.40, .96), "bank")
    for cs in (13, 27, 47, 68, 85, 112, 147):
        for _ in range(18):
            grass(rng.choice(ASSETS), cs + rng.uniform(-6, 6), OPPOSITE - rng.uniform(2.1, 6.4),
                  rng.uniform(.13, .41), rng.uniform(.37, .84), "bank")
    assert max(gap_range) < -.01 and min(gap_range) > -.04
    return counts, gap_range


def main(inputs, output):
    scene = bpy.context.scene
    assert bpy.data.filepath and scene.render.engine == "CYCLES"
    bpy.context.view_layer.update()
    cameras = camera_state(scene)
    protected = protection_signature()
    assert (scene.render.resolution_x, scene.render.resolution_y, scene.cycles.samples) == (1280, 720, 64)
    assert math.isclose(cameras["exposure"], .82, abs_tol=1e-6)
    land = bpy.data.collections[LANDSCAPE]
    unchanged_vertices, max_relief = terrain_art(land)
    ground = terrain_hit(land)
    rng = random.Random(412)
    sources = grass_sources(inputs)
    added, tree_gaps = stage_tree_layers(bpy.data.collections[WOODLAND], ground, rng)
    grass, grass_gaps = grass_layers(scene, sources, ground, rng)
    bpy.context.view_layer.update()
    assert cameras == camera_state(scene)
    assert protected == protection_signature()
    bpy.ops.file.pack_all()
    assert all(im.packed_file for im in bpy.data.images if im.source == "FILE")
    stats = {
        "blender": bpy.app.version_string,
        "camera_and_exposure": cameras,
        "cycles_samples": scene.cycles.samples,
        "adaptive_threshold": scene.cycles.adaptive_threshold,
        "denoising": scene.cycles.use_denoising,
        "protected_road_and_restraint_signature": protected,
        "unchanged_verge_corridor_vertices": unchanged_vertices,
        "largest_terrain_relief_edit_m": max_relief,
        "added_tree_and_scrub_by_layer": added,
        "tree_anchor_signed_clearance_m": tree_gaps,
        "grass_instances": grass,
        "grass_anchor_signed_clearance_m": grass_gaps,
        "grass_source_variants": {a: [c.name for c, _ in sources[a]] for a in ASSETS},
        "packed_images": sum(bool(im.packed_file) for im in bpy.data.images),
    }
    (output / "roadside-art-stats.json").write_text(json.dumps(stats, indent=2) + "\n")
    print("R4.1c audit:", json.dumps(stats), flush=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "highway-master-r41c.blend"), compress=True)


if __name__ == "__main__":
    main(*map(Path, sys.argv[sys.argv.index("--") + 1:]))
