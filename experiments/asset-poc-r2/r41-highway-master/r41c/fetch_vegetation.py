"""Fetch two Poly Haven CC0 assets and record the precise source files."""
import hashlib
import json
import shutil
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen

ASSETS = ("grass_medium_02", "grass_bermuda_01")
USER_AGENT = "Driving Lab Blender environment (maxtrcgi-glitch/Driving-Lab)"


def fetch(url, dest=None):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=60) as response:
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


def acquire(root):
    records = []
    for asset in ASSETS:
        asset_dir = root / asset
        asset_dir.mkdir(parents=True, exist_ok=True)
        entry = fetch(f"https://api.polyhaven.com/files/{asset}")["gltf"]["1k"]["gltf"]
        for relative, file in [("source.gltf", entry), *entry.get("include", {}).items()]:
            dest = asset_dir / relative
            if not dest.resolve().is_relative_to(asset_dir.resolve()):
                raise ValueError(f"Unsafe source dependency: {relative}")
            fetch(file["url"], dest)
            contents = dest.read_bytes()
            if file.get("size") is not None and len(contents) != file["size"]:
                raise ValueError(f"Byte count mismatch: {relative}")
            if file.get("md5") and hashlib.md5(contents).hexdigest() != file["md5"]:
                raise ValueError(f"Provider checksum mismatch: {relative}")
            records.append({"asset": asset, "license": "CC0-1.0", "url": file["url"],
                            "file": str(dest.relative_to(root)), "bytes": len(contents),
                            "sha256": hashlib.sha256(contents).hexdigest()})
        gltf = json.loads((asset_dir / "source.gltf").read_text())
        for resource in gltf.get("buffers", []) + gltf.get("images", []):
            uri = resource.get("uri", "")
            if uri and not uri.startswith("data:") and not (asset_dir / uri).is_file():
                raise FileNotFoundError(f"{asset}: {uri}")
        print(asset, "source mesh names:", [m.get("name") for m in gltf.get("meshes", [])], flush=True)
    (root / "vegetation-download-manifest.json").write_text(json.dumps(records, indent=2) + "\n")


if __name__ == "__main__":
    acquire(Path(sys.argv[1]))
