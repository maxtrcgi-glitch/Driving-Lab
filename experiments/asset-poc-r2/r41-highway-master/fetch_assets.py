"""Fetch CC0 scene inputs and record the exact bytes used. Powered by Poly Haven."""
import hashlib
import json
import shutil
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen

root = Path(sys.argv[1])
root.mkdir(parents=True, exist_ok=True)
records = []
user_agent = "Driving Lab R4.1 art pipeline (maxtrcgi-glitch/Driving-Lab)"


def retrieve(url, dest=None):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": user_agent}), timeout=60) as response:
                if dest is None:
                    return json.load(response)
                dest.parent.mkdir(parents=True, exist_ok=True)
                with dest.open("wb") as out:
                    shutil.copyfileobj(response, out)
                return
        except OSError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def download(entry, path, asset):
    url = entry["url"]
    retrieve(url, path)
    data = path.read_bytes()
    if entry.get("size") is not None and len(data) != entry["size"]:
        raise ValueError(f"Unexpected byte count for {url}")
    if entry.get("md5") and hashlib.md5(data).hexdigest() != entry["md5"]:
        raise ValueError(f"Checksum mismatch for {url}")
    records.append(dict(asset=asset, url=url, file=str(path.relative_to(root)),
                        bytes=len(data), sha256=hashlib.sha256(data).hexdigest()))


def files(asset):
    return retrieve(f"https://api.polyhaven.com/files/{asset}")


for asset in ("tree_small_02", "pine_sapling_medium"):
    entry = files(asset)["gltf"]["1k"]["gltf"]
    folder = root / asset
    download(entry, folder / "source.gltf", asset)
    for relative, dependency in entry.get("include", {}).items():
        dest = folder / relative
        if not dest.resolve().is_relative_to(folder.resolve()):
            raise ValueError(f"Unsafe dependency path: {relative}")
        download(dependency, dest, asset)
    document = json.loads((folder / "source.gltf").read_text())
    for resource in document.get("buffers", []) + document.get("images", []):
        uri = resource.get("uri", "")
        if uri and not uri.startswith("data:") and not (folder / uri).is_file():
            raise FileNotFoundError(f"{asset}: missing glTF resource {uri}")

asset = "leafy_grass"
entries = files(asset)
for name, formats in {"diff": ("jpg", "png"), "nor_gl": ("jpg", "png", "exr"),
                      "rough": ("jpg", "png", "exr")}.items():
    options = entries[name]["2k"]
    fmt = next(fmt for fmt in formats if fmt in options)
    download(options[fmt], root / f"grass-{name}.{fmt}", asset)

asset = "kloppenheim_03_puresky"
download(files(asset)["hdr"]["4k"]["hdr"], root / "daylight.hdr", asset)
(root / "download-manifest.json").write_text(json.dumps(records, indent=2) + "\n")
