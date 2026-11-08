"""Restore the two provider grass alpha cutouts on the existing R4.1c master."""
import hashlib
import json
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from edit_roadside import ASSETS, camera_state, protection_signature
from fetch_vegetation import fetch


def files_below(item):
    if isinstance(item, dict):
        if "url" in item:
            yield item
        else:
            for entry in item.values():
                yield from files_below(entry)


def provider_mask(asset, directory):
    catalog = fetch(f"https://api.polyhaven.com/files/{asset}")
    files = list(files_below(catalog))
    for resolution in ("1k", "2k"):
        for ext in ("png", "jpg", "exr"):
            candidates = sorted((item for item in files
                                 if item["url"].endswith(f"_{resolution}.{ext}")
                                 and "alpha" in item["url"].split("/")[-1].lower()
                                 and "_diff" not in item["url"].split("/")[-1].lower()),
                                key=lambda item: item["url"])
            if candidates:
                entry = candidates[0]
                path = directory / f"{asset}-opacity.{ext}"
                fetch(entry["url"], path)
                data = path.read_bytes()
                if entry.get("md5") and hashlib.md5(data).hexdigest() != entry["md5"]:
                    raise ValueError(f"Opacity checksum mismatch for {asset}")
                return path, {"mode": "provider opacity map", "url": entry["url"],
                              "sha256": hashlib.sha256(data).hexdigest()}
    return None, {"mode": "luminance key of the packed provider diffuse atlas",
                  "linear_black": .004, "linear_white": .022}


def fix_materials(asset, mask_path):
    seen = []
    mask_image = None
    if mask_path:
        mask_image = bpy.data.images.load(str(mask_path), check_existing=True)
        mask_image.colorspace_settings.name = "Non-Color"
        mask_image.pack()
    for mat in bpy.data.materials:
        if not mat.node_tree:
            continue
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        diffuse = next((n for n in nodes if n.type == "TEX_IMAGE" and n.image
                        and n.image.name.startswith(asset + "_diff")), None)
        if not diffuse:
            continue
        shader = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
        alpha = shader.inputs["Alpha"]
        if mask_image:
            tex = nodes.new("ShaderNodeTexImage")
            tex.label = "Poly Haven source opacity"
            tex.image = mask_image
            tex.location = (diffuse.location.x, diffuse.location.y - 320)
            if diffuse.inputs["Vector"].is_linked:
                links.new(diffuse.inputs["Vector"].links[0].from_socket, tex.inputs["Vector"])
            opacity = tex.outputs["Color"]
        else:
            # The supplied JPEG has black around the blades and no alpha channel.
            # Preserve leaf tint while removing the background from the card.
            key = nodes.new("ShaderNodeRGBToBW")
            key.location = (diffuse.location.x + 240, diffuse.location.y - 285)
            ramp = nodes.new("ShaderNodeValToRGB")
            ramp.label = "Remove black atlas background"
            ramp.location = (key.location.x + 170, key.location.y)
            ramp.color_ramp.elements[0].position = .004
            ramp.color_ramp.elements[1].position = .022
            links.new(diffuse.outputs["Color"], key.inputs["Color"])
            links.new(key.outputs["Val"], ramp.inputs["Fac"])
            opacity = ramp.outputs["Color"]
        links.new(opacity, alpha)
        mat.blend_method = "HASHED"
        mat.shadow_method = "HASHED"
        assert alpha.links[0].from_socket == opacity
        seen.append(mat.name)
    if not seen:
        raise ValueError(f"No grass shader found for {asset}")
    return seen


def main(output):
    scene = bpy.context.scene
    bpy.context.view_layer.update()
    before = camera_state(scene)
    signature = protection_signature()
    path = output / "roadside-art-stats.json"
    stats = json.loads(path.read_text())
    assert signature == stats["protected_road_and_restraint_signature"]
    assert before == stats["camera_and_exposure"]
    maps = {}
    for asset in ASSETS:
        mask, detail = provider_mask(asset, output)
        detail["materials"] = fix_materials(asset, mask)
        maps[asset] = detail
    assert before == camera_state(scene) and signature == protection_signature()
    bpy.ops.file.pack_all()
    assert all(im.packed_file for im in bpy.data.images if im.source == "FILE")
    stats["grass_cutout_correction"] = maps
    stats["packed_images"] = sum(bool(im.packed_file) for im in bpy.data.images)
    path.write_text(json.dumps(stats, indent=2) + "\n")
    print("Verified grass cutouts:", json.dumps(maps), flush=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "highway-master-r41c.blend"), compress=True)


if __name__ == "__main__":
    main(Path(sys.argv[sys.argv.index("--") + 1]))
