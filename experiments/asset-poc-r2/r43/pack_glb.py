"""Repack embedded textures while preserving GLB meshes and alpha."""
import argparse
import io
import json
from pathlib import Path
import struct
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("glb", type=Path)
args = parser.parse_args()
raw = args.glb.read_bytes()
magic, version, total, json_size, kind = struct.unpack_from("<4sIIII", raw)
assert (magic, version, total, kind) == (b"glTF", 2, len(raw), 0x4E4F534A)
doc = json.loads(raw[20:20+json_size])
binary = memoryview(raw)[28+json_size:]
images = {i["bufferView"]:i for i in doc["images"]}
rebuilt = bytearray()
for i, view in enumerate(doc["bufferViews"]):
    start = view.get("byteOffset",0)
    data = binary[start:start+view["byteLength"]]
    if i in images:
        descriptor = images[i]
        with Image.open(io.BytesIO(data)) as original:
            alpha = "A" in original.getbands() or "transparency" in original.info
            name = descriptor.get("name","").lower()
            edge = 1024 if "48 m art study" in name or alpha else 512
            image = original.convert("RGBA" if alpha else "RGB")
            image.thumbnail((edge,edge), Image.Resampling.LANCZOS)
            encoded = io.BytesIO()
            if alpha:
                image.save(encoded,"PNG",optimize=True)
                descriptor["mimeType"]="image/png"
            else:
                image.save(encoded,"JPEG",quality=91 if "nor" in name else 87,subsampling=0,optimize=True)
                descriptor["mimeType"]="image/jpeg"
            data = encoded.getvalue()
    view["byteOffset"] = len(rebuilt)
    view["byteLength"] = len(data)
    rebuilt.extend(data)
    rebuilt.extend(b"\0" * (-len(rebuilt)%4))
doc["buffers"][0]["byteLength"]=len(rebuilt)
encoded=json.dumps(doc,separators=(",",":")).encode()
encoded+=b" "*(-len(encoded)%4)
result=struct.pack("<4sIIII",b"glTF",2,28+len(encoded)+len(rebuilt),len(encoded),0x4E4F534A)
tmp=args.glb.with_suffix(".tmp")
with tmp.open("wb") as f:
    f.write(result)
    f.write(encoded)
    f.write(struct.pack("<II",len(rebuilt),0x004E4942))
    f.write(rebuilt)
tmp.replace(args.glb)
print(f"Packed textures: {len(raw):,} → {args.glb.stat().st_size:,} bytes")
