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

def available_files(value):
    if not isinstance(value, dict):
        return
    if "url" in value:
        yield value
        return
    for entry in value.values():
        yield from available_files(entry)


asset = "leafy_grass"
entries = list(available_files(files(asset)))
for name in ("diff", "nor_gl", "rough"):
    stem = f"{asset}_{name}_2k"
    for ext in ("jpg", "png", "exr"):
        match = next((entry for entry in entries if entry["url"].endswith(f"/{stem}.{ext}")), None)
        if match:
            download(match, root / f"grass-{name}.{ext}", asset)
            break
    else:
        raise RuntimeError(f"No 2K {name} map available for {asset}")

asset = "kloppenheim_03_puresky"
entries = list(available_files(files(asset)))
for ext in ("hdr", "exr"):
    match = next((entry for entry in entries if entry["url"].endswith(f"/{asset}_4k.{ext}")), None)
    if match:
        download(match, root / f"daylight.{ext}", asset)
        break
else:
    raise RuntimeError(f"No 4K HDR image available for {asset}")

try:
    retrieve("https://upload.wikimedia.org/wikipedia/commons/8/8e/Auf_der_A_9_in_Richtung_Berlin.jpg",
             root / "primary-reference.jpg")
except OSError as error:
    print(f"Reference download unavailable. See Wikimedia link in manifest: {error}", flush=True)
(root / "download-manifest.json").write_text(json.dumps(records, indent=2) + "\n")
