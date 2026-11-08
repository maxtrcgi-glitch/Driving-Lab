"""Apply the R4.1b art correction to the verified native R4.1 checkpoint."""
import json
import math
import random
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector, noise
from mathutils.bvhtree import BVHTree

RADIUS = 630.0
OUTER = 13.8
OPPOSITE_EDGE = -17.0
SHOTS = {
    "driver": "A | Driver eye · 1.20 m",
    "roadside": "B | Shoulder and restraint",
    "overview": "C | Carriageway cross-section",
}


def camera_state(scene):
    return {
        key: {
            "matrix_world": [list(row) for row in bpy.data.objects[name].matrix_world],
            "lens_mm": bpy.data.objects[name].data.lens,
            "sensor_width_mm": bpy.data.objects[name].data.sensor_width,
        }
        for key, name in SHOTS.items()
    } | {"exposure": scene.view_settings.exposure, "view_transform": scene.view_settings.view_transform}


def uv_metres(point):
    dx, y = point.x + RADIUS, point.y
    return RADIUS * math.atan2(y, dx), math.hypot(dx, y) - RADIUS


def world_xy(s, x):
    theta = s / RADIUS
    return (RADIUS + x) * math.cos(theta) - RADIUS, (RADIUS + x) * math.sin(theta)


def smoothstep(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3.0 - 2.0 * t)


def noise_at(s, x, stretch_s, stretch_x):
    return noise.noise(Vector((s / stretch_s, x / stretch_x, 0.71)))


def attribute(mesh, name, values):
    attr = mesh.attributes.new(name=name, type="FLOAT", domain="POINT")
    attr.data.foreach_set("value", list(values))


def input_texture(mat, slot):
    return next(n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE"
                and n.image and slot in n.image.name)


def surface_profile(s, x):
    if x < -1.01:
        x = -4.5 - x
    tone = 1.42
    for edge, delta, width in ((3.5, -.47, .11), (7.0, .58, .12), (10.75, .28, .16)):
        tone += delta * smoothstep(edge - width, edge + width, x)
    shoulder = smoothstep(10.62, 10.93, x)
    tracks = (0.98, 2.52, 4.49, 6.01, 8.08, 9.66)
    wheel_paths = max(math.exp(-((x - track) / .32) ** 2) for track in tracks)
    wear = wheel_paths * (1.0 - shoulder)
    fine_seam = math.exp(-((x - 12.14 - .035 * noise_at(s, 1, 4, 2)) / .055) ** 2)
    tone += .11 * wear - .07 * shoulder * fine_seam
    tone += .10 * noise_at(s, x, 9, 2.8)
    rough_delta = .055 * shoulder - .075 * wear
    return tone, shoulder, rough_delta


def asphalt_correction(pavement):
    asphalt = bpy.data.materials["Paving | Asphalt Track / wheel-path mask"]
    tree = asphalt.node_tree
    nodes, links = tree.nodes, tree.links
    shader = nodes.get("Principled BSDF")
    previous_tone = shader.inputs["Base Color"].links[0].from_node
    raw_diffuse = previous_tone.inputs[1].links[0].from_socket
    rough_source = shader.inputs["Roughness"].links[0].from_socket
    for node in list(nodes):
        if node == previous_tone or (node.type == "ATTRIBUTE" and node.attribute_name == "PavementTone"):
            nodes.remove(node)
    for obj in pavement.objects:
        if not obj.data.materials or obj.data.materials[0] != asphalt:
            continue
        values = [surface_profile(*uv_metres(v.co)) for v in obj.data.vertices]
        for index, name in enumerate(("R41bAsphaltTone", "R41bShoulder", "R41bPaveRoughness")):
            attribute(obj.data, name, (row[index] for row in values))
    tonemap = nodes.new("ShaderNodeAttribute")
    tonemap.attribute_name = "R41bAsphaltTone"
    tonemap.location = (-340, 320)
    scale = nodes.new("ShaderNodeVectorMath")
    scale.operation = "SCALE"
    scale.label = "Existing aggregate × lane tone"
    scale.location = (-120, 300)
    links.new(raw_diffuse, scale.inputs[0])
    links.new(tonemap.outputs["Fac"], scale.inputs["Scale"])
    shoulder = nodes.new("ShaderNodeAttribute")
    shoulder.attribute_name = "R41bShoulder"
    shoulder.location = (-340, 80)
    warmth = nodes.new("ShaderNodeMixRGB")
    warmth.blend_type = "MULTIPLY"
    warmth.label = "Subtle warm mineral cast on paved shoulder"
    warmth.location = (90, 310)
    warmth.inputs[2].default_value = (1.03, 1.0, .94, 1)
    links.new(shoulder.outputs["Fac"], warmth.inputs[0])
    links.new(scale.outputs["Vector"], warmth.inputs[1])
    links.new(warmth.outputs["Color"], shader.inputs["Base Color"])
    rough = nodes.new("ShaderNodeAttribute")
    rough.attribute_name = "R41bPaveRoughness"
    rough.location = (-340, -190)
    add = nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    add.use_clamp = True
    add.label = "Wheel path and shoulder roughness"
    add.location = (90, 70)
    links.new(rough_source, add.inputs[0])
    links.new(rough.outputs["Fac"], add.inputs[1])
    links.new(add.outputs[0], shader.inputs["Roughness"])
    next(n for n in nodes if n.type == "NORMAL_MAP").inputs["Strength"].default_value = .45
    shader.location = (350, 300)
    nodes.get("Material Output").location = (680, 300)


def neutral_gravel(mat, color_socket, target, saturation, value, position):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    adjust = nodes.new("ShaderNodeHueSaturation")
    adjust.label = "Neutral weathered mineral and soil"
    adjust.location = position
    adjust.inputs["Saturation"].default_value = saturation
    adjust.inputs["Value"].default_value = value
    links.new(color_socket, adjust.inputs["Color"])
    links.new(adjust.outputs["Color"], target)


def shade_ground(mat, input_socket, target, position):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    moisture = nodes.new("ShaderNodeAttribute")
    moisture.attribute_name = "R41bGroundTone"
    moisture.location = (position[0] - 220, position[1])
    scale = nodes.new("ShaderNodeVectorMath")
    scale.operation = "SCALE"
    scale.label = "Broad moisture and meadow tone"
    scale.location = position
    links.new(input_socket, scale.inputs[0])
    links.new(moisture.outputs["Fac"], scale.inputs["Scale"])
    links.new(scale.outputs["Vector"], target)


def verge_correction(terrain):
    verge = bpy.data.materials["Verge | gravel to leafy grass"]
    grass = bpy.data.materials["Verge | leafy grass"]
    gravel = bpy.data.materials["Verge | compacted gravel, muted"]
    for obj in terrain.objects:
        if not obj.data.materials:
            continue
        mat = obj.data.materials[0]
        coords = [uv_metres(v.co) for v in obj.data.vertices]
        if mat == verge:
            coverage = []
            tones = []
            for s, x in coords:
                d = max(0, (x - OUTER) if x > 0 else (OPPOSITE_EDGE - x))
                # Bare material survives as pockets rather than a parallel stripe.
                mosaic = noise_at(s, x, 3.1, .68)
                width = max(.04, .23 + .52 * noise_at(s, x, 7.0, 1.4))
                soft_edge = smoothstep(-.16, .39, d - width)
                cover = .29 + .70 * soft_edge + mosaic * .43 * (1.0 - smoothstep(.3, 1.3, d))
                coverage.append(min(1.0, max(.16, cover)))
                tones.append(.83 + .18 * noise_at(s, x, 10, 4) + .095 * noise_at(s, x, 2.6, 1.2))
            obj.data.attributes["VergeGrass"].data.foreach_set("value", coverage)
            attribute(obj.data, "R41bGroundTone", tones)
        elif mat == grass:
            attribute(obj.data, "R41bGroundTone",
                      (.68 + .25 * noise_at(s, x, 29, 19) for s, x in coords))
    vn, vl = verge.node_tree.nodes, verge.node_tree.links
    shader = vn.get("Principled BSDF")
    old_mix = shader.inputs["Base Color"].links[0].from_node
    neutral_gravel(verge, old_mix.inputs[1].links[0].from_socket, old_mix.inputs[1], .22, .72, (-150, 540))
    shade_ground(verge, old_mix.outputs[0], shader.inputs["Base Color"], (420, 300))
    for slot, key in (("Roughness", "rough"),):
        existing = shader.inputs[slot].links[0].from_socket
        tex = vn.new("ShaderNodeTexImage")
        tex.image = input_texture(gravel, key).image
        tex.location = (-580, -720)
        blend = vn.new("ShaderNodeMixRGB")
        blend.location = (20, -460)
        vl.new(old_mix.inputs[0].links[0].from_socket, blend.inputs[0])
        vl.new(tex.outputs["Color"], blend.inputs[1])
        vl.new(existing, blend.inputs[2])
        vl.new(blend.outputs[0], shader.inputs[slot])
    grass_normal = shader.inputs["Normal"].links[0].from_node
    normal_source = grass_normal.inputs["Color"].links[0].from_socket
    tex = vn.new("ShaderNodeTexImage")
    tex.image = input_texture(gravel, "nor_gl").image
    tex.location = (-580, -990)
    normals = vn.new("ShaderNodeMixRGB")
    normals.location = (20, -710)
    vl.new(old_mix.inputs[0].links[0].from_socket, normals.inputs[0])
    vl.new(tex.outputs["Color"], normals.inputs[1])
    vl.new(normal_source, normals.inputs[2])
    vl.new(normals.outputs[0], grass_normal.inputs["Color"])
    shader.location = (650, 300)
    vn.get("Material Output").location = (990, 300)
    for mat, saturation, value in [(gravel, .15, .65)]:
        target = mat.node_tree.nodes.get("Principled BSDF").inputs["Base Color"]
        neutral_gravel(mat, target.links[0].from_socket, target, saturation, value, (-120, 410))
    target = grass.node_tree.nodes.get("Principled BSDF").inputs["Base Color"]
    shade_ground(grass, target.links[0].from_socket, target, (-120, 390))


def terrain_sampler(terrain):
    surfaces = [BVHTree.FromPolygons([obj.matrix_world @ v.co for v in obj.data.vertices],
                                    [tuple(p.vertices) for p in obj.data.polygons])
                for obj in terrain.objects if obj.type == "MESH"]

    def elevation(x, y):
        hits = [surface.ray_cast((x, y, 100), (0, 0, -1), 200)[0] for surface in surfaces]
        heights = [p.z for p in hits if p is not None]
        if not heights:
            raise ValueError(f"No terrain at {x:.3f}, {y:.3f}")
        return max(heights)

    return elevation


def source_positions(obj):
    flat = np.empty(3 * len(obj.data.vertices), dtype=np.float32)
    obj.data.vertices.foreach_get("co", flat)
    m = np.asarray(obj.matrix_world)
    return flat.reshape((-1, 3)) @ m[:3, :3].T + m[:3, 3]


def tree_variants():
    variants = {}
    for source, kind in (("tree_small_02", "broadleaf"), ("pine_sapling_medium", "pine")):
        original = bpy.data.collections["SOURCE | Poly Haven " + source]
        meshes = sorted((o for o in original.objects if o.type == "MESH"), key=lambda o: o.name)
        if len(meshes) != (3 if kind == "pine" else 1):
            raise RuntimeError(f"Unexpected count of source variants in {original.name}")
        variants[kind] = []
        for mesh in meshes:
            positions = source_positions(mesh)
            bottom = float(positions[:, 2].min())
            root = positions[positions[:, 2] <= bottom + .075]
            root_xy = np.median(root[:, :2], axis=0)
            collection = bpy.data.collections.new(f"R4.1b source | {mesh.name}")
            collection.objects.link(mesh)
            collection.instance_offset = (*root_xy, bottom)
            variants[kind].append(collection)
    return variants


def vegetation_correction(woodland, ground):
    variants = tree_variants()
    rng = random.Random(411)
    placements = []
    forest = sorted(woodland.objects, key=lambda o: o.name)
    ridge = [o for o in forest if o.name.startswith("Distant ridge")]
    ridge_groups = ((-78, 271), (-40, 260), (-10, 252), (19, 263), (63, 278))
    for index, obj in enumerate(ridge):
        cx, cs = ridge_groups[index % len(ridge_groups)]
        placements.append((obj, cs + rng.uniform(-16, 19), cx + rng.uniform(-12, 12),
                           rng.uniform(.60, 1.24), "broadleaf"))
    for obj in forest:
        if obj in ridge:
            continue
        s, x = uv_metres(obj.location)
        if obj.name.startswith("Verge"):
            s = max(-23, min(214, s + rng.uniform(-1.4, 1.4)))
            x = max(OUTER + 1.85, x + rng.uniform(-1.25, 1.25))
            scale = rng.uniform(.12, .34)
            kind = "broadleaf"
        else:
            edge = OUTER if x > 0 else OPPOSITE_EDGE
            sign = 1 if x > 0 else -1
            depth = abs(x - edge)
            s = max(-23, min(214, s + rng.uniform(-4.6, 4.6)))
            # Leave asymmetric openings in the tree line while preserving backdrop depth.
            opening = (4.5 * math.exp(-((s - 26) / 11) ** 2) +
                       3.0 * math.exp(-((s - 64) / 14) ** 2)) if sign > 0 else 0
            x = edge + sign * max(3.7, depth + rng.uniform(-3.7, 3.7) + opening)
            scale = rng.uniform(.62, 1.43)
            kind = "pine" if obj.name.startswith("Woodland | pine") else "broadleaf"
        placements.append((obj, s, x, scale, kind))
    pine_counts = {collection.name: 0 for collection in variants["pine"]}
    root_gaps = []
    for obj, s, x, scale, kind in placements:
        xx, yy = world_xy(s, x)
        burial = .095 if scale > .45 else .035
        surface = ground(xx, yy)
        obj.location = (xx, yy, surface - burial)
        obj.rotation_euler = (0, 0, rng.uniform(0, math.tau))
        obj.scale = (scale * rng.uniform(.78, 1.18), scale * rng.uniform(.83, 1.19), scale)
        obj.instance_collection = rng.choice(variants[kind])
        root_gaps.append(obj.location.z - surface)
        if kind == "pine":
            pine_counts[obj.instance_collection.name] += 1
    assert len(placements) == len(forest)
    assert all(-.10 <= z <= -.03 for z in root_gaps)
    assert all(pine_counts.values())
    return len(placements), pine_counts, [min(root_gaps), max(root_gaps)]


def guardrail_contact(safety, ground):
    source = bpy.data.collections["SOURCE | Innerscene W-beam"]
    posts = next(o for o in source.objects if o.name.startswith("Steel posts and blockouts"))
    points = source_positions(posts) - np.asarray(source.instance_offset)
    low = float(points[:, 2].min())
    # Every post is within 8 cm of the common source bottom plane.
    foot_vertices = points[points[:, 2] <= low + .08]
    if len(foot_vertices) < 12 or np.ptp(foot_vertices[:, 0]) < 9:
        raise RuntimeError("Expected six support feet across the verified W-beam module")
    adjustments = []
    for obj in safety.objects:
        if obj.instance_collection != source:
            continue
        contacts = [obj.matrix_world @ Vector(p) for p in foot_vertices]
        gaps = [p.z - ground(p.x, p.y) for p in contacts
                if -23.6 < uv_metres(p)[0] < 215.6]
        if not gaps:
            continue
        shift = -.025 - max(gaps)
        if abs(shift) > .20:
            raise ValueError(f"Unexpected guardrail height adjustment {shift:.3f} m")
        obj.location.z += shift
        adjustments.append(shift)
    assert adjustments, "No existing guardrail modules corrected"
    return [min(adjustments), max(adjustments)]


def main(output):
    scene = bpy.context.scene
    assert bpy.data.filepath and scene.render.engine == "CYCLES"
    bpy.context.view_layer.update()
    before = camera_state(scene)
    assert math.isclose(before["exposure"], .82, abs_tol=1e-6)
    assert (scene.render.resolution_x, scene.render.resolution_y) == (1280, 720)
    asphalt_correction(bpy.data.collections["01 | Pavement and paint"])
    terrain = bpy.data.collections["03 | Verge and landform"]
    verge_correction(terrain)
    ground = terrain_sampler(terrain)
    count, pine_counts, root_gaps = vegetation_correction(bpy.data.collections["04 | Woodland"], ground)
    shifts = guardrail_contact(bpy.data.collections["02 | Road restraint systems"], ground)
    scene.cycles.samples = 64
    scene.cycles.adaptive_threshold = .035
    scene.cycles.adaptive_min_samples = 24
    scene.cycles.use_denoising = False
    bpy.context.view_layer.update()
    assert before == camera_state(scene), "Camera or exposure changed"
    assert all(im.packed_file for im in bpy.data.images if im.source == "FILE")
    output.mkdir(parents=True, exist_ok=True)
    audit = {
        "blender": bpy.app.version_string,
        "camera_and_exposure": before,
        "vegetation_instances": count,
        "pine_variant_instances": pine_counts,
        "tree_root_signed_clearance_m": root_gaps,
        "guardrail_vertical_adjustment_m": shifts,
        "cycles_samples_max": scene.cycles.samples,
        "adaptive_threshold": scene.cycles.adaptive_threshold,
        "denoising": scene.cycles.use_denoising,
    }
    print("R4.1b audit:", json.dumps(audit), flush=True)
    (output / "art-correction-stats.json").write_text(json.dumps(audit, indent=2) + "\n")
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "highway-master-r41b.blend"), compress=True)


if __name__ == "__main__":
    main(Path(sys.argv[sys.argv.index("--") + 1]))
