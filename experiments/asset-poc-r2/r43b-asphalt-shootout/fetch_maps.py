"""Download only the Poly Haven maps used by the shootout and verify provider MD5."""
from concurrent.futures import ThreadPoolExecutor
from hashlib import md5, sha256
import json
from pathlib import Path
import sys
from subprocess import run

root = Path(sys.argv[1])
root.mkdir(parents=True, exist_ok=True)
sets = {"asphalt_floor": "2k", "asphalt_01": "2k", "asphalt_04": "4k"}
def download(url):
    return run(["curl", "-fsSL", "--retry", "2", "--max-time", "75", url],
               check=True, capture_output=True).stdout

jobs = []
for asset, resolution in sets.items():
    maps = json.loads(download(f"https://api.polyhaven.com/files/{asset}"))
    for key in ("Diffuse", "Rough", "nor_gl"):
        jobs.append((asset, key, maps[key][resolution]["jpg"]))

def fetch(job):
    asset, key, asset_file = job
    path = root / Path(asset_file["url"]).name
    if path.exists():
        data = path.read_bytes()
    else:
        data = download(asset_file["url"])
    if md5(data).hexdigest() != asset_file["md5"]:
        raise ValueError(f"Provider bytes failed checksum for {path}")
    path.write_bytes(data)
    return dict(asset=asset, channel=key, file=path.name, url=asset_file["url"],
                bytes=len(data), sha256=sha256(data).hexdigest())

with ThreadPoolExecutor(max_workers=6) as pool:
    manifest = list(pool.map(fetch, jobs))
(root / "maps.json").write_text(json.dumps(manifest, indent=2) + "\n")
